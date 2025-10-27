/**
 * Database Connection Module (db.js)
 * Connects the Node.js application to MongoDB using Mongoose.
 */
const mongoose = require('mongoose');
const config = require('./config'); // Assuming config.js is in the same directory

/**
 * Establishes and maintains the connection to MongoDB.
 */
const connectDB = async () => {
    try {
        // Use the connection string from config.js (either environment variable or local fallback)
        const conn = await mongoose.connect(config.MONGODB_URI, {
            // These options are standard best practices for Mongoose v6+
            // They are technically optional but good to keep for compatibility/stability
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        // If the connection fails (e.g., mongod server isn't running)
        console.error(`Error connecting to MongoDB: ${error.message}`);
        
        // Exit process with failure code
        process.exit(1);
    }
};

module.exports = connectDB;


module.exports = {
    // Server Configuration
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // Database Configuration
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/novuna-electronics',
    
    // Mobile Money Configuration
    MTN_MERCHANT_NUMBER: process.env.MTN_MERCHANT_NUMBER || '256754030391',
    AIRTEL_MERCHANT_NUMBER: process.env.AIRTEL_MERCHANT_NUMBER || '256705030391',
    
    // WhatsApp Configuration
    WHATSAPP_NUMBER: process.env.WHATSAPP_NUMBER || '256754030391',
    
    // JWT Secret (for future authentication)
    JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    
    // Email Configuration (for notifications)
    EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
    EMAIL_PORT: process.env.EMAIL_PORT || 587,
    EMAIL_USER: process.env.EMAIL_USER || 'your_email@gmail.com',
    EMAIL_PASS: process.env.EMAIL_PASS || 'your_app_password',
    
    // API Keys (for production)
    MTN_API_KEY: process.env.MTN_API_KEY || 'your_mtn_api_key',
    AIRTEL_API_KEY: process.env.AIRTEL_API_KEY || 'your_airtel_api_key'
};

