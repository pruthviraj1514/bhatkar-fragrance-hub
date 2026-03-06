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
  prefillContact?: string;
  shippingData?: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  buttonText?: string;
  buttonClassName?: string;
}

const CheckoutPayment: React.FC<CheckoutPaymentProps> = ({
  items,
  totalAmount,
  prefillContact,
  shippingData,
  onSuccess,
  onError,
  buttonText = 'Pay Now',
  buttonClassName = 'btn-primary'
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Convert phone number from 12 digits to 10 digits
   * Input: "+91 93596 87277" or "9359687277" or "+919359687277"
   * Output: "9359687277"
   */
  const formatPhoneFor10Digits = (phone: string): string => {
    if (!phone) return '';
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    // Take last 10 digits (handles +91 prefix scenarios)
    return cleaned.slice(-10);
  };

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
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');

  // Core payment flow extracted to allow prefill collection first
  const doPayment = useCallback(async (contactToUse: string | null) => {
    try {
      setLoading(true);
      // Clear any previous errors immediately when starting payment
      setError(null);

      console.log('🛒 Starting payment process...');

      // 1. Load Razorpay script
      console.log('📦 Loading Razorpay script...');
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay script - check CDN access');
      }
      console.log('✅ Razorpay script loaded');

      // 1.5. Fetch Razorpay key from backend (ensures we use live key)
      console.log('🔑 Fetching Razorpay key from backend...');
      const configResponse = await api.get('/payment/config');
      if (!configResponse.data.success || !configResponse.data.razorpayKeyId) {
        throw new Error('Failed to fetch Razorpay key from server');
      }
      const razorpayKeyId = configResponse.data.razorpayKeyId;
      console.log('✅ Razorpay key retrieved from backend');

      console.log(`🔄 Creating order for ${items.length} items...`);
      console.log(`📡 API Base URL: ${import.meta.env.VITE_API_BASE_URL}`);

      // Convert phone to 10 digits for shipment APIs
      const formattedPhone = contactToUse ? formatPhoneFor10Digits(contactToUse) : null;

      // Prepare payload with shipping data
      const orderPayload: any = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        contact: formattedPhone || null
      };

      // Include full shipping data if available
      if (shippingData) {
        orderPayload.shippingData = {
          firstName: shippingData.firstName,
          lastName: shippingData.lastName,
          email: shippingData.email,
          phone: formattedPhone || null,
          address: shippingData.address,
          city: shippingData.city,
          state: shippingData.state,
          zipCode: shippingData.zipCode,
          country: shippingData.country
        };
      }

      const orderResponse = await api.post('/payment/create-order', orderPayload);

      console.log('📨 Order creation response:', orderResponse.status, orderResponse.data);

      if (!orderResponse.data.success) {
        const errorMsg = orderResponse.data.error || 'Failed to create order';
        console.error('❌ Order creation failed:', errorMsg);
        throw new Error(errorMsg);
      }

      const { razorpayOrderId, amount, orderId, productName } = orderResponse.data;
      console.log(`✅ Order created: ${orderId}, Razorpay Order: ${razorpayOrderId}, Amount: ₹${amount}`);

      // 3. Open Razorpay checkout
      console.log('🎯 Opening Razorpay Checkout modal...');
      
      // Use the already formatted phone (10 digits or empty)
      const validContact = formattedPhone || '';
      
      console.log('📋 Razorpay options:', {
        key: razorpayKeyId ? 'SET' : 'MISSING',
        amount: Math.round(amount * 100),
        currency: 'INR',
        order_id: razorpayOrderId,
        contact: validContact ? '✅ Valid' : '⚠️ Empty',
        email: localStorage.getItem('userEmail') ? '✅ Set' : '⚠️ Empty'
      });
      
      const options = {
        key: razorpayKeyId,  // ✅ Use key from backend (live key)
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        name: 'Bhatkar Fragrance Hub',
        description: `Order - ${productName}`,
        order_id: razorpayOrderId,

        // Success handler
        handler: async (response: any) => {
          try {
            setLoading(true);
            // Clear any previous errors immediately when payment succeeds on Razorpay
            setError(null);

            // 4. Verify payment on backend
            console.log('💳 Payment successful on Razorpay, verifying on backend...');
            console.log('Payment ID:', response.razorpay_payment_id);

            const verifyResponse = await api.post('/payment/verify', {
              orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            console.log('✅ Verification response:', verifyResponse.data);

            if (verifyResponse.data.success) {
              console.log('🎉 Payment verified successfully! Order:', orderId);
              // Payment successful - call success callback immediately
              if (onSuccess) {
                onSuccess({
                  orderId,
                  paymentId: response.razorpay_payment_id,
                  amount
                });
              }
              // Clear error state to ensure success is processed completely
              setError(null);
            } else {
              const verifyError = 'Payment verification failed - ' + verifyResponse.data.error;
              throw new Error(verifyError);
            }
          } catch (err: any) {
            console.error('❌ Payment verification error:', err.message);
            const errorMsg = err.response?.data?.error || err.message || 'Payment verification failed. Your payment is secure with Razorpay, but we encountered an issue. Please contact support with your Razorpay Payment ID: ' + response.razorpay_payment_id;
            setError(errorMsg);
            if (onError) {
              onError(err);
            }
          } finally {
            setLoading(false);
          }
        },

        // Error handler - Called when Razorpay modal is dismissed or error occurs
        modal: {
          ondismiss: () => {
            console.log('⚠️ Razorpay modal dismissed by user');
            setError('Payment cancelled by user');
          }
        },

        // Contact information - prefill from checkout form if available
        prefill: {
          email: localStorage.getItem('userEmail') || '',
          contact: validContact  // Only send if valid
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

      console.log('🔧 Initializing Razorpay with options');
      const razorpay = new window.Razorpay(options);
      
      console.log('📤 Calling razorpay.open()...');
      
      // Wrap open() call in try-catch in case Razorpay SDK throws
      try {
        razorpay.open();
        console.log('✅ Razorpay modal opened successfully');
      } catch (razorpayError: any) {
        console.error('❌ Razorpay.open() threw error:', {
          message: razorpayError.message,
          error: razorpayError
        });
        throw razorpayError;
      }

    } catch (err: any) {
      // special-case: backend may respond 400 with "Order already paid" when
      // verify is called twice; treat as success to avoid confusing users.
      const status = err.response?.status;
      const dataError = err.response?.data?.error || err.response?.data?.message;
      const errorMessage = dataError || err.message || 'Payment initialization failed';

      if (status === 400 && /already paid/i.test(errorMessage)) {
        console.warn('Duplicate payment verification detected, treating as success');
        if (onSuccess) {
          onSuccess({
            orderId: err.response?.data?.orderId || '(unknown)',
            paymentId: err.response?.data?.paymentId || '(unknown)',
            amount
          });
        }
        setError(null);
      } else {
        console.error('❌ Payment initialization error:', {
          message: errorMessage,
          status: status,
          url: err.response?.config?.url,
          method: err.response?.config?.method,
          errorType: err.constructor.name,
          fullError: err
        });
        setError(errorMessage);
        if (onError) {
          onError(err);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [items, totalAmount, loadRazorpayScript, onSuccess, onError]);

  const handlePayment = useCallback(() => {
    // If phone is provided by parent component (from form), use it instantly
    if (prefillContact) {
      void doPayment(prefillContact);
      return;
    }

    // Check local saved phone second
    const saved = localStorage.getItem('userPhone') || '';
    if (saved) {
      void doPayment(saved);
      return;
    }

    // show modal to collect phone as last resort
    setPhoneInput('');
    setShowPhoneModal(true);
  }, [doPayment, prefillContact]);

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

      {showPhoneModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 8, width: 340, boxShadow: '0 6px 24px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: 0, marginBottom: 8 }}>Enter mobile number</h3>
            <p style={{ marginTop: 0, marginBottom: 12, color: '#555', fontSize: 13 }}>Include country code (e.g. 919876543210)</p>
            <input
              autoFocus
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="919876543210"
              style={{ width: '100%', padding: '8px 10px', marginBottom: 12, borderRadius: 4, border: '1px solid #ddd' }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowPhoneModal(false)} style={{ padding: '8px 12px' }}>Cancel</button>
              <button
                type="button"
                onClick={() => {
                  const cleaned = phoneInput.trim();
                  if (cleaned) {
                    try { localStorage.setItem('userPhone', cleaned); } catch (e) { /* ignore */ }
                    setShowPhoneModal(false);
                    void doPayment(cleaned);
                  } else {
                    setError('Please enter a valid phone number');
                  }
                }}
                style={{ padding: '8px 12px' }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPayment;
