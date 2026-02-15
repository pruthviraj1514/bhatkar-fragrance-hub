# PRODUCTION CODE REFERENCE GUIDE

Quick reference for production-ready patterns implemented in this codebase.

---

## 1. SAFE API ROUTE SETUP

### ✅ DO: Require Auth Only Where Needed
```javascript
// backend/src/routes/paymentRoutes.js

// Public routes - no auth needed
router.post('/create-order', paymentController.createOrder);
router.post('/verify', paymentController.verifyPayment);

// Protected routes - admin only  
router.post('/', adminAuth, paymentController.adminCreateOrder);
router.put('/:id', adminAuth, paymentController.adminUpdateOrder);

// Webhook - validated by signature, not JWT
router.post('/webhook', captureRawBody, attachRawBody, paymentController.webhook);
```

### ❌ DON'T: Require Auth for Customer Operations
```javascript
// WRONG - blocks customer payments
router.post('/create-order', adminAuth, paymentController.createOrder);
```

---

## 2. INPUT VALIDATION PATTERN

### ✅ DO: Validate Before Using
```javascript
// backend/src/controllers/variants.controller.js

exports.getProductVariants = async (req, res) => {
  try {
    const { productId } = req.params;

    // Step 1: Check if parameter exists
    if (!productId) {
      return res.status(400).json({
        status: 'error',
        message: 'Product ID is required',
        variants: [],
      });
    }

    // Step 2: Validate format (prevent SQL injection)
    if (isNaN(productId) || parseInt(productId) <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Product ID must be a valid positive number',
        variants: [],
      });
    }

    // Step 3: Convert to safe type
    const productIdNum = parseInt(productId);
    
    // Step 4: Use safely in query
    const [variants] = await db.query(
      'SELECT * FROM product_variants WHERE product_id = ?',
      [productIdNum] // Safe: parameterized query
    );

    return res.status(200).json({
      status: 'success',
      variants: variants || [],
    });
  } catch (error) {
    // Error handling - see below
  }
};
```

### ❌ DON'T: Trust User Input
```javascript
// WRONG - SQL injection vulnerability
const variants = await db.query(
  `SELECT * FROM product_variants WHERE product_id = ${productId}`
);

// WRONG - crash on invalid input
const variants = await db.query(
  'SELECT * FROM product_variants WHERE product_id = ?',
  [productId] // String "abc" causes query error
);
```

---

## 3. ERROR HANDLING PATTERN

### ✅ DO: Fallback to Safe Response
```javascript
// backend/src/controllers/variants.controller.js

exports.getProductVariants = async (req, res) => {
  try {
    // ... validation ...

    let variants = [];
    try {
      const [results] = await db.query(...);
      variants = results || [];
    } catch (dbError) {
      // Log but don't crash
      console.error('Database error:', dbError.message);
      // Return fallback
      return res.status(200).json({
        status: 'success',
        variants: [],
        warning: 'Database query failed',
      });
    }

    // Fetch related data with fallback
    const itemsWithDetails = await Promise.all(
      items.map(async (item) => {
        try {
          const details = await db.query(...);
          return { ...item, details };
        } catch (err) {
          // Single item fails, don't crash all
          console.warn(`Failed to fetch details for item ${item.id}`);
          return { ...item, details: [] };
        }
      })
    );

    return res.status(200).json({
      status: 'success',
      data: itemsWithDetails,
    });
  } catch (error) {
    // Top-level catch - final safety net
    console.error('Unexpected error:', error.message);
    res.status(200).json({
      status: 'success',
      data: [],
      warning: 'Service temporarily unavailable',
    });
  }
};
```

### ❌ DON'T: Return 500 on Expected Errors
```javascript
// WRONG - crashes when data is missing
try {
  const [variants] = await db.query(...); // Could be null
  return res.json(variants); // Crashes if null
} catch (error) {
  res.status(500).json({ error: 'Failed' }); // Generic 500
}

// WRONG - Doesn't handle error in Promise.all
const items = await Promise.all(
  data.map(async (item) => {
    return await db.query(...); // If one fails, whole chain fails
  })
);
```

