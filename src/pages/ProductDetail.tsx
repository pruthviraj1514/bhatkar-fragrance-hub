import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Heart,
  ShoppingBag,
  Truck,
  RotateCcw,
  Shield,
  ChevronRight,
  Minus,
  Plus,
  Check,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/products/ProductCard";
import { products } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { formatPrice, cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ProductDetail() {
  const { id } = useParams();
  const product = products.find((p) => p.id === id);
  const { addItem } = useCart();

  const [selectedSize, setSelectedSize] = useState(
    product?.sizes[product.sizes.length - 1] || { ml: 100, price: 0 }
  );
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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
    addItem(product, selectedSize.ml, selectedSize.price);
    toast.success(`${product.name} added to cart!`, {
      description: `${selectedSize.ml}ml × ${quantity}`,
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
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              <motion.div
                key={activeImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="aspect-square rounded-xl overflow-hidden bg-secondary"
              >
                <img
                  src={product.images[activeImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Thumbnail Gallery */}
              {product.images.length > 1 && (
                <div className="flex gap-3">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={cn(
                        "w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors",
                        activeImageIndex === index
                          ? "border-primary"
                          : "border-transparent"
                      )}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
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
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                {product.name}
              </h1>

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

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-8">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(selectedSize.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-muted-foreground mb-8 leading-relaxed">
                {product.description}
              </p>

              {/* Size Selection */}
              <div className="mb-8">
                <Label className="text-base font-semibold mb-4 block">
                  Select Size
                </Label>
                <div className="flex gap-3">
                  {product.sizes.map((size) => (
                    <button
                      key={size.ml}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "px-6 py-3 rounded-lg border-2 transition-all duration-300",
                        selectedSize.ml === size.ml
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
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-muted-foreground">
                    {product.inStock ? (
                      <span className="flex items-center text-primary">
                        <Check className="h-4 w-4 mr-1" />
                        In Stock
                      </span>
                    ) : (
                      <span className="text-destructive">Out of Stock</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mb-8">
                <Button
                  variant="gold"
                  size="xl"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
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
              <div className="grid grid-cols-3 gap-4 py-6 border-t border-b border-border">
                {[
                  { icon: Truck, label: "Free Shipping", desc: "Above ₹999" },
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
              <div className="max-w-2xl mx-auto text-center py-12">
                <Star className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-display text-2xl font-semibold mb-2">
                  {product.reviewCount} Reviews
                </h3>
                <p className="text-muted-foreground mb-6">
                  Average rating: {product.rating} out of 5 stars
                </p>
                <Button variant="gold-outline">Write a Review</Button>
              </div>
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
