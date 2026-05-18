/**
 * useHomepageQuery.ts
 * ───────────────────
 * Fetches ALL homepage data (categories + 3 product sections) in a
 * SINGLE API call to /api/homepage instead of 4 separate requests.
 *
 * This is the #1 performance win for the home page:
 *   Before: 4 requests × (network RTT + DB query) ≈ 2–4 s
 *   After:  1 request  × (network RTT + 1 parallel DB query) ≈ 300–600 ms
 */

import { useQuery } from '@tanstack/react-query';
// @ts-ignore
import api from '@/api/axios';
import type { CategorySummary, PaginatedProducts } from '@/lib/productMapping';

export interface HomepageBundle {
  categories: CategorySummary[];
  featured:   PaginatedProducts;
  popular:    PaginatedProducts;
  newest:     PaginatedProducts;
}

export function useHomepageBundle() {
  return useQuery<HomepageBundle>({
    queryKey: ['homepage', 'bundle'],
    queryFn: async () => {
      const { data } = await api.get<HomepageBundle>('/homepage');
      return data;
    },
    staleTime: 45_000,          // matches backend TTL (45 s)
    gcTime:    5 * 60 * 1000,   // keep in memory for 5 min after unmount
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });
}
