import { FieldValue, PeriodType } from "@/types";

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Formats a number as currency with $ symbol
 */
export const formatCurrency = (val: number): string => {
  if (isNaN(val) || !isFinite(val)) return "$0.00";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(val));
};

/**
 * Formats a number as percentage
 */
export const formatPercent = (val: number): string => {
  if (isNaN(val) || !isFinite(val)) return "0.00%";
  return `${Math.ceil(val)}%`;
};

/**
 * Formats a number without currency symbol (for display purposes)
 */
export const formatNumber = (val: number): string => {
  if (isNaN(val) || !isFinite(val)) return "0";
  return Math.round(val).toLocaleString();
};

/**
 * Comprehensive currency formatter with configurable options
 */
export const formatCurrencyValue = (
  value: number, 
  options?: {
    showSymbol?: boolean;
  }
): string => {
  if (isNaN(value) || !isFinite(value)) return "$0.00";
  
  const {
    showSymbol = true
  } = options || {};
  
  if (showSymbol) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(Math.round(value));
  } else {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(Math.round(value));
  }
};

// ============================================================================
// SAFETY UTILITIES
// ============================================================================

/**
 * Safely handles percentage values, returning default if invalid
 */
export const safePercentage = (value: number, defaultValue: number = 0): number => {
  if (isNaN(value) || !isFinite(value)) {
    return defaultValue;
  }
  return value;
};

/**
 * Safely divides two numbers, returning 0 if denominator is 0 or invalid
 */
export const safeDivide = (numerator: number, denominator: number): number => {
  if (denominator === 0 || isNaN(denominator) || !isFinite(denominator)) {
    return 0;
  }
  return numerator / denominator;
};

// ============================================================================
// BUSINESS LOGIC UTILITIES
// ============================================================================

/**
 * Calculates management cost based on ad spend tiers
 */
export const calculateManagementCost = (adSpend: number): number => {
  const tiers = [
    { min: 0, max: 5000, cost: 2000 },
    { min: 5001, max: 10000, cost: 2500 },
    { min: 10001, max: 15000, cost: 3000 },
    { min: 15001, max: 20000, cost: 3500 },
    { min: 20001, max: 25000, cost: 4000 },
    { min: 25001, max: 30000, cost: 4500 },
    { min: 30001, max: 35000, cost: 5000 },
    { min: 35001, max: 40000, cost: 5500 },
    { min: 40001, max: 45000, cost: 6000 },
    { min: 45001, max: 50000, cost: 6500 },
    { min: 50001, max: 55000, cost: 7000 },
    { min: 55001, max: 60000, cost: 7500 },
    { min: 60001, max: 65000, cost: 8000 },
    { min: 65001, max: 70000, cost: 8500 },
  ];

  const tier = tiers.find(t => adSpend >= t.min && adSpend <= t.max);
  return tier ? tier.cost : 0;
};

// ============================================================================
// DATE UTILITIES
// ============================================================================

/**
 * Gets the number of days in a given month
 */
export const getDaysInMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};
