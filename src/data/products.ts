import perfumeHero from "@/assets/perfume-hero-1.jpg";
import perfumeCollection from "@/assets/perfume-collection.jpg";
import perfumeOud from "@/assets/perfume-oud.jpg";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: "men" | "women" | "unisex";
  fragranceType: "woody" | "floral" | "citrus" | "oriental" | "fresh" | "spicy";
  notes: {
    top: string[];
    middle: string[];
    base: string[];
  };
  sizes: {
    ml: number;
    price: number;
  }[];
  longevity: "light" | "moderate" | "long-lasting" | "intense";
  rating: number;
  reviewCount: number;
  inStock: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isLuxury?: boolean;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Royal Oud Noir",
    description: "A majestic blend of rare oud wood, smoky incense, and warm amber. This opulent fragrance captures the essence of Arabian nights with its deep, mysterious character.",
    price: 4999,
    originalPrice: 5999,
    images: [perfumeOud],
    category: "unisex",
    fragranceType: "oriental",
    notes: {
      top: ["Bergamot", "Pink Pepper", "Saffron"],
      middle: ["Oud", "Rose", "Incense"],
      base: ["Amber", "Sandalwood", "Musk"]
    },
    sizes: [
      { ml: 30, price: 2499 },
      { ml: 50, price: 3999 },
      { ml: 100, price: 4999 }
    ],
    longevity: "intense",
    rating: 4.9,
    reviewCount: 128,
    inStock: true,
    isBestSeller: true,
    isLuxury: true
  },
  {
    id: "2",
    name: "Velvet Rose Garden",
    description: "An enchanting floral symphony featuring Bulgarian rose, velvety peony, and delicate white musk. A romantic tribute to eternal gardens.",
    price: 3499,
    images: [perfumeCollection],
    category: "women",
    fragranceType: "floral",
    notes: {
      top: ["Lychee", "Raspberry", "Pink Pepper"],
      middle: ["Bulgarian Rose", "Peony", "Magnolia"],
      base: ["White Musk", "Cedarwood", "Vanilla"]
    },
    sizes: [
      { ml: 30, price: 1899 },
      { ml: 50, price: 2799 },
      { ml: 100, price: 3499 }
    ],
    longevity: "long-lasting",
    rating: 4.8,
    reviewCount: 95,
    inStock: true,
    isNewArrival: true
  },
  {
    id: "3",
    name: "Gentleman's Code",
    description: "Bold and sophisticated, this woody aromatic fragrance speaks of confidence and refined taste. Crafted for the modern gentleman.",
    price: 3999,
    originalPrice: 4499,
    images: [perfumeHero],
    category: "men",
    fragranceType: "woody",
    notes: {
      top: ["Grapefruit", "Cardamom", "Lavender"],
      middle: ["Geranium", "Violet Leaf", "Cinnamon"],
      base: ["Vetiver", "Leather", "Tonka Bean"]
    },
    sizes: [
      { ml: 30, price: 2199 },
      { ml: 50, price: 3199 },
      { ml: 100, price: 3999 }
    ],
    longevity: "long-lasting",
    rating: 4.7,
    reviewCount: 156,
    inStock: true,
    isBestSeller: true
  },
  {
    id: "4",
    name: "Mediterranean Sunrise",
    description: "Fresh and invigorating, capturing the essence of sun-kissed citrus groves along the Mediterranean coast. Pure energy in a bottle.",
    price: 2799,
    images: [perfumeHero],
    category: "unisex",
    fragranceType: "citrus",
    notes: {
      top: ["Sicilian Lemon", "Bergamot", "Orange Blossom"],
      middle: ["Neroli", "Jasmine", "Green Tea"],
      base: ["White Cedar", "Musk", "Ambrox"]
    },
    sizes: [
      { ml: 30, price: 1599 },
      { ml: 50, price: 2199 },
      { ml: 100, price: 2799 }
    ],
    longevity: "moderate",
    rating: 4.6,
    reviewCount: 82,
    inStock: true,
    isNewArrival: true
  },
  {
    id: "5",
    name: "Mystic Amber",
    description: "A seductive oriental fragrance with warm amber, exotic spices, and precious resins. An olfactory journey to ancient temples.",
    price: 4499,
    images: [perfumeOud],
    category: "unisex",
    fragranceType: "oriental",
    notes: {
      top: ["Cinnamon", "Cardamom", "Pink Pepper"],
      middle: ["Frankincense", "Myrrh", "Jasmine"],
      base: ["Amber", "Benzoin", "Vanilla"]
    },
    sizes: [
      { ml: 30, price: 2399 },
      { ml: 50, price: 3599 },
      { ml: 100, price: 4499 }
    ],
    longevity: "intense",
    rating: 4.8,
    reviewCount: 67,
    inStock: true,
    isLuxury: true
  },
  {
    id: "6",
    name: "Ocean Breeze",
    description: "A fresh aquatic fragrance that captures the spirit of the open sea. Clean, crisp, and effortlessly masculine.",
    price: 2499,
    images: [perfumeHero],
    category: "men",
    fragranceType: "fresh",
    notes: {
      top: ["Sea Salt", "Bergamot", "Grapefruit"],
      middle: ["Lavender", "Geranium", "Marine Notes"],
      base: ["Driftwood", "Musk", "Ambergris"]
    },
    sizes: [
      { ml: 30, price: 1399 },
      { ml: 50, price: 1999 },
      { ml: 100, price: 2499 }
    ],
    longevity: "moderate",
    rating: 4.5,
    reviewCount: 134,
    inStock: true,
    isBestSeller: true
  },
  {
    id: "7",
    name: "Midnight Jasmine",
    description: "Intoxicating and sensual, featuring night-blooming jasmine, tuberose, and warm sandalwood. For those who embrace the mystery of the night.",
    price: 3799,
    images: [perfumeCollection],
    category: "women",
    fragranceType: "floral",
    notes: {
      top: ["Ylang-Ylang", "Orange Blossom", "Bergamot"],
      middle: ["Jasmine Sambac", "Tuberose", "Gardenia"],
      base: ["Sandalwood", "Vanilla", "Musk"]
    },
    sizes: [
      { ml: 30, price: 2099 },
      { ml: 50, price: 2999 },
      { ml: 100, price: 3799 }
    ],
    longevity: "long-lasting",
    rating: 4.9,
    reviewCount: 89,
    inStock: true,
    isLuxury: true
  },
  {
    id: "8",
    name: "Spice Trader",
    description: "An adventurous spicy oriental blend inspired by ancient spice routes. Bold, warm, and utterly captivating.",
    price: 3299,
    images: [perfumeOud],
    category: "men",
    fragranceType: "spicy",
    notes: {
      top: ["Black Pepper", "Ginger", "Elemi"],
      middle: ["Cardamom", "Nutmeg", "Saffron"],
      base: ["Oud", "Tobacco", "Benzoin"]
    },
    sizes: [
      { ml: 30, price: 1799 },
      { ml: 50, price: 2599 },
      { ml: 100, price: 3299 }
    ],
    longevity: "long-lasting",
    rating: 4.6,
    reviewCount: 72,
    inStock: true,
    isNewArrival: true
  }
];

