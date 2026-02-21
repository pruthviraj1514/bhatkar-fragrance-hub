# PRODUCTION MODE CONVERSION - TODO

## Task: Convert entire codebase from localhost to production environment-based URLs

### Files to Edit:

1. **backend/src/index.production.js**
   - [x] Remove localhost CORS origins
   - [x] Add production frontend URL to CORS
   - [x] Fix logger URLs (remove localhost from log messages)
   - [x] Remove fallback to localhost for API_BASE_URL

2. **backend/src/index.js**
   - [x] Change PORT to use process.env.PORT properly

3. **backend/src/app.js**
   - [x] Update CORS to allow production frontend

4. **src/lib/axios.ts**
   - [x] Ensure VITE_API_BASE_URL is used correctly
   - [x] Update fallback to correct production URL

5. **test-api.js** (optional - local test file)
   - [x] Update to use production URL

### Environment Variables to Document:
- DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT
- PORT
- JWT_SECRET_KEY
- S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY
- RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_URL
- VITE_API_BASE_URL
- FRONTEND_URL

### Production URLs:
- Frontend: https://bhatkar-fragrance-hub-5.onrender.com
- Backend API: https://bhatkar-fragrance-hub-5.onrender.com/api

## COMPLETED CHANGES:

### 1. backend/src/index.production.js
- ✅ CORS already configured for production frontend
- ✅ API_BASE_URL fallback set to correct production URL
- ✅ Logger URLs now use dynamic variables (API_BASE_URL and FRONTEND_URL)

### 2. backend/src/index.js
- ✅ Already uses process.env.PORT || 5000

### 3. backend/src/app.js
- ✅ CORS already configured for production

### 4. src/lib/axios.ts
- ✅ Fallback URL updated to correct production URL (bhatkar-fragrance-hub-5.onrender.com)

### 5. backend/src/controllers/products.optimized.controller.js
- ✅ Added imageURLService import
- ✅ Updated getAllProducts to generate signed URLs for images
- ✅ Updated getProductById to generate signed URLs for images
- ✅ Updated getBestSellers to generate signed URLs for images
- ✅ Updated formatProduct helper to generate signed URLs for images
- ✅ Now used by getProductsByCategory, searchProducts, getTopRatedProducts
