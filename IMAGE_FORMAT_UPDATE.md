# Image Format Enhancement Guide

## Overview
This update adds a **`image_format`** column to the `product_images` table to properly track PNG, JPG, and other image formats. This ensures images are displayed correctly with proper MIME type handling.

## What Changed

### 1. Database Schema
- Added `image_format` VARCHAR(10) column to `product_images` table
- Column stores image format (jpg, png, gif, webp, etc.)
- Automatically extracted from image URL or manually specified

### 2. Backend Updates
- **Models**: `ProductImage` now includes `image_format` parameter
- **Queries**: All queries updated to select/insert `image_format`
- **Controller**: `addProductImages` extracts and saves image format

### 3. Frontend Updates
- **ProductImageCarousel**: Updated interface to include `image_format`
- **ProductDetailWithImages**: Updated interface to include `image_format`

## Installation Steps

### Step 1: Run Database Migration
```bash
# From backend directory
node src/database/scripts/addImageFormatColumn.js
```

This script:
- Checks if `image_format` column exists
- Adds it if missing (sets default to 'jpg')
- Verifies the column structure

### Step 2: Restart Backend Server
```bash
# Backend
npm run dev
# or
bun run dev
```

### Step 3: Clear Frontend Cache
```bash
# Frontend
npm run dev
# or
bun run dev
```

## API Changes

### Add Product Images
**Endpoint**: `POST /api/products/{productId}/images`

**Request Body** (with optional image_format):
```json
{
  "images": [
    {
      "imageUrl": "https://example.com/image1.png",
      "imageFormat": "png",
      "altText": "Product front view",
      "imageOrder": 1,
      "isThumbnail": true
    },
    {
      "imageUrl": "https://example.com/image2.jpg",
      "imageFormat": "jpg",
      "altText": "Product side view",
      "imageOrder": 2,
      "isThumbnail": false
    }
  ]
}
```

**Note**: If `imageFormat` is not provided, it's automatically extracted from the URL extension.

### Get Product with Images
**Endpoint**: `GET /api/products/{productId}/with-images`

**Response**:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Premium Fragrance",
    "price": 99.99,
    "images": [
      {
        "id": 1,
        "image_url": "https://example.com/image1.png",
        "image_format": "png",
        "alt_text": "Product front view",
        "image_order": 1,
        "is_thumbnail": true
      }
    ]
  }
}
```

## Image Format Detection

The system automatically detects image format from URL:
- `image.jpg` → jpg
- `image.png` → png
- `image.gif` → gif
- `image.webp` → webp
- Default → jpg (if format cannot be detected)

## Benefits

1. ✅ Proper MIME type handling
2. ✅ Format validation for image uploads
3. ✅ Better image optimization options
4. ✅ Support for multiple image formats
5. ✅ Improved image compatibility

## Troubleshooting

### Images Still Not Visible?

1. **Check Database Column**:
   ```sql
   DESCRIBE product_images;
   ```
   Should show `image_format` column

2. **Check Image URLs**:
   - Ensure URLs are accessible
   - Verify format extension is in URL

3. **Clear Browser Cache**:
   - Hard refresh (Ctrl+F5 or Cmd+Shift+R)
   - Clear browser cache and cookies

4. **Check Backend Logs**:
   - Look for image-related errors
   - Verify API responses include `image_format`

## Migration for Existing Images

If you have existing images without `image_format`, they will automatically default to 'jpg'. To update them:

```sql
UPDATE product_images 
SET image_format = 'jpg' 
WHERE image_format IS NULL OR image_format = '';
```

For PNG images, manually update or re-upload:
```sql
UPDATE product_images 
SET image_format = 'png' 
WHERE image_url LIKE '%.png%';
```

## Next Steps

After implementing this update:

1. Re-upload product images with correct formats
2. Test image display across different products
3. Monitor image loading performance
4. Consider CDN optimization for images
