# Product Image Upload Feature - Admin Documentation

## Overview

The product management form now includes **integrated image upload functionality**. Admin users can add, edit, and manage product images directly from the "Add New Product" or "Edit Product" dialog.

---

## Features

### ✅ What's Included

1. **Image URL Input** - Add images via HTTPS URLs (no file upload needed)
2. **Alt Text** - Add descriptive text for accessibility and SEO
3. **Multiple Images** - Support for 1-4 images per product
4. **Thumbnail Selection** - Mark one image as the primary thumbnail
5. **Live Preview** - See all added images with edit/delete options
6. **Automatic Saving** - Images are saved to `product_images` table automatically
7. **Edit Existing** - Load and modify images when editing a product

---

## How to Use

### Adding a New Product with Images

#### Step 1: Open the "Add Product" Form
- Go to **Admin → Products**
- Click the **"Add Product"** button

#### Step 2: Fill Basic Information
```
Product Name *:     Dior Sauvage
Brand *:            Christian Dior
Price (₹) *:        8,500.00
Category *:         Men
Concentration *:    EDP (Eau de Parfum)
Stock:              15
Description:        A fresh, spicy fragrance for modern men...
```

#### Step 3: Add Images
Scroll down to the **"Product Images (Max 4)"** section:

1. **Paste Image URL** in the "Image URL *" field
   ```
   https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500&h=500
   ```

2. **Add Alt Text** (optional but recommended)
   ```
   Dior Sauvage perfume bottle front view
   ```

3. Click **"Add Image"** button

4. **Repeat** for additional images (up to 4 total)

#### Step 4: Set Thumbnail
- Click the **"Thumb"** button on one image to make it the primary thumbnail
- First image is automatically set as thumbnail by default

#### Step 5: Save
Click **"Add Product"** - Images will be saved automatically

---

## Image Upload Tips

### Recommended Image Sources

#### Free Stock Photo Sites
- **Unsplash** - https://unsplash.com
  - Perfume/Product photos: Search "fragrance", "bottle", "parfum"
  - Example: `https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500&h=500`

- **Pexels** - https://pexels.com
  - Free stock photos with CC0 license
  - Product category available

- **Pixabay** - https://pixabay.com
  - Free images for commercial use
  - Good for product photography

#### Professional CDN Services
- **Cloudinary** - https://cloudinary.com
  - Image hosting and optimization
  - Free tier available
  - Automatic resizing and compression

- **ImgBB** - https://imgbb.com
  - Free image hosting
  - Simple URL sharing
  - No registration required

### Image URL Guidelines

✅ **Do's:**
- Use **HTTPS** URLs only (not HTTP)
- Use **high-quality** images (minimum 500x500px)
- Compress images (under 500KB recommended)
- Use **descriptive alt text** for SEO
- Keep image aspect ratio **square or portrait** (1:1 or 4:5)

❌ **Don'ts:**
- Don't use HTTP (insecure)
- Don't upload extremely large files
- Don't use broken or temporary links
- Don't skip alt text for accessibility
- Avoid overly small images (< 300px)

---

## Example Workflows

### Workflow 1: Add New Product with 4 Images

```
1. Click "Add Product"
2. Fill form:
   - Name: Chanel No. 5
   - Brand: Chanel
   - Price: 12,000
   - Category: Women
   - Concentration: EDP
   - Stock: 20
   
3. Add Images:
   - Image 1: https://images.unsplash.com/photo-1...?w=500 | "Front view" | ✓ Thumb
   - Image 2: https://images.unsplash.com/photo-2...?w=500 | "Side view"
   - Image 3: https://images.unsplash.com/photo-3...?w=500 | "Top view"
   - Image 4: https://images.unsplash.com/photo-4...?w=500 | "Packaging"
   
4. Click "Add Product"
5. Images automatically saved to database
```

### Workflow 2: Edit Existing Product Images

```
1. Go to Products table
2. Click "Edit" on a product
3. Dialog opens with existing product data
4. Existing images are loaded automatically
5. You can:
   - Delete existing images (X button)
   - Set new thumbnail
   - Add more images (if less than 4)
6. Click "Update Product"
```

### Workflow 3: Replace Product Images

```
1. Click "Edit" on product
2. Delete existing images (X button on each)
3. Add new images:
   - Image 1: New main product image
   - Image 2: Product in use
   - Image 3: Close-up detail
   - Image 4: Packaging/Box
4. Set Image 1 as thumbnail
5. Click "Update Product"
```

---

## Customer View

### How Customers See Product Images

Once images are added and saved, customers see them in:

#### 1. **Product Detail Page** (`/product/:id`)
- **Main Image Display**: Large product image with counter (e.g., "1 / 4")
- **Carousel Navigation**: 
  - Left/Right arrows for scrolling
  - Click thumbnail to change main image
  - 3-4 thumbnails visible at once
  - Thumbnail marked as primary image

#### 2. **Product Listing** (if carousel added)
- Product grid view with images
- First image (thumbnail) displayed
- Click to view full product details

#### 3. **Login Protected**
- Images only visible after customer logs in
- Encourages user registration
- Improves engagement

---

## Database Structure

### product_images Table

```sql
CREATE TABLE product_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  image_order INT NOT NULL DEFAULT 0,
  is_thumbnail BOOLEAN DEFAULT FALSE,
  created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  INDEX idx_image_order (product_id, image_order)
) ENGINE=InnoDB;
```

