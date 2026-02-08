# Bhatkar Fragrance Hub - ML/Variant System Guide

## 🎯 Overview

The application now features a complete Amazon-style product variant system with:
- **ML/Size Variants**: Each product can have multiple size variants (50ml, 100ml, 250ml, etc.)
- **Variant-Specific Pricing**: Each variant has its own price
- **Variant Stock Management**: Individual inventory tracking per variant
- **Variant-Specific Images**: Different image galleries for each size variant
- **Dynamic UI**: Product detail page updates images, price, and stock based on selected variant

---

## 🗄️ Database Structure

### Tables

```sql
-- Products table (main product)
products (id, name, brand, price, stock, quantity_ml, quantity_unit, ...)

-- Variants table (each product can have multiple variants)
product_variants (id, product_id, variant_name, variant_value, variant_unit, price, stock, is_active)

-- Variant images (each variant can have multiple images)
variant_images (id, variant_id, image_url, alt_text, image_order, is_thumbnail)

-- Product images (fallback for variants without specific images)
product_images (id, product_id, image_url, alt_text, image_order, is_thumbnail)
```

### Key Relationships
```
Product
  ├── ProductVariants (1-to-many)
  │   ├── VariantImages (1-to-many)
  │   └── [Stock, Price per variant]
  └── ProductImages (Fallback)
```

---

## 🚀 Setup Instructions

### 1. Create Variant Images Table

```bash
cd backend
npm run tables:up  # If not already created
node src/database/scripts/createVariantImagesTable.js
```

### 2. Sync Existing Products to Variants

Ensure all products have at least one variant:

```bash
npm run sync:variants
```

This script:
- Creates a variant for each product using its base `quantity_ml` and `stock`
- Fixes any zero-stock variants by syncing from the product table
- Maintains data integrity

### 3. Migrate Frontend Assets

The frontend now supports variant images. No special migration needed, but ensure:
- Backend is running with new endpoints
- Database migrations are complete

---

## 📱 Frontend Flow (User Experience)

### Product Detail Page - Image-First Experience

```
User clicks product
    ↓
Page loads with first variant selected
    ↓
First variant's images displayed in gallery
    ↓
User clicks different size variant (e.g., 100ml → 250ml)
    ↓
Image gallery switches to 250ml images
Price updates
Stock updates
    ↓
User adjusts quantity
    ↓
Total price recalculates
    ↓
User adds to cart
```

### Code Flow

```typescript
// ProductDetail.tsx

// 1. Fetch product and variants
const [variants, setVariants] = useState([]);
const [selectedVariant, setSelectedVariant] = useState(null);

// 2. Load variant-specific images when variant changes
useEffect(() => {
  // Fetch from /variant-images/{variantId}
  // Falls back to product images if none found
  setVariantImages(response.data.data);
}, [selectedVariant?.id]);

// 3. Display correct images
const displayImages = variantImages.length > 0 
  ? variantImages.map(img => img.image_url)
  : product.images;

// 4. Update price and stock
const variantPrice = selectedVariant?.price ?? product?.price;
const availableStock = selectedVariant?.stock ?? product?.stock;
```

---

## 🔧 Admin Panel - Variant Management

### Creating Variants

1. Go to Admin → Products
2. Click "Create" or "Edit" a product
3. In the dialog, scroll to "Variants" section
4. Click "+ Add Variant"
5. Fill in:
   - **Variant Name**: e.g., "100ml"
   - **Variant Value**: e.g., "100"
   - **Unit**: e.g., "ml"
   - **Price**: e.g., "₹2,499"
   - **Stock**: e.g., "50"
6. Click "Add"

### Managing Variant Images

**Current limitation**: Images are managed at the product level. To enable per-variant image uploads:

1. Update variant management UI to include image upload section
2. Use `/api/variant-images/{variantId}` endpoint (POST)
3. Images automatically display when variant is selected

---

## 🔌 API Endpoints

### Products & Variants

```
GET  /api/products                          - Get all products
GET  /api/products/{id}/with-images         - Get product with images
GET  /api/variants/product/{productId}      - Get all variants for product
POST /api/variants/product/{productId}      - Create variant (admin)
PUT  /api/variants/{variantId}              - Update variant
DELETE /api/variants/{variantId}            - Delete variant

GET  /api/variant-images/{variantId}        - Get variant images
POST /api/variant-images/{variantId}        - Upload variant images (admin)
DELETE /api/variant-images/{imageId}        - Delete variant image
```

