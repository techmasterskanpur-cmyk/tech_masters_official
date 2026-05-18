/**
 * db.js – MongoDB Connection
 * ───────────────────────────
 * Tuned Mongoose connection options for production:
 *
 *  • maxPoolSize: 10   – up to 10 concurrent DB connections
 *                        (prevents connection storms under load)
 *  • serverSelectionTimeoutMS: 5000 – fail fast if Atlas is unreachable
 *  • socketTimeoutMS: 45000         – don't hang forever on a slow query
 *  • connectTimeoutMS: 10000        – timeout for initial TCP handshake
 *  • heartbeatFrequencyMS: 10000    – monitor the cluster every 10 s
 */

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            maxPoolSize:               10,
            serverSelectionTimeoutMS:  5_000,
            socketTimeoutMS:          45_000,
            connectTimeoutMS:         10_000,
            heartbeatFrequencyMS:     10_000,
        });

        console.log(`🍃 MongoDB Connected: ${conn.connection.host}`);

        // Log slow queries in development
        if (process.env.NODE_ENV !== 'production') {
            mongoose.set('debug', false); // set to true to log all queries
        }
    } catch (error) {
        console.error(`❌ MongoDB connection error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;