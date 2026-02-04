# 🚀 Quick Start - Image Format Fix

## TL;DR - 3 Simple Steps

### ✅ Step 1: Run Migration (2 minutes)
```bash
cd backend
node src/database/scripts/addImageFormatColumn.js
```
**What it does**: Adds `image_format` column to database

### ✅ Step 2: Restart Servers (1 minute)
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2  
npm run dev
```

### ✅ Step 3: Clear Cache & Test (1 minute)
- Hard refresh: `Ctrl+F5`
- Go to `/shop`
- Click product → Images should load ✅

---

## Verify It Worked

### Check 1: Database
```bash
node backend/src/database/scripts/verifyImageFormat.js
```
Look for: ✅ image_format column exists

### Check 2: Frontend
- Open browser console (F12)
- Go to product page
- Check Network tab for image requests
- Images should load with proper format

### Check 3: API
```bash
curl http://localhost:3000/api/products/1/with-images
```
Look for: `"image_format": "png"` in response

---

## Supported Formats

| Format | Works | Example |
|--------|-------|---------|
| JPG/JPEG | ✅ | `image.jpg` |
| PNG | ✅ | `image.png` |
| GIF | ✅ | `image.gif` |
| WebP | ✅ | `image.webp` |

---

## If Images Still Don't Show

**Try in order:**
1. ✅ Hard refresh: `Ctrl+F5`
2. ✅ Check URL: Ends with `.jpg`, `.png`, etc?
3. ✅ Restart backend: `npm run dev`
4. ✅ Check logs for errors
5. ✅ Clear browser cache completely

---

## Files Changed

**Backend** (Updated for image_format):
- ✅ `backend/src/database/productImages.queries.js`
- ✅ `backend/src/models/productImage.model.js`
- ✅ `backend/src/controllers/productImage.controller.js`

**Frontend** (Interface updated):
- ✅ `src/components/products/ProductImageCarousel.tsx`
- ✅ `src/pages/ProductDetailWithImages.tsx`

**New Scripts**:
- ✅ `backend/src/database/scripts/addImageFormatColumn.js`
- ✅ `backend/src/database/scripts/verifyImageFormat.js`

---

## Need Help?

- 📖 Read: `IMAGE_FORMAT_UPDATE.md` (detailed guide)
- 📋 Read: `IMAGE_FORMAT_IMPLEMENTATION.md` (full specs)
- 🔧 Run: `setup-image-format.bat` (Windows)
- 🔧 Run: `setup-image-format.sh` (Linux/Mac)

---

**Questions?** Check the detailed docs! 🎉