### Response Format

**GET /api/variants/product/1**
```json
{
  "status": "success",
  "data": [
    {
      "id": 5,
      "product_id": 1,
      "variant_name": "100ml",
      "variant_value": 100,
      "variant_unit": "ml",
      "price": 2499,
      "stock": 45,
      "is_active": 1
    },
    {
      "id": 6,
      "product_id": 1,
      "variant_name": "250ml",
      "variant_value": 250,
      "variant_unit": "ml",
      "price": 5999,
      "stock": 32,
      "is_active": 1
    }
  ]
}
```

**GET /api/variant-images/5**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "variant_id": 5,
      "image_url": "https://cdn.example.com/100ml-1.jpg",
      "alt_text": "100ml bottle front",
      "image_order": 1,
      "is_thumbnail": true
    }
  ],
  "total": 1
}
```

---

## 💾 Stock Synchronization

### How It Works

1. **Base Stock** (Product Level)
   - Default stock quantity if product has no variants
   - Used as fallback if variant has zero stock

2. **Variant Stock** (Size-Specific)
   - Individual stock per ML/size
   - Takes precedence over base stock
   - Shows in variant selection buttons

3. **Sync Migration**
   - Run `npm run sync:variants` to fix any zero-stock variants
   - Creates missing variants automatically
   - Maintains data integrity

### Stock Display in UI

ProductDetail page shows availability:
- 🟢 **Green**: >10 items available
- 🟡 **Yellow**: 4-10 items available
- 🟠 **Orange**: 1-3 items available (Low stock warning)
- 🔴 **Red**: Out of stock

---

## 🐛 Troubleshooting

### Variants Not Showing

```bash
# Check variant data
curl http://localhost:3000/api/variants/product/1

# If empty, sync variants
npm run sync:variants

# Check logs
node src/database/scripts/diagnosticVariants.js
```

### Images Not Switching on Variant Change

1. Ensure backend is running with new routes
2. Check browser console for errors
3. Verify variant images exist in database
4. If not, images fall back to product images (expected behavior)

### Stock Shows 0

1. Run sync migration: `npm run sync:variants`
2. Check database: `SELECT * FROM product_variants WHERE product_id = 1`
3. Manually update if needed: `UPDATE product_variants SET stock = 10 WHERE id = 1`

---

## 📈 Future Enhancements

- [ ] Per-variant image upload in admin UI
- [ ] Inventory tracking dashboard
- [ ] Low-stock alerts for admins
- [ ] Variant comparison view
- [ ] Bulk stock updates
- [ ] Auto-reorder system
- [ ] Variant ratings/reviews

---

## 🎨 UI Components Updated

- **ProductDetail**: Variant selection, image switching, price/stock updates
- **Admin Products Table**: Color-coded stock badges
- **Admin Variant Management**: Create/read/delete variants (in dialog)

---

## 📝 Database Queries

### Get all variants with images
```sql
SELECT pv.*, COUNT(vi.id) as image_count
FROM product_variants pv
LEFT JOIN variant_images vi ON pv.id = vi.variant_id
WHERE pv.product_id = 1
GROUP BY pv.id;
```

### Find products missing variants
```sql
SELECT id, name, quantity_ml, stock
FROM products
WHERE id NOT IN (SELECT DISTINCT product_id FROM product_variants);
```

### Check low stock variants
```sql
SELECT * FROM product_variants
WHERE stock <= 5 AND is_active = 1
ORDER BY stock ASC;
```

---

## 🔐 Admin Authentication

- Email: `admin@bhatkar.com`
- Password: `admin123`
- Variant management requires admin authentication

---

## ✅ Testing Checklist

- [ ] Create product with multiple variants
- [ ] Product detail shows variant selection buttons
- [ ] Clicking variant updates price
- [ ] Stock updates when variant changes
- [ ] Image gallery switches on variant change
- [ ] "Add to Cart" validates stock correctly
- [ ] Admin can see color-coded stock in product table
- [ ] Variants sync runs without errors

---

**Last Updated**: February 2026  
**Version**: 1.0 - Complete Variant System
