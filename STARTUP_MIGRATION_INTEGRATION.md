# 🔧 INTEGRATION GUIDE - Adding Startup Migrations

## Overview

This guide shows how to integrate automatic migrations into your Express backend so the missing columns are added automatically on server startup.

---

## Option 1: Automatic (Recommended)

Add this to your `backend/src/index.js` **after database connection is established**:

```javascript
// In backend/src/index.js, after db connection setup

const express = require('express');
const db = require('./config/db.config');
const { logger } = require('./utils/logger');
const { runStartupMigrations } = require('./database/startupMigrations');  // Add this import

const app = express();

// ... other middleware setup ...

// DATABASE CONNECTION
db.getConnection()
  .then(async () => {
    logger.info('✅ Connected to MySQL database');

    // ✅ ADD THIS: Run migrations on startup
    logger.info('🔄 Running startup migrations...');
    try {
      await runStartupMigrations(db, logger);
      logger.info('✅ Database schema verified and updated');
    } catch (error) {
      logger.warn('⚠️  Startup migration warning:', error.message);
      // Continue anyway - columns might already exist
    }

    // ... rest of server startup ...
    
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('❌ Database connection failed:', error.message);
    process.exit(1);
  });
```

### What This Does:
- ✅ Checks if `is_active` column exists
- ✅ Adds it if missing (with DEFAULT 1)
- ✅ Checks if `is_best_seller` column exists
- ✅ Adds it if missing (with DEFAULT 0)
- ✅ Creates performance indexes
- ✅ Logs success/failure
- ✅ Continues startup even if columns already exist (idempotent)

### Advantages:
- **Automatic**: No manual migration needed
- **Zero Downtime**: Runs during server start
- **Safe**: Won't error if columns exist
- **Production Ready**: Used by major frameworks like Rails, Django

---

## Option 2: Manual Migration Command

If you prefer to run migrations manually before deployment:

```bash
# Add to package.json scripts:
```

Edit `package.json`:

```json
{
  "scripts": {
    "migrate": "node backend/src/database/migrations/001_add_is_active_column.js",
    "verify-schema": "node backend/src/database/verify-production-schema.js",
    "start": "node backend/src/index.js",
    "dev": "nodemon backend/src/index.js"
  }
}
```

Usage:
```bash
# Before deploying
npm run migrate

# Verify it worked
npm run verify-schema

# Then start normally
npm start
```

---

## Option 3: Railway Deploy Hook

If using Railway's deploy hooks, add this to `.railway/hooks/post-deploy.sh`:

```bash
#!/bin/bash

echo "🔄 Running database migrations..."
node backend/src/database/migrations/001_add_is_active_column.js

if [ $? -eq 0 ]; then
  echo "✅ Migrations successful"
else
  echo "❌ Migrations failed"
  exit 1
fi
```

---

## How to Implement Option 1 (Automatic)

### Step 1: Check Your Current index.js

Find the file: `backend/src/index.js`

Look for where your database connection is established:

```javascript
// Current code might look like:
const db = require('./config/db.config');

db.getConnection()
  .then(() => {
    logger.info('✅ Connected to database');
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on ${PORT}`);
    });
  })
  .catch(error => {
    logger.error('Database error:', error.message);
    process.exit(1);
  });
```

### Step 2: Add the Import

At the top of `index.js`, add:

```javascript
const { runStartupMigrations } = require('./database/startupMigrations');
```

### Step 3: Call Migration in Connection Handler

Modify the `.then()` block:

```javascript
db.getConnection()
  .then(async () => {
    logger.info('✅ Connected to MySQL database');

    // 🆕 Add migrations
    logger.info('🔄 Running startup migrations...');
    try {
      const result = await runStartupMigrations(db, logger);
      if (result.success) {
        logger.info('✅ Database schema verified and updated');
      }
    } catch (error) {
      logger.warn('⚠️  Startup migration warning:', error.message);
      // Continue anyway - might be permission issue or columns exist
    }

    // Server startup continues...
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(error => {
    logger.error('❌ Database connection failed:', error.message);
    process.exit(1);
  });
```

### Step 4: Test Locally

```bash
npm run dev

# Watch for output:
# 🔄 Running startup migrations...
# ✅ Database schema verified and updated
```

### Step 5: Deploy to Railway

```bash
git add .
git commit -m "feat: add startup migrations for schema sync"
git push

# Railway will automatically restart
# Watch logs: migrations should run on startup
```

---

## Expected Output

### Successful Migration:

```
✅ Connected to MySQL database
🔄 Running startup migrations...
  Adding is_active column to products table...
  ✅ Added is_active column
  Adding is_best_seller column to products table...
  ✅ Added is_best_seller column
  Creating index idx_is_active on products...
  ✅ Created index idx_is_active
✅ Database schema verified and updated
🚀 Server running on port 5000
```

### Already Migrated (Idempotent):

```
✅ Connected to MySQL database
🔄 Running startup migrations...
  ✓ Column is_active already exists
  ✓ Column is_best_seller already exists
  ✓ Index idx_is_active already exists
✅ Database schema verified and updated
🚀 Server running on port 5000
```

### If Columns Exist But Index Missing:

```
✅ Connected to MySQL database
🔄 Running startup migrations...
  ✓ Column is_active already exists
  ✓ Column is_best_seller already exists
  Creating index idx_is_active on products...
  ✅ Created index idx_is_active
✅ Database schema verified and updated
🚀 Server running on port 5000
```

---

## Troubleshooting

### Issue: "Cannot find module startupMigrations"

**Solution**: Verify file exists at `backend/src/database/startupMigrations.js`

```bash
ls -la backend/src/database/startupMigrations.js
```

### Issue: "db.query is not a function"

**Solution**: Ensure `db` is actually a mysql2/promise pool:

```javascript
// In backend/src/config/db.config.js, should have:
const pool = mysql.createPool({...});
module.exports = pool;  // ✅ Export the pool, not a single connection
```

### Issue: "Access Denied" error during migration

**Solution**: Railway database user might not have ALTER TABLE permission

```bash
# On Railway dashboard, check that the DB_USER has:
# - GRANT ALTER
# - GRANT INDEX
# - GRANT CREATE privileges
```

### Issue: Still seeing "Unknown column 'p.is_active'" error

**Solution**: Verify migration actually ran:

```bash
# Check server logs for:
# ✅ Database schema verified and updated

# If not there, migration didn't run. Then:
# 1. Check for errors in logs
# 2. Verify database credentials in .env
# 3. Manually run: node backend/src/database/migrations/001_add_is_active_column.js
```

---

## Verification After Integration

### 1. Check Server Logs

```bash
# Should show:
✅ Database schema verified and updated
```

### 2. Verify Aggregate Query Works

```bash
# Call your API
curl http://localhost:5000/api/products/with-images/all

# Should return JSON without errors
# Should NOT return: "Falling back to separate queries"
```

### 3. Check Database Directly

```bash
node backend/src/database/verify-production-schema.js

# Should show: ✅ ALL CHECKS PASSED
```

---

## Next Steps

1. **Add to index.js**: Copy the code from "Step 3" above
2. **Test locally**: `npm run dev` and check logs
3. **Deploy**: Push to Railway
4. **Verify**: Check production logs and API response

---

## Additional Resources

- **Migration file**: `backend/src/database/startupMigrations.js`
- **Full guide**: `PRODUCTION_SCHEMA_FIX_GUIDE.md`
- **Verification script**: `node backend/src/database/verify-production-schema.js`
- **Manual SQL**: `MIGRATION_SQL_COMMANDS.sql`

