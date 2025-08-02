import { FieldValue, PeriodType } from "@/types";
import {
  startOfWeek,
  startOfMonth,
  startOfYear,
  isBefore,
  isAfter,
} from "date-fns";

// ============================================================================
// ACTUAL DATA CALCULATION UTILITIES
// ============================================================================

/**
 * Calculates reporting fields for actual data entry
 */
export function calculateReportingFields(inputValues: FieldValue): FieldValue {
  const allValues = { ...inputValues };
  
  // Calculate total budget spent
  const budgetSpent = (allValues.testingBudgetSpent || 0) + 
                     (allValues.awarenessBrandingBudgetSpent || 0) + 
                     (allValues.leadGenerationBudgetSpent || 0);
  allValues.budgetSpent = budgetSpent;

  // Calculate budget fields if target revenue and com are available
  if (allValues.targetRevenue !== undefined && allValues.com !== undefined) {
    allValues.weeklyBudget = allValues.targetRevenue * (allValues.com / 100);
    allValues.budget = allValues.weeklyBudget; // For weekly period
  }

  // Calculate over/under budget
  if (allValues.budget !== undefined) {
    allValues.overUnderBudget = allValues.budget - budgetSpent;
  }

  return allValues;
}

/**
 * Calculates performance metrics for actual data
 */
export function calculatePerformanceMetrics(actualData: FieldValue, targetData: FieldValue): FieldValue {
  const metrics = { ...actualData };

  // Calculate performance percentages
  if (targetData.revenue && targetData.revenue > 0) {
    metrics.revenuePerformance = (actualData.revenue / targetData.revenue) * 100;
  }

  if (targetData.leads && targetData.leads > 0) {
    metrics.leadsPerformance = (actualData.leads / targetData.leads) * 100;
  }

  if (targetData.estimatesSet && targetData.estimatesSet > 0) {
    metrics.estimatesSetPerformance = (actualData.estimatesSet / targetData.estimatesSet) * 100;
  }

  if (targetData.estimatesRan && targetData.estimatesRan > 0) {
    metrics.estimatesRanPerformance = (actualData.estimatesRan / targetData.estimatesRan) * 100;
  }

  if (targetData.sales && targetData.sales > 0) {
    metrics.salesPerformance = (actualData.sales / targetData.sales) * 100;
  }

  // Calculate efficiency metrics
  if (actualData.leads && actualData.leads > 0) {
    metrics.actualAppointmentRate = (actualData.estimatesSet / actualData.leads) * 100;
  }

  if (actualData.estimatesSet && actualData.estimatesSet > 0) {
    metrics.actualShowRate = (actualData.estimatesRan / actualData.estimatesSet) * 100;
  }

  if (actualData.estimatesRan && actualData.estimatesRan > 0) {
    metrics.actualCloseRate = (actualData.sales / actualData.estimatesRan) * 100;
  }

  if (actualData.leads && actualData.leads > 0) {
    metrics.actualLeadToSale = (actualData.sales / actualData.leads) * 100;
  }

  return metrics;
}

// ============================================================================
// ACTUAL DATA VALIDATION UTILITIES
// ============================================================================

/**
 * Check if the selected time frame is in the past (for actual data entry)
 */
export const isTimeFrameInPast = (
  period: PeriodType,
  selectedDate: Date
): boolean => {
  const currentDate = new Date();

  switch (period) {
    case "weekly":
      const selectedWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      return isBefore(selectedWeekStart, currentWeekStart);
    case "monthly":
      const selectedMonthStart = startOfMonth(selectedDate);
      const currentMonthStart = startOfMonth(currentDate);
      // For monthly period, allow current month as well (not just past months)
      return !isAfter(selectedMonthStart, currentMonthStart);
    case "yearly":
      const selectedYearStart = startOfYear(selectedDate);
      const currentYearStart = startOfYear(currentDate);
      return !isAfter(selectedYearStart, currentYearStart);
    default:
      return false;
  }
};

/**
 * Validates actual data entry requirements
 */
export function validateActualDataEntry(
  period: PeriodType,
  selectedDate: Date
): { isValid: boolean; message?: string } {
  // Check if time frame is in the past
  if (!isTimeFrameInPast(period, selectedDate)) {
    return {
      isValid: false,
      message: "Actual data can only be entered for past dates"
    };
  }

  // Check if period is weekly (only weekly is allowed for actual data)
  if (period !== "weekly") {
    return {
      isValid: false,
      message: "Reporting data can only be added in week view"
    };
  }

  return { isValid: true };
}

// ============================================================================
// BUDGET CALCULATION UTILITIES
// ============================================================================

/**
 * Calculates budget utilization metrics
 */
export function calculateBudgetUtilization(
  budgetSpent: number,
  totalBudget: number
): {
  utilizationPercentage: number;
  remainingBudget: number;
  isOverBudget: boolean;
} {
  const utilizationPercentage = totalBudget > 0 ? (budgetSpent / totalBudget) * 100 : 0;
  const remainingBudget = totalBudget - budgetSpent;
  const isOverBudget = budgetSpent > totalBudget;

  return {
    utilizationPercentage,
    remainingBudget,
    isOverBudget,
  };
}

/**
 * Calculates budget breakdown percentages
 */
export function calculateBudgetBreakdown(
  testingBudget: number,
  awarenessBudget: number,
  leadGenerationBudget: number,
  totalBudget: number
): {
  testingPercentage: number;
  awarenessPercentage: number;
  leadGenerationPercentage: number;
} {
  if (totalBudget === 0) {
    return {
      testingPercentage: 0,
      awarenessPercentage: 0,
      leadGenerationPercentage: 0,
    };
  }

  return {
    testingPercentage: (testingBudget / totalBudget) * 100,
    awarenessPercentage: (awarenessBudget / totalBudget) * 100,
    leadGenerationPercentage: (leadGenerationBudget / totalBudget) * 100,
  };
}

// ============================================================================
// DATA AGGREGATION UTILITIES
// ============================================================================

/**
 * Aggregates actual data across multiple weeks
 */
export function aggregateActualData(weeklyData: FieldValue[]): FieldValue {
  return weeklyData.reduce((acc, weekData) => {
    Object.keys(weekData).forEach(key => {
      if (typeof weekData[key] === 'number') {
        acc[key] = (acc[key] || 0) + weekData[key];
      }
    });
    return acc;
  }, {} as FieldValue);
}

/**
 * Calculates averages for actual data across multiple weeks
 */
export function calculateAverageMetrics(weeklyData: FieldValue[]): FieldValue {
  if (weeklyData.length === 0) return {};

  const aggregated = aggregateActualData(weeklyData);
  const averages: FieldValue = {};

  // Calculate averages for relevant metrics
  const metricsToAverage = [
    'avgJobSize',
    'appointmentRate',
    'showRate',
    'closeRate',
    'leadToSale',
    'cpl',
    'cpEstimateSet',
    'cpEstimate',
    'cpJobBooked',
  ];

  metricsToAverage.forEach(metric => {
    if (aggregated[metric] !== undefined) {
      averages[metric] = aggregated[metric] / weeklyData.length;
    }
  });

  // Keep sum metrics as they are
  const sumMetrics = [
    'revenue',
    'leads',
    'estimatesSet',
    'estimatesRan',
    'sales',
    'budgetSpent',
    'testingBudgetSpent',
    'awarenessBrandingBudgetSpent',
    'leadGenerationBudgetSpent',
  ];

  sumMetrics.forEach(metric => {
    if (aggregated[metric] !== undefined) {
      averages[metric] = aggregated[metric];
    }
  });

  return averages;
} 