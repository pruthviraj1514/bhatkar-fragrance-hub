import { useState } from "react";
import { ArrowLeft, Lock, Truck, Gift } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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

export default function Checkout() {
  const { state, totalPrice } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    cardNumber: "",
    cardExpiry: "",
    cardCVC: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (
        !formData.email ||
        !formData.firstName ||
        !formData.lastName ||
        !formData.address ||
        !formData.city ||
        !formData.state ||
        !formData.zipCode ||
        !formData.cardNumber ||
        !formData.cardExpiry ||
        !formData.cardCVC
      ) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: "Order Placed Successfully!",
        description: `Order confirmation sent to ${formData.email}`,
      });

      // Redirect to orders page after success
      setTimeout(() => {
        navigate("/orders");
      }, 1500);
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Please try again with valid payment details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Contact Information */}
                <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
                  <h2 className="mb-3 sm:mb-4 font-display text-base sm:text-lg font-semibold flex items-center gap-2">
                    Contact Information
                  </h2>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <Label htmlFor="email" className="text-sm sm:text-base">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="text-sm sm:text-base"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm sm:text-base">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="text-sm sm:text-base"
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
                          placeholder="New York"
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
                          placeholder="NY"
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
                          placeholder="10001"
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
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="UK">United Kingdom</SelectItem>
                            <SelectItem value="AU">Australia</SelectItem>
                            <SelectItem value="IN">India</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
                  <h2 className="mb-3 sm:mb-4 font-display text-base sm:text-lg font-semibold flex items-center gap-2">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                    Payment Information
                  </h2>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <Label htmlFor="cardNumber" className="text-sm sm:text-base">Card Number</Label>
                      <Input
                        id="cardNumber"
                        name="cardNumber"
                        placeholder="4111 1111 1111 1111"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        className="text-sm sm:text-base"
                        required
                      />
                    </div>

                    <div className="grid gap-2 sm:gap-4 grid-cols-2">
                      <div>
                        <Label htmlFor="cardExpiry" className="text-sm sm:text-base">Expiry Date</Label>
                        <Input
                          id="cardExpiry"
                          name="cardExpiry"
                          placeholder="MM/YY"
                          value={formData.cardExpiry}
                          onChange={handleInputChange}
                          className="text-sm sm:text-base"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cardCVC" className="text-sm sm:text-base">CVC</Label>
                        <Input
                          id="cardCVC"
                          name="cardCVC"
                          placeholder="123"
                          value={formData.cardCVC}
                          onChange={handleInputChange}
                          className="text-sm sm:text-base"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  size="sm"
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Complete Purchase"}
                </Button>
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
                    <span>Free returns 30d</span>
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
