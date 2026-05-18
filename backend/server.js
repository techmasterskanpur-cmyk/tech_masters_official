/**
 * server.js – Tech_Masters Entry Point
 * ──────────────────────────────────────
 * Boot sequence:
 *   1. Connect to MongoDB (with tuned connection pool)
 *   2. Pre-warm the in-memory cache (homepage + categories)
 *   3. Start the HTTP server
 *
 * This means the very first real user request is served from cache, not DB.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app           = require('./src/app');
const connectDB     = require('./src/database/db');
const productService = require('./src/services/productService');
const { warmUp }    = require('./src/utils/cache');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // ── 1. Database ────────────────────────────────────────────────────────
        await connectDB();

        // ── 2. Cache warm-up (non-blocking: errors won't crash the server) ────
        //    Fire-and-forget – the server is usable before this resolves,
        //    but first request will likely be a cache hit thanks to await.
        await warmUp(productService).catch((e) =>
            console.warn('⚠️  Cache warm-up failed (non-fatal):', e.message)
        );

        // ── 3. HTTP server ─────────────────────────────────────────────────────
        const server = app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
        });

        // Graceful shutdown
        const shutdown = (signal) => {
            console.log(`\n🛑 ${signal} received – shutting down gracefully…`);
            server.close(() => {
                console.log('🔒 HTTP server closed.');
                process.exit(0);
            });
            // Force exit if something hangs
            setTimeout(() => process.exit(1), 10_000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT',  () => shutdown('SIGINT'));

    } catch (error) {
        console.error('❌ Server failed to start:', error);
        process.exit(1);
    }
};

startServer();