import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { formatPrice, cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const defaultSize = product.sizes[product.sizes.length - 1];
    addItem(product, defaultSize.ml, defaultSize.price);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative overflow-hidden rounded-lg bg-card shadow-soft transition-shadow duration-300 group-hover:shadow-medium">
          {/* Image Container */}
          <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
            <motion.img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover"
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.4 }}
            />

            {/* Badges */}
            <div className="absolute left-3 top-3 flex flex-col gap-2">
              {product.isNewArrival && (
                <Badge className="bg-primary text-primary-foreground">New</Badge>
              )}
              {product.isBestSeller && (
                <Badge className="bg-accent text-accent-foreground">Best Seller</Badge>
              )}
              {product.isLuxury && (
                <Badge className="bg-charcoal text-ivory">Luxury</Badge>
              )}
              {product.originalPrice && (
                <Badge className="bg-destructive text-destructive-foreground">
                  {Math.round(
                    ((product.originalPrice - product.price) /
                      product.originalPrice) *
                      100
                  )}
                  % Off
                </Badge>
              )}
            </div>

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
                setIsWishlisted(!isWishlisted);
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
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              {product.category} • {product.fragranceType}
            </p>

            {/* Name */}
            <h3 className="font-display text-lg font-semibold mb-2 line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-1 mb-3">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="text-sm font-medium">{product.rating}</span>
              <span className="text-sm text-muted-foreground">
                ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-primary">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            {/* Size Options Preview */}
            <div className="flex gap-2 mt-3">
              {product.sizes.map((size) => (
                <span
                  key={size.ml}
                  className="text-xs px-2 py-1 rounded bg-secondary text-muted-foreground"
                >
                  {size.ml}ml
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
