import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";

// Interface reflecting the normalized product structure
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

export function ProductProvider({ children }: { children: React.ReactNode }) {
    const [products, setProducts] = useState<NormalizedProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initial load: Hydrate from cache instantly, then refresh silently
    useEffect(() => {
        let mounted = true;

        const initializeStore = async () => {
            // 1. Instant Cache Hydration
            try {
                const cachedStr = localStorage.getItem("products_cache");
                if (cachedStr) {
                    const cachedProducts = JSON.parse(cachedStr);
                    if (Array.isArray(cachedProducts) && cachedProducts.length > 0) {
                        if (mounted) {
                            setProducts(cachedProducts);
                            setLoading(false); // UI renders immediately
                            console.log(`📦 [Cache] Instantly loaded ${cachedProducts.length} products`);
                        }
                    }
                }
            } catch (err) {
                console.warn("Failed to parse local product cache:", err);
            }

            // 2. Silent Network Refresh
            await fetchProducts(true);
        };

        initializeStore();

        return () => {
            mounted = false;
        };
    }, []);

    const fetchProducts = async (isBackground = false) => {
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
                if (normalized.images.length > 0) {
                    normalized.images = normalized.images.map((img: any) => {
                        if (typeof img === 'string') return img;
                        if (img && typeof img === 'object' && img.image_url) return img.image_url;
                        return '/images/fallback/perfume1.svg';
                    });
                }

                return normalized as NormalizedProduct;
            });

            // Update state
            setProducts(normalizedProducts);

            // Update Cache
            localStorage.setItem("products_cache", JSON.stringify(normalizedProducts));
            console.log(`✅ [Network] Refreshed & cached ${normalizedProducts.length} products`);

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
