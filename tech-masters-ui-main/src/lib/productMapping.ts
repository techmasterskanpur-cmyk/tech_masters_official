/**
 * productMapping.ts
 * ─────────────────
 * Types for the backend API responses and a mapper function that converts
 * raw API product objects into the `Product` shape expected by ProductCard.
 *
 * Kept in one place so any backend schema change is fixed here only.
 */

import type { Product } from '@/types';

// ── API response shapes ───────────────────────────────────────────────────────

/** One category as returned by GET /api/categories or /api/homepage */
export interface CategorySummary {
  _id: string;        // category name (used as slug)
  count: number;
}

/** One product as returned by the backend */
export interface ApiProduct {
  _id: string;
  productId?: string;
  name: string;
  description?: string;
  category: string;
  basePrice: number;
  finalPrice: number;
  stock: number;
  rating?: number;
  reviews?: { rating: number }[];
  image?: string;
  images?: string[];
  createdAt?: string;
}

/** Paginated product list as returned by GET /api/products or /api/homepage */
export interface PaginatedProducts {
  items: ApiProduct[];
  page: number;
  pages: number;
  total: number;
}

// ── Mapper ────────────────────────────────────────────────────────────────────

/**
 * mapApiProductToCard
 * Converts a raw backend `ApiProduct` into the `Product` type that
 * `ProductCard` and the cart context expect.
 */
export function mapApiProductToCard(p: ApiProduct): Product {
  const image =
    p.image ||
    (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : '') ||
    'https://placehold.co/400x400?text=Tech_Masters';

  const reviewCount = Array.isArray(p.reviews) ? p.reviews.length : 0;
  const rating = typeof p.rating === 'number' ? p.rating : 0;

  return {
    id:            p._id,
    name:          p.name,
    description:   p.description ?? p.name,
    price:         p.finalPrice ?? p.basePrice ?? 0,
    originalPrice: p.basePrice !== p.finalPrice ? p.basePrice : undefined,
    image,
    category:      p.category,
    stock:         p.stock ?? 0,
    rating,
    reviewCount,
    specifications: {},
    tags:          [],
    isFeatured:    false,
    isNew:         false,
    isPopular:     false,
  };
}
