// ============================================================================
// GHAR LEKHA - CENTRALIZED CONFIGURATION
// ============================================================================
// All configurable values live here. NO hardcoded values in business logic.
// ============================================================================

export const CONFIG = {
  // -------------------------------------------------------------------------
  // APPLICATION
  // -------------------------------------------------------------------------
  app: {
    name: "Ghar Lekha",
    tagline: "Rental Management Made Simple",
    version: "1.0.0",
  },

  // -------------------------------------------------------------------------
  // CURRENCY & LOCALE
  // -------------------------------------------------------------------------
  currency: {
    symbol: "₹",
    code: "INR",
    locale: "en-IN",
  },

  // -------------------------------------------------------------------------
  // DATE/TIME FORMATS
  // -------------------------------------------------------------------------
  dateFormats: {
    display: "dd/MM/yyyy",
    displayWithTime: "dd/MM/yyyy HH:mm",
    monthYear: "MMMM yyyy",
    input: "yyyy-MM-dd", // HTML date input format
  },

  // -------------------------------------------------------------------------
  // BILLING CONFIGURATION
  // -------------------------------------------------------------------------
  billing: {
    electricityRatePerUnit: 10, // ₹ per unit
    defaultWaterCharges: 200, // ₹ per month
    billingCycleDay: 1, // Day of month when billing cycle starts
    lateFeePercentage: 0, // Percentage of total bill (0 = disabled)
    lateFeeGraceDays: 0, // Days after due date before late fee applies
  },

  // -------------------------------------------------------------------------
  // PROPERTY CONFIGURATION
  // -------------------------------------------------------------------------
  property: {
    bhkTypes: [
      { value: "1BHK", label: "1 BHK" },
      { value: "2BHK", label: "2 BHK" },
      { value: "3BHK", label: "3 BHK" },
    ] as const,
    maxOccupantsAllowed: 10,
    floorNumbers: Array.from({ length: 10 }, (_, i) => ({
      value: i.toString(),
      label: i === 0 ? "Ground Floor" : `Floor ${i}`,
    })),
  },

  // -------------------------------------------------------------------------
  // TENANT CONFIGURATION
  // -------------------------------------------------------------------------
  tenant: {
    relationshipTypes: [
      { value: "self", label: "Self" },
      { value: "spouse", label: "Spouse" },
      { value: "child", label: "Child" },
      { value: "parent", label: "Parent" },
      { value: "sibling", label: "Sibling" },
      { value: "relative", label: "Relative" },
      { value: "friend", label: "Friend" },
      { value: "other", label: "Other" },
    ] as const,
  },

  // -------------------------------------------------------------------------
  // VALIDATION RULES
  // -------------------------------------------------------------------------
  validation: {
    rent: {
      min: 1000,
      max: 500000,
    },
    mobileNumber: {
      pattern: /^[6-9]\d{9}$/,
      length: 10,
    },
    aadhaar: {
      pattern: /^\d{12}$/,
      length: 12,
    },
    meterReading: {
      min: 0,
      max: 999999,
    },
  },

  // -------------------------------------------------------------------------
  // PDF CONFIGURATION
  // -------------------------------------------------------------------------
  pdf: {
    branding: {
      companyName: "Ghar Lekha",
      tagline: "Rental Management Made Simple",
      footerText:
        "Thank you for your payment. This is a computer-generated invoice.",
    },
    pageSize: "A4" as const,
    margins: {
      top: 40,
      right: 40,
      bottom: 40,
      left: 40,
    },
  },

  // -------------------------------------------------------------------------
  // AUTH CONFIGURATION
  // -------------------------------------------------------------------------
  auth: {
    sessionExpiryDays: 7,
    passwordMinLength: 8,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 30,
  },

  // -------------------------------------------------------------------------
  // EXPENSE CATEGORIES
  // -------------------------------------------------------------------------
  expenses: {
    categories: [
      { value: "maintenance", label: "Maintenance" },
      { value: "repair", label: "Repair" },
      { value: "plumbing", label: "Plumbing" },
      { value: "electrical", label: "Electrical" },
      { value: "painting", label: "Painting" },
      { value: "cleaning", label: "Cleaning" },
      { value: "security", label: "Security" },
      { value: "tax", label: "Tax/Fees" },
      { value: "other", label: "Other" },
    ] as const,
  },

  // -------------------------------------------------------------------------
  // ENCRYPTION (for Aadhaar)
  // -------------------------------------------------------------------------
  encryption: {
    algorithm: "aes-256-gcm",
    // Key should come from environment variable
  },

  // -------------------------------------------------------------------------
  // PAYMENT STATUS
  // -------------------------------------------------------------------------
  payment: {
    statuses: [
      { value: "pending", label: "Pending", color: "yellow" },
      { value: "paid", label: "Paid", color: "green" },
      { value: "partial", label: "Partial", color: "orange" },
      { value: "overdue", label: "Overdue", color: "red" },
    ] as const,
  },
} as const;

// Type exports for type safety
export type BHKType = (typeof CONFIG.property.bhkTypes)[number]["value"];
export type RelationshipType =
  (typeof CONFIG.tenant.relationshipTypes)[number]["value"];
export type ExpenseCategory =
  (typeof CONFIG.expenses.categories)[number]["value"];
export type PaymentStatus = (typeof CONFIG.payment.statuses)[number]["value"];
