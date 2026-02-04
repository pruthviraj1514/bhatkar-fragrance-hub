# Product Management Form - Updated UI with Image Upload

## New Form Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Add New Product                                             │
│  Create a new fragrance product                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Product Name *                                              │
│  ┌────────────────────────────────────────────────────────┐│
│  │ e.g., Eau de Parfum Rose                              ││
│  └────────────────────────────────────────────────────────┘│
│                                                              │
│  Brand *                                                    │
│  ┌────────────────────────────────────────────────────────┐│
│  │ e.g., Guerlain                                         ││
│  └────────────────────────────────────────────────────────┘│
│                                                              │
│  Price (₹) *                                                │
│  ┌────────────────────────────────────────────────────────┐│
│  │ 0.00                                                   ││
│  └────────────────────────────────────────────────────────┘│
│                                                              │
│  Category *                                                 │
│  ┌────────────────────────────────────────────────────────┐│
│  │ Select category                                    ▼   ││
│  └────────────────────────────────────────────────────────┘│
│     ○ Men  ○ Women  ○ Unisex                               │
│                                                              │
│  Concentration *                                            │
│  ┌────────────────────────────────────────────────────────┐│
│  │ Select concentration                             ▼   ││
│  └────────────────────────────────────────────────────────┘│
│     ○ EDP ○ EDT ○ Parfum                                   │
│                                                              │
│  Stock                                                      │
│  ┌────────────────────────────────────────────────────────┐│
│  │ 0                                                      ││
│  └────────────────────────────────────────────────────────┘│
│                                                              │
│  Description                                                │
│  ┌────────────────────────────────────────────────────────┐│
│  │ Product description...                                 ││
│  │                                                        ││
│  │                                                        ││
│  └────────────────────────────────────────────────────────┘│
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Product Images (Max 4)                                     │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Image URL Input Section (NEW)                          ││
│  │ ┌──────────────────────────────────────────────────┐  ││
│  │ │ Image URL *                                      │  ││
│  │ │ https://example.com/image.jpg                  │  ││
│  │ │ 💡 Use HTTPS URLs (e.g., Unsplash,           │  ││
│  │ │    Cloudinary, or your image CDN)            │  ││
│  │ └──────────────────────────────────────────────────┘  ││
│  │                                                        ││
│  │ ┌──────────────────────────────────────────────────┐  ││
│  │ │ Alt Text                                         │  ││
│  │ │ e.g., Product front view                       │  ││
│  │ └──────────────────────────────────────────────────┘  ││
│  │                                                        ││
│  │ ┌──────────────────────────────────────────────────┐  ││
│  │ │ [⬆️  Upload] Add Image                           │  ││
│  │ └──────────────────────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  4 images added                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Product front view                                     ││
│  │ https://images.unsplash.com/photo-1495521... [Thumb]  ││
│  │                                                 ✓ Thumb ││
│  │                                                    [✕] ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ Product side view                                      ││
│  │ https://images.unsplash.com/photo-1505740... [Thumb]  ││
│  │                                                 Thumb   ││
│  │                                                    [✕] ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ Product detail                                         ││
│  │ https://images.unsplash.com/photo-1535632... [Thumb]  ││
│  │                                                 Thumb   ││
│  │                                                    [✕] ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ Product packaging                                      ││
│  │ https://images.unsplash.com/photo-1561181... [Thumb]  ││
│  │                                                 Thumb   ││
│  │                                                    [✕] ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌────────────────┬───────────────────────────────────────┐│
│  │   [Cancel]     │     [✓ Add Product]                 ││
│  └────────────────┴───────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Form Features

### Basic Product Information (Unchanged)
- **Product Name** - Required field
- **Brand** - Required field  
- **Price** - Required field, accepts decimals
- **Category** - Dropdown: Men, Women, Unisex
- **Concentration** - Dropdown: EDP, EDT, Parfum
- **Stock** - Number input
- **Description** - Text area for product details

### NEW: Product Images Section

#### Image Input Form
```
┌─────────────────────────────────────────┐
│ Image URL *                              │
│ [https://example.com/image.jpg--------]  │
│ 💡 Use HTTPS URLs (e.g., Unsplash...) │
│                                         │
│ Alt Text                                │
│ [e.g., Product front view-----------]  │
│                                         │
│ [⬆️  Upload] Add Image                  │
└─────────────────────────────────────────┘
```

**Input Fields:**
- **Image URL** (Required) - HTTPS image link
- **Alt Text** (Optional) - Accessibility text
- **Add Image** Button - Submits image to list

#### Images List
```
4 images added

[Image Preview Row]
├─ Product name/text truncated
├─ URL truncated (shows it's saved)
├─ [✓ Thumb] / [Thumb] - Set as thumbnail
└─ [✕] - Delete image
```

**Per-Image Controls:**
- **Thumbnail Button** - Click to set as primary image
  - Highlighted when selected: `[✓ Thumb]`
  - Unselected: `[Thumb]`
- **Delete Button** - Remove image from product
  - X icon button
  - Immediate removal

---

## User Interactions

### Adding an Image

```
1. User enters URL:
   https://images.unsplash.com/photo-1495521821757-a1efb6729352

2. User enters Alt Text (optional):
   "Dior Sauvage perfume bottle front"

3. Clicks [Add Image] button

4. Image appears in list:
   ┌──────────────────────────────────────┐
   │ Dior Sauvage perfume bottle front    │
   │ https://images.unsplash.com/...      │
   │ [✓ Thumb]        [✕]                │
   └──────────────────────────────────────┘

5. Can add up to 4 images total
```

