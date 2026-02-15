/**
 * @file policies.ts
 * @description Centralized constants for business policies
 * Used across the application to maintain consistency
 * Single source of truth for policy text
 */

export const POLICIES = {
  // Return Policy
  RETURN_POLICY: "No Return Policy",
  RETURN_POLICY_DESCRIPTION: "No returns accepted",
  RETURN_DAYS: "0 days",

  // Delivery
  DELIVERY: "Free Delivery",
  DELIVERY_DESCRIPTION: "Orders over $50",

  // Security
  SECURITY: "Secure Checkout",
  SECURITY_DESCRIPTION: "100% secure payment",

  // Authentication
  AUTHENTIC: "100% Authentic Products",
  AUTHENTIC_DESCRIPTION: "Guaranteed",
} as const;

// Export individual constants for quick access
export const {
  RETURN_POLICY,
  RETURN_POLICY_DESCRIPTION,
  RETURN_DAYS,
  DELIVERY,
  DELIVERY_DESCRIPTION,
  SECURITY,
  SECURITY_DESCRIPTION,
  AUTHENTIC,
  AUTHENTIC_DESCRIPTION,
} = POLICIES;
