import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";

export function CartDrawer() {
  const {
    state,
    closeCart,
    removeItem,
    updateQuantity,
    totalItems,
    totalPrice,
  } = useCart();

  return (
    <AnimatePresence>
      {state.isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background shadow-elegant"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-xl font-semibold">
                    Your Cart ({totalItems})
                  </h2>
                </div>
                <Button variant="ghost" size="icon" onClick={closeCart}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {state.items.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <h3 className="font-display text-lg font-semibold mb-2">
                      Your cart is empty
                    </h3>
                    <p className="text-muted-foreground text-sm mb-6">
                      Discover our exquisite collection of fragrances
                    </p>
                    <Button variant="gold" asChild onClick={closeCart}>
                      <Link to="/shop">Explore Fragrances</Link>
                    </Button>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {state.items.map((item) => (
                      <motion.li
                        key={`${item.product.id}-${item.selectedSize}`}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex gap-4 rounded-lg bg-card p-4 shadow-soft"
                      >
                        {/* Product Image */}
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-secondary">
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex flex-1 flex-col">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="font-display font-semibold text-sm">
                                {item.product.name}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {item.selectedSize}ml
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                removeItem(item.product.id, item.selectedSize)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="mt-auto flex items-center justify-between">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.selectedSize,
                                    item.quantity - 1
                                  )
                                }
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.selectedSize,
                                    item.quantity + 1
                                  )
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>

                            {/* Price */}
                            <span className="font-semibold text-primary">
                              {formatPrice(item.selectedPrice * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer */}
              {state.items.length > 0 && (
                <div className="border-t border-border px-6 py-4 space-y-4">
                  {/* Subtotal */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">{formatPrice(totalPrice)}</span>
                  </div>

                  {/* Shipping Notice */}
                  <p className="text-xs text-muted-foreground text-center">
                    Shipping and taxes calculated at checkout
                  </p>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button variant="gold" className="w-full" size="lg" asChild>
                      <Link to="/checkout" onClick={closeCart}>
                        Proceed to Checkout
                      </Link>
                    </Button>
                    <Button
                      variant="gold-outline"
                      className="w-full"
                      size="lg"
                      asChild
                    >
                      <Link to="/cart" onClick={closeCart}>
                        View Cart
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
