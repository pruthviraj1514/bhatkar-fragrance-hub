# Customer Checkout Data Integration for Shipment Creation

## Overview
This document describes how customer checkout information is captured, stored, and used for automatic shipment creation with Shiprocket.

**Previous State:** Hardcoded billing/shipping information (company address)
**Current State:** Real customer data from checkout form flows through payment → storage → shipment creation

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOMER CHECKOUT (Frontend)                 │
│  /src/pages/Checkout.tsx & /src/components/CheckoutPayment.tsx │
│                                                                  │
│  Collects:                                                       │
│  • Email                                                         │
│  • Phone (+91 prefix in UI, stored as 10 digits)               │
│  • First Name, Last Name                                        │
│  • Street Address                                               │
│  • City, State, ZIP Code                                        │
│  • Country                                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ sends POST /api/payment/create-order
                              │ { items, contact, shippingData }
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              PAYMENT SERVICE (Backend Processing)               │
│        /backend/src/services/paymentService.js                  │
│                                                                  │
│  • Validates products and calculates total                      │
│  • Creates Razorpay order                                       │
│  • Stores order + CUSTOMER DATA in orders table:                │
│    ├─ first_name (from checkout)                               │
│    ├─ last_name (from checkout)                                │
│    ├─ phone (10-digit format)                                  │
│    ├─ shipping_address (from checkout)                         │
│    ├─ shipping_city (from checkout)                            │
│    ├─ shipping_state (from checkout)                           │
│    ├─ shipping_pincode (from checkout)                         │
│    └─ shipping_phone (10-digit format)                         │
│                                                                  │
│  Status: PENDING (payment not yet verified)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Customer completes Razorpay payment
                              │ Backend verifies signature
                              │ Order status → PAID
                              │ Webhook triggers shipment creation
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│           SHIPMENT CREATION (Backend Processing)                │
│  /backend/src/controllers/shipment.controller.js                │
│                                                                  │
│  • Fetches order with all customer data from DB                 │
│  • Extracts shipping fields:                                    │
│    ├─ shippingCustomerName = first_name (customer checkout)    │
│    ├─ shippingLastName = last_name (customer checkout)         │
│    ├─ shippingAddress = shipping_address (customer checkout)   │
│    ├─ shippingCity = shipping_city (customer checkout)         │
│    ├─ shippingState = shipping_state (customer checkout)       │
│    └─ shippingPincode = shipping_pincode (customer checkout)   │
│                                                                  │
│  • Builds Shiprocket payload with REAL customer data:           │
│    ├─ billing = customer's provided info                       │
│    ├─ shipping = SAME AS BILLING (customer data)              │
│    └─ phone = formatted to 10 digits (Shiprocket requirement)  │
│                                                                  │
│  • Sends to Shiprocket API                                     │
│  • Stores tracking info in orders table:                        │
│    ├─ shiprocket_order_id                                      │
│    ├─ awb_code                                                 │
│    ├─ courier_name                                             │
│    └─ tracking_url                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Shiprocket creates shipment
                              │ Issues AWB number
                              │ Assigns courier
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│            SHIPMENT TRACKING (Customer Visibility)              │
│                                                                  │
│  Customer receives:                                             │
│  • Order confirmation email with shipment details               │
│  • AWB number for tracking                                      │
│  • Courier information                                          │
│  • Real shipment to their provided address                      │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema Changes

### Orders Table - New Columns
```sql
ALTER TABLE orders ADD COLUMN (
  first_name VARCHAR(100),           -- Customer's first name from checkout
  last_name VARCHAR(100),            -- Customer's last name from checkout
  phone VARCHAR(20),                 -- User's phone (fallback if checkout phone missing)
  shipping_address TEXT,             -- Customer's street address from checkout
  shipping_city VARCHAR(100),        -- Customer's city from checkout
  shipping_state VARCHAR(100),       -- Customer's state from checkout
  shipping_pincode VARCHAR(10),      -- Customer's ZIP code from checkout
  shipping_phone VARCHAR(20),        -- Customer's phone from checkout (10-digit format)
  shiprocket_order_id VARCHAR(255),  -- Shiprocket's order ID after shipment creation
  awb_code VARCHAR(255),             -- AWB number for tracking
  courier_name VARCHAR(255),         -- Courier company assigned
  tracking_url TEXT,                 -- Shiprocket tracking link
  shipment_status VARCHAR(100)       -- Current shipment status
);
```

