// This script is run once to populate the database with initial product data.

const mongoose = require('mongoose');
const config = require('./config'); // Assumes your config.js is in the same folder
const Product = require('./models/product.model'); // Assumes your Product model path

// 1. Define the sample products
const sampleProducts = [
    {
        name: 'Spectrum Laptop 14.6 Inc',
        category: 'Laptops',
        price: 950000, // Price in UGX
        description: 'High-performance laptop with a 14.6-inch display, perfect for professional use.',
        imageUrl: 'https://placehold.co/400x400/805ad5/ffffff?text=LAPTOP',
        rating: 5,
        stock: 15
    },
    {
        name: 'SONY Alpha Camera Kit',
        category: 'Electronics',
        price: 1800000,
        description: 'Professional grade mirrorless camera kit with standard zoom lens.',
        imageUrl: 'https://placehold.co/400x400/805ad5/ffffff?text=CAMERA',
        rating: 4,
        stock: 8
    },
    {
        name: 'Fast-Charging Power Bank',
        category: 'Accessories',
        price: 85000,
        description: '20,000mAh power bank with fast-charging USB-C ports.',
        imageUrl: 'https://placehold.co/400x400/805ad5/ffffff?text=POWER+BANK',
        rating: 5,
        stock: 45
    },
    {
        name: 'Wireless Noise-Cancelling Headphones',
        category: 'Audio',
        price: 240000,
        description: 'Immersive sound experience with industry-leading noise cancellation.',
        imageUrl: 'https://placehold.co/400x400/805ad5/ffffff?text=HEADPHONES',
        rating: 4,
        stock: 22
    }
];

// 2. Connect to MongoDB Atlas
mongoose.connect(config.MONGODB_URI)
    .then(async () => {
        console.log('MongoDB connection successful. Starting database seeding...');

        // 3. Clear existing products (optional, but good for fresh runs)
        await Product.deleteMany({});
        console.log('Existing products cleared.');

        // 4. Insert new products
        const result = await Product.insertMany(sampleProducts);
        console.log(`Successfully inserted ${result.length} products.`);
        
        // 5. Check the current count
        const count = await Product.countDocuments({});
        console.log(`Total products now in database: ${count}`);
    })
    .catch(err => {
        console.error('Database seeding failed:', err.message);
    })
    .finally(() => {
        // 6. Disconnect from the database
        mongoose.connection.close();
    });
