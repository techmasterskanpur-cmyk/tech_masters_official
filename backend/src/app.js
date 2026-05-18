/**
 * app.js – Tech_Masters Express Application
 * ──────────────────────────────────────────
 * Performance-hardened setup:
 *   • Compression (gzip/br) on every response
 *   • Security headers via Helmet
 *   • Smart CORS with explicit allowed origins
 *   • Rate limiting on auth endpoints
 *   • /api/homepage batch endpoint (1 request instead of 4 for the home page)
 *   • ETag middleware for 304 Not Modified support
 */

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const compression  = require('compression');
const rateLimit    = require('express-rate-limit');

const orderRoutes   = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');
const authRoutes    = require('./routes/authRoutes');

const { getCategories, getHomepageBundle } = require('./controllers/productController');

const app = express();

// ── Trust proxy (required for Render / Railway / Heroku) ─────────────────────
app.set('trust proxy', 1);

// ── ETag support (lets browsers cache with 304 Not Modified) ─────────────────
app.set('etag', 'strong');

// ── Compression: reduces JSON payload size by ~70 % ──────────────────────────
app.use(compression({ level: 6, threshold: 1024 }));

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
// Allow: all *.vercel.app domains, localhost (any port), and any explicit
// FRONTEND_URL set in the environment.
const VERCEL_PATTERN = /^https:\/\/[\w-]+(\.vercel\.app)$/;
const LOCALHOST_PATTERN = /^http:\/\/localhost(:\d+)?$/;

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (curl, Postman, mobile apps, SSR)
            if (!origin) return callback(null, true);

            // Allow all Vercel preview + production deployments
            if (VERCEL_PATTERN.test(origin)) return callback(null, true);

            // Allow localhost development
            if (LOCALHOST_PATTERN.test(origin)) return callback(null, true);

            // Allow explicit custom domain set via env var
            if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
                return callback(null, true);
            }

            // Allow everything in development
            if (process.env.NODE_ENV !== 'production') return callback(null, true);

            callback(new Error(`CORS: origin "${origin}" not allowed`));
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── Request logger (dev only) ─────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// ── Rate limiters ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * /api/homepage  ← NEW: single batch endpoint for the home page
 * Returns { categories, featured, popular, newest } in one request.
 * Cached aggressively (45 s fresh + 90 s stale-while-revalidate).
 */
app.get('/api/homepage', getHomepageBundle);

app.use('/api/auth',     authLimiter, authRoutes);
app.get('/api/categories', getCategories);
app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
    res.json({ status: 'ok', message: 'Tech_Masters Backend is running ⚡' });
});

app.get('/api/health', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ status: 'ok', uptime: process.uptime() });
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('[Error]', err.message || err);
    const status = err.statusCode || err.status || 500;
    res.status(status).json({
        message: err.message || 'Internal server error',
    });
});

module.exports = app;