# PRODUCTION FIXES - TODO

## Issues Identified:

### 1. Product Images NOT Loading
- **Root Cause**: Backend returns image_url directly from DB without generating fresh signed URLs
- **Fix**: Update products.optimized.controller.js to use imageURLService.generateSignedUrlsForImages()

### 2. Logo 404 Error
- **Root Cause**: bhatkar-logo.png is missing from /public folder
- **Fix**: Need to add logo file to public folder OR fix the path in Header.tsx

### 3. Mixed Content Warnings
- **Root Cause**: Some URLs still use HTTP
- **Fix**: Ensure all URLs use HTTPS

### 4. Razorpay Checkout Errors
- **Root Cause**: Iframe access issues
- **Fix**: Fix Razorpay modal initialization

### 5. Order Details Buttons Not Working
- **Root Cause**: No handlers implemented
- **Fix**: Implement handlers for Download Invoice, See Details, and remove Track Package

### 6. Image Performance
- **Root Cause**: No lazy loading or error handling
- **Fix**: Add lazy loading, skeleton loaders, error fallback

## Files to Edit:
1. backend/src/controllers/products.optimized.controller.js - Add signed URL generation
2. src/components/layout/Header.tsx - Fix logo path
3. src/pages/Orders.tsx - Implement button handlers
4. Various image components - Add lazy loading

## Testing Required:
- Test image loading on production
- Test order details buttons
- Test Razorpay checkout flow
