# ✅ Product Unique IDs & Image Visibility Guide

## Overview

Your system should have:
- ✅ Each product with **unique product_id**
- ✅ Each product can have **1-4 images**
- ✅ Each image is **linked to exactly one product**
- ✅ Customers see **only that product's images**

---

## Testing Product IDs & Visibility

### Quick Test

Run these commands to verify everything is set up correctly:

```bash
# Test 1: Verify unique product IDs
node test-product-ids-visibility.mjs

# Test 2: Verify carousel display
node test-carousel-display.mjs
```

---

## What the System Checks

### Test 1: Product Unique IDs Verification
```
✅ All product IDs are UNIQUE
   Total products: X
   Unique IDs: X
   (No duplicates)
```

### Test 2: Image-Product Linking
```
✅ Product-Image Relationships
   - Product 1: 0 images
   - Product 2: 4 images
   - Product 3: 2 images
   - etc...
```

### Test 3: Individual Product Visibility
```
✅ Each product returns its own images
   - GET /products/1/with-images → Product 1 images only
   - GET /products/2/with-images → Product 2 images only
   - GET /products/3/with-images → Product 3 images only
```

### Test 4: Image Data Structure
```
✅ Each image has required fields:
   - id: Unique image ID
   - product_id: Which product it belongs to
   - image_url: Cloudinary URL
   - image_format: jpg/png/gif
   - alt_text: Description
   - image_order: Display order (1-4)
   - is_thumbnail: If it's the main image
```

### Test 5: Product-Image Relationships
```
✅ All images correctly linked to their product
   - Every image has correct product_id
   - product_id matches the product that contains it
   - No image is linked to wrong product
```

### Test 6: Carousel Display
```
✅ Carousel ready for each product
   - Products with images: X/Y
   - Products without images: Y-X
   - All images have URLs: ✅
   - Images are Cloudinary format: ✅
```

---

## Database Schema Verification

### Products Table
```sql
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,  ← Unique product ID
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(255),
  price DECIMAL(10, 2),
  category VARCHAR(50),
  concentration VARCHAR(50),
  description TEXT,
  stock INT,
  created_on TIMESTAMP
);
```

**Example:**
```
ID | Name                | Brand    | Price
1  | Lavender Dreams    | Guerlain | 5000
2  | Rose Perfume       | Chanel   | 6000
3  | Ocean Breeze       | Dior     | 5500
```

### Product Images Table
```sql
CREATE TABLE product_images (
  id INT PRIMARY KEY AUTO_INCREMENT,        ← Unique image ID
  product_id INT NOT NULL,                  ← Links to product
  image_url VARCHAR(500) NOT NULL,          ← Cloudinary URL
  image_format VARCHAR(50),
  alt_text VARCHAR(255),
  image_order INT,                          ← Display order (1-4)
  is_thumbnail BOOLEAN,                     ← Main image
  created_on TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

**Example:**
```
ID | product_id | image_url                          | image_order
1  | 2          | https://res.cloudinary.com/...     | 1
2  | 2          | https://res.cloudinary.com/...     | 2
3  | 2          | https://res.cloudinary.com/...     | 3
4  | 3          | https://res.cloudinary.com/...     | 1
5  | 3          | https://res.cloudinary.com/...     | 2
```

**Key Points:**
- ✅ product_id (1,2,3) links to products table
- ✅ Each product_id can have multiple images (1-4)
- ✅ image_order ensures correct display order
- ✅ is_thumbnail marks the main carousel image

---

## How Visibility Works

### When Customer Views /product/2

```
Frontend Request
  ↓
GET /api/products/2/with-images
  ↓
Backend Query
  SELECT p.*, 
         JSON_ARRAYAGG(pi.*) as images
  FROM products p
  LEFT JOIN product_images pi ON p.id = pi.product_id
  WHERE p.id = 2    ← Filter by product_id
  ↓
Returns ONLY Product 2 + Its Images
  ✅ Product 2 details
  ✅ Images linked to product_id = 2
  ❌ NOT images from other products
  ↓
Frontend Carousel
  Displays images specific to Product 2
```

---

## Example Data Flow

### Product 2 (Rose Perfume)

**Database Records:**

```
Products Table:
┌─────────────────────────────────────┐
│ ID | Name            | Price       │
├─────────────────────────────────────┤
│ 2  | Rose Perfume    | 6000        │
└─────────────────────────────────────┘

