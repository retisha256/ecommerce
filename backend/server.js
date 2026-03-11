const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();

const app = express();
let PORT = process.env.PORT || 5003;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static assets from project root so files like `style.css`, images,
// and the HTML files are served correctly. Keep `/uploads` separate.
const frontendPath = path.join(__dirname, '../frontend');
console.log('Static serving from:', frontendPath);
app.use(express.static(frontendPath));

// Serve uploaded files
console.log('Uploads serving from:', path.join(__dirname, 'uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer setup for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname) || '';
        cb(null, `image-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (jpeg, png, gif, webp) are allowed'));
        }
    }
});

// MongoDB Connection
let MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/novuna-electronics';

// Sanitize: Remove potential quotes if copied from .env or entered incorrectly in dashboard
if (typeof MONGODB_URI === 'string') {
    MONGODB_URI = MONGODB_URI.trim().replace(/^['"]|['"]$/g, '');
}

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log(' MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));


// MongoDB Connection
let MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/novuna-electronics';

// Sanitize: Remove potential quotes if copied from .env or entered incorrectly in dashboard
if (typeof MONGODB_URI === 'string') {
    MONGODB_URI = MONGODB_URI.trim().replace(/^['"]|['"]$/g, '');
}

// Add connection options for Render
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        console.log('Make sure MONGODB_URI is set correctly in environment variables');
    });

// Use centralized router for API (products, orders, payments)
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
app.use('/api', productRoutes);
app.use('/api', authRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Serve static files (fallback to index only for browsers hitting root)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// Start server with port conflict handling
const server = app.listen(PORT, '::', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is busy, trying port ${PORT + 1}...`);
        PORT += 1;
        server.listen(PORT);
    } else {
        console.error('Server error:', err);
    }
});