---

## 4. IMAGE HANDLING PATTERN

### ✅ DO: Normalize Image Data
```typescript
// src/lib/utils.ts

/**
 * Safely extract image URL from any format
 * Handles: strings, objects, arrays, null
 */
export function getImageUrl(image: any): string {
  try {
    // Null check
    if (!image) {
      console.warn('⚠️ Image is null/undefined');
      return '/placeholder.svg';
    }

    // String URL
    if (typeof image === 'string') {
      if (image.startsWith('http') || image.startsWith('/')) {
        return image;
      }
      return '/placeholder.svg';
    }

    // Array - use first item
    if (Array.isArray(image)) {
      return image.length > 0 ? getImageUrl(image[0]) : '/placeholder.svg';
    }

    // Object with image_url
    if (typeof image === 'object' && image?.image_url) {
      return typeof image.image_url === 'string' 
        ? image.image_url 
        : '/placeholder.svg';
    }

    return '/placeholder.svg';
  } catch (err) {
    console.error('Image processing error:', err);
    return '/placeholder.svg';
  }
}
```

### Usage in Components
```typescript
// src/components/ProductCard.tsx

import { getImageUrl } from '@/lib/utils';

export function ProductCard({ product }) {
  return (
    <img
      src={getImageUrl(product.image)}
      alt={product.name}
      onError={(e) => {
        console.error(`Failed to load image for ${product.name}`);
        (e.target as HTMLImageElement).src = '/placeholder.svg';
      }}
    />
  );
}
```

### ❌ DON'T: Assume Image Format
```typescript
// WRONG - crashes if image is object
<img src={product.image} /> {/* Could be [object Object] */}

// WRONG - doesn't handle missing images
<img src={product.images[0].image_url} /> {/* Crashes if images empty */}

// WRONG - no fallback
<img src={imageUrl} /> {/* Shows broken image if URL invalid */}
```

---

## 5. AXIOS CONFIGURATION PATTERN

### ✅ DO: Configure with Logging & Timeout
```typescript
// src/lib/axios.ts

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000, // 30 seconds
  withCredentials: false,
});

// Request interceptor - log and add auth
api.interceptors.request.use(
  (config) => {
    const url = `${config.baseURL || ''}${config.url}`;
    console.log(`📡 ${config.method?.toUpperCase()} ${url}`);

    // Add token to protected endpoints
    const isPublic = ['/auth/signin', '/auth/signup'].some(
      path => config.url?.includes(path)
    );

    if (!isPublic) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    console.error('❌ Request error:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor - log and handle errors
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Status ${response.status}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`❌ HTTP ${error.response.status}`);
      console.error(`   URL: ${error.config.url}`);
      console.error(`   Message: ${error.response.data?.message}`);
    } else {
      console.error('❌ Network error');
    }
    return Promise.reject(error);
  }
);

export default api;
```

### ❌ DON'T: Leave Requests Unlogged
```typescript
// WRONG - no visibility into requests
const api = axios.create({ baseURL: '/api' });

// WRONG - no error details
api.interceptors.response.use(r => r, e => Promise.reject(e));
```

---

## 6. REACT COMPONENT PATTERN

### ✅ DO: Handle Loading & Error States
```typescript
// src/components/ProductList.tsx

import { useState, useEffect } from 'react';
import api from '@/lib/axios';

export function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get('/products');
        setProducts(response.data.data || []);

        console.log(`✅ Loaded ${products.length} products`);
      } catch (err: any) {
        const message = err.response?.data?.message || err.message || 'Failed to load products';
        setError(message);
        console.error(`❌ Error loading products:`, message);
        
        // Fallback data
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (products.length === 0) return <div>No products found</div>;

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### ❌ DON'T: Ignore States
```typescript
// WRONG - no loading or error handling
<img src={products[0].image} /> {/* Crashes if products empty */}

