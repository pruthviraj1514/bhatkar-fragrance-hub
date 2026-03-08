/**
 * @file company.ts
 * @description Centralized company information configuration
 * Use this file for all company details across the application
 * Single source of truth for branding consistency
 */

export const COMPANY_INFO = {
  name: "Bhatkar & Co",
  tagline: "Fine Perfumery",
  established: "January-2026",
  
  address: `R102, Moregaon 90 Feet Road,
Nalasopara East,
Mumbai – 401209,
Maharashtra, India`,
  
  // Formatted single-line address for invoices/receipts
  addressSingleLine: "R102, Moregaon 90 Feet Road, Nalasopara East, Mumbai – 401209, Maharashtra, India",
  
  // Phone
  phone: "+91 7758088155",
  
  // Email
  email: "bhatkarco@gmail.com",
  
  // Website
  website: "https://bhatkar-fragrance-hub-5.onrender.com",
  
  // Social media links
  social: {
    facebook: "https://www.facebook.com/share/1DYeAfAB1G/",
    instagram: "https://www.instagram.com/bhatkarco.official?igsh=MTBlbTh4cnhvZXlqdw==",
    twitter: "https://twitter.com",
    youtube: "https://youtube.com/@bhatkarcoperfumes?si=4G_IUDj40ntFX7tP"
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
