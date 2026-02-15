#!/bin/bash
# Production Debugging Checklist - Bhatkar Fragrance Hub
# This script helps identify and verify fixes for both production bugs

echo "=================================="
echo "🔍 PRODUCTION DEBUGGING CHECKLIST"
echo "=================================="
echo ""

# ----------------------------------
# BUG 1: IMAGE LOADING [object%20Object]
# ----------------------------------
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "BUG 1: IMAGE LOADING ERROR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Error: GET https://domain.com/[object%20Object] 404"
echo ""
echo "DIAGNOSIS CHECKLIST:"
echo ""
echo "Step 1: Check if getDatabaseProductImage() function exists"
grep -n "getDatabaseProductImage" src/components/products/ProductCard.tsx && echo "✅ Function found" || echo "❌ Function missing"
echo ""

echo "Step 2: Verify ProductCard calls getDatabaseProductImage()"
grep -n "getDatabaseProductImage(product as DatabaseProduct)" src/components/products/ProductCard.tsx && echo "✅ Called correctly" || echo "❌ Not called"
echo ""

echo "Step 3: Check for type safety checks in image handling"
grep -n "typeof imageObj === 'object'" src/components/products/ProductCard.tsx && echo "✅ Type check found" || echo "❌ Type check missing"
echo ""

echo "Step 4: Check for placeholder fallback"
grep -n "/placeholder.svg" src/components/products/ProductCard.tsx && echo "✅ Fallback exists" || echo "❌ No fallback"
echo ""

echo "Step 5: Verify image onError handler in render"
grep -n "onError=" src/components/products/ProductCard.tsx | head -3 && echo "✅ Error handler found" || echo "❌ No error handler"
echo ""

# ----------------------------------
# BUG 2: PAYMENT API 404
# ----------------------------------
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "BUG 2: PAYMENT API 404 ERROR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Error: POST https://backend.com/api/payment/create-order 404"
echo ""
echo "DIAGNOSIS CHECKLIST:"
echo ""

echo "Step 1: Verify backend route mounting in app.js"
grep -n "app.use.*payment" backend/src/app.js && echo "✅ Route mounted" || echo "❌ Route not mounted"
echo ""

echo "Step 2: Check payment routes file exists"
[ -f backend/src/routes/paymentRoutes.js ] && echo "✅ Routes file exists" || echo "❌ Routes file missing"
echo ""

echo "Step 3: Verify create-order endpoint in routes"
grep -n "router.post.*create-order" backend/src/routes/paymentRoutes.js && echo "✅ Endpoint defined" || echo "❌ Endpoint missing"
echo ""

echo "Step 4: Check frontend axios base URL"
grep -n "baseURL" src/lib/axios.ts && echo "✅ Base URL configured" || echo "❌ Base URL missing"
echo ""

echo "Step 5: Verify payment endpoint calls use correct path"
grep -n "api.post.*payment" src/components/CheckoutPayment.tsx && echo "✅ Payment call found" || echo "❌ Payment call missing"
echo ""

echo "Step 6: Check environment variables in frontend"
[ -f .env.local ] && echo "✅ .env.local exists" || echo "⚠️  .env.local not created"
[ -f .env.local ] && grep VITE_API_BASE_URL .env.local && echo "✅ API base URL set" || echo "❌ API base URL missing"
echo ""

# ----------------------------------
# DEPLOYMENT STATUS
# ----------------------------------
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "DEPLOYMENT STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Step 1: Check if all changes are committed to git"
git status
echo ""

echo "Step 2: Verify latest commit is pushed"
git log -1 --oneline
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DIAGNOSTIC COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "NEXT STEPS:"
echo "1. If all checks pass ✅, trigger Render frontend redeploy"
echo "2. If any check fails ❌, see DEBUGGING_DETAILS.md"
echo ""
