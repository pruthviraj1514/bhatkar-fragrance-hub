# Render Deployment Guide for Bhatkar Fragrance Hub Backend

## Prerequisites
- GitHub repo connected to Render
- PostgreSQL database hosted on Supabase (already migrated)

## Step 1: Get Supabase Connection String

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project → **Settings** → **Database**
3. Find the **Connection String** section
4. Copy the **URI** format (Pooler connection recommended for Render)
   - It should look like: `postgresql://postgres:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`

## Step 2: Connect Backend to Render

1. **Go to [Render Dashboard](https://dashboard.render.com/)**
2. **Click "+ New"** → **Web Service**
3. **Select your GitHub repo** (`bhatkar-fragrance-hub`)
4. **Configuration:**
   - Name: `bhatkar-backend` (or similar)
   - Environment: `Node` (Version 18+ recommended)
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: Free tier is OK for development

## Step 3: Set Environment Variables in Render

In the Render dashboard, go to your service → **Environment**

Add these essential variables:

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
JWT_SECRET_KEY=d_aepb5oKnJBvBemM_jaavme1vqEU7tEletSnp98IxY
NODE_ENV=production
FRONTEND_URL=https://bhatkar-fragrance-hub.onrender.com
```

### Optional S3 (Railway Storage):
```
S3_ENDPOINT=https://t3.storageapi.dev
S3_BUCKET=stocked-cupboard-bdb4pjnh
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
```

### Razorpay Integration:
```
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

## Step 4: Deploy

1. Click **Create Web Service**
2. Render will automatically build and deploy from `main` branch
3. Check logs for any errors
4. Once deployed, you'll get a URL like: `https://bhatkar-backend.onrender.com`

## Step 5: Connect React Frontend

Update your React frontend's API base URL in `.env` (root):

```
VITE_API_BASE_URL=https://bhatkar-backend.onrender.com/api
```

## Step 6: SSL/TLS Connections

The backend automatically handles SSL for Supabase:
- It uses the consolidated connection pool in `src/config/db.js`
- It is optimized for serverless environments using PGBouncer (Port 6543)

## Troubleshooting

### "Too many connections" error
- Ensure you are using the **Pooler connection string** (Port 6543)
- Verify `?pgbouncer=true` is at the end of your `DATABASE_URL`

### "Connection Refused"
- Supabase allows all IP addresses by default, but check if there are any network restrictions.
- Ensure the password doesn't contain special characters that aren't URL-encoded.

### Logs
View logs in Render dashboard:
1. Go to your service
2. Click **Logs** tab
3. Check for "✅ PostgreSQL Connected" message on startup.