// WRONG - no fallback
useEffect(() => {
  api.get('/products').then(r => setProducts(r.data)); // Ignores errors
}, []);
```

---

## 7. DATABASE QUERY PATTERN

### ✅ DO: Parameterized Queries
```javascript
// backend/src/models/product.model.js

exports.getProductVariants = async (productId) => {
  // Safe - parameter placeholder
  const [variants] = await db.query(
    'SELECT * FROM product_variants WHERE product_id = ?',
    [productId] // Value passed separately
  );
  return variants;
};

// Safe - multiple parameters
const [products] = await db.query(
  'SELECT * FROM products WHERE category = ? AND price > ? AND price < ?',
  [category, minPrice, maxPrice]
);
```

### ❌ DON'T: String Interpolation
```javascript
// WRONG - SQL injection vulnerability
const query = `SELECT * FROM products WHERE id = ${productId}`;

// WRONG - no validation
const query = 'SELECT * FROM products WHERE id = ?';
db.query(query, [userInput]); // userInput could be malicious
```

---

## 8. LOGGING PATTERN

### ✅ DO: Structured Logging with Context
```javascript
// backend logs
console.log(`📦 Fetching variants for product: ${productId}`);
console.log(`✅ Found ${variants.length} variants`);
console.error(`❌ Database error:`, { code: err.code, message: err.message });

// frontend logs
console.log(`✅ Image is valid string URL: ${url}`);
console.warn(`⚠️ Image is null/undefined, using placeholder`);
console.error(`❌ Image array is empty, product has no images`);
```

### ❌ DON'T: Vague Logging
```javascript
// WRONG - no context
console.log('Error');
console.log(variants); // Too much data

// WRONG - no severity indicator
console.log('variants not found'); // Is this error, warning, or info?
```

---

## COMMON PRODUCTION PATTERNS

### Pattern: Safe Data Extraction
```typescript
// Safe property access with fallback
const firstImage = product?.images?.[0] ?? null;
const imageUrl = firstImage?.image_url ?? '/placeholder.svg';

// Safe array operations
const items = (data.items || []).filter(item => item.active);
```

### Pattern: Safe Type Conversion
```javascript
// Safe number conversion
const id = parseInt(idParam, 10);
if (isNaN(id) || id <= 0) return null;

// Safe string operations
const name = value?.trim() || 'Unknown';
const isValid = typeof value === 'string' && value.length > 0;
```

### Pattern: Safe Error Messages
```javascript
// Expose safe messages to clients
const userMessage = 'Unable to complete request at this time';
const internalMessage = 'Database connection refused: ' + err.message;

console.error('Internal:', internalMessage);
res.status(500).json({ error: userMessage });
```

---

## DEPLOYMENT VERIFICATION CHECKLIST

```bash
# 1. No console errors
# Open DevTools → Console tab
# Should be empty of ❌ red errors

# 2. API calls working
# Check DevTools → Network tab
# POST /api/payment/create-order → 200 OK
# GET /api/variants/product/1 → 200 OK with variants

# 3. Images loading
# Check DevTools → Network tab
# Image requests → 200 OK with correct Content-Type
# HTML src attributes → Valid URLs, not [object Object]

# 4. Backend logs clean
# Check backend terminal/logs
# Should show ✅ success logs, debug info
# Should NOT show ❌ unhandled errors

# 5. No unhandled promises
# Add to browser console:
window.addEventListener('unhandledrejection', e => {
  console.error('Unhandled promise:', e.reason);
});
# Navigate app
# Should not log any rejection errors
```

---

## QUICK TROUBLESHOOTING REFERENCE

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| 404 on API call | Route not defined OR middleware blocks | Check routes.js, remove unnecessary auth |
| 500 on API call | Missing input validation OR database error | Add try-catch, validate inputs, return fallback |
| `[object Object]` in image src | Image data format inconsistent | Use getImageUrl() helper |
| CORS errors | Missing CORS headers | Check app.js CORS setup |
| Token not sent | Not in localStorage OR not being read | Check interceptor, storage keys |
| Network hangs | No timeout set | Add timeout to axios config |
| Blank page | Unhandled JS error | Check DevTools console, add error boundaries |

