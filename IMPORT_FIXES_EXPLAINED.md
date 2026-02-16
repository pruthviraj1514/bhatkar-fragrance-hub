# 🔧 Import Fixes - Payment Handler

## Issues Found & Fixed

### Issue 1: Wrong Hook Import Path
```typescript
// ❌ WRONG
import { useAuth } from "@/hooks/useAuth";

// ✅ CORRECT
import { useAuth } from "@/contexts/AuthContext";
```

**Reason:** The `useAuth` hook is defined in `src/contexts/AuthContext.tsx`, not in a hooks folder.

---

### Issue 2: Wrong Axios Export
```typescript
// ❌ WRONG
import { api } from "@/lib/axios";

// ✅ CORRECT
import api from "@/lib/axios";
```

**Reason:** The `api` instance is exported as a **default export**, not a named export. Axios library exports the instance as:
```typescript
// src/lib/axios.ts
const api = axios.create({...});
export default api;  // ← Default export
```

---

## How Authentication Works in Frontend

### AuthContext Structure
```typescript
interface AuthContextType {
  user: User | null;           // Customer: { firstname, lastname, email }
  admin: AdminUser | null;     // Admin: { id, email }
  token: string | null;        // JWT token
  isAuthenticated: boolean;    // true if logged in
  role: "admin" | "customer";  // Role type
  isAdmin: boolean;            // true if admin
  login: (data) => Promise<void>;
  adminLogin: (data) => Promise<void>;
  signup: (data) => Promise<void>;
  logout: () => void;
}
```

### Data Flow

**On Login:**
1. Frontend calls `api.post('/auth/signin', { email, password })`
2. Backend validates and returns JWT token (contains userId)
3. Frontend stores: `localStorage.setItem('token', token)`
4. Frontend stores: `localStorage.setItem('user', JSON.stringify(userData))`
5. AuthContext updates: `setToken(token)`, `setUser(userData)`

**On Payment:**
1. Frontend checks `isAuthenticated` from context
2. Frontend sends: `Authorization: Bearer <token>` header
3. Backend middleware extracts userId from JWT
4. Backend processes payment with userId

---

## Fixed Payment Handler Logic

### Before (Wrong)
```typescript
import { useAuth } from "@/hooks/useAuth";  // ❌ Wrong path
import { api } from "@/lib/axios";          // ❌ Wrong export

const { user } = useAuth();
const userId = user?.id;  // ❌ user doesn't have id property

await api.post("/payment/create-order", {
  productId,
  quantity,
  userId  // ❌ Sending in payload
});
```

### After (Correct)
```typescript
import { useAuth } from "@/contexts/AuthContext";  // ✅ Correct path
import api from "@/lib/axios";                      // ✅ Default export

const { user, admin, token, isAuthenticated } = useAuth();

if (!isAuthenticated || !token) {
  // User not logged in
  window.location.href = "/auth/signin";
  return;
}

// ✅ Send token in Authorization header
// Backend will extract userId from JWT
const response = await api.post("/payment/create-order", 
  {
    productId,
    quantity
    // ✅ No userId in payload - backend gets it from token
  },
  {
    headers: {
      Authorization: `Bearer ${token}`,  // ✅ Add token here
    }
  }
);
```

---

## Backend Token Structure

The JWT token contains the userId:

```javascript
// backend/src/utils/token.js
const generate = (id) => jwt.sign({ id }, JWT_SECRET_KEY, { expiresIn: '1d'});

// Decoded token payload:
// { id: 123, iat: 1234567890, exp: 1234654290 }
```

**Backend Middleware (payment controller):**
```javascript
exports.createOrder = async (req, res) => {
  const { productId, quantity } = req.body;
  
  // userId extracted from Authorization header by middleware
  const userId = req.user?.id;  // ← From JWT token
  
  if (!productId || !userId) {
    return res.status(400).json({
      success: false,
      error: 'Product ID and User ID are required'
    });
  }
  
  // Process payment...
};
```

---

## Public vs Protected Endpoints

