import axios from "axios";

// ===== CONFIG =====
// Use environment variable or fallback to deployed backend
const baseURL = import.meta.env.VITE_API_BASE_URL || "https://bhatkar-fragrance-hub-1.onrender.com/api";

console.log(`🔗 API Base URL: ${baseURL}`);

const api = axios.create({
  baseURL,
  timeout: 15000, // 15 second timeout (was 30s - backend cold start finishes in 15s)
  withCredentials: false,
});

// ===== REQUEST INTERCEPTOR =====
// Add auth token and handle FormData
api.interceptors.request.use(
  (config) => {
    // Log request details for debugging
    const fullUrl = `${config.baseURL || ''}${config.url}`;
    const method = config.method?.toUpperCase() || 'GET';
    const timestamp = new Date().toISOString();
    
    console.log(`📡 [${timestamp}] ${method} ${fullUrl}`);
    
    // ===== AUTHENTICATION HANDLING =====
    // Public endpoints that don't need auth
    const publicEndpoints = [
      "/auth/signin",
      "/auth/signup",
      "/products",
      "/variants",
      "/reviews",
      "/images",
      "/payment/create-order",  // ✅ Payment creation is public (customers pay)
      "/payment/verify",        // ✅ Payment verification needs signature, not auth
    ];
    
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      config.url?.includes(endpoint)
    );
    
    // Only add token for protected endpoints
    if (!isPublicEndpoint) {
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`  🔐 Auth: Token attached`);
      } else {
        console.warn(`  ⚠️ Auth: No token found for protected endpoint`);
      }
    } else {
      console.log(`  🌍 Auth: Public endpoint (no token needed)`);
    }

    // ===== CONTENT-TYPE HANDLING =====
    // Handle FormData (for file uploads)
    if (config.data instanceof FormData) {
      // Let axios set Content-Type with proper boundary
      delete config.headers["Content-Type"];
      console.log(`  📦 Content-Type: multipart/form-data (auto)`);
    } else if (config.data) {
      // Set Content-Type for JSON requests
      config.headers["Content-Type"] = "application/json";
      console.log(`  📄 Content-Type: application/json`);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error.message);
    return Promise.reject(error);
  }
);

// ===== RESPONSE INTERCEPTOR =====
// Handle success and error responses with detailed logging
api.interceptors.response.use(
  (response) => {
    const { status, statusText, config } = response;
    const method = config.method?.toUpperCase() || 'GET';
    const url = config.url;
    
    // Success logging
    if (status >= 200 && status < 300) {
      console.log(`✅ Success [${status}] ${method} ${url}`);
    } else {
      console.warn(`⚠️ Status [${status}] ${method} ${url}`);
    }
    
    return response;
  },
  (error) => {
    // ===== ERROR RESPONSE =====
    if (error.response) {
      const { status, statusText, data, config } = error.response;
      const method = config?.method?.toUpperCase() || 'UNKNOWN';
      const url = config?.url || 'unknown';
      
      // Log detailed error information
      console.error(`❌ HTTP Error [${status}] ${method} ${url}`);
      console.error(`   Status: ${status} ${statusText}`);
      
      // Log error message from backend if available
      if (data?.error) {
        console.error(`   Backend Error: ${data.error}`);
      } else if (data?.message) {
        console.error(`   Message: ${data.message}`);
      }
      
      // Special handling for 404 errors
      if (status === 404) {
        console.error(`   ℹ️  Endpoint not found. Check route definition on backend.`);
      }
      
      // Special handling for 401/403 errors
      if (status === 401 || status === 403) {
        console.error(`   ℹ️  Authentication/Authorization failed. Check token.`);
      }
      
      // Special handling for 500 errors
      if (status >= 500) {
        console.error(`   ℹ️  Server error. Check backend logs.`);
      }
    }
    // ===== NO RESPONSE (Network Error) =====
    else if (error.request) {
      console.error('❌ Network Error: No response from server');
      console.error(`   Request: ${error.request.method} ${error.request.url}`);
      console.error(`   ℹ️  Check if backend is running and CORS is enabled.`);
    }
    // ===== REQUEST SETUP ERROR =====
    else {
      console.error('❌ Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
