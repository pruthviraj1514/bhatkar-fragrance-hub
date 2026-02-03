# Render + Clever Cloud MySQL Setup

## Environment Variables for Render Dashboard

Add these to your **Web Service Environment** in Render:

```
DB_HOST=bwr2d3lbhgcmlgtbfbhq-mysql.services.clever-cloud.com
DB_USER=uy5vtvz5ie8lllhq
DB_PASSWORD=kJYyiVaIsZJ155NZVAo9
DB_NAME=bwr2d3lbhgcmlgtbfbhq
DB_PORT=3306
JWT_SECRET_KEY=d_aepb5oKnJBvBemM_jaavme1vqEU7tEletSnp98IxY
PORT=3000
NODE_ENV=production
```

## Steps to Configure in Render

1. **Go to your Web Service** in [render.com](https://render.com) dashboard
2. **Click "Environment"** tab
3. **Add environment variable** (one by one or paste all):
   - Key: `DB_HOST` → Value: `bwr2d3lbhgcmlgtbfbhq-mysql.services.clever-cloud.com`
   - Key: `DB_USER` → Value: `uy5vtvz5ie8lllhq`
   - Key: `DB_PASSWORD` → Value: `kJYyiVaIsZJ155NZVAo9`
   - Key: `DB_NAME` → Value: `bwr2d3lbhgcmlgtbfbhq`
   - Key: `DB_PORT` → Value: `3306`
   - Key: `JWT_SECRET_KEY` → Value: (your existing key)
   - Key: `NODE_ENV` → Value: `production`

4. **Click "Deploy"** to trigger a redeploy with new environment variables

## Verification

After deployment, check the logs in Render:
- ✅ Should see: `Database pool created successfully`
- ❌ If error: `ECONNREFUSED` — check credentials and Clever Cloud MySQL is online
- ❌ If error: `Access Denied` — verify username/password

## Local Development

To test locally with docker-compose MySQL:

```bash
# Use local credentials in .env
DB_HOST=localhost
DB_USER=root
DB_PASS=pass
DB_NAME=fragrance_hub
DB_PORT=3306

# Start MySQL container
docker compose up -d

# Run backend
npm start  # from backend/
```

To use Clever Cloud locally (testing production config):
```bash
# Update backend/.env with Clever Cloud credentials above
npm start  # from backend/
```

## SSL Connection Note

In `src/config/db.config.js`:
- SSL is **enabled in production** (`NODE_ENV=production`)
- SSL is **disabled in development** (`NODE_ENV=development`)

Clever Cloud MySQL supports SSL connections. If you get SSL errors, you can:

1. **Disable SSL** (not recommended):
   ```javascript
   ssl: false  // in db.config.js
   ```

2. **Use custom CA certificate** (recommended):
   - Get Clever Cloud's CA bundle
   - Pass it in connection config: `ssl: { ca: [fs.readFileSync('path/to/ca.pem')] }`

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED` | Can't reach Clever Cloud | Check Clever Cloud MySQL is running; verify host/port |
| `Access Denied` | Wrong credentials | Double-check username/password in Render env vars |
| `PROTOCOL_CONNECTION_LOST` | Connection timeout | Increase `connectionLimit` or check network firewall |
| `ER_NO_DB_ERROR` | Database doesn't exist | Verify DB name matches exactly |

