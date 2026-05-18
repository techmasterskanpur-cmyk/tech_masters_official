const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const rateLimit = require('express-rate-limit');
const upload = multer({ dest: 'uploads/' });

const {
    getProducts,
    getProductById,
    getProductsInventory,
    uploadProducts,
    deleteProduct,
    deleteAllProducts,
    createProductReview,
    getCacheStats,
} = require('../controllers/productController');

const { fetchImage } = require('../controllers/imageController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 30,
    message: { message: 'Too many uploads, try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ── Image proxy (unchanged) ───────────────────────────────────────────────────
router.get('/proxy/image', fetchImage);

// ── Admin-only ────────────────────────────────────────────────────────────────
router.get('/inventory', protect, adminOnly, getProductsInventory);

router.post(
    '/upload',
    uploadLimiter,
    protect,
    adminOnly,
    upload.single('file'),
    uploadProducts
);

router.delete('/delete-all', protect, adminOnly, deleteAllProducts);

// ── Cache stats (admin only) ──────────────────────────────────────────────────
router.get('/cache-stats', protect, adminOnly, getCacheStats);

// ── Reviews ───────────────────────────────────────────────────────────────────
router.post('/:id/reviews', protect, createProductReview);

// ── Public product endpoints ──────────────────────────────────────────────────
router.get('/',    getProducts);
router.get('/:id', getProductById);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
