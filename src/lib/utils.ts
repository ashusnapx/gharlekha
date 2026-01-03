// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

import { CONFIG } from "@/config/config";
import { format, parse } from "date-fns";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// -------------------------------------------------------------------------
// CLASSNAME UTILITY (for Tailwind)
// -------------------------------------------------------------------------
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// -------------------------------------------------------------------------
// CURRENCY FORMATTING
// -------------------------------------------------------------------------
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(CONFIG.currency.locale, {
    style: "currency",
    currency: CONFIG.currency.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat(CONFIG.currency.locale).format(num);
}

// -------------------------------------------------------------------------
// DATE FORMATTING
// -------------------------------------------------------------------------
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, CONFIG.dateFormats.display);
}

export function formatDateWithTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, CONFIG.dateFormats.displayWithTime);
}

export function formatMonthYear(month: number, year: number): string {
  const date = new Date(year, month - 1, 1);
  return format(date, CONFIG.dateFormats.monthYear);
}

export function parseInputDate(dateString: string): Date {
  return parse(dateString, CONFIG.dateFormats.input, new Date());
}

// -------------------------------------------------------------------------
// BILL NUMBER GENERATION
// -------------------------------------------------------------------------
export function generateBillNumber(
  flatNumber: string,
  month: number,
  year: number
): string {
  const monthStr = month.toString().padStart(2, "0");
  return `GL-${flatNumber}-${year}${monthStr}`;
}

// -------------------------------------------------------------------------
// ELECTRICITY CALCULATION
// -------------------------------------------------------------------------
export function calculateElectricityUnits(
  currentReading: number,
  previousReading: number
): number {
  if (previousReading === null || previousReading === undefined) {
    return 0; // First reading, no consumption calculated
  }
  return Math.max(0, currentReading - previousReading);
}

export function calculateElectricityAmount(
  units: number,
  rate?: number
): number {
  const effectiveRate = rate ?? CONFIG.billing.electricityRatePerUnit;
  return units * effectiveRate;
}

// -------------------------------------------------------------------------
// TOTAL CALCULATION
// -------------------------------------------------------------------------
export function calculateBillTotal(
  rent: number,
  electricityAmount: number,
  waterAmount: number,
  otherCharges: number = 0
): number {
  return rent + electricityAmount + waterAmount + otherCharges;
}

// -------------------------------------------------------------------------
// MOBILE NUMBER FORMATTING
// -------------------------------------------------------------------------
export function formatMobileNumber(number: string): string {
  if (!number || number.length !== 10) return number;
  return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
}

// -------------------------------------------------------------------------
// MONTH HELPERS
// -------------------------------------------------------------------------
export function getMonthOptions() {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: format(new Date(2024, i, 1), "MMMM"),
  }));
}

export function getCurrentMonthYear() {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}

export function getPreviousMonthYear(month: number, year: number) {
  if (month === 1) {
    return { month: 12, year: year - 1 };
  }
  return { month: month - 1, year };
}

// -------------------------------------------------------------------------
// BHK TYPE HELPERS
// -------------------------------------------------------------------------
export function getBHKLabel(bhkType: string): string {
  const bhk = CONFIG.property.bhkTypes.find((b) => b.value === bhkType);
  return bhk?.label ?? bhkType;
}

// -------------------------------------------------------------------------
// RELATIONSHIP HELPERS
// -------------------------------------------------------------------------
export function getRelationshipLabel(relationship: string): string {
  const rel = CONFIG.tenant.relationshipTypes.find(
    (r) => r.value === relationship
  );
  return rel?.label ?? relationship;
}

// -------------------------------------------------------------------------
// PAYMENT STATUS HELPERS
// -------------------------------------------------------------------------
export function getPaymentStatusColor(status: string): string {
  const statusConfig = CONFIG.payment.statuses.find((s) => s.value === status);
  return statusConfig?.color ?? "gray";
}

export function getPaymentStatusLabel(status: string): string {
  const statusConfig = CONFIG.payment.statuses.find((s) => s.value === status);
  return statusConfig?.label ?? status;
}

// -------------------------------------------------------------------------
// ERROR HELPERS
// -------------------------------------------------------------------------
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
}

// -------------------------------------------------------------------------
// DEBOUNCE
// -------------------------------------------------------------------------
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

// -------------------------------------------------------------------------
// YEAR OPTIONS
// -------------------------------------------------------------------------
export function getYearOptions(pastYears: number = 5, futureYears: number = 1) {
  const currentYear = new Date().getFullYear();
  const years = [];

  for (let y = currentYear - pastYears; y <= currentYear + futureYears; y++) {
    years.push({ value: y, label: y.toString() });
  }

  return years;
}
