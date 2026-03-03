## Payment Service Multi-Item Order Fix

### Root Cause Analysis
The payment service error was caused by a database schema mismatch:

**Error:** `null value in column "product_id" of relation "orders" violates not-null constraint`

**Root Issue:**
1. The `orders` table schema required `product_id` (NOT NULL) and expected a single product per order
2. The payment code (`paymentService.js`) was updated to handle **multiple items per order** 
3. However, the code was NOT inserting individual items into the database
4. This caused the database INSERT to fail because `product_id` column was NULL

### Solution Implemented

#### 1. **Database Schema Changes**
- Made `product_id` and `quantity` columns NULLABLE in the `orders` table
- Created a new `order_items` junction table to store individual items for each order
- Structure:
  ```
  orders (user_id, total_amount, razorpay_order_id, status, ...)
    ↓↓↓ (one-to-many relationship)
  order_items (order_id, product_id, quantity, price, subtotal)
  ```

#### 2. **Backend Service Updates**
Updated `paymentService.js` `createOrder()` method:
- After creating the order, it now inserts each item into the `order_items` table
- Stores product ID, quantity, price (at time of order), and subtotal for each item
- This allows proper tracking of multi-item orders

#### 3. **Startup Migrations**
Added automated migrations in `startupMigrations.js`:
- `createOrderItemsTable()` - Creates the new table if it doesn't exist
- `fixOrdersTableForMultiItemOrders()` - Makes columns nullable if needed
- These run automatically on server startup without manual intervention

### Files Modified

1. **backend/src/services/paymentService.js**
   - Added order_items insertion loop after order creation

2. **backend/src/database/startupMigrations.js**
   - Added `createOrderItemsTable()` function
   - Added `fixOrdersTableForMultiItemOrders()` function
   - Updated `runStartupMigrations()` to call these functions

3. **backend/src/database/razorpay_schema.sql**
   - Updated schema documentation
   - Changed product_id and quantity to nullable
   - Added order_items table definition

4. **backend/src/database/migrations/002_fix_multi_item_orders.js**
   - Standalone migration script (for reference)

### Deployment Steps

No manual steps required! The fix will apply automatically:

1. **Deploy the updated code** to your production environment (Render)
2. **Server startup** will automatically:
   - Create the `order_items` table (if it doesn't exist)
   - Make `product_id` and `quantity` nullable in orders table
   - Continue normally without any downtime

### Testing the Fix

After deployment, test the payment flow:

```bash
# 1. Add multiple items to cart (2+ items)
# 2. Click Checkout
# 3. Fill payment details
# 4. Complete payment

# Expected result:
# ✅ Order created successfully
# ✅ All items saved to order_items table
# ✅ Payment completes without "product_id null" errors
```

### Database Query Examples

```sql
-- Get order with all items
SELECT o.*, oi.product_id, oi.quantity, oi.price, oi.subtotal
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.id = 1;

-- Get total revenue (multi-item safe)
SELECT 
  SUM(o.total_amount) as revenue,
  COUNT(DISTINCT o.id) as order_count,
  COUNT(DISTINCT oi.product_id) as unique_products_sold
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.status = 'PAID';
```

### Backward Compatibility

✅ The fix is fully backward compatible:
- Existing single-item orders continue to work
- Old schema with `product_id` in orders table remains valid (just nullable now)
- New multi-item orders use the `order_items` table

### Monitoring

Watch your logs for migration messages:
```
🔄 Checking database schema...
  Creating order_items table...
  ✅ Created order_items table
  Making product_id and quantity nullable in orders table...
  ✅ Fixed orders table for multi-item support
✅ All startup migrations completed successfully
```

If you see any warnings instead of success messages, check your database configuration.

### Next Steps

Once deployment is complete and verified:
1. Accept cart payments with multiple items
2. Monitor order creation in your database
3. All items should appear in `order_items` table with correct product_id, quantity, and pricing
