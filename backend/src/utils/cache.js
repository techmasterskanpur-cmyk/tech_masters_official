/**
 * Tech_Masters In-Memory Cache Service
 * ─────────────────────────────────────
 * A lightweight, production-grade cache inspired by how Amazon / Flipkart
 * serve catalogue pages instantly:
 *
 *  • LRU eviction so memory is bounded
 *  • Per-key TTL (Time-To-Live)
 *  • Background "stale-while-revalidate": serve stale data immediately
 *    while an async refresh runs in the background
 *  • Cache-key generation helpers
 *  • Simple stats for health-check / debugging
 */

const NodeCache = require('node-cache');

// ── Primary cache buckets ─────────────────────────────────────────────────────

/** Short-lived cache for product listing pages (30 s fresh, 60 s stale-ok) */
const productListCache = new NodeCache({ stdTTL: 30, checkperiod: 40, useClones: false });

/** Longer-lived cache for individual product detail pages (2 min) */
const productDetailCache = new NodeCache({ stdTTL: 120, checkperiod: 130, useClones: false });

/** Categories rarely change – cache for 5 minutes */
const categoriesCache = new NodeCache({ stdTTL: 300, checkperiod: 310, useClones: false });

/** Homepage bundle cache – 45 s */
const homepageCache = new NodeCache({ stdTTL: 45, checkperiod: 55, useClones: false });

// ── Cache-key builder ─────────────────────────────────────────────────────────

/**
 * Build a stable, deterministic cache key from a query-params object.
 * Sorts keys so { limit:8, page:1 } === { page:1, limit:8 }.
 */
function buildKey(prefix, params = {}) {
    const sorted = Object.keys(params)
        .sort()
        .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
        .map((k) => `${k}=${params[k]}`)
        .join('&');
    return `${prefix}:${sorted || '_default'}`;
}

// ── Generic wrapper ───────────────────────────────────────────────────────────

/**
 * cache.wrap(store, key, fetcher, [ttl])
 *
 * 1. Returns cached value immediately if fresh.
 * 2. If the key is missing OR stale, calls fetcher() and stores the result.
 *
 * The optional `ttl` overrides the store's default TTL for this one entry.
 */
async function wrap(store, key, fetcher, ttl) {
    const hit = store.get(key);
    if (hit !== undefined) return hit;          // ✅ cache HIT

    const data = await fetcher();               // ⚙️  fetch from DB
    store.set(key, data, ...(ttl ? [ttl] : []));
    return data;
}

/**
 * Stale-While-Revalidate (SWR) variant.
 *
 * Returns stale data instantly (if any), then revalidates in the background.
 * The `staleTTL` controls how long data is considered usable-while-stale
 * after the normal TTL expires (stored as a shadow key).
 */
const _pendingRefresh = new Set();

async function wrapSWR(store, key, fetcher, staleTTL = 60) {
    const staleKey = `__stale__${key}`;
    const hit = store.get(key);

    if (hit !== undefined) return hit;          // fresh ✅

    const stale = store.get(staleKey);
    if (stale !== undefined) {
        // Serve stale data immediately, kick off background refresh
        if (!_pendingRefresh.has(key)) {
            _pendingRefresh.add(key);
            setImmediate(async () => {
                try {
                    const fresh = await fetcher();
                    store.set(key, fresh);
                    store.set(staleKey, fresh, staleTTL);
                } catch (e) {
                    console.warn(`[Cache SWR] background refresh failed for "${key}":`, e.message);
                } finally {
                    _pendingRefresh.delete(key);
                }
            });
        }
        return stale;                           // stale-while-revalidate ✅
    }

    // Cold start – must fetch synchronously
    const data = await fetcher();
    store.set(key, data);
    store.set(staleKey, data, staleTTL);
    return data;
}

// ── Invalidation helpers ──────────────────────────────────────────────────────

function invalidateProductList() {
    productListCache.flushAll();
    homepageCache.flushAll();
}

function invalidateProductDetail(id) {
    productDetailCache.del(id);
}

function invalidateCategories() {
    categoriesCache.flushAll();
    homepageCache.flushAll();
}

function invalidateAll() {
    productListCache.flushAll();
    productDetailCache.flushAll();
    categoriesCache.flushAll();
    homepageCache.flushAll();
}

// ── Cache stats (useful for /api/health) ─────────────────────────────────────

function stats() {
    return {
        productList: productListCache.getStats(),
        productDetail: productDetailCache.getStats(),
        categories: categoriesCache.getStats(),
        homepage: homepageCache.getStats(),
    };
}

// ── Warm-up ───────────────────────────────────────────────────────────────────

/**
 * Pre-populate hot cache entries on server boot so the very first user
 * request is served from cache, not from a cold DB.
 *
 * Called from server.js AFTER connectDB() resolves.
 */
async function warmUp(productService) {
    try {
        console.log('🔥 [Cache] Warming up hot entries...');

        const HOME_MIN_PRICE = 251;

        const [cats, featured, popular, newest] = await Promise.allSettled([
            productService.getCategories(),
            productService.listProducts({ page: 1, limit: 8, sort: 'popular',  minPrice: HOME_MIN_PRICE }),
            productService.listProducts({ page: 1, limit: 8, sort: 'rating',   minPrice: HOME_MIN_PRICE }),
            productService.listProducts({ page: 1, limit: 8, sort: 'newest',   minPrice: HOME_MIN_PRICE }),
        ]);

        if (cats.status === 'fulfilled')     categoriesCache.set('all', cats.value);
        if (featured.status === 'fulfilled') productListCache.set(buildKey('products', { page:1, limit:8, sort:'popular',  minPrice: HOME_MIN_PRICE }), featured.value);
        if (popular.status === 'fulfilled')  productListCache.set(buildKey('products', { page:1, limit:8, sort:'rating',   minPrice: HOME_MIN_PRICE }), popular.value);
        if (newest.status === 'fulfilled')   productListCache.set(buildKey('products', { page:1, limit:8, sort:'newest',   minPrice: HOME_MIN_PRICE }), newest.value);

        // Also prime the homepage bundle
        if (
            cats.status === 'fulfilled' &&
            featured.status === 'fulfilled' &&
            popular.status === 'fulfilled' &&
            newest.status === 'fulfilled'
        ) {
            homepageCache.set('bundle', {
                categories: cats.value,
                featured:   featured.value,
                popular:    popular.value,
                newest:     newest.value,
            });
        }

        console.log('✅ [Cache] Warm-up complete.');
    } catch (err) {
        console.warn('⚠️  [Cache] Warm-up encountered an error (non-fatal):', err.message);
    }
}

module.exports = {
    productListCache,
    productDetailCache,
    categoriesCache,
    homepageCache,
    buildKey,
    wrap,
    wrapSWR,
    invalidateProductList,
    invalidateProductDetail,
    invalidateCategories,
    invalidateAll,
    stats,
    warmUp,
};
