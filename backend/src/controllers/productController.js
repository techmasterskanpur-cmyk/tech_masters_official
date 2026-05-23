/**
 * productController.js
 * ─────────────────────
 * HTTP handlers for product routes.
 * Uses the unified cache service for in-memory caching and sets
 * appropriate HTTP Cache-Control + ETag headers so browsers and CDNs
 * can serve repeat requests without hitting the backend at all.
 */

const Product = require('../models/productModel');
const fs      = require('fs');
const csv     = require('csv-parser');
const asyncHandler = require('../utils/asyncHandler');
const productService = require('../services/productService');
const {
    invalidateProductList,
    invalidateProductDetail,
    invalidateCategories,
    invalidateAll,
    homepageCache,
    stats,
    wrapSWR,
} = require('../utils/cache');
const crypto = require('crypto');

// ── Cache-Control helpers ─────────────────────────────────────────────────────

function setCacheHeaders(res, maxAge, staleWhileRevalidate = maxAge * 2) {
    res.set(
        'Cache-Control',
        `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
    );
}

/**
 * Generate a lightweight ETag from a JSON body.
 * Lets browsers skip the response body on 304 Not Modified.
 */
function etag(data) {
    return `"${crypto.createHash('md5').update(JSON.stringify(data)).digest('hex').slice(0, 16)}"`;
}

function sendWithEtag(req, res, data, maxAge, swr) {
    const tag = etag(data);
    res.set('ETag', tag);
    setCacheHeaders(res, maxAge, swr);

    if (req.headers['if-none-match'] === tag) {
        return res.status(304).end();   // Browser already has a fresh copy ✅
    }
    res.json(data);
}

// ── Homepage bundle endpoint ──────────────────────────────────────────────────

/**
 * GET /api/homepage
 *
 * Returns ALL data the homepage needs in a single round-trip:
 *   { categories, featured, popular, newest }
 *
 * This is the most important optimization: one request instead of four.
 * Result is aggressively cached at every layer.
 */
exports.getHomepageBundle = asyncHandler(async (req, res) => {
    const HOME_MIN_PRICE = 251;

    const data = await wrapSWR(
        homepageCache,
        'bundle',
        async () => {
            const [categories, featured, popular, newest] = await Promise.all([
                productService.getCategories(),
                productService.listProducts({ page: 1, limit: 8, sort: 'popular', minPrice: HOME_MIN_PRICE }),
                productService.listProducts({ page: 1, limit: 8, sort: 'rating',  minPrice: HOME_MIN_PRICE }),
                productService.listProducts({ page: 1, limit: 8, sort: 'newest',  minPrice: HOME_MIN_PRICE }),
            ]);
            return { categories, featured, popular, newest };
        },
        90   // stale-ok for 90 s beyond the 45 s TTL
    );

    sendWithEtag(req, res, data, 45, 90);
});

// ── Categories ────────────────────────────────────────────────────────────────

exports.getCategories = asyncHandler(async (req, res) => {
    const data = await productService.getCategories();
    sendWithEtag(req, res, data, 60, 120);
});

// ── Product list ──────────────────────────────────────────────────────────────

exports.getProducts = asyncHandler(async (req, res) => {
    const result = await productService.listProducts(req.query);
    sendWithEtag(req, res, result, 30, 60);
});

// ── Product detail ────────────────────────────────────────────────────────────

exports.getProductById = asyncHandler(async (req, res) => {
    const product = await productService.getProductById(req.params.id);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }
    sendWithEtag(req, res, product, 120, 240);
});

// ── Admin: Inventory (no cache) ───────────────────────────────────────────────

exports.getProductsInventory = asyncHandler(async (req, res) => {
    const result = await productService.listProductsInventory(req.query);
    res.set('Cache-Control', 'no-store');
    res.json(result);
});

// ── Admin: Upload CSV ─────────────────────────────────────────────────────────

exports.uploadProducts = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    console.log('🚀 Starting Error-Free Upload...');
    const products = [];
    const cleanKey = (key) => key.trim().replace(/^\ufeff/, '');
    let rowIndex = 0;

    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (rawRow) => {
            rowIndex++;
            try {
                const row = {};
                Object.keys(rawRow).forEach((key) => {
                    row[cleanKey(key)] = rawRow[key];
                });

                let nameStr = row['wd-entities-title'] || row['name'] || `Product ${rowIndex}`;
                const name = nameStr.trim();
                
                // Generate a stable slug from the product name
                const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                const productId = slug || `product-${rowIndex}`;

                let basePrice = parseFloat(row['woocommerce-Price-amount'] || row['basePrice']);
                if (isNaN(basePrice)) basePrice = 0;

                let finalPrice = basePrice;
                if (basePrice > 0) {
                    if (basePrice < 100) {
                        finalPrice = basePrice * 1.05;
                    } else if (basePrice >= 100 && basePrice <= 200) {
                        finalPrice = basePrice * 1.07;
                    } else {
                        finalPrice = basePrice * 1.10;
                    }
                    finalPrice = Math.round(finalPrice);
                    if (finalPrice % 10 === 0) finalPrice -= 1;
                }

                let images = [];
                if (row.images) images = row.images.split(',');
                else if (row.image) images.push(row.image);
                else images.push('https://placehold.co/600x600?text=No+Image');

                products.push({
                    productId:   productId,
                    name:        name,
                    category:    row.category || 'Components',
                    description: row.description || name,
                    basePrice,
                    finalPrice,
                    stock: parseInt(row.stock || 50, 10),
                    image:  images[0],
                    images,
                });
            } catch (err) {
                console.log('Skipping row');
            }
        })
        .on('end', async () => {
            try {
                // Use bulkWrite with upsert to preserve existing reviews and data
                const bulkOps = products.map(p => ({
                    updateOne: {
                        filter: { productId: p.productId },
                        update: { 
                            $set: p,
                            $setOnInsert: { reviewCount: 0, numReviews: 0, rating: 0, reviews: [] }
                        },
                        upsert: true
                    }
                }));
                
                if (bulkOps.length > 0) {
                    await Product.bulkWrite(bulkOps);
                }
                
                console.log(`✅ SUCCESS! ${products.length} Products Uploaded/Updated.`);
                invalidateAll();                // nuke everything after bulk reload
                fs.unlinkSync(req.file.path);
                res.status(200).json({ message: 'Upload Successful!' });
            } catch (error) {
                console.error('❌ ERROR:', error.message);
                res.status(500).json({ message: error.message });
            }
        });
};

// ── Admin: Delete ─────────────────────────────────────────────────────────────

exports.deleteProduct = asyncHandler(async (req, res) => {
    await Product.deleteOne({ _id: req.params.id });
    invalidateProductDetail(req.params.id);
    invalidateProductList();
    invalidateCategories();
    res.json({ message: 'Deleted' });
});

exports.deleteAllProducts = asyncHandler(async (req, res) => {
    await Product.deleteMany({});
    invalidateAll();
    res.json({ message: 'All Deleted' });
});

// ── Reviews ───────────────────────────────────────────────────────────────────

exports.createProductReview = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
        return res.status(400).json({ message: 'Product already reviewed' });
    }

    product.reviews.push({
        name:   req.user.name,
        rating: Number(rating),
        comment,
        user:   req.user._id,
    });

    product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;
        
    product.reviewCount = product.reviews.length;
    product.numReviews = product.reviews.length;

    await product.save();

    // Invalidate detail cache for this product so next fetch is fresh
    invalidateProductDetail(req.params.id);
    invalidateProductDetail(product.productId);

    res.status(201).json({ message: 'Review added' });
});

// ── Health / Cache stats (internal) ──────────────────────────────────────────

exports.getCacheStats = asyncHandler(async (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json(stats());
});

// ── Legacy export for backward compat ────────────────────────────────────────
exports.invalidateCategoriesCache = invalidateCategories;
