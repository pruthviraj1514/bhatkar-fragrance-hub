import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { formatPrice, cn } from "@/lib/utils";

interface ProductImage {
  id: number;
  image_url: string;
  alt_text: string;
  image_order: number;
  is_thumbnail: boolean;
}

interface DatabaseProduct {
  id: number;
  name: string;
  brand: string;
  price: number;
  category: string;
  concentration: string;
  description: string;
  stock: number;
  images: ProductImage[];
  quantity_ml?: number;
  quantity_unit?: string;
}

interface ProductCardProps {
  product: Product | DatabaseProduct;
  index?: number;
}

function isStaticProduct(product: any): product is Product {
  return 'fragranceType' in product && 'sizes' in product;
}

function getDatabaseProductImage(product: DatabaseProduct): string {
  if (product.images && product.images.length > 0) {
    const thumbnail = product.images.find(img => img.is_thumbnail) || product.images[0];
    const apiBase = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, '') : '';
    const url = thumbnail.image_url || '';
    return url.startsWith('http') ? url : `${apiBase}${url}`;
  }
  return '/placeholder.svg';
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const { addItem } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);
  
  const isStatic = isStaticProduct(product);
  const imageUrl = isStatic 
    ? product.images[0] 
    : getDatabaseProductImage(product as DatabaseProduct);
  const productPrice = product.price;
  const productName = product.name;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isStatic) {
      const staticProduct = product as Product;
      const defaultSize = staticProduct.sizes[staticProduct.sizes.length - 1];
      addItem(staticProduct, defaultSize.ml, defaultSize.price);
    } else {
      const dbProduct = product as DatabaseProduct;
      addItem(dbProduct as any, 1, dbProduct.price);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsMobileExpanded(!isMobileExpanded)}
    >
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative overflow-hidden rounded-lg bg-card shadow-soft transition-shadow duration-300 group-hover:shadow-medium">
          {/* Image Container */}
          <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
            <motion.img
              src={imageUrl}
              alt={productName}
              className="h-full w-full object-cover"
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.4 }}
              onError={(e: any) => {
                e.target.src = '/placeholder.svg';
              }}
            />

            {/* Badges - Only show for static products */}
            {isStatic && (
              <div className="absolute left-3 top-3 flex flex-col gap-2">
                {(product as Product).isNewArrival && (
                  <Badge className="bg-primary text-primary-foreground">New</Badge>
                )}
                {(product as Product).isBestSeller && (
                  <Badge className="bg-accent text-accent-foreground">Best Seller</Badge>
                )}
                {(product as Product).isLuxury && (
                  <Badge className="bg-charcoal text-ivory">Luxury</Badge>
                )}
                {(product as Product).originalPrice && (
                  <Badge className="bg-destructive text-destructive-foreground">
                    {Math.round(
                      (((product as Product).originalPrice - productPrice) /
                        (product as Product).originalPrice) *
                        100
                    )}
                    % Off
                  </Badge>
                )}
              </div>
            )}

            {/* Wishlist Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              className={cn(
                "absolute right-3 top-3 p-2 rounded-full bg-background/90 backdrop-blur-sm transition-colors",
                isWishlisted
                  ? "text-destructive"
                  : "text-muted-foreground hover:text-destructive"
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isWishlisted) {
                  removeFromWishlist(product.id);
                } else {
                  addToWishlist(product as any);
                }
              }}
            >
              <Heart
                className={cn("h-5 w-5", isWishlisted && "fill-current")}
              />
            </motion.button>

            {/* Quick Add Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-4 left-4 right-4"
            >
              <Button
                variant="hero"
                className="w-full"
                onClick={handleAddToCart}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </motion.div>
          </div>

          {/* Product Info */}
          <div className="p-4">
            {/* Category */}
            {isStatic ? (
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                {(product as Product).category} • {(product as Product).fragranceType}
              </p>
            ) : (
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                {(product as DatabaseProduct).category} • {(product as DatabaseProduct).concentration}
              </p>
            )}

            {/* Name & Brand */}
            <div>
              <h3 className="font-display text-lg font-semibold mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                {productName}
              </h3>
              {!isStatic && (
                <p className="text-xs text-muted-foreground mb-2">
                  {(product as DatabaseProduct).brand}
                </p>
              )}
              {!isStatic && (
                <p className="text-xs text-muted-foreground mb-2">
                  {((product as DatabaseProduct).quantity_ml ?? 0)}{(product as DatabaseProduct).quantity_unit || 'ml'}
                </p>
              )}
            </div>

            {/* Rating - Only show for static products */}
            {isStatic && (
              <div className="flex items-center gap-1 mb-3">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="text-sm font-medium">{(product as Product).rating}</span>
                <span className="text-sm text-muted-foreground">
                  ({(product as Product).reviewCount} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg font-semibold text-primary">
                ₹{formatPrice(productPrice)}
              </span>
              {isStatic && (product as Product).originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  ₹{formatPrice((product as Product).originalPrice)}
                </span>
              )}
            </div>

            {/* Size Options Preview - Only for static products */}
            {isStatic && (
              <div className="flex gap-2 mt-3 mb-3">
                {(product as Product).sizes.map((size) => (
                  <span
                    key={size.ml}
                    className="text-xs px-2 py-1 rounded bg-secondary text-muted-foreground"
                  >
                    {size.ml}ml
                  </span>
                ))}
              </div>
            )}

            {/* Stock Status - For database products */}
            {!isStatic && (
              <div className="text-xs mb-3">
                {(product as DatabaseProduct).stock > 0 ? (
                  <span className="text-green-600 font-medium">In Stock ({(product as DatabaseProduct).stock})</span>
                ) : (
                  <span className="text-red-600 font-medium">Out of Stock</span>
                )}
              </div>
            )}

            {/* Mobile Quick Action Buttons */}
            <div className="flex gap-2 md:hidden">
              <Button 
                size="sm" 
                className="flex-1 h-8 text-xs"
                onClick={handleAddToCart}
              >
                <ShoppingBag className="h-3 w-3 mr-1" />
                Add
              </Button>
              <Button 
                size="sm"
                variant={isWishlisted ? "default" : "outline"}
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isWishlisted) {
                    removeFromWishlist(product.id);
                  } else {
                    addToWishlist(product as any);
                  }
                }}
              >
                <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