### Setting Thumbnail

```
Initial State (First image auto-selected):
│ Image 1: [✓ Thumb]  [✕]
│ Image 2: [Thumb]    [✕]
│ Image 3: [Thumb]    [✕]
│ Image 4: [Thumb]    [✕]

User clicks "Thumb" on Image 3:
│ Image 1: [Thumb]    [✕]
│ Image 2: [Thumb]    [✕]
│ Image 3: [✓ Thumb]  [✕]  ← Primary image
│ Image 4: [Thumb]    [✕]
```

### Deleting an Image

```
User clicks [✕] on Image 2:
│ Image 1: [✓ Thumb]  [✕]
│ Image 2: [Thumb]    [✕] ← DELETED
│ Image 3: [Thumb]    [✕]  (becomes Image 2)

Updated list:
│ Image 1: [✓ Thumb]  [✕]
│ Image 2: [Thumb]    [✕]
│ Image 3: [Thumb]    [✕]

Total: 3 images
```

---

## Responsive Design

### Desktop (Full Width)
```
┌──────────────────────────────────────────────────┐
│ Form with all fields visible                      │
│ Image URL: [Input field full width -----------] │
│ [Add Image] button right-aligned                │
└──────────────────────────────────────────────────┘
```

### Mobile/Tablet (Scrollable)
```
Dialog scrolls vertically
- Form fields stack
- Image URL input uses full width
- [Add Image] button full width
- Image list scrollable
```

---

## Data Flow

### Creating Product with Images

```
User fills form → Validates → Submits

┌─────────────────────────────┐
│ Product Data Submitted:     │
├─────────────────────────────┤
│ POST /products              │
│ {                           │
│   name, brand, price,       │
│   category, concentration,  │
│   description, stock        │
│ }                           │
└─────────────────────────────┘
         ↓ Create product ↓
         ↓ Get product ID ↓

┌─────────────────────────────┐
│ Images Data Submitted:      │
├─────────────────────────────┤
│ POST /products/:id/images   │
│ {                           │
│   images: [                 │
│     {                       │
│       imageUrl,             │
│       altText,              │
│       imageOrder,           │
│       isThumbnail           │
│     }                        │
│   ]                         │
│ }                           │
└─────────────────────────────┘
         ↓ Save images ↓
         ↓ Return success ↓

✅ Product & Images Saved
```

### Editing Product with Images

```
User clicks Edit → Form loads

┌──────────────────────────────┐
│ Load Existing Product Data   │
│ GET /products/:id            │
│ → Populate form fields       │
└──────────────────────────────┘
         ↓
┌──────────────────────────────┐
│ Load Existing Images         │
│ GET /products/:id/images     │
│ → Display in images list     │
└──────────────────────────────┘
         ↓
User can:
 - Delete existing images
 - Add new images
 - Change thumbnail
 - Update other fields
         ↓
Update → API Calls → Success
```

---

## State Management

### Form State
```javascript
formData: {
  name: "",
  brand: "",
  price: "",
  category: "",
  concentration: "",
  description: "",
  stock: "0"
}

images: [
  {
    id: number | undefined,
    imageUrl: string,
    altText: string,
    imageOrder: number,
    isThumbnail: boolean
  },
  // ... up to 4 images
]
```

### UI State
- `isOpen` - Dialog open/closed
- `editingId` - Current product ID (null for new)
- `isSubmitting` - Loading during save
- `error` - Error message display
- `loading` - Initial data load

---

## Validation Rules

### Product Data
- ✅ Name required
- ✅ Brand required
- ✅ Price required (number)
- ✅ Category required
- ✅ Concentration required
- ✅ Stock optional (default 0)

### Image Data
- ✅ Image URL required (HTTPS)
- ✅ Alt text optional
- ✅ Maximum 4 images per product
- ✅ At least one image marked as thumbnail
- ✅ Image order auto-assigned (1-4)

### Restrictions
- ❌ Cannot add 5+ images
- ❌ Cannot use HTTP URLs (HTTPS only)
- ❌ Cannot submit empty URL
- ❌ Cannot have no thumbnail

---

## Error Handling

### Image Addition Errors
```
if (images.length >= 4) {
  toast.error("Maximum 4 images per product")
}

if (!imageUrl.trim()) {
  toast.error("Please enter image URL")
}

if (!imageUrl.startsWith('https://')) {
  // Validation happens client-side and server-side
}
```

### Submission Errors
```
Form validation:
  ❌ Missing required fields
     → Error: "Please fill in all required fields"

API errors:
  ❌ Invalid product data
     → Error from server: specific message
  
  ❌ Image save failure
     → Error from API: specific message
  
  ❌ Database error
     → Generic error: "Failed to save product"
```

---

## Success Messages

```
✅ "Image added!" - New image added to list

✅ "Image removed" - Image deleted from list

✅ "Thumbnail updated" - Thumbnail changed

✅ "Product created successfully!" - Form submitted

✅ "Product updated successfully!" - Edit submitted
```

---

## Security Notes

- ✅ Admin-only access (checked on page load)
- ✅ JWT token required for API calls
- ✅ HTTPS URLs enforced
- ✅ SQL injection prevention via parameterized queries
- ✅ CORS headers applied

---

## Browser Compatibility

✅ Works on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Related Components

- **Input** - UI component for text inputs
- **Select** - Dropdown selector
- **Button** - Action buttons
- **Dialog** - Modal dialog component
- **Toast** (Sonner) - Notification messages
- **Table** - Products list display

---

**Last Updated:** February 4, 2026  
**Status:** ✅ Production Ready
