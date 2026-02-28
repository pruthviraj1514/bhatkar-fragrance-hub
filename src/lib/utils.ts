import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: any): string {
  // Handle empty/null values
  if (price === null || price === undefined || isNaN(Number(price))) {
    return "0";
  }

  const numPrice = typeof price === "string" ? parseFloat(price) : price;

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  } catch (err) {
    console.error("formatPrice error:", err);
    return String(numPrice);
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * PRODUCTION-SAFE: Get image URL from product image data
 * 
 * Handles multiple data formats:
 * - String URLs: "https://..."
 * - Image objects: { image_url: "https://...", alt_text: "..." }
 * - Arrays: [{ image_url: "..." }, ...]
 * - Null/undefined: Falls back to placeholder
 * 
 * @returns Safe string URL or placeholder
 */
export function getImageUrl(image: any): string {
  try {
    // Null/undefined check
    if (!image) {
      console.warn('⚠️ getImageUrl: Image is null/undefined, returning placeholder');
      return '/placeholder.svg';
    }

    // If it's already a string URL
    if (typeof image === 'string') {
      if (image.length > 0 && (image.startsWith('http') || image.startsWith('/'))) {
        const preview = image.substring(0, 60);
        console.log(`✅ Image is valid string URL: ${preview}...`);
        return image;
      }
      console.warn(`⚠️ Image is string but not a valid URL: ${image}`);
      return '/placeholder.svg';
    }

    // If it's an array, get first item
    if (Array.isArray(image)) {
      if (image.length === 0) {
        console.warn('⚠️ Image array is empty');
        return '/placeholder.svg';
      }
      console.log(`💾 Image is array with ${image.length} items, using first`);
      return getImageUrl(image[0]); // Recursively process first item
    }

    // If it's an object with image_url property
    if (typeof image === 'object' && image !== null) {
      // Check if image_url exists and is a string
      if ('image_url' in image) {
        const url = image.image_url;
        if (typeof url === 'string' && url.length > 0) {
          const preview = url.substring(0, 60);
          console.log(`✅ Image URL extracted from object: ${preview}...`);
          return url;
        }
        console.error(`❌ image.image_url exists but is not a valid string:`, typeof url);
        return '/placeholder.svg';
      }

      // If no image_url property, log available properties
      const keys = Object.keys(image);
      console.warn(`⚠️ Image object has no 'image_url' property. Available keys:`, keys.join(', '));
      return '/placeholder.svg';
    }

    // Unexpected type
    console.error(`❌ Image has unexpected type:`, typeof image);
    return '/placeholder.svg';
  } catch (err) {
    // Defensive: Catch any unexpected errors
    console.error(`❌ Error in getImageUrl:`, err instanceof Error ? err.message : err);
    return '/placeholder.svg';
  }
}
