
import { useEffect, useState } from "react";
import { CheckCircle2, Package, ArrowRight, ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Layout } from "@/components/layout/Layout";
import { formatPrice } from "@/lib/utils";

export default function PaymentSuccess() {
    const { clearCart } = useCart();
    const navigate = useNavigate();
    const [orderDetails, setOrderDetails] = useState<any>(null);

    useEffect(() => {
        // 1. Get order details from localStorage
        const savedOrder = localStorage.getItem("lastOrder");
        if (savedOrder) {
            try {
                const parsed = JSON.parse(savedOrder);
                setOrderDetails(parsed);
                // 2. Clear cart on success
                clearCart();
                // 3. Clear the flag from localStorage so it doesn't trigger on re-entry unless fresh
                // We keep it for display during this session
            } catch (e) {
                console.error("Failed to parse lastOrder", e);
            }
        } else {
            // If no order details, redirect to home
            navigate("/");
        }

        // Scroll to top
        window.scrollTo(0, 0);
    }, [clearCart, navigate]);

    if (!orderDetails) return null;

    return (
        <Layout>
            <div className="min-h-[80vh] bg-background flex items-center justify-center px-4 py-12">
                <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="flex justify-center">
                        <div className="rounded-full bg-green-50 p-4">
                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="font-display text-3xl font-bold tracking-tight">
                            Payment Successful!
                        </h1>
                        <p className="text-muted-foreground">
                            Thank you for your purchase. Your order has been confirmed and is being processed.
                        </p>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 text-left space-y-4 shadow-sm">
                        <div className="flex justify-between items-center pb-4 border-b border-border">
                            <span className="text-sm text-muted-foreground">Order ID</span>
                            <span className="font-mono font-medium text-sm">{orderDetails.orderId}</span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Amount Paid</span>
                                <span className="font-semibold">{formatPrice(orderDetails.amount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Payment ID</span>
                                <span className="text-xs font-mono truncate max-w-[150px]">{orderDetails.paymentId}</span>
                            </div>
                        </div>

                        <div className="pt-2">
                            <div className="flex items-start gap-3">
                                <Package className="h-5 w-5 text-primary mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium">Shipping to {orderDetails.shippingAddress.firstName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {orderDetails.shippingAddress.address}, {orderDetails.shippingAddress.city}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button asChild variant="outline" className="flex-1 gap-2">
                            <Link to="/orders">
                                <ShoppingBag className="h-4 w-4" />
                                View Orders
                            </Link>
                        </Button>
                        <Button asChild className="flex-1 gap-2">
                            <Link to="/shop">
                                Continue Shopping
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        A confirmation email has been sent to {orderDetails.customerEmail}
                    </p>
                </div>
            </div>
        </Layout>
    );
}
