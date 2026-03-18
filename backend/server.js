const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();

// ── NEW: http + Socket.io + Nodemailer ─────────────────────────────────────
const http       = require('http');
const { Server } = require('socket.io');
const nodemailer = require('nodemailer');
// ──────────────────────────────────────────────────────────────────────────

const app = express();
let PORT = process.env.PORT || 5003;

// ── NEW: wrap express in http server so Socket.io can attach ───────────────
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'OPTIONS'],
        credentials: false
    },
    allowEIO3: true,
    transports: ['polling', 'websocket']
});
// ──────────────────────────────────────────────────────────────────────────

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const frontendPath = path.join(__dirname, '../frontend');
console.log('Static serving from:', frontendPath);
app.use(express.static(frontendPath));

console.log('Uploads serving from:', path.join(__dirname, 'uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, uploadsDir); },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname) || '';
        cb(null, `image-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) cb(null, true);
        else cb(new Error('Only image files (jpeg, png, gif, webp) are allowed'));
    }
});

let MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/novuna-electronics';
if (typeof MONGODB_URI === 'string') {
    MONGODB_URI = MONGODB_URI.trim().replace(/^['"]|['"]$/g, '');
}

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        console.log('Make sure MONGODB_URI is set correctly in environment variables');
    });

// Your existing routes — unchanged
const productRoutes = require('./routes/productRoutes');
const authRoutes    = require('./routes/authRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
app.use('/api', productRoutes);
app.use('/api', authRoutes);
app.use('/api/chatbot', chatbotRoutes);

// ── NEW: Nodemailer ────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendEmailNotification(sessionId, message, page) {
    const adminUrl = `${process.env.ADMIN_URL || `http://localhost:${PORT}`}/admin-chat.html`;
    try {
        await transporter.sendMail({
            from: `"Novuna Chatbot" <${process.env.EMAIL_USER}>`,
            to:   process.env.NOTIFY_EMAIL,
            subject: `💬 New customer question — ${sessionId.slice(-8)}`,
            html: `
                <div style="font-family:sans-serif;max-width:520px;margin:auto;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden;">
                    <div style="background:linear-gradient(135deg,#088178,#06655e);padding:24px 28px;">
                        <h2 style="color:#fff;margin:0;">New Customer Message</h2>
                        <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;">Novuna Electronics Chatbot</p>
                    </div>
                    <div style="padding:28px;">
                        <table style="width:100%;font-size:14px;">
                            <tr><td style="padding:8px 0;color:#888;width:120px;">Session</td><td style="font-weight:600;">${sessionId}</td></tr>
                            <tr><td style="padding:8px 0;color:#888;">Page</td><td>${page || '/'}</td></tr>
                            <tr><td style="padding:8px 0;color:#888;">Time</td><td>${new Date().toLocaleString('en-UG', { timeZone: 'Africa/Kampala' })}</td></tr>
                        </table>
                        <div style="background:#f9fafb;border-left:4px solid #088178;border-radius:8px;padding:16px;margin:20px 0;">
                            <p style="margin:0;font-size:15px;">"${message}"</p>
                        </div>
                        <a href="${adminUrl}" style="display:inline-block;background:linear-gradient(135deg,#088178,#06655e);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">
                            Open Admin Dashboard →
                        </a>
                    </div>
                </div>
            `
        });
        console.log(`Email sent for session ${sessionId}`);
    } catch (err) {
        console.error('Email notification failed:', err.message);
    }
}


// Add this after all your route definitions to debug routing
console.log('Registered routes:');
app._router.stack.forEach(function(r){
    if (r.route && r.route.path){
        console.log(r.route.path, Object.keys(r.route.methods));
    } else if (r.name === 'router') {
        console.log('Router:', r.regexp);
    }
});

// Add a test endpoint to verify API is working
app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'API is working', timestamp: new Date() });
});

// Add a direct chatbot test endpoint
app.post('/api/test-chatbot', (req, res) => {
    res.json({ success: true, reply: 'Test chatbot is working! Your message: ' + req.body.message });
});
// ──────────────────────────────────────────────────────────────────────────

// ── NEW: In-memory session store ───────────────────────────────────────────
const sessions = {};
// ──────────────────────────────────────────────────────────────────────────

// ── NEW: Socket.io events ──────────────────────────────────────────────────
io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('customer_join', ({ sessionId, page }) => {
        if (!sessionId) return;
        socket.join(sessionId);
        if (!sessions[sessionId]) sessions[sessionId] = { messages: [], humanMode: false, page: page || '' };
        sessions[sessionId].page = page || '';
        io.to('admin_room').emit('session_update', { sessionId, ...sessions[sessionId] });
    });

    socket.on('customer_message', async ({ sessionId, message, page, timestamp }) => {
        if (!sessionId || !message) return;
        if (!sessions[sessionId]) sessions[sessionId] = { messages: [], humanMode: false, page: page || '' };
        sessions[sessionId].messages.push({ role: 'user', text: message, ts: Date.now() });
        io.to('admin_room').emit('new_customer_message', { sessionId, message, page, timestamp, messages: sessions[sessionId].messages });
        await sendEmailNotification(sessionId, message, page);
    });

    socket.on('bot_reply', ({ sessionId, message }) => {
        if (!sessionId || !message) return;
        if (!sessions[sessionId]) sessions[sessionId] = { messages: [], humanMode: false, page: '' };
        sessions[sessionId].messages.push({ role: 'bot', text: message, ts: Date.now() });
        io.to('admin_room').emit('session_update', { sessionId, ...sessions[sessionId] });
    });

    socket.on('admin_join', ({ secret }) => {
        if (secret !== (process.env.ADMIN_SECRET || 'novuna_admin_2026')) {
            socket.emit('admin_auth_error', { message: 'Wrong secret' });
            return;
        }
        socket.join('admin_room');
        socket.emit('admin_auth_ok');
        socket.emit('all_sessions', Object.entries(sessions).map(([id, s]) => ({ sessionId: id, ...s })));
        console.log('Admin joined:', socket.id);
    });

    socket.on('admin_takeover', ({ sessionId }) => {
        if (!sessions[sessionId]) return;
        sessions[sessionId].humanMode = true;
        io.to(sessionId).emit('takeover_start', { sessionId });
        io.to('admin_room').emit('session_update', { sessionId, ...sessions[sessionId] });
    });

    socket.on('admin_handback', ({ sessionId }) => {
        if (!sessions[sessionId]) return;
        sessions[sessionId].humanMode = false;
        io.to(sessionId).emit('takeover_end', { sessionId });
        io.to('admin_room').emit('session_update', { sessionId, ...sessions[sessionId] });
    });

    socket.on('admin_send', ({ sessionId, message }) => {
        if (!sessionId || !message) return;
        if (!sessions[sessionId]) sessions[sessionId] = { messages: [], humanMode: true, page: '' };
        sessions[sessionId].messages.push({ role: 'admin', text: message, ts: Date.now() });
        io.to(sessionId).emit('admin_message', { sessionId, message });
        io.to('admin_room').emit('session_update', { sessionId, ...sessions[sessionId] });
    });

    socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
});
// ──────────────────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// ── IMPORTANT: server.listen (not app.listen) so Socket.io works ──────────
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Admin dashboard: http://localhost:${PORT}/admin-chat.html`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} busy, trying ${PORT + 1}...`);
        PORT += 1;
        server.listen(PORT);
    } else {
        console.error('Server error:', err);
    }
});