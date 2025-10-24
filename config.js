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
