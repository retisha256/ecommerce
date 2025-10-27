const express = require('express');
const router = express.Router();

// --- 1. TEMPORARY MOCK DATA ---
// This array mimics the data you would eventually pull from MongoDB
const MOCK_PRODUCTS = [
    { id: 'iphone-xr', name: 'Iphone XR', category: 'Mobile devices', price: 'UGX. 2,000,000', image: 'jpeg.jpeg' },
    { id: 'cctv-camera', name: 'CCTV Camera', category: 'Home security', price: 'UGX. 350,000', image: 'security.jpeg' },
    { id: 'jbl-speaker', name: 'JBL Speaker', category: 'Smart devices', price: 'UGX. 150,000', image: 'portablespeaker.jpeg' },
    { id: 'iwatch', name: 'Iwatch', category: 'Mobile devices', price: 'UGX. 80,000', image: 'watch.jpeg' },
    { id: 'ipad', name: 'Ipad', category: 'Tablet', price: 'UGX. 450,000', image: 'jpeg1.jpeg' },
    { id: 'earpods', name: 'Ear pods', category: 'Phone accesories', price: 'UGX. 20,000', image: 'airpods.jpeg' }
];

// --- 2. PRODUCT ROUTES ---

// GET /products
// Your frontend's api.getProducts() calls this route (mapped to /api/products)
router.get('/products', (req, res) => {
    // Sends the mock array back to the frontend
    res.json({
        success: true,
        data: MOCK_PRODUCTS,
        count: MOCK_PRODUCTS.length
    });
});

// GET /products/:id
// Handles requests for a single product
router.get('/products/:id', (req, res) => {
    const product = MOCK_PRODUCTS.find(p => p.id === req.params.id);
    if (product) {
        res.json({ success: true, data: product });
    } else {
        res.status(404).json({ success: false, message: 'Product not found' });
    }
});

// POST, PUT, and DELETE routes need to exist in the router
// to match the functions in your api.js, even if they currently
// just send back a success message (mocking the action).
router.post('/products', (req, res) => {
    res.status(201).json({ success: true, message: "Product created (mock)" });
});

router.put('/products/:id', (req, res) => {
    res.json({ success: true, message: "Product updated (mock)" });
});

router.delete('/products/:id', (req, res) => {
    res.json({ success: true, message: "Product deleted (mock)" });
});


// --- 3. OTHER API ROUTES (PLACEHOLDERS) ---

// GET /health
router.get('/health', (req, res) => {
    res.json({ success: true, message: 'API is healthy' });
});

// Order and Payment endpoints (required placeholders for your api.js)
router.post('/orders', (req, res) => res.status(201).json({ success: true, orderId: 'O123', message: 'Order placed (mock)' }));
router.get('/orders/:id', (req, res) => res.json({ success: true, order: { id: req.params.id } }));
router.put('/orders/:id/status', (req, res) => res.json({ success: true, message: 'Status updated (mock)' }));

router.post('/payments/generate', (req, res) => res.json({ success: true, paymentUrl: 'mock_url' }));
router.post('/payments/verify', (req, res) => res.json({ success: true, verified: true }));


module.exports = router;
