import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Heart,
  ShoppingBag,
  RotateCcw,
  Shield,
  ChevronRight,
  Minus,
  Plus,
  Check,
  ChevronLeft,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/products/ProductCard";
import ProductReviews from "@/components/reviews/ProductReviews";
import { products } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { formatPrice, cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ProductDetail() {
  const { id } = useParams();
  const localProduct = products.find((p) => p.id === id);
  const { addItem } = useCart();

  const [remoteProduct, setRemoteProduct] = useState<any | null>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [variantImages, setVariantImages] = useState<any[]>([]); // Variant-specific images
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  const product = localProduct || remoteProduct;

  // Default to first variant or fallback
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [thumbnailScrollPosition, setThumbnailScrollPosition] = useState(0);
  const thumbnailScrollRef: any = useRef(null);

  // Calculate total price and available stock
  const variantPrice = selectedVariant?.price ?? product?.price ?? 0;
  const totalPrice = variantPrice * quantity;
  const availableStock = selectedVariant?.stock ?? product?.stock ?? 0;
  const maxQuantity = Math.min(10, availableStock); // Max 10 or available stock, whichever is less
  
  // Display images: use variant-specific if available, else product images
  // Ensure we always have strings, never objects
  const displayImages = variantImages.length > 0 
    ? variantImages.map(img => typeof img === 'string' ? img : img.image_url)
    : (Array.isArray(product?.images) 
        ? product.images.filter((img): img is string => typeof img === 'string')
        : []);

  useEffect(() => {
    if (localProduct) return; // nothing to fetch
    if (!id) return;

    let mounted = true;
    setLoadingRemote(true);
    setRemoteError(null);

    (async () => {
      try {
        // Fetch product with images
        const productRes = await api.get(`/products/${id}/with-images`);
        const p = productRes.data?.data || productRes.data;
        
        if (!mounted) return;
        
        if (!p) {
          setRemoteError('Product not found');
          setLoadingRemote(false);
          return;
        }

        // Normalize backend product
        const normalized: any = {
          id: p.id,
          name: p.name,
          description: p.description || p.short_description || '',
          price: p.price || 0,
          originalPrice: p.original_price || p.originalPrice,
          images: Array.isArray(p.images)
            ? p.images.map((img: any) => img.image_url || img.url || img)
            : [],
          category: p.category || 'unisex',
          fragranceType: p.fragranceType || p.fragrance_type || 'fresh',
          notes: p.notes || { top: [], middle: [], base: [] },
          sizes: p.sizes || [{ ml: p.quantity_ml || 100, price: p.price || 0 }],
          longevity: p.longevity || 'moderate',
          rating: p.rating || 4.5,
          reviewCount: p.reviewCount || p.review_count || 0,
          inStock: (p.stock ?? p.quantity ?? 0) > 0,
          quantity_ml: p.quantity_ml,
          quantity_unit: p.quantity_unit,
          brand: p.brand,
          stock: p.stock || 0,
          is_best_seller: p.is_best_seller || false,
          is_luxury_product: p.is_luxury_product || false,
        };

        setRemoteProduct(normalized);

        // Fetch variants for this product
        try {
          const variantRes = await api.get(`/variants/product/${p.id}`);
          if (!mounted) return;
          
          let variantData = variantRes?.data?.data || [];
          
          // Filter out invalid variants and sort by value
          variantData = variantData.filter(v => v && v.id).sort((a, b) => a.variant_value - b.variant_value);
          
          setVariants(variantData);
          
          // Set first variant as selected
          if (variantData.length > 0) {
            setSelectedVariant(variantData[0]);
          } else {
            // No variants found - use product's base characteristics
            const fallbackVariant = {
              id: null,
              product_id: p.id,
              variant_name: `${p.quantity_ml || 100}${p.quantity_unit || 'ml'}`,
              variant_value: p.quantity_ml || 100,
              variant_unit: p.quantity_unit || 'ml',
              price: p.price || 0,
              stock: p.stock || 0
            };
            setSelectedVariant(fallbackVariant);
          }
        } catch (variantErr) {
          if (!mounted) return;
          // Variants endpoint failed - use product's base characteristics
          console.warn('Could not fetch variants, using product base:', { price: p.price, stock: p.stock });
          const fallbackVariant = {
            id: null,
            product_id: p.id,
            variant_name: `${p.quantity_ml || 100}${p.quantity_unit || 'ml'}`,
            variant_value: p.quantity_ml || 100,
            variant_unit: p.quantity_unit || 'ml',
            price: p.price || 0,
            stock: p.stock || 0
          };
          setSelectedVariant(fallbackVariant);
        }
      } catch (err: any) {
        if (!mounted) return;
        setRemoteError(err?.response?.data?.message || err.message || 'Failed to load product');
      } finally {
        if (mounted) setLoadingRemote(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id, localProduct]);

  // Load variant-specific images when variant is selected
  useEffect(() => {
    if (!selectedVariant || !selectedVariant.id) {
      setVariantImages([]);
      setActiveImageIndex(0);
      return;
    }

    let mounted = true;
    
    (async () => {
      try {
        const response = await api.get(`/variant-images/${selectedVariant.id}`);
        if (!mounted) return;
        
        const images = response.data?.data || [];
        setVariantImages(images);
        setActiveImageIndex(0); // Reset to first image when variant changes
      } catch (err) {
        if (!mounted) return;
        console.warn('Could not load variant-specific images, using product images');
        setVariantImages([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedVariant?.id]);

  if (!product) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-display text-3xl font-bold mb-4">
            Product Not Found
          </h1>
          <p className="text-muted-foreground mb-6">
            The product you're looking for doesn't exist.
          </p>
          <Button variant="gold" asChild>
            <Link to="/shop">Browse All Products</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const handleAddToCart = () => {
    // Validation: Check if variant is selected
    if (!selectedVariant) {
      toast.error("Please select a variant");
      return;
    }
    
    // Validation: Check stock is available
    if (availableStock <= 0) {
      toast.error("This product is out of stock");
      return;
    }
    
    // Validation: Check quantity is valid
    if (quantity <= 0) {
      toast.error("Please select a valid quantity");
      return;
    }
    
    if (quantity > availableStock) {
      toast.error(`Only ${availableStock} item(s) available`);
      return;
    }

    // Add to cart with selected quantity
    addItem(product, selectedVariant.variant_value, variantPrice, quantity);
    toast.success(`${product.name} added to cart!`, {
      description: `${selectedVariant.variant_name} × ${quantity} | ₹${(variantPrice * quantity).toFixed(2)}`,
    });
  };

  const relatedProducts = products
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.fragranceType === product.fragranceType ||
          p.category === product.category)
    )
    .slice(0, 4);

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="bg-secondary/30 py-4">
        <div className="container px-4">
          <nav className="flex items-center text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <Link to="/shop" className="hover:text-foreground transition-colors">
              Shop
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-foreground">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Section */}
      <section className="py-12">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {/* Image Gallery - Professional container with constrained width */}
            <div className="md:col-span-1 lg:col-span-1 flex flex-col items-center md:items-start space-y-4">
              {/* Main Image - Constrained, Professional sizing */}
              <motion.div
                key={activeImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md aspect-square rounded-lg overflow-hidden bg-secondary/50 flex items-center justify-center border border-border/50 shadow-sm"
              >
                <img
                  src={displayImages[activeImageIndex] || '/placeholder.svg'}
                  alt={product.name}
                  className="w-full h-full object-contain p-3 md:p-6"
                />
              </motion.div>

              {/* Thumbnail Gallery - Amazon-style left-to-right scroll */}
              {displayImages.length > 1 && (
                <div className="w-full max-w-md">
                  <div className="relative flex items-center gap-2">
                    {/* Left Arrow */}
                    {thumbnailScrollPosition > 0 && (
                      <button
                        onClick={() => {
                          if (thumbnailScrollRef.current) {
                            thumbnailScrollRef.current.scrollBy({ left: -80, behavior: 'smooth' });
                          }
                        }}
                        className="absolute left-0 z-10 p-1.5 bg-background/90 backdrop-blur-sm rounded-full border border-border hover:bg-background transition"
                        aria-label="Scroll thumbnails left"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                    )}

                    {/* Right Arrow */}
                    {displayImages.length > 4 && (
                      <button
                        onClick={() => {
                          if (thumbnailScrollRef.current) {
                            thumbnailScrollRef.current.scrollBy({ left: 80, behavior: 'smooth' });
                          }
                        }}
                        className="absolute right-0 z-10 p-1.5 bg-background/90 backdrop-blur-sm rounded-full border border-border hover:bg-background transition"
                        aria-label="Scroll thumbnails right"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}

                    {/* Thumbnails Container */}
                    <div
                      ref={thumbnailScrollRef}
                      onScroll={(e) => {
                        setThumbnailScrollPosition((e.target as HTMLDivElement).scrollLeft);
                      }}
                      className="flex gap-2 overflow-x-auto scroll-smooth px-8 md:px-0 w-full no-scrollbar"
                      style={{ scrollBehavior: 'smooth' }}
                    >
                      {displayImages.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveImageIndex(index)}
                          className={cn(
                            "min-w-16 md:min-w-20 w-16 md:w-20 h-16 md:h-20 rounded-md overflow-hidden border-2 transition-all flex-shrink-0 hover:border-primary/70",
                            activeImageIndex === index
                              ? "border-primary shadow-md"
                              : "border-border/50"
                          )}
                        >
                          <img
                            src={image || '/placeholder.svg'}
                            alt={`${product.name} ${index + 1}`}
                            className="w-full h-full object-contain p-1 bg-secondary/20"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Product Info - takes 1 column on mobile, 1 on tablet, 2 on desktop */}
            <div className="md:col-span-1 lg:col-span-2">
              {/* Badges */}
              <div className="flex gap-2 mb-4">
                {product.isNewArrival && (
                  <Badge className="bg-primary text-primary-foreground">
                    New Arrival
                  </Badge>
                )}
                {product.isBestSeller && (
                  <Badge className="bg-accent text-accent-foreground">
                    Best Seller
                  </Badge>
                )}
                {product.isLuxury && (
                  <Badge className="bg-charcoal text-ivory">Luxury</Badge>
                )}
              </div>

              {/* Category */}
              <p className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
                {product.category} • {product.fragranceType}
              </p>

              {/* Name */}
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display text-4xl md:text-5xl font-bold">
                  {product.name}
                </h1>
                {product.is_best_seller && (
                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 text-base px-3 py-1 flex items-center gap-1">
                    ⭐ Best Seller
                  </Badge>
                )}
                {product.is_luxury_product && (
                  <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 text-base px-3 py-1 flex items-center gap-1">
                    💎 Luxury
                  </Badge>
                )}
              </div>

              {/* Net Quantity / Size display similar to mobile screenshot */}
              <div className="text-sm text-muted-foreground mb-4">
                {selectedVariant ? (
                  <span>Net quantity: 1 pc ({selectedVariant.variant_name})</span>
                ) : product.quantity_ml ? (
                  <span>Net quantity: 1 pc ({product.quantity_ml}{product.quantity_unit || 'ml'})</span>
                ) : (
                  <span>Net quantity: 1 pc (100 ml)</span>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-5 w-5",
                        i < Math.floor(product.rating)
                          ? "fill-primary text-primary"
                          : "text-muted-foreground/30"
                      )}
                    />
                  ))}
                </div>
                <span className="font-medium">{product.rating}</span>
                <span className="text-muted-foreground">
                  ({product.reviewCount} reviews)
                </span>
              </div>

              {/* Price - Detailed pricing with original, discount, shipping, and total */}
              <div className="mb-8 p-4 bg-secondary/30 rounded-lg border border-border/50">
                {/* Original Price & Discount */}
                <div className="space-y-2 mb-4">
                  {product.original_price && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground line-through">
                        Original: {formatPrice(product.original_price)}
                      </span>
                      {product.discount_percentage > 0 && (
                        <span className="px-2 py-1 bg-destructive text-destructive-foreground text-xs font-semibold rounded">
                          {Math.round(product.discount_percentage)}% OFF
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Selling Price */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(variantPrice)}
                    </span>
                    <span className="text-xs text-muted-foreground">per unit</span>
                  </div>
                </div>

                {/* Shipping & Additional Charges */}
                {(product.shipping_cost > 0 || product.other_charges > 0) && (
                  <div className="space-y-1 py-3 border-t border-b border-border/50 text-xs">
                    {product.shipping_cost > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Shipping Cost:</span>
                        <span>+ {formatPrice(product.shipping_cost)}</span>
                      </div>
                    )}
                    {product.other_charges > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Other Charges:</span>
                        <span>+ {formatPrice(product.other_charges)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Quantity & Total */}
                <div className="pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {quantity > 1 && `${quantity} × ${formatPrice(variantPrice)}`}
                    </span>
                    {quantity > 1 && (
                      <span className="font-medium">{formatPrice(variantPrice * quantity)}</span>
                    )}
                  </div>
                  {(product.shipping_cost > 0 || product.other_charges > 0) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Additional Charges:</span>
                      <span className="font-medium">+ {formatPrice((product.shipping_cost + product.other_charges) * quantity)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border/50 pt-2">
                    <span className="font-semibold">Final Total:</span>
                    <span className="text-lg font-bold text-primary">
                      {formatPrice(
                        (variantPrice + product.shipping_cost + product.other_charges) * quantity
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-muted-foreground mb-8 leading-relaxed">
                {product.description}
              </p>

              {/* Variant Selection */}
              {variants.length > 0 ? (
                <div className="mb-8">
                  <Label className="text-base font-semibold mb-4 block">
                    Select Size / Variant
                  </Label>
                  <div className="flex flex-wrap gap-3">
                    {variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => {
                          setSelectedVariant(variant);
                          setQuantity(1); // Reset quantity when variant changes
                        }}
                        className={cn(
                          "px-6 py-3 rounded-lg border-2 transition-all duration-300",
                          selectedVariant?.id === variant.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <span className="block font-semibold">{variant.variant_name}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatPrice(variant.price)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {variant.stock > 0 ? `${variant.stock} in stock` : "Out of stock"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : localProduct?.sizes && localProduct.sizes.length > 0 ? (
                // Fallback for static products
                <div className="mb-8">
                  <Label className="text-base font-semibold mb-4 block">
                    Select Size
                  </Label>
                  <div className="flex gap-3">
                    {localProduct.sizes.map((size: any) => (
                      <button
                        key={size.ml}
                        onClick={() => {
                          setSelectedVariant(size);
                          setQuantity(1);
                        }}
                        className={cn(
                          "px-6 py-3 rounded-lg border-2 transition-all duration-300",
                          selectedVariant?.ml === size.ml
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <span className="block font-semibold">{size.ml}ml</span>
                        <span className="text-sm text-muted-foreground">
                          {formatPrice(size.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Quantity */}
              <div className="mb-8">
                <Label className="text-base font-semibold mb-4 block">
                  Quantity
                </Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-border rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                      disabled={quantity >= maxQuantity}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-muted-foreground">
                    {availableStock > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          availableStock > 10 
                            ? 'bg-green-100 text-green-800' 
                            : availableStock > 3
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          <Check className="h-3 w-3 mr-1" />
                          {availableStock} available
                        </span>
                        {availableStock <= 3 && (
                          <span className="text-xs text-destructive font-medium">Low stock!</span>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Out of Stock
                      </span>
                    )}
                  </span>
                </div>
                {availableStock > 0 && quantity > availableStock && (
                  <p className="text-xs text-destructive mt-2">
                    Only {availableStock} available
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mb-8">
                <Button
                  variant="gold"
                  size="xl"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || availableStock <= 0 || quantity <= 0}
                >
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  size="xl"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={cn(isWishlisted && "text-destructive")}
                >
                  <Heart
                    className={cn("h-5 w-5", isWishlisted && "fill-current")}
                  />
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-4 py-6 border-t border-b border-border">
                {[
                  { icon: RotateCcw, label: "Easy Returns", desc: "30 Days" },
                  { icon: Shield, label: "100% Authentic", desc: "Guaranteed" },
                ].map((badge) => (
                  <div key={badge.label} className="text-center">
                    <badge.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">{badge.label}</p>
                    <p className="text-xs text-muted-foreground">{badge.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Details Tabs */}
      <section className="py-12 bg-secondary/30">
        <div className="container px-4">
          <Tabs defaultValue="notes" className="w-full">
            <TabsList className="w-full max-w-md mx-auto grid grid-cols-3 mb-8">
              <TabsTrigger value="notes">Fragrance Notes</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="mt-0">
              <div className="max-w-3xl mx-auto">
                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    { type: "Top Notes", notes: product.notes.top, desc: "First impression, lasts 15-30 mins" },
                    { type: "Heart Notes", notes: product.notes.middle, desc: "The core, emerges after 30 mins" },
                    { type: "Base Notes", notes: product.notes.base, desc: "The foundation, lasts for hours" },
                  ].map((noteGroup, index) => (
                    <motion.div
                      key={noteGroup.type}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-card rounded-xl p-6 shadow-soft text-center"
                    >
                      <h3 className="font-display text-xl font-semibold mb-2">
                        {noteGroup.type}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-4">
                        {noteGroup.desc}
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {noteGroup.notes.map((note) => (
                          <Badge
                            key={note}
                            variant="secondary"
                            className="font-normal"
                          >
                            {note}
                          </Badge>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="mt-0">
              <div className="max-w-2xl mx-auto bg-card rounded-xl p-8 shadow-soft">
                <dl className="space-y-4">
                  {[
                    { label: "Category", value: product.category },
                    { label: "Fragrance Type", value: product.fragranceType },
                    { label: "Longevity", value: product.longevity },
                    { label: "Available Sizes", value: product.sizes.map((s) => `${s.ml}ml`).join(", ") },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex justify-between py-3 border-b border-border last:border-0"
                    >
                      <dt className="text-muted-foreground">{item.label}</dt>
                      <dd className="font-medium capitalize">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-0">
              <ProductReviews productId={product.id} />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-16">
          <div className="container px-4">
            <h2 className="font-display text-3xl font-bold mb-8">
              You May Also Like
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct, index) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}

function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("block", className)} {...props} />;
}
