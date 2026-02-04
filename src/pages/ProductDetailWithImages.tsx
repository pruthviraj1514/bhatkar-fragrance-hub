import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
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
import ProductImageCarousel from "@/components/products/ProductImageCarousel";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductImage {
  id: number;
  image_url: string;
  image_format?: string;
  alt_text: string;
  image_order: number;
  is_thumbnail: boolean;
}

interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  category: string;
  concentration: string;
  description: string;
  stock: number;
  images: ProductImage[];
  created_on: string;
}

export default function ProductDetailWithImages() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/products/${id}/with-images`);
        setProduct(response.data.data);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-24" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container py-20 text-center px-4">
          <h1 className="font-display text-3xl font-bold mb-4">
            Product Not Found
          </h1>
          <p className="text-muted-foreground mb-6">
            The product you're looking for doesn't exist.
          </p>
          <Button variant="default" asChild>
            <Link to="/shop">Browse All Products</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      return;
    }

    addItem(product as any, quantity, product.price);
    toast.success(`${product.name} added to cart!`, {
      description: `Quantity: ${quantity}`,
    });
    setQuantity(1);
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast.error("Please login to add to wishlist");
      return;
    }
    setIsWishlisted(!isWishlisted);
    toast.success(
      isWishlisted ? "Removed from wishlist" : "Added to wishlist"
    );
  };

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="bg-gray-50 py-4">
        <div className="container px-4">
          <nav className="flex items-center text-sm text-gray-600">
            <Link to="/" className="hover:text-gray-900 transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <Link to="/shop" className="hover:text-gray-900 transition-colors">
              Shop
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-gray-900 font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Section */}
      <section className="py-12">
        <div className="container px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Product Image Carousel */}
            <div className="flex flex-col">
              <ProductImageCarousel
                images={product.images || []}
                productName={product.name}
                className="mb-6"
              />
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                    {product.name}
                  </h1>
                </div>
                <p className="text-lg text-gray-600">{product.brand}</p>

                {/* Category & Type */}
                <div className="flex gap-2 mt-4">
                  <Badge className="bg-blue-100 text-blue-900">
                    {product.category}
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-900">
                    {product.concentration}
                  </Badge>
                  {product.stock > 0 && (
                    <Badge className="bg-green-100 text-green-900">
                      In Stock
                    </Badge>
                  )}
                </div>
              </div>

              {/* Price */}
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  ${formatPrice(product.price)}
                </p>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Product Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 font-semibold uppercase">
                    Concentration
                  </p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {product.concentration}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 font-semibold uppercase">
                    Stock
                  </p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {product.stock} units
                  </p>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">
                  Quantity
                </label>
                <div className="flex items-center gap-4 bg-gray-100 rounded-lg p-2 w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-gray-200 rounded-lg transition"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <span className="w-8 text-center font-semibold">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(product.stock, quantity + 1))
                    }
                    className="p-2 hover:bg-gray-200 rounded-lg transition"
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Add to Cart & Wishlist */}
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-6"
                  size="lg"
                >
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                </Button>
                <Button
                  onClick={handleWishlist}
                  variant="outline"
                  size="lg"
                  className="px-6"
                >
                  {isWishlisted ? (
                    <Check className="h-5 w-5 text-orange-500" />
                  ) : (
                    "♡"
                  )}
                </Button>
              </div>

              {/* Benefits */}
              <div className="space-y-3 pt-6 border-t">
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-orange-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      Free Delivery
                    </p>
                    <p className="text-sm text-gray-600">Orders over $50</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <RotateCcw className="h-5 w-5 text-orange-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Easy Returns</p>
                    <p className="text-sm text-gray-600">30-day return policy</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-orange-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      Secure Checkout
                    </p>
                    <p className="text-sm text-gray-600">
                      100% secure payment
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
