// ============================================================================
// GHAR LEKHA - TYPE DEFINITIONS
// ============================================================================

import type {
  BHKType,
  RelationshipType,
  ExpenseCategory,
  PaymentStatus,
} from "@/config/config";

// -------------------------------------------------------------------------
// USER & AUTH
// -------------------------------------------------------------------------
export type UserRole = "admin" | "tenant";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "tenant";
  mobile_number?: string;
  landlord_code?: string; // For admins
  linked_landlord_id?: string; // For tenants
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// -------------------------------------------------------------------------
// TENANT
// -------------------------------------------------------------------------
export interface Occupant {
  id: string;
  tenant_id: string;
  name: string;
  relationship: RelationshipType;
  created_at: string;
}

export interface Tenant {
  id: string;
  user_id: string; // Links to auth user
  full_name: string;
  mobile_number: string;
  email: string;
  flat_number: string;
  floor_number: number;
  bhk_type: BHKType;
  monthly_rent: number;
  rent_start_date: string;
  aadhaar_encrypted: string; // Encrypted Aadhaar number
  aadhaar_masked: string; // Last 4 digits for display (XXXX XXXX 1234)
  total_occupants: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  occupants?: Occupant[];
}

export interface TenantFormData {
  full_name: string;
  mobile_number: string;
  email: string;
  password: string;
  flat_number: string;
  floor_number: number;
  bhk_type: BHKType;
  monthly_rent: number;
  rent_start_date: string;
  aadhaar_number: string;
  occupants: {
    name: string;
    relationship: RelationshipType;
  }[];
}

// -------------------------------------------------------------------------
// METER READING
// -------------------------------------------------------------------------
export interface MeterReading {
  id: string;
  tenant_id: string;
  reading_value: number;
  reading_date: string;
  month: number; // 1-12
  year: number;
  units_consumed: number | null; // Calculated: current - previous
  recorded_by: string; // Admin user ID
  notes: string | null;
  created_at: string;
  // Relations
  tenant?: Tenant;
}

export interface MeterReadingFormData {
  tenant_id: string;
  reading_value: number;
  reading_date: string;
  month: number;
  year: number;
  notes?: string;
}

// -------------------------------------------------------------------------
// BILL
// -------------------------------------------------------------------------
export interface BillLineItem {
  description: string;
  amount: number;
  details?: string;
}

export interface Bill {
  id: string;
  tenant_id: string;
  month: number;
  year: number;

  // Amounts
  rent_amount: number;
  electricity_units: number;
  electricity_rate: number;
  electricity_amount: number;
  water_amount: number;
  other_charges: number;
  total_amount: number;

  // Payment
  payment_status: PaymentStatus;
  payment_date: string | null;

  // Metadata
  bill_number: string;
  generated_at: string;
  generated_by: string; // Admin user ID
  pdf_url: string | null;

  // Line items as JSON
  line_items: BillLineItem[];

  created_at: string;
  updated_at: string;

  // Relations
  tenant?: Tenant;
  meter_reading?: MeterReading;
}

export interface BillGenerationData {
  tenant_id: string;
  month: number;
  year: number;
  water_amount?: number;
  other_charges?: number;
  other_charges_description?: string;
}

// -------------------------------------------------------------------------
// EXPENSE
// -------------------------------------------------------------------------
export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  flat_number: string | null; // Optional - can be for specific flat or general
  tenant_id: string | null;
  recorded_by: string;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  tenant?: Tenant;
}

export interface ExpenseFormData {
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  flat_number?: string;
  tenant_id?: string;
}

// -------------------------------------------------------------------------
// NOTE
// -------------------------------------------------------------------------
export interface Note {
  id: string;
  tenant_id: string | null;
  flat_number: string | null;
  title: string;
  content: string;
  is_important: boolean;
  recorded_by: string;
  created_at: string;
  updated_at: string;
  // Relations
  tenant?: Tenant;
}

// -------------------------------------------------------------------------
// DASHBOARD & ANALYTICS
// -------------------------------------------------------------------------
export interface DashboardSummary {
  currentMonthIncome: number;
  allTimeIncome: number;
  totalExpenses: number;
  netEarnings: number;
  totalTenants: number;
  activeTenants: number;
  pendingBills: number;
  overdueAmount: number;
  landlordCode?: string;
}

export interface MonthlyIncome {
  month: number;
  year: number;
  monthLabel: string;
  income: number;
  expenses: number;
  net: number;
}

export interface TenantBreakdown {
  tenant_id: string;
  tenant_name: string;
  flat_number: string;
  total_paid: number;
  pending_amount: number;
  last_payment_date: string | null;
}

// -------------------------------------------------------------------------
// API RESPONSE TYPES
// -------------------------------------------------------------------------
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
