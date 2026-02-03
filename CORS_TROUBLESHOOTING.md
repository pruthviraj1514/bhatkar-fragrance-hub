# CORS Error Troubleshooting

## Issue:
```
Access to XMLHttpRequest at 'https://bhatkar-fragrance-hub-1.onrender.com/api/auth/signup' 
from origin 'https://bhatkar-fragrance-hub-5.onrender.com' has been blocked by CORS policy
```

## Root Cause:
Backend service hasn't redeployed with the CORS fix, or backend is down.

---

## Step-by-Step Fix:

### 1. Verify Backend Service URL
- ✅ Backend URL in frontend: `https://bhatkar-fragrance-hub-1.onrender.com/api`
- ✅ Frontend URL: `https://bhatkar-fragrance-hub-5.onrender.com`

### 2. Check Backend Status on Render
1. Go to [render.com/dashboard](https://render.com/dashboard)
2. Click on your **Web Service** (backend) - `bhatkar-fragrance-hub-1`
3. Check the **Status** at top:
   - 🟢 **Live** = Running ✓
   - 🟡 **Deploying** = Still deploying (wait 2-3 min)
   - 🔴 **Failed** = Deployment failed (check logs)

### 3. Force Redeploy Backend
1. In backend service page, scroll down to **Recent Deploys**
2. Find the latest commit: `3322825 - Simplify CORS to allow all origins`
3. Click **"Redeploy"** button (not "Deploy" - the specific commit button)
4. Wait for **BUILD SUCCESS** in logs
5. Should see: `Database pool created successfully`

### 4. Test Backend Directly
Open this URL in your browser:
```
https://bhatkar-fragrance-hub-1.onrender.com/
```

Expected response:
```json
{
  "status": "success",
  "data": {
    "message": "API working fine"
  }
}
```

If you see this → Backend is working ✓

### 5. Check Backend Logs for Errors
1. In Render backend service
2. Click **Logs** tab
3. Look for errors like:
   - `Database connection failed`
   - `ECONNREFUSED`
   - `Error: Missing required credential`

If you see errors → Note them and share

### 6. Refresh Frontend
1. Go to `https://bhatkar-fragrance-hub-5.onrender.com`
2. **Hard refresh**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
3. Open DevTools: `F12`
4. Go to **Network** tab
5. Try signing up
6. Look for the request to `/api/auth/signup`
7. Check **Response Headers** for:
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: GET,POST,PUT,DELETE,PATCH,OPTIONS
   ```

---

## If Problem Persists:

### Check 1: Is the backend URL being used correctly?
```javascript
// In frontend, check console:
console.log(import.meta.env.VITE_API_BASE_URL);
// Should output: https://bhatkar-fragrance-hub-1.onrender.com/api
```

### Check 2: Backend Logs
Run in Render backend logs:
```
[Backend] cors enabled for all origins
[Backend] Running on PORT 3000
```

If you don't see these → backend hasn't redeployed

### Check 3: Network Issue
The backend might be taking time to wake up (free tier cold starts).
- Wait 30 seconds and try again
- Check if backend URL responds: `https://bhatkar-fragrance-hub-1.onrender.com/`

---

## Quick Action:

1. ✅ Go to Render dashboard
2. ✅ Find backend service → Click **Redeploy** on latest commit
3. ✅ Wait for green checkmark (deployment complete)
4. ✅ Refresh frontend and try signup again
5. ✅ Hard refresh if still having issues

Report what you see in the logs!
