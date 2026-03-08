import React, { useState, useEffect } from "react";
import { ArrowLeft, Lock, Truck, Gift } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";
import { Layout } from "@/components/layout/Layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import CheckoutPayment from "@/components/CheckoutPayment";

export default function Checkout() {
  const { state, totalPrice } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get data from navigation state if available
  const stateData = location.state || null;

  // IMPORTANT: Redirect back to cart if state is missing (prevents broken flow from Razorpay external redirects)
  React.useEffect(() => {
    if (!stateData && state.items.length > 0) {
      toast({
        title: "Session Reset",
        description: "Please restart the checkout process securely.",
      });
      navigate("/cart");
    }
  }, [stateData, state.items.length, navigate, toast]);

  const [loading, setLoading] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);
  const [formData, setFormData] = useState({
    email: stateData?.email || user?.email || "",
    firstName: stateData?.firstName || user?.firstname || "",
    lastName: stateData?.lastName || user?.lastname || "",
    phone: stateData?.phone || "",
    address: stateData?.address || "",
    city: stateData?.city || "",
    state: stateData?.state || "",
    zipCode: stateData?.zipCode || "",
    country: stateData?.country || "IN",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Restrict phone number to 10 digits only
    if (name === "phone") {
      const phoneOnly = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({
        ...prev,
        [name]: phoneOnly,
      }));
      return;
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateShippingInfo = () => {
    if (
      !formData.email ||
      !formData.phone ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.address ||
      !formData.city ||
      !formData.state ||
      !formData.zipCode
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all shipping details before payment",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handlePaymentSuccess = (response: any) => {
    toast({
      title: "Order Placed Successfully!",
      description: `Order ${response.orderId} confirmed. Check your email for details.`,
    });

    // Save order details to localStorage for reference
    localStorage.setItem(
      "lastOrder",
      JSON.stringify({
        orderId: response.orderId,
        paymentId: response.paymentId,
        amount: response.amount,
        customerEmail: formData.email,
        shippingAddress: formData,
      })
    );

    // Redirect to success page
    setTimeout(() => {
      navigate("/payment-success");
    }, 1500);
  };

  const handlePaymentError = (error: any) => {
    toast({
      title: "Payment Error",
      description: error.message || "Payment failed. Please try again.",
      variant: "destructive",
    });
  };

  const proceedToPayment = () => {
    if (validateShippingInfo()) {
      setPaymentReady(true);
    }
  };

  if (state.items.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-background px-3 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="mb-4 font-display text-xl sm:text-3xl font-bold">
              Your cart is empty
            </h1>
            <p className="mb-8 text-sm sm:text-base text-muted-foreground">
              Add items to your cart before proceeding to checkout
            </p>
            <Link to="/shop">
              <Button>Continue Shopping</Button>
            </Link>
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
            <Link to="/cart" className="text-muted-foreground hover:text-foreground flex-shrink-0">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
            <h1 className="font-display text-xl sm:text-3xl font-bold truncate">Checkout</h1>
          </div>

          <div className="grid gap-4 md:gap-8 md:grid-cols-3">
            {/* Checkout Form - moves below on mobile */}
            <div className="md:col-span-2 order-2 md:order-1">
              <form
                className="space-y-4 sm:space-y-6"
                onSubmit={(e) => e.preventDefault()}
              >
                {/* Contact Information */}
                <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
                  <h2 className="mb-3 sm:mb-4 font-display text-base sm:text-lg font-semibold flex items-center gap-2">
                    Contact Information
                  </h2>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <Label htmlFor="email" className="text-sm sm:text-base">Email Address</Label>
                      <Input
                        id="email" <span className="text-xs text-muted-foreground">(Do payment though this number only)</span></Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="98765 43210"
                        value={formData.phone}
                        onChange={handleInputChange}
                        maxLength={10
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm sm:text-base">Phone Number <span className="text-xs text-muted-foreground">(Do payment though this number only)</span></Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="9876543210"
                        value={formData.phone}
                        onChange={handleInputChange}
                        maxLength={10}
                        className="text-sm sm:text-base"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
                  <h2 className="mb-3 sm:mb-4 font-display text-base sm:text-lg font-semibold flex items-center gap-2">
                    <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
                    Shipping Address
                  </h2>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="grid gap-2 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="firstName" className="text-sm sm:text-base">First Name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          placeholder="John"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="text-sm sm:text-base"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-sm sm:text-base">Last Name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          placeholder="Doe"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="text-sm sm:text-base"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address" className="text-sm sm:text-base">Street Address</Label>
                      <Input
                        id="address"
                        name="address"
                        placeholder="123 Main Street"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="text-sm sm:text-base"
                        required
                      />
                    </div>

                    <div className="grid gap-2 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="city" className="text-sm sm:text-base">City</Label>
                        <Input
                          id="city"
                          name="city"
                          placeholder="Mumbai"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="text-sm sm:text-base"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="state" className="text-sm sm:text-base">State</Label>
                        <Input
                          id="state"
                          name="state"
                          placeholder="Maharashtra"
                          value={formData.state}
                          onChange={handleInputChange}
                          className="text-sm sm:text-base"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-2 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="zipCode" className="text-sm sm:text-base">ZIP Code</Label>
                        <Input
                          id="zipCode"
                          name="zipCode"
                          placeholder="400001"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          className="text-sm sm:text-base"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="country" className="text-sm sm:text-base">Country</Label>
                        <Select
                          value={formData.country}
                          onValueChange={(value) =>
                            handleSelectChange("country", value)
                          }
                        >
                          <SelectTrigger id="country" className="text-sm sm:text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="IN">India</SelectItem>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="UK">United Kingdom</SelectItem>
                            <SelectItem value="AU">Australia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Section */}
                <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
                  <h2 className="mb-3 sm:mb-4 font-display text-base sm:text-lg font-semibold flex items-center gap-2">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                    Payment Method
                  </h2>

                  {!paymentReady ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground mb-4">
                        Choose your preferred payment method - UPI, Cards, Wallets, NetBanking and more available
                      </p>
                      <Button
                        type="button"
                        onClick={proceedToPayment}
                        className="w-full"
                        size="sm"
                        disabled={loading}
                      >
                        Proceed to Payment
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-800">
                          💳 Pay ₹{formatPrice((totalPrice * 1.1))} using your preferred method
                        </p>
                      </div>
                      <CheckoutPayment
                        items={state.items.map(item => ({
                          productId: Number(item.product.id),
                          quantity: item.quantity,
                          price: item.selectedPrice
                        }))}
                        totalAmount={totalPrice * 1.1}
                        prefillContact={formData.phone}
                        shippingData={formData}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                        buttonText={`Pay ₹${formatPrice((totalPrice * 1.1))}`}
                        buttonClassName="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 font-medium disable:opacity-60"
                      />
                      <Button
                        type="button"
                        onClick={() => setPaymentReady(false)}
                        variant="outline"
                        className="w-full mt-2"
                        size="sm"
                      >
                        Back to Shipping
                      </Button>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Order Summary Sidebar - moves to top on mobile */}
            <div className="md:col-span-1 order-1 md:order-2">
              <div className="rounded-lg border border-border bg-card p-4 sm:p-6 md:sticky md:top-4">
                <h2 className="mb-3 sm:mb-4 font-display text-base sm:text-lg font-semibold">
                  Order Summary
                </h2>

                <div className="mb-3 sm:mb-4 space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                  {state.items.map((item) => (
                    <div key={`${item.product.id}-${item.selectedSize}`} className="flex justify-between text-xs sm:text-sm gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Q: {item.quantity} × {item.selectedSize}ml
                        </p>
                      </div>
                      <p className="text-right font-medium flex-shrink-0">
                        {formatPrice(item.selectedPrice * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-3 sm:pt-4 space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">Free</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">{formatPrice(totalPrice * 0.1)}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-3 sm:pt-4">
                  <div className="flex justify-between font-semibold text-sm sm:text-base mb-4">
                    <span>Total</span>
                    <span className="text-primary">
                      {formatPrice(totalPrice * 1.1)}
                    </span>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="rounded-md bg-muted p-2 sm:p-3 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Lock className="h-3 w-3 flex-shrink-0" />
                    <span>Secure encryption</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Gift className="h-3 w-3 flex-shrink-0" />
                    <span>No Return Policy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