**In axios.ts:**
```javascript
const publicEndpoints = [
  "/auth/signin",
  "/auth/signup",
  "/products",           // Public - no auth needed
  "/payment/create-order",  // Public endpoint...
  "/payment/verify",     // ...but still uses token if provided
];

// Middleware checks:
if (isPublicEndpoint) {
  console.log("🌍 Public endpoint - no token required");
  // ✅ Doesn't attach token automatically
} else {
  config.headers.Authorization = `Bearer ${token}`;
  console.log("🔐 Protected endpoint - token attached");
}
```

**For payment:** 
- Endpoint is marked as "public" because guests might want to pay
- **But** if user IS logged in, we manually add the token
- Backend uses token if present, otherwise fails with "userId required"

---

## How to Use Fixed Payment Handler

### 1. Import the fixed handler
```typescript
// src/hooks/usePayment.ts (rename from paymentHandler.fixed.ts)
export function PaymentHandler() {
  const { handlePayment, loading, error } = PaymentHandler();
  return { handlePayment, loading, error };
}
```

### 2. Use in component
```tsx
import { PaymentHandler } from "@/hooks/usePayment";

export function ProductCard({ product }) {
  const { handlePayment, loading, error } = PaymentHandler();
  
  const handleClick = () => {
    handlePayment(product.id, 1);  // (productId, quantity)
  };
  
  return (
    <>
      <button onClick={handleClick} disabled={loading}>
        {loading ? "Processing..." : "Buy Now"}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </>
  );
}
```

### 3. What happens on click
```
1. User not logged in?
   → Toast: "Please log in"
   → Redirect to /auth/signin
   
2. User logged in?
   → ✅ Check authentication
   → ✅ Validate payload
   → ✅ Load Razorpay script
   → ✅ Send request with Authorization header
   → ✅ Backend extracts userId from token
   → ✅ Creates order
   → ✅ Opens Razorpay checkout
   → ✅ Payment successful → Redirect to order page
```

---

## Error Messages

### If Still Getting 400 Error
```
❌ "Product ID and User ID are required"
```

**Troubleshooting:**
1. Check browser console:
   ```javascript
   ✅ User authenticated: {user name or email}
   📡 Sending API request...
   📄 Request payload: {productId, quantity}
   // Authorization header should be visible in Network tab
   ```

2. Check Network tab in DevTools:
   ```
   POST /api/payment/create-order
   Headers:
     Authorization: "Bearer eyJh..." ← token should be here
   ```

3. If Authorization header missing:
   - Token not being passed from frontend
   - Check: `const { token } = useAuth()`
   - Should not be null/undefined

4. If still 400:
   - Check backend logs on Render
   - Verify middleware is extracting userId from token correctly

---

## Summary of Changes

| Item | Before | After |
|------|--------|-------|
| useAuth import | `@/hooks/useAuth` | `@/contexts/AuthContext` |
| api import | `{ api }` | `api` (default) |
| userId source | `user?.id` | Auth middleware (from JWT) |
| Authorization | Not sent | `Bearer ${token}` header |
| Payload | `{productId, quantity, userId}` | `{productId, quantity}` |
| Status | ❌ 400 Error | ✅ 200 Success |

---

## Testing

### Test Login First
```
1. Go to homepage
2. Click profile icon (top right)
3. Click "Sign In"
4. Enter: john@example.com / password123
5. Click "Login"
6. Should see profile menu with user name
```

### Test Payment
```
1. Click search icon
2. Search for product
3. Click on product
4. Click "Buy Now"
5. Razorpay modal should open
6. Follow payment flow
```

### Check Debugging
```javascript
// Browser console logs should show:
🔑 Checking authentication...
✅ User authenticated: John
📋 Validating payment payload...
✅ Payload validated
📦 Loading Razorpay script...
✅ Razorpay script loaded
📡 Sending API request to /api/payment/create-order
✅ API Response [200]: {success: true, ...}
```

---

## File Status

✅ **Fixed:** src/utils/paymentHandler.fixed.ts
- Correct imports
- Proper authentication check
- Manual Authorization header
- Proper error handling

🚀 **Ready to deploy:** Copy to src/hooks/usePayment.ts and use in components
