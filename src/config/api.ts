/**
 * Centralized API Configuration
 * Use this for all API calls to ensure consistent configuration
 */

export const API_BASE = import.meta.env.VITE_API_BASE_URL 
  || "https://bhatkar-fragrance-hub-1.onrender.com/api";

export const API_ENDPOINTS = {
  // Auth
  SIGNIN: "/auth/signin",
  SIGNUP: "/auth/signup",
  
  // Products
  PRODUCTS: "/products",
  PRODUCTS_WITH_IMAGES: "/products/with-images/all",
  
  // Variants
  VARIANTS: "/variants",
  
  // Reviews
  REVIEWS: "/reviews",
  
  // Orders
  ORDERS: "/orders",
  
  // Upload
  UPLOAD_IMAGE: "/upload-image",
  
  // Images
  IMAGES: "/images",
  
  // Payment
  PAYMENT: "/payment",
  PAYMENT_CREATE_ORDER: "/payment/create-order",
  PAYMENT_VERIFY: "/payment/verify",
  PAYMENT_HEALTH: "/payment/health",
};

export const isProduction = import.meta.env.PROD || false;

export default API_BASE;
