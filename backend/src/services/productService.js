/**
 * productService.js
 * ─────────────────
 * All DB queries for products, wrapped in the Tech_Masters cache layer.
 * Every public read path goes through cache.wrapSWR() so we always serve
 * a response from memory while DB revalidation runs in the background.
 */

const mongoose = require('mongoose');
const Product = require('../models/productModel');
const {
    productListCache,
    productDetailCache,
    categoriesCache,
    buildKey,
    wrapSWR,
} = require('../utils/cache');

const MAX_LIMIT_PUBLIC = 100;
const DEFAULT_LIMIT = 24;

// ── Helpers ───────────────────────────────────────────────────────────────────

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function buildListMatch({
    category,
    categories,
    q,
    minPrice,
    maxPrice,
    inStock,
    excludeId,
    minRating,
}) {
    const match = {};

    if (categories && categories.length > 0) {
        match.category = { $in: categories };
    } else if (category) {
        match.category = category;
    }

    if (minRating !== undefined && minRating !== null && minRating !== '') {
        const r = Number(minRating);
        if (!Number.isNaN(r) && r > 0) {
            match.rating = { $gte: r };
        }
    }

    if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
        const n = Number(minPrice);
        if (!Number.isNaN(n)) match.finalPrice = { ...match.finalPrice, $gte: n };
    }
    if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
        const n = Number(maxPrice);
        if (!Number.isNaN(n)) {
            match.finalPrice = { ...match.finalPrice, $lte: n };
        }
    }

    if (inStock === true || inStock === 'true' || inStock === '1') {
        match.stock = { $gt: 0 };
    }

    if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
        match._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
    }

    if (q && String(q).trim()) {
        const term = String(q).trim();
        match.$or = [
            { name: { $regex: escapeRegex(term), $options: 'i' } },
            { description: { $regex: escapeRegex(term), $options: 'i' } },
            { category: { $regex: escapeRegex(term), $options: 'i' } },
        ];
    }

    return match;
}

function sortStage(sort) {
    switch (sort) {
        case 'price_asc':
            return { finalPrice: 1, _id: 1 };
        case 'price_desc':
            return { finalPrice: -1, _id: 1 };
        case 'rating':
            return { rating: -1, reviewCount: -1, _id: 1 };
        case 'newest':
            return { createdAt: -1, _id: 1 };
        case 'popular':
        default:
            return { reviewCount: -1, rating: -1, _id: 1 };
    }
}

// ── Core DB fetchers (no cache logic here – cache is applied at call site) ────

async function _fetchProducts(query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    let limit = parseInt(query.limit, 10) || DEFAULT_LIMIT;
    if (Number.isNaN(limit) || limit < 1) limit = DEFAULT_LIMIT;
    limit = Math.min(limit, MAX_LIMIT_PUBLIC);

    const sort = query.sort || 'popular';
    const categoriesList = query.categories
        ? String(query.categories)
              .split(',')
              .map((c) => c.trim())
              .filter(Boolean)
        : [];

    const match = buildListMatch({
        category: categoriesList.length ? undefined : query.category,
        categories: categoriesList.length ? categoriesList : undefined,
        q: query.q,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        inStock: query.inStock,
        excludeId: query.exclude,
        minRating: query.minRating,
    });

    const pipeline = [
        { $match: match },
        {
            $addFields: {
                reviewCount: { $size: { $ifNull: ['$reviews', []] } },
                numReviews:  { $size: { $ifNull: ['$reviews', []] } },
            },
        },
        { $sort: sortStage(sort) },
        {
            $facet: {
                metadata: [{ $count: 'total' }],
                data: [
                    { $skip: (page - 1) * limit },
                    { $limit: limit },
                    {
                        $project: {
                            name: 1,
                            category: 1,
                            subCategories: 1,
                            productId: 1,
                            finalPrice: 1,
                            basePrice: 1,
                            stock: 1,
                            images: 1,
                            image: 1,
                            rating: 1,
                            createdAt: 1,
                            reviewCount: 1,
                            numReviews: 1,
                            description: {
                                $substrCP: [{ $ifNull: ['$description', ''] }, 0, 220],
                            },
                        },
                    },
                ],
            },
        },
    ];

    const [result] = await Product.aggregate(pipeline).allowDiskUse(false);
    const total = result?.metadata?.[0]?.total ?? 0;
    const items = result?.data ?? [];
    const pages = Math.ceil(total / limit) || 1;

    return { items, total, page, pages, limit };
}

async function _fetchCategories() {
    return Product.aggregate([
        { $match: { category: { $exists: true, $ne: '' } } },
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 },
            },
        },
        { $sort: { count: -1 } },
        {
            $project: {
                _id: 0,
                name: '$_id',
                slug: '$_id',
                count: 1,
            },
        },
    ]);
}

async function _fetchProductById(id) {
    const or = [];
    if (mongoose.Types.ObjectId.isValid(id)) {
        or.push({ _id: new mongoose.Types.ObjectId(id) });
    }
    or.push({ productId: id });

    const doc = await Product.findOne({ $or: or }).lean();
    if (!doc) return null;

    const reviewCount = Array.isArray(doc.reviews) ? doc.reviews.length : 0;
    return { ...doc, numReviews: reviewCount };
}

// ── Public API (cache-wrapped) ────────────────────────────────────────────────

/**
 * List products with full cache+SWR support.
 * Skips cache for user-specific / search queries so stale search results
 * are never served (search UX > cache benefit for free-text queries).
 */
async function listProducts(query) {
    // Don't cache free-text searches – they are highly variable and infrequent
    if (query.q && String(query.q).trim()) {
        return _fetchProducts(query);
    }

    const key = buildKey('products', {
        page:        query.page       || 1,
        limit:       query.limit      || DEFAULT_LIMIT,
        sort:        query.sort       || 'popular',
        category:    query.category   || '',
        categories:  query.categories || '',
        minPrice:    query.minPrice   || '',
        maxPrice:    query.maxPrice   || '',
        inStock:     query.inStock    || '',
        exclude:     query.exclude    || '',
        minRating:   query.minRating  || '',
    });

    return wrapSWR(productListCache, key, () => _fetchProducts(query), 60);
}

async function getCategories() {
    return wrapSWR(categoriesCache, 'all', _fetchCategories, 600);
}

async function getProductById(id) {
    if (!id) return null;
    return wrapSWR(productDetailCache, String(id), () => _fetchProductById(id), 240);
}

/**
 * Admin inventory – NEVER cached (admins need real-time data).
 */
async function listProductsInventory(query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    let limit = parseInt(query.limit, 10) || 100;
    if (Number.isNaN(limit) || limit < 1) limit = 100;
    const maxAdmin = 500;
    limit = Math.min(limit, maxAdmin);

    const categoriesList = query.categories
        ? String(query.categories)
              .split(',')
              .map((c) => c.trim())
              .filter(Boolean)
        : [];

    const match = buildListMatch({
        category:   categoriesList.length ? undefined : query.category,
        categories: categoriesList.length ? categoriesList : undefined,
        q:          query.q,
        minPrice:   query.minPrice,
        maxPrice:   query.maxPrice,
        inStock:    query.inStock,
        excludeId:  null,
        minRating:  query.minRating,
    });

    const [count, items] = await Promise.all([
        Product.countDocuments(match),
        Product.find(match)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
    ]);

    const pages = Math.ceil(count / limit) || 1;
    return { items, total: count, page, pages, limit };
}

module.exports = {
    listProducts,
    getCategories,
    getProductById,
    listProductsInventory,
    MAX_LIMIT_PUBLIC,
    DEFAULT_LIMIT,
};
