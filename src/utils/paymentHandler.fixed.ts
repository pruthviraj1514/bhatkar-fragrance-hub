/**
 * ISSUE 1: PAYMENT API FIX
 * ========================
 * Backend expects: { productId, quantity, userId }
 * Frontend was only sending: { productId, quantity }
 * 
 * Solution: Get userId from auth context or localStorage
 *           Validate user is logged in
 *           Send proper payload to backend
 */

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/axios";
import { useToast } from "@/components/ui/use-toast";

export function PaymentHandler() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
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

        const userId = user?.id || localStorage.getItem("userId");

        if (!userId) {
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

        console.log(`✅ User authenticated: ${userId}`);

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

        console.log(`✅ Payload validated: productId=${productId}, quantity=${quantity}, userId=${userId}`);

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
          userId, // ← NOW SENDING userId
        };

        console.log("   📄 Request payload:", JSON.stringify(payload, null, 2));

        const response = await api.post("/payment/create-order", payload);

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
            name: user?.name || "",
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
    [user, toast]
  );

  return { handlePayment, loading, error };
}

/**
 * USAGE IN COMPONENT:
 * 
 * function ProductCard({ product }) {
 *   const { handlePayment, loading, error } = PaymentHandler();
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
