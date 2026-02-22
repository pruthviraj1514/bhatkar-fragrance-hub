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
   - [x] Add admin user auto-seeding on startup

3. **backend/src/app.js**
   - [x] Update CORS to allow production frontend

4. **src/lib/axios.ts**
   - [x] Ensure VITE_API_BASE_URL is used correctly
   - [x] Update fallback to correct production URL

5. **test-api.js** (optional - local test file)
   - [ ] Update to use production URL

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

### Admin Credentials:
- Email: admin@bhatkar.com
- Password: admin123
