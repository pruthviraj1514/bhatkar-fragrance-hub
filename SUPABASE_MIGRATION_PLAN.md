# Supabase PostgreSQL Migration Plan

## 1. MIGRATION COMPATIBILITY REPORT

### Current MySQL Database Summary

| Component | Current (MySQL) | Required (PostgreSQL) |
|-----------|----------------|----------------------|
| **Driver** | mysql2/promise | pg |
| **Pool** | mysql2 createPool | pg Pool |
| **Auto Increment** | AUTO_INCREMENT | SERIAL |
| **Boolean** | BOOLEAN, TINYINT(1) | BOOLEAN |
| **Timestamp** | TIMESTAMP(6) | TIMESTAMP |
| **Placeholder** | ? | $1, $2... |
| **Insert ID** | result[0].insertId | result.rows[0].id |

### Tables to Migrate

1. **users** - User authentication
2. **products** - Product catalog  
3. **product_images** - Product images
4. **orders** - Order tracking
5. **product_variants** - Product variants
6. **reviews** - Product reviews

---

## 2. POSTGRESQL SCHEMA CONVERSION

### Converted Schema Files (PostgreSQL Compatible)

```
products → SERIAL PRIMARY KEY, BOOLEAN, TIMESTAMP
users → SERIAL PRIMARY KEY, TIMESTAMP  
product_images → SERIAL PRIMARY KEY, BOOLEAN, FK references
orders → SERIAL PRIMARY KEY, TIMESTAMP
product_variants → SERIAL PRIMARY KEY, BOOLEAN, TIMESTAMP
reviews → SERIAL PRIMARY KEY, BOOLEAN, TIMESTAMP
```

### Key Changes:
- AUTO_INCREMENT → SERIAL
- BOOLEAN (unchanged, but ensure not TINYINT)
- TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) → TIMESTAMP DEFAULT NOW()
- ENUM preserved as CHECK constraints or VARCHAR
- JSON_ARRAYAGG → PostgreSQL JSON_AGG or array_agg

---

## 3. FILES TO MODIFY

### Core Database Files:
1. `backend/src/config/db.config.js` - Replace mysql2 with pg Pool
2. `backend/src/config/db.pool.js` - Update to PostgreSQL pool
3. `backend/src/database/products.queries.js` - $1 placeholders, RETURNING id
4. `backend/src/database/queries.js` - $1 placeholders, RETURNING id
5. `backend/src/database/productImages.queries.js` - PostgreSQL JSON syntax
6. `backend/src/database/orders.queries.js` - $1 placeholders

### Model Files (for insertId handling):
7. `backend/src/models/product.model.js` - result.rows[0].id
8. `backend/src/models/user.model.js` - result.rows[0].id
9. `backend/src/models/productImage.model.js` - result.rows[0].id

### Index/Migration Files:
10. `backend/src/index.js` - INFORMATION_SCHEMA → pg_catalog

---

## 4. CONNECTION STRING FORMAT

```
PostgreSQL Connection (Supabase Pooler - Port 6543):
postgres://postgres:[PASSWORD]@db.tntyfwpaxiyaovdiphql.supabase.co:6543/postgres

Direct Connection (Port 5432):
postgres://postgres:[PASSWORD]@db.tntyfwpaxiyaovdiphql.supabase.co:5432/postgres
```

---

## 5. IMPLEMENTATION STEPS

### Step 1: Install pg driver
```
bash
cd backend && npm install pg
```

### Step 2: Create PostgreSQL connection file
### Step 3: Update all query files
### Step 4: Update model files for RETURNING clause
### Step 5: Update index.js migrations
### Step 6: Add health check endpoint
### Step 7: Configure RLS policies (via Supabase dashboard)

---

## 6. EXPECTED MIGRATION RESULT

- ✅ Stable PostgreSQL connections via pooler
- ✅ All API routes functional
- ✅ insertId replaced with returning id
- ✅ ? placeholders replaced with $1, $2...
- ✅ Health check endpoint /api/health
- ✅ RLS policies for security
