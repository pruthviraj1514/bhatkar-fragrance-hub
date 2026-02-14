/**
 * PRODUCTION-OPTIMIZED REACT PRODUCTS COMPONENT
 * ===============================================
 * 
 * Features:
 * - Single API call (no N+1)
 * - Request deduplication
 * - Proper loading states
 * - Error boundaries
 * - Pagination
 * - Image lazy loading
 * - Performance optimized
 * 
 * File: src/hooks/useProducts.ts (or similar)
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../lib/axios';
import { logger } from '../utils/logger';

// ========================================================================
// TYPE DEFINITIONS
// ========================================================================

interface ProductImage {
  id: number;
  url: string;
  alt: string;
  thumb: boolean;
}

interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  original_price: number;
  discount_percentage: number;
  final_price: number;
  category: string;
  concentration: string;
  stock: number;
  is_best_seller: boolean;
  is_active: boolean;
  avg_rating: number;
  total_reviews: number;
  images: ProductImage[];
}

interface UseProductsOptions {
  page?: number;
  limit?: number;
  category?: string;
  autoFetch?: boolean;
}

// ========================================================================
// REQUEST DEDUPLICATION
// ========================================================================

const requestCache = new Map<string, Promise<any>>();

function getOrMakeRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (requestCache.has(key)) {
    return requestCache.get(key);
  }

  const promise = fn();
  requestCache.set(key, promise);
  
  // Clear cache after 1 second to allow fresh requests
  setTimeout(() => requestCache.delete(key), 1000);
  
  return promise;
}

// ========================================================================
// CUSTOM HOOK: useProducts
// ========================================================================

export function useProducts(options: UseProductsOptions = {}) {
  const {
    page = 1,
    limit = 20,
    category = null,
    autoFetch = true
  } = options;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page,
    limit,
    total: 0,
    pages: 0
  });

  // Track if component is still mounted (prevent memory leaks)
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Generate cache key for deduplication
      const cacheKey = `products:${category || 'all'}:${page}:${limit}`;

      // Use request deduplication
      const response = await getOrMakeRequest(cacheKey, () =>
        api.get('/products', {
          params: {
            page,
            limit,
            ...(category && { category })
          }
        })
      );

      // Only update if component is still mounted
      if (!isMountedRef.current) return;

      const { data, pagination: paginationData } = response.data;

      setProducts(data || []);
      setPagination(paginationData || {
        page,
        limit,
        total: 0,
        pages: 0
      });

      logger.info(`✅ Loaded ${data?.length} products (${response.data.responseTime})`);

    } catch (err: any) {
      if (!isMountedRef.current) return;

      const errorMessage = err.response?.data?.message || err.message || 'Failed to load products';
      setError(errorMessage);
      logger.error('❌ Error loading products:', errorMessage);

    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [page, limit, category]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchProducts();
    }
  }, [fetchProducts, autoFetch]);

  return {
    products,
    loading,
    error,
    pagination,
    refetch: fetchProducts,
    hasMore: pagination.page < pagination.pages
  };
}

// ========================================================================
// CUSTOM HOOK: useSingleProduct
// ========================================================================

export function useSingleProduct(productId: number | string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/products/${productId}`);

      if (!isMountedRef.current) return;

      setProduct(response.data.data);
      logger.info(`✅ Loaded product #${productId}`);

    } catch (err: any) {
      if (!isMountedRef.current) return;

      const errorMessage = err.response?.data?.message || 'Failed to load product';
      setError(errorMessage);
      logger.error('❌ Error loading product:', errorMessage);

    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return { product, loading, error,refetch: fetchProduct };
}

// ========================================================================
// CUSTOM HOOK: useBestSellers
// ========================================================================

export function useBestSellers(limit: number = 10) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get('/products/bestsellers', {
          params: { limit }
        });

        setProducts(response.data.data || []);

      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load');
        logger.error('❌ Error loading best sellers:', err.message);

      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, [limit]);

  return { products, loading, error };
}

// ========================================================================
// CUSTOM HOOK: Search Products with Debounce
// ========================================================================

import { useMemo } from 'react';

export function useSearchProducts(searchTerm: string, debounceMs: number = 300) {
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't search for empty or very short terms
    if (!searchTerm || searchTerm.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);

    // Debounce the search request
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await api.get('/products/search', {
          params: { q: searchTerm }
        });

        if (!isMountedRef.current) return;

        setResults(response.data.data || []);
        setError(null);

      } catch (err: any) {
        if (!isMountedRef.current) return;

        setError(err.response?.data?.message || 'Search failed');
        setResults([]);

      } finally {
        if (isMountedRef.current) {
          setSearching(false);
        }
      }
    }, debounceMs);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };

  }, [searchTerm, debounceMs]);

  return { results, searching, error };
}

// ========================================================================
// LAZY IMAGE LOADING HELPER
// ========================================================================

export function useLazyImage(imageUrl: string) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          img.src = imageUrl;
          observer.unobserve(img);

          img.onload = () => setLoaded(true);
          img.onerror = () => setError(true);
        }
      },
      { rootMargin: '50px' }
    );

    observer.observe(img);

    return () => observer.disconnect();

  }, [imageUrl]);

  return { imageRef, loaded, error };
}

// ========================================================================
// PAGINATION HELPER
// ========================================================================

export function usePagination(totalPages: number, currentPage: number) {
  return useMemo(() => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    const halfWindow = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, currentPage - halfWindow);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push('...');
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  }, [totalPages, currentPage]);
}

// ========================================================================
// USAGE EXAMPLE IN A COMPONENT
// ========================================================================

/*
import React, { useState } from 'react';
import { useProducts, useLazyImage, usePagination } from './hooks/useProducts';

export function ProductsPage() {
  const [page, setPage] = useState(1);
  const { products, loading, error, pagination, hasMore } = useProducts({
    page,
    limit: 20,
    autoFetch: true
  });

  const pageNumbers = usePagination(pagination.pages, pagination.page);

  if (loading && products.length === 0) {
    return <div>Loading products...</div>;
  }

  if (error && products.length === 0) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-4">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>

          {pageNumbers.map((p, i) => (
            <button
              key={i}
              onClick={() => typeof p === 'number' && setPage(p)}
              className={page === p ? 'active' : ''}
            >
              {p}
            </button>
          ))}

          <button
            disabled={!hasMore}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const thumbnail = product.images?.find(img => img.thumb) || product.images?.[0];
  const { imageRef, loaded } = useLazyImage(thumbnail?.url || '');

  return (
    <div className="product-card">
      <img
        ref={imageRef}
        src="/placeholder.jpg"
        alt={thumbnail?.alt}
        className={loaded ? 'loaded' : 'loading'}
      />
      <h3>{product.name}</h3>
      <p className="brand">{product.brand}</p>
      <p className="price">${product.final_price}</p>
      <p className="rating">⭐ {product.avg_rating} ({product.total_reviews})</p>
    </div>
  );
}
*/
