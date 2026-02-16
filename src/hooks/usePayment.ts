/**
 * usePayment Hook
 * ===============
 * Complete payment flow handler with authentication
 * 
 * ISSUE 1: PAYMENT API FIX
 * Backend expects: { productId, quantity, userId }
 * Frontend solution: Get userId from JWT token via Authorization header
 * Backend extracts userId from token middleware
 */

import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";
import { useToast } from "@/components/ui/use-toast";

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, admin, token, isAuthenticated } = useAuth();
  const { toast } = useToast();

  /**
   * Create Order - Fixed version with userId validation
   */
  const handlePayment = useCallback(
    async (productId: number, quantity: number = 1) => {
      try {
        setLoading(true);
        setError(null);

        // ========== STEP 1: VALIDATE USER IS LOGGED IN ==========
        console.log("🔑 Checking authentication...");

        // Check if user is authenticated
        if (!isAuthenticated || !token) {
          const errorMsg = "❌ Please log in to purchase";
          console.error(errorMsg);
          setError(errorMsg);
          toast({
            title: "Authentication Required",
            description: "Please log in to complete your purchase",
            variant: "destructive",
          });
          // Redirect to login
          window.location.href = "/auth/signin";
          return;
        }

        // Get user display name
        const userName = user?.firstname || admin?.email || "Customer";
        console.log(`✅ User authenticated: ${userName}`);

        // ========== STEP 2: VALIDATE PAYLOAD ==========
        console.log("📋 Validating payment payload...");

        if (!productId || typeof productId !== "number" || productId < 1) {
          const errorMsg = "Invalid product ID";
          console.error(`❌ ${errorMsg}`);
          setError(errorMsg);
          return;
        }

        if (!quantity || typeof quantity !== "number" || quantity < 1 || quantity > 100) {
          const errorMsg = "Quantity must be between 1 and 100";
          console.error(`❌ ${errorMsg}`);
          setError(errorMsg);
          return;
        }

        console.log(`✅ Payload validated: productId=${productId}, quantity=${quantity}`);

        // ========== STEP 3: LOAD RAZORPAY SCRIPT ==========
        console.log("📦 Loading Razorpay script...");

        const scriptLoaded = await new Promise<boolean>((resolve) => {
          const script = document.querySelector('script[src*="checkout.razorpay.com"]');
          if (script) {
            resolve(true);
            return;
          }

          const newScript = document.createElement("script");
          newScript.src = "https://checkout.razorpay.com/v1/checkout.js";
          newScript.async = true;
          newScript.onload = () => resolve(true);
          newScript.onerror = () => resolve(false);
          document.body.appendChild(newScript);
        });

        if (!scriptLoaded) {
          throw new Error("Failed to load Razorpay script - check CDN access");
        }

        console.log("✅ Razorpay script loaded");

        // ========== STEP 4: SEND API REQUEST ==========
        console.log("📡 Sending API request to /api/payment/create-order");
        console.log(`   📊 API Base URL: ${import.meta.env.VITE_API_BASE_URL}`);

        const payload = {
          productId,
          quantity,
        };

        console.log("   📄 Request payload:", JSON.stringify(payload, null, 2));

        // Send request with Authorization header
        // Backend will extract userId from JWT token
        const response = await api.post("/payment/create-order", payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log(`✅ API Response [${response.status}]:`, response.data);

        if (!response.data.success) {
          const errorMsg = response.data.error || "Failed to create order";
          console.error(`❌ ${errorMsg}`);
          setError(errorMsg);
          toast({
            title: "Order Creation Failed",
            description: errorMsg,
            variant: "destructive",
          });
          return;
        }

        // ========== STEP 5: OPEN RAZORPAY CHECKOUT ==========
        const { razorpayOrderId, amount, orderId, productName } = response.data;

        console.log(`✅ Order created successfully`);
        console.log(`   Order ID: ${orderId}`);
        console.log(`   Razorpay Order: ${razorpayOrderId}`);
        console.log(`   Amount: ₹${amount}`);

        console.log("🎯 Opening Razorpay Checkout modal...");

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          order_id: razorpayOrderId,
          amount: Math.round(amount * 100), // Convert to paise
          currency: "INR",
          name: "Bhatkar & Co",
          description: productName,
          prefill: {
            name: `${user?.firstname || ''} ${user?.lastname || ''}`.trim() || "",
            email: user?.email || "",
          },
          handler: async (response: any) => {
            console.log("✅ Payment successful!");
            console.log("   Payment ID:", response.razorpay_payment_id);
            console.log("   Signature:", response.razorpay_signature);

            // Verify payment on backend
            try {
              const verifyResponse = await api.post("/payment/verify", {
                orderId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (verifyResponse.data.success) {
                toast({
                  title: "Payment Successful",
                  description: `Order ${orderId} confirmed!`,
                });
                // Redirect to order confirmation
                window.location.href = `/order/${orderId}`;
              } else {
                toast({
                  title: "Verification Failed",
                  description: "Payment received but verification failed",
                  variant: "destructive",
                });
              }
            } catch (err: any) {
              console.error("❌ Verification error:", err.message);
              toast({
                title: "Verification Error",
                description: err.message,
                variant: "destructive",
              });
            }
          },
          modal: {
            ondismiss: () => {
              console.log("⚠️ User closed Razorpay modal");
              toast({
                title: "Payment Cancelled",
                description: "You closed the payment window",
              });
            },
          },
        };

        const checkout = new (window as any).Razorpay(options);
        checkout.open();
      } catch (err: any) {
        const errorMsg = err.message || "Payment processing failed";
        console.error(`❌ Payment error: ${errorMsg}`);
        setError(errorMsg);
        toast({
          title: "Payment Error",
          description: errorMsg,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [user, admin, token, isAuthenticated, toast]
  );

  return { handlePayment, loading, error };
}

/**
 * USAGE IN COMPONENT:
 * 
 * import { usePayment } from "@/hooks/usePayment";
 * 
 * function ProductCard({ product }) {
 *   const { handlePayment, loading, error } = usePayment();
 *   
 *   return (
 *     <>
 *       <button
 *         onClick={() => handlePayment(product.id, 1)}
 *         disabled={loading}
 *       >
 *         {loading ? "Processing..." : "Buy Now"}
 *       </button>
 *       {error && <p className="text-red-500">{error}</p>}
 *     </>
 *   );
 * }
 */
