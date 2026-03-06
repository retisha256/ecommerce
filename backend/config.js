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
    MONGODB_URI: process.env.MONGODB_URI,
    // Mobile Money Configuration
    MTN_MERCHANT_NUMBER: process.env.MTN_MERCHANT_NUMBER || '256754030391',
    AIRTEL_MERCHANT_NUMBER: process.env.AIRTEL_MERCHANT_NUMBER || '256705030391',
    AIRTEL_MERCHANT_CODE: process.env.AIRTEL_MERCHANT_CODE || '80ESSDHY',
    
    // Airtel API Configuration (Uganda)
    AIRTEL_API_BASE_URL: process.env.AIRTEL_API_BASE_URL || 'https://apiuat.airtel.africa',
    AIRTEL_API_KEY: process.env.AIRTEL_API_KEY || 'your_airtel_api_key',
    AIRTEL_CALLBACK_URL: process.env.AIRTEL_CALLBACK_URL || 'https://yourdomain.com/api/payments/airtel/webhook',
    
    // MTN API Configuration (Uganda) - To be implemented
    MTN_API_BASE_URL: process.env.MTN_API_BASE_URL || 'https://api.mtn.com',
    MTN_API_KEY: process.env.MTN_API_KEY || 'your_mtn_api_key',
    MTN_CALLBACK_URL: process.env.MTN_CALLBACK_URL || 'https://yourdomain.com/api/payments/mtn/webhook',
    
    // WhatsApp Configuration
    WHATSAPP_NUMBER: process.env.WHATSAPP_NUMBER || '256754030391',
    
    // JWT Secret (for future authentication)
    JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    
    // Email Configuration (for notifications)
    EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
    EMAIL_PORT: process.env.EMAIL_PORT || 587,
    EMAIL_USER: process.env.EMAIL_USER || 'your_email@gmail.com',
    EMAIL_PASS: process.env.EMAIL_PASS || 'your_app_password',
};

