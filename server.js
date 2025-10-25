const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
// Serve uploaded files
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
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/novuna-electronics';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.log('MongoDB connection error:', err));

// Product Schema
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    originalPrice: {
        type: Number,
        min: 0
    },
    description: {
        type: String,
        required: false,
        default: ''
    },
    image: {
        type: String,
        required: true
    },
    images: [String],
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    featured: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    reviews: [{
        user: String,
        rating: Number,
        comment: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    specifications: {
        brand: String,
        model: String,
        color: String,
        weight: String,
        dimensions: String,
        warranty: String
    },
    tags: [String],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Product = mongoose.model('Product', productSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    customer: {
        firstName: String,
        lastName: String,
        email: String,
        phone: String,
        address: String,
        city: String
    },
    items: [{
        productId: String,
        name: String,
        category: String,
        price: Number,
        quantity: Number,
        image: String
    }],
    total: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['mtn', 'airtel'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'failed', 'refunded'],
        default: 'pending'
    },
    orderStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentReference: String,
    notes: String
}, {
    timestamps: true
});

const Order = mongoose.model('Order', orderSchema);

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Novuna Electronics API is running',
        timestamp: new Date().toISOString()
    });
});

// Product Routes

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const { category, featured, limit = 20, page = 1 } = req.query;
        const query = { isActive: true };
        
        if (category) {
            query.category = new RegExp(category, 'i');
        }
        
        if (featured === 'true') {
            query.featured = true;
        }
        
        const skip = (page - 1) * limit;
        const products = await Product.find(query)
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });
            
        const total = await Product.countDocuments(query);
        
        res.json({
            success: true,
            data: products,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product || !product.isActive) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create product (Admin only) - supports JSON and multipart/form-data with image upload
app.post('/api/products', upload.single('image'), async (req, res) => {
    try {
        const isMultipart = (req.headers['content-type'] || '').includes('multipart/form-data');

        let payload = {};
        if (isMultipart) {
            const imageUrl = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : (req.body.image || '');

            payload = {
                name: (req.body.name || '').trim(),
                category: (req.body.category || '').trim(),
                price: Number(req.body.price),
                description: (req.body.description || '').toString(),
                image: imageUrl,
                stock: Number(req.body.stock || 0),
                featured: req.body.featured === 'true' || req.body.featured === true
            };
        } else {
            // JSON body
            payload = {
                ...req.body,
            };
            // Ensure types
            payload.name = (payload.name || '').trim();
            payload.category = (payload.category || '').trim();
            payload.price = Number(payload.price);
            payload.description = (payload.description || '').toString();
            payload.image = (payload.image || '').toString();
            if (typeof payload.stock !== 'number') payload.stock = Number(payload.stock || 0);
            if (typeof payload.featured !== 'boolean') payload.featured = payload.featured === 'true';
        }

        if (!payload.name || !payload.category || !payload.price || !payload.image) {
            return res.status(400).json({ success: false, message: 'Missing required fields: name, category, price, image' });
        }

        const product = new Product(payload);
        await product.save();
        res.status(201).json({ success: true, data: product });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Update product (Admin only)
app.put('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, data: product });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Delete product (Admin only)
app.delete('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Order Routes

// Create order
app.post('/api/orders', async (req, res) => {
    try {
        const order = new Order(req.body);
        await order.save();
        res.status(201).json({ success: true, data: order });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Get order by ID
app.get('/api/orders/:orderId', async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update order status
app.put('/api/orders/:orderId/status', async (req, res) => {
    try {
        const { orderStatus, paymentStatus } = req.body;
        const updateData = {};
        
        if (orderStatus) updateData.orderStatus = orderStatus;
        if (paymentStatus) updateData.paymentStatus = paymentStatus;
        
        const order = await Order.findOneAndUpdate(
            { orderId: req.params.orderId },
            updateData,
            { new: true }
        );
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        res.json({ success: true, data: order });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Mobile Money Integration Routes

// Generate payment request
app.post('/api/payments/generate', async (req, res) => {
    try {
        const { orderId, amount, phone, paymentMethod } = req.body;
        
        // Generate payment reference
        const paymentReference = `PAY${Date.now()}`;
        
        const paymentData = {
            orderId,
            amount,
            phone,
            paymentMethod,
            paymentReference,
            status: 'pending',
            createdAt: new Date()
        };
        
        // In a real implementation, you would integrate with MTN/Airtel APIs here
        // For now, we'll simulate the payment request
        
        res.json({
            success: true,
            data: paymentData,
            message: 'Payment request generated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Verify payment
app.post('/api/payments/verify', async (req, res) => {
    try {
        const { orderId, paymentReference } = req.body;
        
        // In a real implementation, you would verify with MTN/Airtel APIs
        // For now, we'll simulate payment verification
        
        const order = await Order.findOneAndUpdate(
            { orderId },
            { 
                paymentStatus: 'confirmed',
                orderStatus: 'confirmed',
                paymentReference
            },
            { new: true }
        );
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        res.json({
            success: true,
            data: order,
            message: 'Payment verified successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Serve static files (fallback to index only for browsers hitting root)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api`);
});
