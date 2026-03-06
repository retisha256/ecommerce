/**
 * Database Connection Module (db.js)
 * Connects the Node.js application to MongoDB using Mongoose.
 * * NOTE: This requires the 'mongoose' package to be installed (npm install mongoose).
 */
const mongoose = require('mongoose');
const config = require('./config'); // Assumes config.js is in the same directory

/**
 * Establishes and maintains the connection to MongoDB.
 */
const connectDB = async () => {
    try {
        // Mongoose automatically handles a lot of the old connection options.
        // We use the connection string from config.js
        const conn = await mongoose.connect(config.MONGODB_URI);

        console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);
    } catch (error) {
        // If the connection fails (e.g., mongod server isn't running)
        console.error(`Error connecting to MongoDB: ${error.message}`);
        
        // Exit process with failure code, as the application cannot run without a database
        process.exit(1);
    }
};

module.exports = connectDB;
