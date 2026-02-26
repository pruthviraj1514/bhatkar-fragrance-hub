# Supabase PostgreSQL Migration - Summary

## Completed Changes

### 1. Core Database Configuration
- ✅ **Installed pg driver** - `npm install pg`
- ✅ **Created supabase.db.config.js** - PostgreSQL connection with pooler (port 6543)
- ✅ **Created db.compat.js** - MySQL compatibility layer

### 2. Schema Files
- ✅ **Created supabase-schema.sql** - PostgreSQL schema for all tables:
  - users (SERIAL PRIMARY KEY)
  - products (with CHECK constraints for category/concentration)
  - product_images
  - product_variants
  - orders
  - reviews
  - RLS policies
  - Automatic timestamp triggers

### 3. Query Files Updated (PostgreSQL syntax)
- ✅ **products.queries.js** - $1 placeholders, RETURNING clauses
- ✅ **queries.js** (users) - $1 placeholders, RETURNING
- ✅ **productImages.queries.js** - JSON_AGG instead of JSON_ARRAYAGG
- ✅ **orders.queries.js** - $1 placeholders, RETURNING
- ✅ **productVariants.queries.js** - $1 placeholders, RETURNING

### 4. Model Files Updated
- ✅ **product.model.js** - Uses supabase.db.config, result.rows[0].id
- ✅ **user.model.js** - Uses supabase.db.config, result.rows
- ✅ **productImage.model.js** - Uses supabase.db.config, result.rows
- ✅ **order.model.js** - Uses supabase.db.config, result.rows

### 5. Application Files Updated
- ✅ **index.js** - Uses Supabase DB, PostgreSQL INFORMATION_SCHEMA
- ✅ **app.js** - Added /api/health with DB health check

---

## Manual Steps Required

### Step 1: Run Schema in Supabase
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `backend/database/supabase-schema.sql`
3. Run the SQL

### Step 2: Set Environment Variables
Add these to your backend environment:

```
env
# Supabase PostgreSQL Connection
SUPABASE_DB_URL=postgres://postgres:[YOUR_PASSWORD]@db.tntyfwpaxiyaovdiphql.supabase.co:6543/postgres

# Keep existing Railway vars for fallback during transition
DB_HOST=your-railway-host
DB_USER=your-railway-user
DB_PASSWORD=your-railway-password
DB_NAME=your-railway-db
DB_PORT=3306
```

### Step 3: Update Remaining Files (if needed)
The following files still use old MySQL config and may need updates:
- paymentService.js
- paymentRoutes.js  
- reviews.controller.js
- variants.controller.js
- Other controller files

For these files, you can either:
1. Update them to use `require('../config/supabase.db.config')`
2. Or use `require('../config/db.compat')` for MySQL-style compatibility

---

## Key Changes Summary

| MySQL | PostgreSQL |
|-------|------------|
| `mysql2` driver | `pg` driver |
| `?` placeholders | `$1, $2...` |
| `result[0].insertId` | `result.rows[0].id` |
| `result[0].affectedRows` | `result.rowCount` |
| `JSON_ARRAYAGG` | `JSON_AGG` |
| `AUTO_INCREMENT` | `SERIAL` |
| `BOOLEAN` | `BOOLEAN` (unchanged) |
| `TIMESTAMP(6)` | `TIMESTAMP` |
| `INFORMATION_SCHEMA` | `information_schema` |

---

## Testing the Migration

1. After running schema in Supabase
2. Start backend: `npm start`
3. Test health: `GET /api/health`
4. Test products: `GET /api/products/with-images/all`

---

## Rollback Plan

If issues occur:
1. Keep Railway MySQL instance running
2. Revert environment variables to Railway config
3. The old `db.config.js` and `db.pool.js` are still available

---

## Next Steps After Migration

1. ✅ Data Migration (export CSV from MySQL, import to PostgreSQL)
2. ✅ Test all API endpoints
3. ✅ Monitor for 500 errors
4. ✅ Configure RLS policies in Supabase dashboard
5. ✅ Remove Railway MySQL when stable