export const collections = [
  {
    id: "best-sellers",
    name: "Best Sellers",
    description: "Our most loved fragrances",
    products: products.filter(p => p.isBestSeller)
  },
  {
    id: "new-arrivals",
    name: "New Arrivals",
    description: "Fresh additions to our collection",
    products: products.filter(p => p.isNewArrival)
  },
  {
    id: "luxury",
    name: "Luxury Collection",
    description: "The pinnacle of perfumery",
    products: products.filter(p => p.isLuxury)
  }
];

export const testimonials = [
  {
    id: "1",
    name: "Priya Sharma",
    location: "Mumbai",
    rating: 5,
    text: "Royal Oud Noir is absolutely divine! The longevity is incredible - I get compliments all day long. Bhatkar & Co has become my go-to for luxury fragrances.",
    product: "Royal Oud Noir",
    verified: true
  },
  {
    id: "2",
    name: "Arjun Mehta",
    location: "Delhi",
    rating: 5,
    text: "Gentleman's Code perfectly balances sophistication with everyday wearability. The quality rivals international brands at a fraction of the price.",
    product: "Gentleman's Code",
    verified: true
  },
  {
    id: "3",
    name: "Ananya Reddy",
    location: "Bangalore",
    rating: 5,
    text: "Velvet Rose Garden is the most beautiful floral fragrance I've ever worn. It's romantic, elegant, and truly long-lasting. Highly recommend!",
    product: "Velvet Rose Garden",
    verified: true
  },
  {
    id: "4",
    name: "Vikram Singh",
    location: "Jaipur",
    rating: 5,
    text: "The attention to detail in every bottle is remarkable. Ocean Breeze is my signature scent now - fresh yet masculine. Excellent customer service too!",
    product: "Ocean Breeze",
    verified: true
  }
];