### Migrations
- **005_add_shipping_fields.js** - Database migration file
- **backend/src/database/startupMigrations.js** - Auto-runs migration on server startup

## Phone Number Formatting

### Input (UI) - Checkout Form
```
Placeholder: "+91 98765 43210"
User enters: "+91 93596 87277" (with spaces and +91 prefix)
Max length: 12 digits + prefix + spaces
```

### Processing (Frontend) - CheckoutPayment Component
```javascript
formatPhoneFor10Digits(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');      // Remove all non-numeric
  return cleaned.slice(-10);                      // Take last 10 digits
}
```

### Example Conversions:
| Input | Output |
|-------|--------|
| +91 93596 87277 | 9359687277 |
| 9359687277 | 9359687277 |
| +919359687277 | 9359687277 |
| 919359687277 | 9359687277 |

### Output (Backend) - Storage & Shiprocket
```
Database: 9359687277 (stored as 10 digits)
Shiprocket API: 9359687277 (sent as 10 digits)
Reason: Shiprocket only accepts 10-digit numbers for India
```

## Code Changes Summary

### Frontend Changes

#### 1. Checkout.tsx (`/src/pages/Checkout.tsx`)
- **Added:** Pass `shippingData={formData}` to CheckoutPayment component
- **Effect:** Entire checkout form collected data is now sent to backend
- **Lines:** ~350

#### 2. CheckoutPayment.tsx (`/src/components/CheckoutPayment.tsx`)
- **Added:** ShippingData interface for type safety
- **Added:** `formatPhoneFor10Digits()` function to convert 12-digit input to 10-digit format
- **Updated:** API call to `/payment/create-order` now includes:
  ```javascript
  {
    items: [...],
    contact: formattedPhone,  // 10-digit format
    shippingData: {           // NEW: full checkout data
      firstName,
      lastName,
      email,
      phone: formattedPhone,
      address,
      city,
      state,
      zipCode,
      country
    }
  }
  ```
- **Effect:** Customer data flows from form to backend storage

### Backend Changes

#### 1. Payment Controller (`/backend/src/controllers/paymentController.js`)
- **Updated:** Extract `shippingData` from request body
- **Updated:** Pass `shippingData` to `paymentService.createOrder()`
- **Effect:** Customer data is now handled by payment service

#### 2. Payment Service (`/backend/src/services/paymentService.js`)
- **Updated:** Method signature to accept `shippingData` parameter
- **Updated:** INSERT statement includes shipping columns:
  ```javascript
  INSERT INTO orders (
    user_id, total_amount, razorpay_order_id, status, phone,
    first_name, last_name, shipping_address, shipping_city, 
    shipping_state, shipping_pincode, shipping_phone,
    created_at
  ) VALUES (...)
  ```
- **Effect:** Customer data stored in orders table for later retrieval

#### 3. Shipment Controller (`/backend/src/controllers/shipment.controller.js`)
- **Updated:** Extract customer shipping data from orders table:
  ```javascript
  const shippingCustomerName = order.first_name || 'Customer';
  const shippingLastName = order.last_name || 'Order';
  const shippingAddress = order.shipping_address || 'Address not provided';
  const shippingCity = order.shipping_city || 'Mumbai';
  const shippingPincode = order.shipping_pincode || '400001';
  const shippingState = order.shipping_state || 'Maharashtra';
  ```
- **Updated:** Shiprocket payload now uses customer data:
  ```javascript
  billing_customer_name: shippingCustomerName,      // From checkout
  shipping_customer_name: shippingCustomerName,     // From checkout
  shipping_address: shippingAddress,                // From checkout
  shipping_city: shippingCity,                      // From checkout
  shipping_pincode: shippingPincode,                // From checkout
  shipping_state: shippingState                     // From checkout
  ```
