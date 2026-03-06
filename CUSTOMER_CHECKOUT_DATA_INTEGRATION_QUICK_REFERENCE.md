# Customer Checkout Data Integration - Quick Reference

## What Changed?

Customer shipping information captured during checkout is now used for shipment creation instead of hardcoded company address.

## Key Files Modified

| File | Change | Purpose |
|------|--------|---------|
| src/pages/Checkout.tsx | Added `shippingData={formData}` prop | Pass form data to payment component |
| src/components/CheckoutPayment.tsx | Added ShippingData interface + formatPhoneFor10Digits() | Send customer data + format phone |
| backend/src/controllers/paymentController.js | Extract shippingData from request | Forward to payment service |
| backend/src/services/paymentService.js | Accept and store shippingData | Save customer data in orders table |
| backend/src/controllers/shipment.controller.js | Use orders table data | Build Shiprocket payload with real customer info |
| backend/src/database/migrations/005_add_shipping_fields.js | Added first_name, last_name columns | Store customer names |
| backend/src/database/startupMigrations.js | Added first_name, last_name to auto-migration | Auto-add columns on startup |

## Database Schema

```sql
-- New columns added to orders table:
first_name VARCHAR(100)           -- Customer's first name
last_name VARCHAR(100)            -- Customer's last name
shipping_address TEXT             -- Customer's street address
shipping_city VARCHAR(100)        -- Customer's city
shipping_state VARCHAR(100)       -- Customer's state
shipping_pincode VARCHAR(10)      -- Customer's ZIP code
shipping_phone VARCHAR(20)        -- Customer's phone (10-digit)
```

## Phone Format Handling

```
INPUT (UI):           "+91 93596 87277"  (12 digits + prefix + spaces)
PROCESSING:           formatPhoneFor10Digits()
STORAGE:              "9359687277"       (10 digits only)
SHIPROCKET PAYLOAD:   "9359687277"       (10 digits only)
```

## Data Flow (Simplified)

```
Checkout Form
    ↓
CheckoutPayment Component (format phone: 12→10 digits)
    ↓
POST /api/payment/create-order { items, contact, shippingData }
    ↓
Payment Service (store all data in orders table)
    ↓
Payment Verified (status: PENDING → PAID)
    ↓
Webhook: Create Shipment
    ↓
Shipment Controller (fetch data from orders table)
    ↓
Build Shiprocket Payload (use customer data instead of hardcoded)
    ↓
Shiprocket API (creates shipment with real customer address)
```

## Quick Testing

### 1. Check Frontend Communications
```javascript
// In browser DevTools Console:
// During checkout, watch Network tab:
// POST /api/payment/create-order
// Should include:
// {
//   "shippingData": {
//     "firstName": "...",
//     "lastName": "...",
//     "address": "...",
//     "phone": "9359687277"  // 10 digits, no prefix
//   }
// }
```

### 2. Check Database Storage
```sql
-- After successful payment:
SELECT first_name, last_name, shipping_address, shipping_city, 
       shipping_state, shipping_pincode, shipping_phone 
FROM orders 
WHERE id = <order_id>;

-- Expected output:
first_name     | John
last_name      | Doe
shipping_address | 123 Main St
shipping_city  | Mumbai
shipping_state | Maharashtra
shipping_pincode | 400001
shipping_phone | 9359687277
```

### 3. Check Backend Logs
```
Look for messages in server logs:
"[Shipment] Using customer shipping info: John Doe, 123 Main St, Mumbai"
```

### 4. Verify Shiprocket Payload
```
Server logs should show:
{
  "shipping_customer_name": "John",      // ✓ Real customer name (not "Bhatkar")
  "shipping_address": "123 Main St",     // ✓ Real address (not "Anderi")
  "shipping_city": "Mumbai",             // ✓ Real city (not hardcoded)
  "shipping_phone": "9359687277"         // ✓ Formatted to 10 digits
}
```

## Common Issues & Fixes

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Phone format wrong in DB | formatPhoneFor10Digits not called | Check CheckoutPayment.tsx line 130 |
| Shipping data empty | shippingData not passed to CheckoutPayment | Check Checkout.tsx line 350 |
| Payments failing | Missing shippingData parameter | Check API payload structure |
| Columns missing in DB | Migration not run | Restart server for auto-migration |
| Shiprocket still hardcoded | shipmentController using old code | Check controller is using order.first_name |

## Verification Checklist

- [ ] Phone input in checkout shows "+91 98765 43210" placeholder
- [ ] Phone stored in DB as 10 digits (e.g., "9359687277")
- [ ] First name appears in orders.first_name column
- [ ] Shipping address appears in orders.shipping_address column
- [ ] Shiprocket payload logs show real customer name (not "Bhatkar")
- [ ] Shiprocket payload shows real address (not "Anderi, Mumbai")
- [ ] No 422 validation errors from Shiprocket API
- [ ] AWB code is generated and stored in orders.awb_code

## Rollback (if needed)

All changes are forward-compatible. If rollback is needed:

1. **Frontend:**
   - Revert Checkout.tsx & CheckoutPayment.tsx changes
   - Remove shippingData prop

2. **Backend:**
   - Revert paymentController & paymentService changes
   - All new database columns are optional (IF NOT EXISTS)

3. **Database:**
   - New columns remain but unused
   - No data loss occurs

## Next Steps

1. Deploy to staging
2. Run end-to-end test order
3. Verify in database
4. Check Shiprocket dashboard
5. Confirm AWB is generated
6. Deploy to production

## Support

For issues, check:
1. CUSTOMER_CHECKOUT_DATA_INTEGRATION.md (full documentation)
2. Backend logs: `docker logs <container>`
3. Database: `psql <connection_string>`
4. Shiprocket dashboard: https://app.shiprocket.in
