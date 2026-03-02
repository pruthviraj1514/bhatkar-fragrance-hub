import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";

// ─── Image Proxy URL Transformer ─────────────────────────────────────────────
// All Supabase CDN URLs are rewritten to go through the backend image proxy.
// This eliminates ERR_CONNECTION_TIMED_OUT from direct browser→Supabase requests.
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'https://bhatkar-fragrance-hub-1.onrender.com';
const SUPABASE_STORAGE_RE = /https?:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/products\//;

function toProxyUrl(url: string): string {
    if (!url || !url.startsWith('http')) return url;
    const match = url.match(SUPABASE_STORAGE_RE);
    if (!match) return url;
    const filename = url.slice(match.index! + match[0].length);
    return `${BACKEND_URL}/api/images/proxy/${filename}`;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface NormalizedProduct {
    id: number;
    name: string;
    brand: string;
    price: number;
    category: string;
    concentration: string;
    description: string;
    stock: number;
    images: string[];
    quantity_ml?: number;
    quantity_unit?: string;
    is_best_seller?: boolean;
    is_luxury_product?: boolean;
    notes: {
        top: string[];
        middle: string[];
        base: string[];
    };
    sizes: {
        ml: number;
        price: number;
    }[];
    longevity: string;
    rating: number;
    reviewCount: number;
    inStock: boolean;
    original_price?: number;
    discount_percentage?: number;
    shipping_cost?: number;
    other_charges?: number;
}

interface ProductContextType {
    products: NormalizedProduct[];
    loading: boolean;
    error: string | null;
    refreshProducts: () => Promise<void>;
    getProductById: (id: string | number) => NormalizedProduct | undefined;
}

const ProductContext = createContext<ProductContextType | null>(null);

// ── Read cache synchronously before first render ──────────────────────────────
function readProductCache(): NormalizedProduct[] {
    try {
        const raw = localStorage.getItem("products_cache");
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : [];
    } catch {
        return [];
    }
}

export function ProductProvider({ children }: { children: React.ReactNode }) {
    const cachedOnMount = readProductCache();

    // If cache has data → loading is false immediately, no skeleton flash
    const [products, setProducts] = useState<NormalizedProduct[]>(cachedOnMount);
    const [loading, setLoading] = useState(cachedOnMount.length === 0); // true only if cache is empty
    const [error, setError] = useState<string | null>(null);

    const SUPABASE_PROJECT_ID = 'kztbfdzvulahrivixgkx';
    const SUPABASE_PUBLIC_URL_BASE = `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/products/`;

    function toImageUrl(url: string, useProxy = true): string {
        if (!url || !url.startsWith('http')) return url;

        // Check if it's a Supabase storage URL
        const SUPABASE_STORAGE_RE = /https?:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/products\//;
        const match = url.match(SUPABASE_STORAGE_RE);

        if (!match) return url;

        const filename = url.slice(match.index! + match[0].length);

        if (useProxy) {
            return `${BACKEND_URL}/api/images/proxy/${filename}`;
        }

        return `${SUPABASE_PUBLIC_URL_BASE}${filename}`;
    }

    // Initial load: show cache but ALWAYS fetch fresh data
    useEffect(() => {
        let mounted = true;
        fetchProducts(false, mounted); // Set background=false to show progress if cache is old
        return () => { mounted = false; };
    }, []);

    const fetchProducts = async (isBackground = false, _mounted = true) => {
        if (!isBackground) {
            setLoading(true);
        }

        setError(null);

        try {
            console.log('🔄 [Network] Fetching fresh products...');
            const response = await api.get('/products/with-images/all');
            const rawProducts = response.data.data || [];

            // We apply standard normalization (similar to what was in Shop.tsx, but globally)
            const normalizedProducts = rawProducts.map((p: any) => {
                // Standardize structure
                const normalized = {
                    ...p,
                    description: p.description || p.short_description || '',
                    notes: p.notes || { top: [], middle: [], base: [] },
                    sizes: p.sizes || [{ ml: p.quantity_ml || 100, price: p.price || 0 }],
                    longevity: p.longevity || 'moderate',
                    rating: p.rating || 4.5,
                    reviewCount: p.reviewCount || p.review_count || 0,
                    inStock: (p.stock ?? p.quantity ?? 0) > 0,
                    images: Array.isArray(p.images) ? p.images : []
                };

                // Convert image objects to flat string arrays if necessary,
                // while also handling null/undefined safely.
                // CRITICAL: rewrite Supabase CDN URLs → backend proxy URLs
                if (normalized.images.length > 0) {
                    normalized.images = normalized.images.map((img: any) => {
                        let url: string;
                        if (typeof img === 'string') url = img;
                        else if (img && typeof img === 'object' && img.image_url) url = img.image_url;
                        else return '/images/fallback/perfume1.svg';

                        // MASTER FIX: Try direct public URL if configured, fallback to proxy handled by SafeImage
                        return toImageUrl(url, false); // false = use direct public URL
                    });
                }

                return normalized as NormalizedProduct;
            });

            // 4. Update state & cache only if changed (prevents unnecessary re-renders)
            const currentCacheStr = localStorage.getItem("products_cache");
            const newCacheStr = JSON.stringify(normalizedProducts);

            if (currentCacheStr !== newCacheStr) {
                setProducts(normalizedProducts);
                localStorage.setItem("products_cache", newCacheStr);
                console.log(`✅ [Network] Refreshed & updated ${normalizedProducts.length} products`);
            } else {
                console.log('ℹ️ [Network] Data unchanged, skipping state update');
            }

        } catch (err: any) {
            console.error('❌ [Network] Fetch failed:', err);
            // Only show error if we also have no cached products
            if (products.length === 0) {
                setError(err.message || 'Failed to load products');
            }
        } finally {
            setLoading(false);
        }
    };

    const getProductById = useCallback((id: string | number) => {
        return products.find(p => p.id.toString() === id.toString());
    }, [products]);

    return (
        <ProductContext.Provider value={{
            products,
            loading,
            error,
            refreshProducts: () => fetchProducts(false),
            getProductById
        }}>
            {children}
        </ProductContext.Provider>
    );
}

export function useProducts() {
    const context = useContext(ProductContext);
    if (!context) {
        throw new Error("useProducts must be used within a ProductProvider");
    }
    return context;
}
