import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { formatPrice, getImageUrl } from "@/lib/utils";
import { Layout } from "@/components/layout/Layout";

export default function Cart() {
  const { state, removeItem, updateQuantity, totalPrice, clearCart } = useCart();

  if (state.items.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-background px-3 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            {/* Header */}
            <div className="mb-6 flex items-center gap-2 sm:gap-4 sm:mb-8">
              <Link to="/shop" className="text-muted-foreground hover:text-foreground flex-shrink-0">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
              <h1 className="font-display text-xl sm:text-3xl font-bold">Shopping Cart</h1>
            </div>

            {/* Empty Cart */}
            <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-12 sm:py-16 text-center px-4">
              <ShoppingBag className="mb-4 h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
              <h2 className="mb-2 font-display text-lg sm:text-xl font-semibold">Your cart is empty</h2>
              <p className="mb-6 text-sm sm:text-base text-muted-foreground">
                Add some fragrant products to get started
              </p>
              <Link to="/shop">
                <Button size="sm" className="sm:size-default">Continue Shopping</Button>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background px-3 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-6 flex items-center gap-2 sm:gap-4 sm:mb-8">
            <Link to="/shop" className="text-muted-foreground hover:text-foreground flex-shrink-0">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
            <h1 className="font-display text-xl sm:text-3xl font-bold truncate">Shopping Cart</h1>
          </div>

          <div className="grid gap-4 md:gap-8 md:grid-cols-3">
            {/* Cart Items */}
            <div className="md:col-span-2">
              <div className="space-y-3 sm:space-y-4">
                {state.items.map((item) => (
                  <div
                    key={`${item.product.id}-${item.selectedSize}`}
                    className="flex gap-2 sm:gap-4 rounded-lg border border-border bg-card p-3 sm:p-4"
                  >
                    {/* Product Image */}
                    <div className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 rounded-md bg-muted">
                      {item.product.images && item.product.images[0] && (
                        <img
                          src={getImageUrl(item.product.images[0])}
                          alt={item.product.name}
                          className="h-full w-full object-cover rounded-md"
                          onError={(e) => {
                            console.error(`❌ Cart image load failed for product ${item.product.id}`);
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex flex-1 flex-col justify-between min-w-0">
                      <div>
                        <Link
                          to={`/product/${item.product.id}`}
                          className="font-medium text-sm sm:text-base hover:text-primary line-clamp-2"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Size: {item.selectedSize}ml
                        </p>
                      </div>
                      <p className="font-semibold text-sm sm:text-base text-primary">
                        {formatPrice(item.selectedPrice)}
                      </p>
                    </div>

                    {/* Quantity & Remove */}
                    <div className="flex flex-col items-end justify-between gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.product.id, item.selectedSize)}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>

                      <div className="flex items-center gap-1 rounded-md border border-border">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.selectedSize,
                              Math.max(1, item.quantity - 1)
                            )
                          }
                          className="h-7 w-7 sm:h-8 sm:w-8"
                        >
                          <Minus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </Button>
                        <span className="w-6 text-center text-xs sm:text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            updateQuantity(item.product.id, item.selectedSize, item.quantity + 1)
                          }
                          className="h-7 w-7 sm:h-8 sm:w-8"
                        >
                          <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="md:col-span-1">
              <div className="rounded-lg border border-border bg-card p-4 sm:p-6 md:sticky md:top-4">
                <h2 className="mb-3 sm:mb-4 font-display text-base sm:text-lg font-semibold">
                  Order Summary
                </h2>

                <div className="space-y-2 sm:space-y-3 border-b border-border pb-3 sm:pb-4">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">Calculated at checkout</span>
                  </div>
                </div>

                <div className="pt-3 sm:pt-4">
                  <div className="mb-4 flex justify-between font-semibold text-sm sm:text-base">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(totalPrice)}</span>
                  </div>

                  <div className="space-y-2">
                    <Link to="/checkout" className="block">
                      <Button className="w-full" size="sm" >
                        Proceed to Checkout
                      </Button>
                    </Link>

                    <Link to="/shop">
                      <Button variant="outline" className="w-full" size="sm">
                        Continue Shopping
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="mt-4 rounded-md bg-muted p-2 sm:p-3 text-xs text-muted-foreground space-y-1">
                  <div>✓ 100% authentic products</div>
                  <div>✓ Easy returns</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
