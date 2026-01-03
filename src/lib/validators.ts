// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

import { z } from "zod";
import { CONFIG } from "@/config/config";

// -------------------------------------------------------------------------
// AUTH SCHEMAS
// -------------------------------------------------------------------------
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(
      CONFIG.auth.passwordMinLength,
      `Password must be at least ${CONFIG.auth.passwordMinLength} characters`
    ),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  full_name: z.string().min(2, "Name must be at least 2 characters"),

  mobile_number: z
    .string()
    .regex(/^\d{10}$/, "Mobile number must be 10 digits"),
  password: z.string().min(CONFIG.auth.passwordMinLength, "Password too short"),
  landlord_code: z.string().min(6, "Invalid Landlord Code").optional(), // Optional because admins don't need it, but tenants do
});

// -------------------------------------------------------------------------
// TENANT SCHEMAS
// -------------------------------------------------------------------------
export const occupantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  relationship: z.enum([
    "self",
    "spouse",
    "child",
    "parent",
    "sibling",
    "relative",
    "friend",
    "other",
  ]),
});

export const tenantFormSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  mobile_number: z
    .string()
    .regex(
      CONFIG.validation.mobileNumber.pattern,
      "Invalid mobile number. Must be 10 digits starting with 6-9"
    ),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(
      CONFIG.auth.passwordMinLength,
      `Password must be at least ${CONFIG.auth.passwordMinLength} characters`
    ),
  flat_number: z.string().min(1, "Flat number is required"),
  floor_number: z.coerce.number().min(0).max(50),
  bhk_type: z.enum(["1BHK", "2BHK", "3BHK"]),
  monthly_rent: z.coerce
    .number()
    .min(
      CONFIG.validation.rent.min,
      `Minimum rent is ${CONFIG.currency.symbol}${CONFIG.validation.rent.min}`
    )
    .max(
      CONFIG.validation.rent.max,
      `Maximum rent is ${CONFIG.currency.symbol}${CONFIG.validation.rent.max}`
    ),
  rent_start_date: z.string().min(1, "Rent start date is required"),
  aadhaar_number: z
    .string()
    .regex(
      CONFIG.validation.aadhaar.pattern,
      "Aadhaar must be exactly 12 digits"
    ),
  occupants: z
    .array(occupantSchema)
    .min(1, "At least one occupant (self) is required"),
});

export const tenantUpdateSchema = tenantFormSchema
  .partial()
  .omit({ password: true, aadhaar_number: true });

// -------------------------------------------------------------------------
// METER READING SCHEMAS
// -------------------------------------------------------------------------
export const meterReadingSchema = z.object({
  tenant_id: z.string().uuid("Invalid tenant ID"),
  reading_value: z.coerce
    .number()
    .min(CONFIG.validation.meterReading.min, "Reading must be positive")
    .max(CONFIG.validation.meterReading.max, "Reading value is too large"),
  reading_date: z.string().min(1, "Reading date is required"),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020).max(2100),
  notes: z.string().optional(),
});

// -------------------------------------------------------------------------
// BILL SCHEMAS
// -------------------------------------------------------------------------
export const billGenerationSchema = z.object({
  tenant_id: z.string().uuid("Invalid tenant ID"),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020).max(2100),
  water_amount: z.coerce.number().min(0).optional(),
  other_charges: z.coerce.number().min(0).optional(),
  other_charges_description: z.string().optional(),
});

export const billPaymentSchema = z.object({
  payment_status: z.enum(["pending", "paid", "partial", "overdue"]),
  payment_date: z.string().optional(),
  payment_notes: z.string().optional(),
});

// -------------------------------------------------------------------------
// EXPENSE SCHEMAS
// -------------------------------------------------------------------------
export const expenseSchema = z.object({
  date: z.string().min(1, "Date is required"),
  category: z.enum([
    "maintenance",
    "repair",
    "plumbing",
    "electrical",
    "painting",
    "cleaning",
    "security",
    "tax",
    "other",
  ]),
  description: z.string().min(3, "Description must be at least 3 characters"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  flat_number: z.string().optional(),
  tenant_id: z.string().uuid().optional(),
});

// -------------------------------------------------------------------------
// NOTE SCHEMAS
// -------------------------------------------------------------------------
export const noteSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  flat_number: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  is_important: z.boolean().default(false),
});

// -------------------------------------------------------------------------
// TYPE EXPORTS
// -------------------------------------------------------------------------
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type TenantFormInput = z.infer<typeof tenantFormSchema>;
export type TenantUpdateInput = z.infer<typeof tenantUpdateSchema>;
export type MeterReadingInput = z.infer<typeof meterReadingSchema>;
export type BillGenerationInput = z.infer<typeof billGenerationSchema>;
export type BillPaymentInput = z.infer<typeof billPaymentSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
