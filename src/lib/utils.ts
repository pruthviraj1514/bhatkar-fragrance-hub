import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Safely extract image URL from different formats
 * Handles both string URLs and image objects with image_url property
 */
export function getImageUrl(image: any): string {
  if (!image) {
    console.warn('⚠️ getImageUrl: Image is null/undefined, returning placeholder');
    return '/placeholder.svg';
  }

  // If it's already a string URL
  if (typeof image === 'string') {
    console.log(`✅ Image is string URL: ${image.substring(0, 50)}...`);
    return image;
  }

  // If it's an object with image_url property
  if (typeof image === 'object' && image.image_url) {
    const url = image.image_url;
    if (typeof url === 'string') {
      console.log(`✅ Image URL extracted from object: ${url.substring(0, 50)}...`);
      return url;
    }
    console.error(`❌ image.image_url is not a string, got:`, typeof url, url);
    return '/placeholder.svg';
  }

  // Fallback for unexpected formats
  console.error(`❌ Image has unexpected format:`, typeof image, 'Keys:', Object.keys(image || {}));
  return '/placeholder.svg';
}
