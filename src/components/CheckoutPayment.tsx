/**
 * Checkout Payment Component
 * ==========================
 * Handles Razorpay payments for checkout with multiple cart items
 */

import React, { useState, useCallback } from 'react';
import api from '../lib/axios';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CheckoutPaymentProps {
  items: Array<{ productId: number; quantity: number; price: number }>;
  totalAmount: number;
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  buttonText?: string;
  buttonClassName?: string;
}

const CheckoutPayment: React.FC<CheckoutPaymentProps> = ({
  items,
  totalAmount,
  onSuccess,
  onError,
  buttonText = 'Pay Now',
  buttonClassName = 'btn-primary'
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load Razorpay script from CDN
   */
  const loadRazorpayScript = useCallback(() => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  /**
   * Handle payment process - Create order on backend for first cart item
   * Backend will fetch the price and ensure security
   */
  const handlePayment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay script');
      }

      // 2. Create order on backend using first item (backend will calculate total)
      const mainItem = items[0];
      if (!mainItem) {
        throw new Error('Cart is empty');
      }

      const orderResponse = await api.post('/api/payment/create-order', {
        productId: mainItem.productId,
        quantity: mainItem.quantity
      });

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.error || 'Failed to create order');
      }

      const { razorpayOrderId, amount, orderId, productName } = orderResponse.data;

      // 3. Open Razorpay checkout
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        name: 'Bhatkar Fragrance Hub',
        description: `Order - ${productName}`,
        order_id: razorpayOrderId,
        
        // Success handler
        handler: async (response: any) => {
          try {
            setLoading(true);

            // 4. Verify payment on backend
            const verifyResponse = await api.post('/api/payment/verify', {
              orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyResponse.data.success) {
              // Payment successful
              if (onSuccess) {
                onSuccess({
                  orderId,
                  paymentId: response.razorpay_payment_id,
                  amount
                });
              }
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (err: any) {
            setError(err.message || 'Payment verification failed');
            if (onError) {
              onError(err);
            }
          } finally {
            setLoading(false);
          }
        },

        // Error handler
        modal: {
          ondismiss: () => {
            setError('Payment cancelled');
          }
        },

        // Contact information - prefill from checkout form if available
        prefill: {
          email: localStorage.getItem('userEmail') || '',
          contact: localStorage.getItem('userPhone') || ''
        },

        // Theme
        theme: {
          color: '#D4A574'
        },

        // Notes
        notes: {
          cartItems: items.length,
          totalAmount
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Payment failed';
      setError(errorMessage);
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [items, totalAmount, loadRazorpayScript, onSuccess, onError]);

  return (
    <div className="checkout-payment">
      {error && (
        <div className="alert alert-danger" role="alert" style={{ 
          padding: '12px', 
          marginBottom: '16px', 
          backgroundColor: '#fee', 
          border: '1px solid #fcc', 
          borderRadius: '4px',
          color: '#c33'
        }}>
          {error}
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={loading}
        className={buttonClassName}
        style={{
          opacity: loading ? 0.6 : 1,
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Processing...' : buttonText}
      </button>
    </div>
  );
};

export default CheckoutPayment;
