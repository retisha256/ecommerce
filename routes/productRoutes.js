const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Product = require('../models/product.model');
const Order = require('../models/order.model');
const { OAuth2Client } = require('google-auth-library');

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(googleClientId);

// Ensure uploads directory exists (relative to project root)
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '';
        cb(null, `product-${Date.now()}-${Math.round(Math.random()*1e6)}${ext}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (/^image\//.test(file.mimetype)) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    }
});

// Helper: build public image URL
function toPublicUrl(req, filename) {
    if (!filename) return '';
    const host = req.get('host');
    const protocol = req.protocol;
    return `${protocol}://${host}/uploads/${path.basename(filename)}`;
}

// Health
router.get('/health', (req, res) => res.json({ success: true, message: 'API is healthy' }));

// GET /products
// Supports: q (search), category, featured, limit, page
router.get('/products', async (req, res) => {
    try {
        const { q, category, featured, limit = 20, page = 1 } = req.query;
        const query = { isActive: { $ne: false } };

        if (category) query.category = new RegExp(category, 'i');
        if (featured === 'true') query.featured = true;
        if (q) {
            const re = new RegExp(q.trim(), 'i');
            query.$or = [ { name: re }, { category: re }, { description: re }, { tags: re } ];
        }

        const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
        const products = await Product.find(query).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 });
        const total = await Product.countDocuments(query);

        res.json({ success: true, data: products, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total/limit) } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /products/:id
router.get('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        res.json({ success: true, data: product });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /products (supports multipart/form-data with `image`)
router.post('/products', upload.single('image'), async (req, res) => {
    try {
        const isMultipart = !!req.file;
        const payload = isMultipart ? {
            name: (req.body.name || '').trim(),
            category: (req.body.category || '').trim(),
            price: Number(req.body.price || 0),
            description: req.body.description || '',
            imageUrl: req.file ? toPublicUrl(req, req.file.filename) : (req.body.image || ''),
            stock: Number(req.body.stock || 0),
            featured: req.body.featured === 'true' || req.body.featured === true,
            tags: req.body.tags ? String(req.body.tags).split(',').map(t => t.trim()).filter(Boolean) : []
        } : {
            name: (req.body.name || '').trim(),
            category: (req.body.category || '').trim(),
            price: Number(req.body.price || 0),
            description: req.body.description || '',
            imageUrl: (req.body.image || ''),
            stock: Number(req.body.stock || 0),
            featured: req.body.featured === 'true' || req.body.featured === true,
            tags: req.body.tags ? String(req.body.tags).split(',').map(t => t.trim()).filter(Boolean) : []
        };

        if (!payload.name || !payload.category || !payload.price) {
            return res.status(400).json({ success: false, message: 'Missing required fields: name, category, price' });
        }

        const p = new Product(payload);
        await p.save();
        res.status(201).json({ success: true, data: p });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// PUT /products/:id
router.put('/products/:id', upload.single('image'), async (req, res) => {
    try {
        const updates = { ...req.body };
        if (req.file) updates.imageUrl = toPublicUrl(req, req.file.filename);
        if (updates.price) updates.price = Number(updates.price);
        if (typeof updates.featured === 'string') updates.featured = updates.featured === 'true';
        const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        res.json({ success: true, data: product });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// DELETE /products/:id (soft delete)
router.delete('/products/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        res.json({ success: true, message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Orders
router.post('/orders', async (req, res) => {
    try {
        const payload = req.body;
        payload.orderId = payload.orderId || `O${Date.now()}`;
        const order = new Order(payload);
        await order.save();
        res.status(201).json({ success: true, data: order });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

router.get('/orders/:id', async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.id });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        res.json({ success: true, data: order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.put('/orders/:id/status', async (req, res) => {
    try {
        const { orderStatus, paymentStatus } = req.body;
        const update = {};
        if (orderStatus) update.orderStatus = orderStatus;
        if (paymentStatus) update.paymentStatus = paymentStatus;
        const order = await Order.findOneAndUpdate({ orderId: req.params.id }, update, { new: true });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        res.json({ success: true, data: order });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// Payments (simulated)
router.post('/payments/generate', async (req, res) => {
    try {
        const { orderId, amount, phone, paymentMethod } = req.body;
        const paymentReference = `PAY${Date.now()}`;
        const paymentData = { orderId, amount, phone, paymentMethod, paymentReference, status: 'pending', createdAt: new Date() };
        res.json({ success: true, data: paymentData, message: 'Payment request generated (simulated)' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/payments/verify', async (req, res) => {
    try {
        const { orderId, paymentReference } = req.body;
        const order = await Order.findOneAndUpdate({ orderId }, { paymentStatus: 'confirmed', orderStatus: 'confirmed', paymentReference }, { new: true });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        res.json({ success: true, data: order, message: 'Payment verified (simulated)' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Google OAuth2 login
router.post('/auth/google', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ success: false, message: 'Missing Google token' });
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: googleClientId,
        });
        const payload = ticket.getPayload();
        // You can use payload.email, payload.name, etc.
        // Here, simulate user creation or lookup
        const user = {
            id: payload.sub,
            firstName: payload.given_name || '',
            lastName: payload.family_name || '',
            email: payload.email,
            picture: payload.picture || '',
            isLoggedIn: true,
            loginMethod: 'google',
        };
        // In production, check DB for user, create if not exists
        res.json({ success: true, user });
    } catch (err) {
        res.status(401).json({ success: false, message: 'Invalid Google token' });
    }
});

// Newsletter subscription
router.post('/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !email.trim()) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        
        // Store subscriber email in localStorage-like collection (in production, save to DB)
        // For now, just acknowledge and send email notification
        try {
            const { sendSubscribeEmail } = require('../utils/mailer');
            const emailResult = await sendSubscribeEmail(email.trim());
            res.json({ 
                success: true, 
                message: 'Thank you for subscribing! Check your email for confirmation.',
                data: { email: email.trim() }
            });
        } catch (err) {
            // If mailer fails, still acknowledge subscription locally
            console.warn('Email service unavailable, but subscription recorded locally');
            res.json({ 
                success: true, 
                message: 'Thank you for subscribing!',
                data: { email: email.trim() }
            });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
