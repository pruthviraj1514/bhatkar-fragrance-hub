/**
 * @file company.ts
 * @description Centralized company information configuration
 * Use this file for all company details across the application
 * Single source of truth for branding consistency
 */

export const COMPANY_INFO = {
  name: "Bhatkar & Co",
  tagline: "Fine Perfumery",
  established: "1987",
  
  address: `R102, Moregaon 90 Feet Road,
Nalasopara East,
Mumbai – 401209,
Maharashtra, India`,
  
  // Formatted single-line address for invoices/receipts
  addressSingleLine: "R102, Moregaon 90 Feet Road, Nalasopara East, Mumbai – 401209, Maharashtra, India",
  
  // Phone
  phone: "+91 98765 43210",
  
  // Email
  email: "info@bhatkarcco.com",
  
  // Website
  website: "https://bhatkar-fragrance-hub-5.onrender.com",
  
  // Social media links
  social: {
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    twitter: "https://twitter.com",
    youtube: "https://youtube.com"
  }
} as const;

// Export individual constants for quick access
export const {
  name,
  tagline,
  established,
  address,
  addressSingleLine,
  phone,
  email,
  website,
  social
} = COMPANY_INFO;