- **Effect:** Shiprocket receives real customer info instead of hardcoded values

#### 4. Database Migrations
- **Updated:** `005_add_shipping_fields.js` - Added first_name, last_name columns
- **Updated:** `startupMigrations.js` - Added columns to auto-migration list
- **Effect:** Database schema includes customer name and address fields

## API Endpoint Specifications

### POST /api/payment/create-order

**Request Body:**
```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ],
  "contact": "9359687277",
  "shippingData": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "9359687277",
    "address": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001",
    "country": "IN"
  }
}
```

**Response:**
```json
{
  "success": true,
  "orderId": 42,
  "razorpayOrderId": "order_IBJOvzinsVUccR",
  "amount": 825.00,
  "currency": "INR",
  "productName": "2 items"
}
```

## Testing Checklist

### Frontend Testing
- [ ] Checkout form displays with phone placeholder "+91 98765 43210"
- [ ] Phone input accepts numbers and +91 prefix
- [ ] Form validates all fields before payment
- [ ] Shipping address fields collect proper data

### Backend Payment Testing
- [ ] POST /api/payment/create-order receives shippingData
- [ ] Payment service stores first_name in orders table
- [ ] Payment service stores shipping_address in orders table
- [ ] Phone is stored as 10 digits (no +91 prefix)
- [ ] Order status updates from PENDING to PAID after payment

### Database Testing
- [ ] orders table has first_name column
- [ ] orders table has last_name column
- [ ] orders table has shipping_address column
- [ ] orders table has shipping_city, shipping_state, shipping_pincode columns
- [ ] Query returns all shipping fields: `SELECT first_name, last_name, shipping_address, ... FROM orders WHERE id = ?`

### Shipment Creation Testing
- [ ] Shipment controller fetches order with shipping data
- [ ] Shiprocket payload includes real customer name (not "Bhatkar")
- [ ] Shiprocket payload includes real customer address (not "Anderi, Mumbai")
- [ ] Phone is formatted to 10 digits in Shiprocket payload
- [ ] AWB code is retrieved and stored in orders table

### End-to-End Testing
1. **Create Order:**
   - Customer fills checkout form with their info
   - Phone: "+91 93596 87277"
   - Address: "123 Main St, Mumbai, Maharashtra, 400001"

2. **Verify Storage:**
   - Query orders table: `first_name` = "John"
   - Query orders table: `shipping_address` = "123 Main St"
   - Query orders table: `shipping_phone` = "9359687277"

3. **Verify Shipment:**
   - Check Shiprocket payload logs
   - shipping_customer_name should be "John" (not "Bhatkar")
   - shipping_address should be "123 Main St" (not "Anderi")
   - shipping_phone should be "9359687277"

## Troubleshooting

### Issue: Phone not formatting correctly
**Solution:** Check formatPhoneFor10Digits function in CheckoutPayment.tsx
```javascript
const formattedPhone = contactToUse ? formatPhoneFor10Digits(contactToUse) : null;
```

### Issue: Shipping data not reaching backend
**Solution:** Verify CheckoutPayment sending shippingData in POST body
```javascript
const orderPayload.shippingData = { ... }
```

### Issue: Columns missing in orders table
**Solution:** Manually run migration or restart server for auto-migration
```bash
# Manual migration:
npm run migrate

# Auto-migration runs on server startup
node backend/src/index.js
```

### Issue: Shiprocket still showing hardcoded address
**Solution:** Check shipping controller is extracting from order object
```javascript
const shippingAddress = order.shipping_address || 'Address not provided';
```

## Production Deployment Notes

1. **Database Migration:** The startupMigrations.js will automatically add columns on server startup
2. **No Downtime Required:** ADD COLUMN IF NOT EXISTS is safe for live databases
3. **Render Deployment:** Git push triggers auto-deployment and server restart
4. **Phone Format:** Already handled in frontend formatPhoneFor10Digits function

## Related Documentation
- [SHIPROCKET_INTEGRATION.md](./SHIPROCKET_INTEGRATION.md)
- [PRODUCT_IMAGE_SYSTEM.md](./PRODUCT_IMAGE_SYSTEM.md)
- [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md)
