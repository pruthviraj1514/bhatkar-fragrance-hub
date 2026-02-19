/**
 * IMAGE HANDLING UTILITIES - Production-Safe Image URL Extraction
 * ================================================================
 * 
 * Handles all image data format variations from backend APIs
 * Prevents "[object Object]" bugs in image src attributes
 * Provides fallback placeholder on errors
 */

/**
 * Normalize image data from any backend API response format
 * 
 * Handles:
 * - String URLs: "https://..." → returns as-is
 * - Image objects: { image_url: "...", ... } → extracts image_url
 * - Image arrays: [{ image_url: "..." }, ...] → returns first item's URL
 * - Mixed: product.images[0].image_url or product.image.url
 * - Null/undefined/invalid → returns placeholder
 * 
 * @param image - Any image data from API (string, object, array, or combination)
 * @param fallback - Optional fallback URL (default: '/placeholder.svg')
 * @returns Safe string URL for <img src> attribute
 */
export function getProductImage(image: any, fallback: string = '/placeholder.svg'): string {
  try {
    // Handle null/undefined
    if (image === null || image === undefined) {
      console.warn('⚠️ getProductImage: Image is null/undefined');
      return fallback;
    }

    // Handle string URLs (largest portion of images)
    if (typeof image === 'string') {
      // Verify it's a valid URL
      if (image.length === 0) {
        console.warn('⚠️ getProductImage: String is empty');
        return fallback;
      }

      // Accept absolute URLs and relative paths
      if (image.startsWith('http') || image.startsWith('https') || image.startsWith('/')) {
        const preview = image.length > 60 ? image.substring(0, 60) + '...' : image;
        console.debug(`✅ getProductImage: Valid string URL: ${preview}`);
        return image;
      }

      console.warn(`⚠️ getProductImage: String is not a valid URL format: ${image}`);
      return fallback;
    }

    // Handle arrays (usually product.images array or variant images array)
    if (Array.isArray(image)) {
      if (image.length === 0) {
        // Empty arrays are common; use debug level to avoid spamming the console
        console.debug('ℹ️ getProductImage: Array is empty');
        return fallback;
      }

      // Recursively process first non-null array item
      const firstValidItem = image.find(item => item !== null && item !== undefined);
      if (firstValidItem === undefined) {
        console.warn('⚠️ getProductImage: All array items are null/undefined');
        return fallback;
      }

      console.debug(`📦 getProductImage: Array with ${image.length} items, processing first`);
      return getProductImage(firstValidItem, fallback);
    }

    // Handle objects with various image property names
    if (typeof image === 'object' && image !== null) {
      // Try common image property names in order of specificity
      const propertyNames = [
        'image_url',      // Most common in backend responses
        'url',            // Alternative common format
        'src',            // Less common
        'imageUrl',       // Camel case variant
        'image',          // Nested property (recurse)
      ];

      for (const prop of propertyNames) {
        if (prop in image && image[prop] !== null && image[prop] !== undefined) {
          const value = image[prop];

          // If it's the 'image' property and object, recurse
          if (prop === 'image' && typeof value === 'object') {
            console.debug(`📦 getProductImage: Found object.image property, recursing`);
            return getProductImage(value, fallback);
          }

          // If it's a string, validate and return
          if (typeof value === 'string') {
            if (value.length === 0) {
              console.warn(`⚠️ getProductImage: Property '${prop}' is empty string`);
              continue;
            }

            if (value.startsWith('http') || value.startsWith('https') || value.startsWith('/')) {
              const preview = value.length > 60 ? value.substring(0, 60) + '...' : value;
              console.debug(`✅ getProductImage: Found valid URL in '.${prop}': ${preview}`);
              return value;
            }

            console.warn(`⚠️ getProductImage: Property '.${prop}' is string but not a URL: ${value}`);
            continue;
          }

          // If it's an array, recurse
          if (Array.isArray(value)) {
            console.debug(`📦 getProductImage: Found array at '.${prop}', recursing`);
            return getProductImage(value, fallback);
          }

          console.debug(`⏭️ getProductImage: Property '.${prop}' exists but is not string/array/object`);
        }
      }

      // No valid property found
      const availableKeys = Object.keys(image).slice(0, 5).join(', ');
      console.warn(
        `⚠️ getProductImage: Object has no valid image properties. Available: [${availableKeys}${Object.keys(image).length > 5 ? ', ...' : ''}]`
      );
      return fallback;
    }

    // Unexpected type
    console.error(`❌ getProductImage: Unexpected type: ${typeof image}`);
    return fallback;
  } catch (error) {
    // Defensive: Never let image helper crash the component
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ getProductImage threw error: ${errorMsg}`);
    return fallback;
  }
}

/**
 * Safe image handler for <img> onError event
 * Use in img tag: onError={(e) => handleImageError(e)}
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement>,
  fallback: string = '/placeholder.svg'
): void {
  const img = event.currentTarget;
  const originalSrc = img.src;

  // Prevent infinite loop if fallback also fails
  if (originalSrc === fallback) {
    console.error(`❌ Fallback image also failed to load: ${fallback}`);
    return;
  }

  console.warn(`⚠️ Image failed to load: ${originalSrc}`);
  img.src = fallback;
  img.alt = 'Product image unavailable';
  img.style.opacity = '0.6'; // Visual indicator of placeholder
}

/**
 * Get product image with error handling
 * Combines URL extraction + fallback, ready for direct img src
 * 
 * Example usage:
 * <img src={getProductImageWithFallback(product.image)} />
 */
export function getProductImageWithFallback(
  image: any,
  fallback: string = '/placeholder.svg'
): string {
  const url = getProductImage(image, fallback);

  // Double-check result is safe string
  if (typeof url !== 'string') {
    console.error(`❌ getProductImageWithFallback returned non-string: ${typeof url}`);
    return fallback;
  }

  // Prevent "[object Object]" bug
  if (url === '[object Object]') {
    console.error(`❌ getProductImageWithFallback detected [object Object] bug`);
    console.debug('Raw image data:', image);
    return fallback;
  }

  return url;
}

/**
 * Normalize product data before rendering
 * Call this after API response before setting state
 * 
 * Example:
 * const normalized = normalizeProductImages(apiProduct);
 * setProduct(normalized);
 */
export function normalizeProductImages(product: any): any {
  if (!product) return product;

  const normalized = { ...product };

  // Normalize product images array
  if (normalized.images) {
    if (Array.isArray(normalized.images)) {
      // Convert objects to strings, filter out empties
      normalized.images = normalized.images
        .map((img: any) => {
          const url = getProductImage(img);
          return url !== '/placeholder.svg' ? url : null;
        })
        .filter(Boolean);
    } else if (typeof normalized.images === 'string') {
      // Single string
      normalized.images = [normalized.images];
    } else if (typeof normalized.images === 'object') {
      // Single object
      const url = getProductImage(normalized.images);
      normalized.images = url !== '/placeholder.svg' ? [url] : [];
    }
  }

  // Ensure images is always array
  if (!normalized.images || !Array.isArray(normalized.images)) {
    normalized.images = [];
  }

  return normalized;
}

/**
 * Normalize variant images before rendering
 * Variants often have arrays of image objects
 */
export function normalizeVariantImages(images: any[]): string[] {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .map((img: any) => {
      const url = getProductImage(img);
      return url !== '/placeholder.svg' ? url : null;
    })
    .filter(Boolean) as string[];
}

/**
 * Debug helper: Log image data structure
 * Use when troubleshooting image issues
 * Example: debugImageData(product.images)
 */
export function debugImageData(data: any, label: string = 'Image Data'): void {
  console.group(`🔍 ${label}`);
  console.log('Type:', typeof data);
  console.log('Is Array:', Array.isArray(data));
  if (Array.isArray(data)) {
    console.log('Length:', data.length);
    if (data.length > 0) {
      console.log('First item:', data[0]);
      console.log('First item type:', typeof data[0]);
    }
  } else if (typeof data === 'object' && data !== null) {
    console.log('Keys:', Object.keys(data));
    console.log('Full object:', data);
  } else {
    console.log('Value:', data);
  }
  console.log('Extracted URL:', getProductImage(data));
  console.groupEnd();
}

export default {
  getProductImage,
  getProductImageWithFallback,
  normalizeProductImages,
  normalizeVariantImages,
  handleImageError,
  debugImageData,
};