Product_Images Table:
┌────────────────────────────────────────────────────┐
│ ID | product_id | image_url          | image_order │
├────────────────────────────────────────────────────┤
│ 1  | 2          | https://res...1.jpg│ 1           │
│ 2  | 2          | https://res...2.jpg│ 2           │
│ 3  | 2          | https://res...3.jpg│ 3           │
│ 4  | 2          | https://res...4.jpg│ 4           │
└────────────────────────────────────────────────────┘
```

**API Response:**
```json
{
  "status": "success",
  "data": {
    "id": 2,
    "name": "Rose Perfume",
    "price": 6000,
    "images": [
      {
        "id": 1,
        "product_id": 2,
        "image_url": "https://res.cloudinary.com/.../product-2-1.jpg",
        "image_order": 1,
        "is_thumbnail": true
      },
      {
        "id": 2,
        "product_id": 2,
        "image_url": "https://res.cloudinary.com/.../product-2-2.jpg",
        "image_order": 2,
        "is_thumbnail": false
      },
      // ... more images
    ]
  }
}
```

**Frontend Carousel:**
- ✅ Shows Product 2 name
- ✅ Displays 4 images from product_images table
- ✅ All 4 images have product_id = 2
- ✅ Images ordered by image_order (1, 2, 3, 4)
- ✅ NO images from Product 1 or 3

---

## Verification Checklist

### ✅ Product IDs

Run: `node test-product-ids-visibility.mjs`

**Expected Output:**
```
✅ All product IDs are UNIQUE
✅ Products with images: X/Y
✅ Image-Product linking: CORRECT
✅ Data structure: VALID
```

### ✅ Carousel Display

Run: `node test-carousel-display.mjs`

**Expected Output:**
```
✅ Product 1: X images
✅ Product 2: X images
✅ Product 3: X images
   - Will display: YES
   - All URLs present: YES
   - Are Cloudinary: YES
```

### ✅ Manual Testing

1. **Go to product page**
   ```
   https://your-frontend.com/product/2
   ```

2. **Verify:**
   - ✅ Page shows "Rose Perfume" (Product 2)
   - ✅ Carousel displays images
   - ✅ Only Product 2's images shown
   - ✅ Can scroll left/right (if >4 images)

3. **Go to different product**
   ```
   https://your-frontend.com/product/3
   ```

4. **Verify:**
   - ✅ Page shows different product name
   - ✅ Different images displayed
   - ✅ Product 2's images are NOT shown
   - ✅ Only Product 3's images shown

---

## Troubleshooting

### Issue: Product 2 shows images from Product 3

**Symptoms:**
- Product ID is correct
- But carousel shows wrong images

**Diagnosis:**
```bash
node test-product-ids-visibility.mjs
```

Look for:
- ❌ Image product_id doesn't match product ID

**Fix:**
- Images linked to wrong product
- Need to fix product_images.product_id values
- Or re-upload images to correct product

---

### Issue: Product doesn't show any images

**Symptoms:**
- Product exists
- Carousel shows "No images available"

**Diagnosis:**
```bash
node test-carousel-display.mjs
```

Look for:
- Product in list with "NO IMAGES"

**Fix:**
1. Go to Admin → Products
2. Click "Images" button
3. Upload 1-4 images
4. Wait for "Upload successful"
5. Refresh product page

---

### Issue: Images show but product ID is wrong

**Symptoms:**
- Images are correct Cloudinary URLs
- But API shows wrong product_id

**Diagnosis:**
```bash
node test-carousel-display.mjs
```

Look for images with wrong product_id

**Fix:**
- Database issue with product_images table
- May need to update product_id values
- Or clear and re-upload

---

## Expected Behavior

### ✅ Correct System

```
Product Page 1: Shows Product 1 images only
Product Page 2: Shows Product 2 images only
Product Page 3: Shows Product 3 images only
...
Product Page N: Shows Product N images only

Each product sees ONLY its own images
```

### ❌ Incorrect System

```
Product Page 1: Shows all images mixed
Product Page 2: Shows Product 1 images
Product Page 3: Shows Product 3 + Product 2 images
...
Images are wrong or duplicated
```

---

## Testing Commands

```bash
# Verify product unique IDs
node test-product-ids-visibility.mjs

# Verify carousel display works
node test-carousel-display.mjs

# Check database images
node backend/test-db-images.mjs

# Check Cloudinary images
cd backend && node test-cloudinary-upload.mjs
```

---

## Success Indicators

✅ **System Working When:**

1. Each product has unique ID
2. Each product can have 1-4 images
3. Images are linked to correct product only
4. Customers see only their product's images
5. Carousel displays correctly
6. All images are Cloudinary URLs
7. No cross-product image visibility

---

**Last Updated:** 2025-02-05  
**Status:** Ready for Verification