**Key Features:**
- **image_order**: Controls display order (1-4)
- **is_thumbnail**: Marks primary image for listings
- **CASCADE DELETE**: Deletes images when product is deleted
- **Indexed**: Fast queries for product images

---

## API Integration

### Backend Endpoints Used

#### Add Images
```
POST /api/products/:productId/images
Authorization: Bearer <admin_token>

Request Body:
{
  "images": [
    {
      "imageUrl": "https://...",
      "altText": "Product front",
      "imageOrder": 1,
      "isThumbnail": true
    }
  ]
}

Response: 201 Created with image data
```

#### Get Product Images
```
GET /api/products/:productId/images

Response: 200 with images array
```

#### Update Image
```
PUT /api/products/:productId/images/:imageId
Authorization: Bearer <admin_token>

Request: Updated image data
Response: 200 with updated image
```

#### Delete Image
```
DELETE /api/products/:productId/images/:imageId
Authorization: Bearer <admin_token>

Response: 200 success
```

---

## Troubleshooting

### Issue: "Maximum 4 images per product"
**Solution:** Delete some images before adding more. The form only accepts URLs, not file uploads.

### Issue: Image URL shows error
**Cause:** URL might be:
- HTTP (not HTTPS)
- Broken/expired link
- Not a valid image URL

**Solution:** 
- Verify URL is HTTPS
- Test URL in browser first
- Use a reliable CDN or image hosting service

### Issue: Images not showing for customers
**Checks:**
1. Verify images were saved (see images list in edit form)
2. Check database: `SELECT * FROM product_images WHERE product_id = ?`
3. Verify image URLs are still valid
4. Ensure customer is logged in (images only show after login)

### Issue: Thumbnail not switching
**Solution:** Click the "✓ Thumb" button to mark a different image as thumbnail

---

## Best Practices

### 1. Image Quality
- Use **high-resolution** images (500x500px minimum)
- Compress with tools like **TinyPNG** or **ImageOptim**
- Maintain **consistent aspect ratio** across images

### 2. Image Organization
- **Image 1**: Product front/main view (thumbnail)
- **Image 2**: Product side or alternative angle
- **Image 3**: Product in context or close-up
- **Image 4**: Packaging or lifestyle shot

### 3. Alt Text Best Practices
```
Good:     "Dior Sauvage 100ml EDP bottle, sleek silver design"
Bad:      "image1.jpg"
Bad:      "product"

Good:     "Perfume bottle from front angle showing brand logo"
Bad:      "bottle"
```

### 4. URL Management
- Keep a spreadsheet of used image URLs
- Use CDN URLs for better performance
- Test URLs before saving
- Keep backup images for popular products

---

## Advanced Features

### Bulk Image Upload (Future)
Currently, images are added individually via URL. Future updates may include:
- Drag-and-drop file upload
- Batch image upload
- Automatic image optimization
- Image gallery integration

### Image Optimization (Future)
- Automatic resizing
- Format conversion (WebP, etc.)
- Lazy loading
- CDN integration

---

## Security & Compliance

### Admin-Only Access
- Only admins can add/edit/delete images
- JWT authentication required
- Session token validated

### Image Validation
- URLs must be HTTPS
- File size limits enforced
- Invalid URLs rejected
- SQL injection prevented

### Data Protection
- Images stored in secure database
- Cascade delete when product removed
- Backup and recovery available

---

## Support & FAQ

### Q: Can customers upload images?
**A:** Currently no. Only admins can upload via URL. Customer-generated images may be added in future.

### Q: What image formats are supported?
**A:** Any format served over HTTPS (JPG, PNG, WebP, etc.). Customer browser handles rendering.

### Q: Can I use image file uploads?
**A:** Currently only URL inputs supported. For uploads, use a CDN first:
1. Upload to Cloudinary/ImgBB
2. Get HTTPS URL
3. Paste URL in form

### Q: How many images can one product have?
**A:** Maximum 4 images per product. This is enforced at database and API level.

### Q: Do images show to non-logged-in users?
**A:** No. Images only display on the carousel after customer login, encouraging registration.

### Q: Can I delete a single image?
**A:** Yes. Click the X button next to image in the edit form.

### Q: What happens if I delete a product?
**A:** All associated images are automatically deleted (CASCADE DELETE).

---

## Testing Checklist

- [ ] Add product with 1 image
- [ ] Add product with 4 images
- [ ] Try adding 5th image (should error)
- [ ] Edit existing product
- [ ] Load existing images
- [ ] Change thumbnail
- [ ] Delete and add images
- [ ] Verify in customer view (after login)
- [ ] Check carousel scrolling
- [ ] Test on mobile
- [ ] Verify alt text displays

---

## Related Documentation

- [Product Image System Guide](./PRODUCT_IMAGE_SYSTEM.md)
- [Product Image Testing](./PRODUCT_IMAGE_TESTING.md)
- [Integration Guide](./PRODUCT_IMAGE_INTEGRATION.md)
- [Quick Reference](./PRODUCT_IMAGE_QUICK_REFERENCE.md)

---

## Updates & Maintenance

**Last Updated:** February 4, 2026

**Version:** 1.0 - Admin Image Upload

**Status:** ✅ Production Ready

---

For issues or questions, refer to the troubleshooting section above or check the main documentation files.
