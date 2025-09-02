import { FieldConfig, FieldValue, PeriodType } from "@/types";
import { targetFields } from "../constant";
import { calculateManagementCost, safeDivide } from "./commonUtils";
import {
  startOfWeek,
  endOfWeek,
  isAfter,
  startOfMonth,
  isBefore,
  startOfYear,
  format,
  endOfMonth,
  eachWeekOfInterval,
  isSameMonth,
  addDays,
} from "date-fns";

// ============================================================================
// TARGET CALCULATION UTILITIES
// ============================================================================

/**
 * Main calculation function that handles all field calculations for targets
 */
export const calculateFields = (
  inputValues: FieldValue,
  period: PeriodType = "monthly",
  daysInMonth: number = 30
): FieldValue => {
  const values = { ...inputValues };
  
  // Calculate funnel metrics (forward calculation)
  if (values.revenue !== undefined && values.avgJobSize !== undefined) {
    values.sales = safeDivide(values.revenue, values.avgJobSize);
  }
  
  if (values.sales !== undefined && values.closeRate !== undefined) {
    values.estimatesRan = safeDivide(values.sales, values.closeRate / 100);
  }
  
  if (values.estimatesRan !== undefined && values.showRate !== undefined) {
    values.estimatesSet = safeDivide(values.estimatesRan, values.showRate / 100);
  }
  
  if (values.estimatesSet !== undefined && values.appointmentRate !== undefined) {
    values.leads = safeDivide(values.estimatesSet, values.appointmentRate / 100);
  }

  // Calculate funnel rate
  if (values.appointmentRate !== undefined && values.showRate !== undefined && values.closeRate !== undefined) {
    values.leadToSale = (values.appointmentRate * values.showRate * values.closeRate) / 10000;
  }

  // Calculate budget fields based on period
  if (values.revenue !== undefined && values.com !== undefined) {
    const budgetPercentage = values.com / 100;
    
    switch (period) {
      case 'yearly':
        values.annualBudget = values.revenue * budgetPercentage;
        values.calculatedMonthlyBudget = values.annualBudget / 12;
        values.budget = values.annualBudget;
        break;
      case 'monthly':
        values.calculatedMonthlyBudget = values.revenue * budgetPercentage;
        values.budget = values.calculatedMonthlyBudget;
        break;
      case 'weekly':
        values.weeklyBudget = values.revenue * budgetPercentage;
        values.budget = values.weeklyBudget;
        break;
      case 'ytd':
        const currentMonth = new Date().getMonth();
        const monthsElapsed = currentMonth + 1;
        values.annualBudget = values.revenue * budgetPercentage;
        values.calculatedMonthlyBudget = values.annualBudget / 12;
        values.budget = values.calculatedMonthlyBudget * monthsElapsed;
        break;
    }
  }

  // Calculate daily budget
  if (values.budget !== undefined) {
    values.dailyBudget = values.budget / daysInMonth;
  }

  // Calculate cost metrics
  if (values.budget !== undefined) {
    if (values.leads !== undefined && values.leads > 0) {
      values.cpl = values.budget / values.leads;
    }
    if (values.estimatesSet !== undefined && values.estimatesSet > 0) {
      values.cpEstimateSet = values.budget / values.estimatesSet;
    }
    if (values.estimatesRan !== undefined && values.estimatesRan > 0) {
      values.cpEstimate = values.budget / values.estimatesRan;
    }
    if (values.sales !== undefined && values.sales > 0) {
      values.cpJobBooked = values.budget / values.sales;
    }
  }

  // Calculate management cost and total CoM%
  if (values.calculatedMonthlyBudget !== undefined) {
    if (values.revenue !== undefined && values.revenue > 0) {
      if(period === 'monthly') {
        values.totalCom = ((values.calculatedMonthlyBudget + values.managementCost) / values.revenue) * 100;
      } else if(period === 'yearly') {
        values.totalCom = (((values.annualBudget + values.managementCost)) / values.revenue) * 100;
      }
    }
  }

  return values;
};

/**
 * Calculates fields for a single week
 */
export const calculateWeeklyFields = (weekData: FieldValue): FieldValue => {
  return calculateFields(weekData, 'weekly', 7);
};

/**
 * Aggregates weekly field values for monthly/yearly totals
 */
export const aggregateWeeklyFields = (weeklyData: FieldValue[]): FieldValue => {
  return weeklyData.reduce((acc, weekValues) => {
    Object.keys(weekValues).forEach(key => {
      if (typeof weekValues[key] === 'number') {
        acc[key] = (acc[key] || 0) + weekValues[key];
      }
    });
    return acc;
  }, {} as FieldValue);
};

/**
 * Processes target data from the API and converts it to field values
 */
export const processTargetData = (currentTarget: any[] | null): FieldValue => {
  if (!currentTarget || currentTarget.length === 0) {
    return getDefaultValues();
  }

  if (currentTarget.length === 1 && !Array.isArray(currentTarget[0])) {
    const weekData = currentTarget[0];
    const weekValues: FieldValue = {
      revenue: weekData.revenue || 0,
      avgJobSize: weekData.avgJobSize || 0,
      appointmentRate: weekData.appointmentRate || 0,
      showRate: weekData.showRate || 0,
      closeRate: weekData.closeRate || 0,
      com: weekData.com || 0,
      managementCost: weekData.managementCost || 0,
    };

    return calculateFieldsForApiData(weekValues, 'weekly', 7);
  }

  let allWeekData: any[] = [];
  
  if (currentTarget.length === 12 && Array.isArray(currentTarget[0])) {
    currentTarget.forEach(monthData => {
      if (Array.isArray(monthData)) {
        allWeekData = allWeekData.concat(monthData);
      }
    });
  } else {
    allWeekData = currentTarget;
  }

  const weeklyCalculations = allWeekData.map(weekData => {
    const weekValues: FieldValue = {
      revenue: weekData.revenue || 0,
      avgJobSize: weekData.avgJobSize || 0,
      appointmentRate: weekData.appointmentRate || 0,
      showRate: weekData.showRate || 0,
      closeRate: weekData.closeRate || 0,
      com: weekData.com || 0,
      managementCost: weekData.managementCost || 0,
    };

    weekValues.sales = safeDivide(weekValues.revenue, weekValues.avgJobSize);
    weekValues.estimatesRan = safeDivide(weekValues.sales, weekValues.closeRate / 100);
    weekValues.estimatesSet = safeDivide(weekValues.estimatesRan, weekValues.showRate / 100);
    weekValues.leads = safeDivide(weekValues.estimatesSet, weekValues.appointmentRate / 100);
    weekValues.weeklyBudget = weekValues.revenue * (weekValues.com / 100);

    return weekValues;
  });

  const aggregatedValues = aggregateWeeklyFields(weeklyCalculations);  
  const finalValues: FieldValue = {
    ...getDefaultValues(),
    ...aggregatedValues,
  };

  // Calculate reverse-calculated values
  if (finalValues.revenue && finalValues.revenue > 0 && finalValues.sales && finalValues.sales > 0) {
    finalValues.avgJobSize = Math.round(finalValues.revenue / finalValues.sales);
  }

  if (finalValues.revenue && finalValues.revenue > 0 && finalValues.weeklyBudget && finalValues.weeklyBudget > 0) {
    finalValues.com = Number(((finalValues.weeklyBudget / finalValues.revenue) * 100).toFixed(1));
  }

  // Calculate funnel rates using reverse formulas
  if (finalValues.leads && finalValues.leads > 0 && finalValues.estimatesSet && finalValues.estimatesSet > 0) {
    finalValues.appointmentRate = Math.round((finalValues.estimatesSet / finalValues.leads) * 100);
  }
  
  if (finalValues.estimatesSet && finalValues.estimatesSet > 0 && finalValues.estimatesRan && finalValues.estimatesRan > 0) {
    finalValues.showRate = Math.round((finalValues.estimatesRan / finalValues.estimatesSet) * 100);
  }
  
  if (finalValues.estimatesRan && finalValues.estimatesRan > 0 && finalValues.sales && finalValues.sales > 0) {
    finalValues.closeRate = Math.round((finalValues.sales / finalValues.estimatesRan) * 100);
  }
  
  if (finalValues.leads && finalValues.leads > 0 && finalValues.sales && finalValues.sales > 0) {
    finalValues.leadToSale = Math.round((finalValues.sales / finalValues.leads) * 100);
  }

  return finalValues;
};

/**
 * Calculates fields for API data while preserving reverse-calculated values
 */
export const calculateFieldsForApiData = (
  inputValues: FieldValue,
  period: PeriodType = "monthly",
  daysInMonth: number = 30
): FieldValue => {
  const values = { ...inputValues };
  
  // Only calculate fields if they don't already exist (preserve reverse-calculated values)
  if (values.revenue !== undefined && values.avgJobSize !== undefined && values.sales === undefined) {
    values.sales = safeDivide(values.revenue, values.avgJobSize);
  }
  
  if (values.sales !== undefined && values.closeRate !== undefined && values.estimatesRan === undefined) {
    values.estimatesRan = safeDivide(values.sales, values.closeRate / 100);
  }
  
  if (values.estimatesRan !== undefined && values.showRate !== undefined && values.estimatesSet === undefined) {
    values.estimatesSet = safeDivide(values.estimatesRan, values.showRate / 100);
  }
  
  if (values.estimatesSet !== undefined && values.appointmentRate !== undefined && values.leads === undefined) {
    values.leads = safeDivide(values.estimatesSet, values.appointmentRate / 100);
  }

  // Calculate funnel rate
  if (values.appointmentRate !== undefined && values.showRate !== undefined && values.closeRate !== undefined) {
    values.leadToSale = (values.appointmentRate * values.showRate * values.closeRate) / 10000;
  }

  // Calculate budget fields based on period
  if (values.revenue !== undefined && values.com !== undefined) {
    const budgetPercentage = values.com / 100;
    
    switch (period) {
      case 'yearly':
        values.annualBudget = values.revenue * budgetPercentage;
        values.calculatedMonthlyBudget = values.annualBudget / 12;
        values.budget = values.annualBudget;
        break;
      case 'monthly':
        values.calculatedMonthlyBudget = values.revenue * budgetPercentage;
        values.budget = values.calculatedMonthlyBudget;
        break;
      case 'weekly':
        values.weeklyBudget = values.revenue * budgetPercentage;
        values.budget = values.weeklyBudget;
        break;
      case 'ytd':
        const currentMonth = new Date().getMonth();
        const monthsElapsed = currentMonth + 1;
        values.annualBudget = values.revenue * budgetPercentage;
        values.calculatedMonthlyBudget = values.annualBudget / 12;
        values.budget = values.calculatedMonthlyBudget * monthsElapsed;
        break;
    }
  }

  // Calculate daily budget
  if (values.budget !== undefined) {
    values.dailyBudget = values.budget / daysInMonth;
  }

  // Calculate cost metrics
  if (values.budget !== undefined) {
    if (values.leads !== undefined && values.leads > 0) {
      values.cpl = values.budget / values.leads;
    }
    if (values.estimatesSet !== undefined && values.estimatesSet > 0) {
      values.cpEstimateSet = values.budget / values.estimatesSet;
    }
    if (values.estimatesRan !== undefined && values.estimatesRan > 0) {
      values.cpEstimate = values.budget / values.estimatesRan;
    }
    if (values.sales !== undefined && values.sales > 0) {
      values.cpJobBooked = values.budget / values.sales;
    }
  }

  // Calculate management cost and total CoM%
  if (values.calculatedMonthlyBudget !== undefined) {
    if (values.revenue !== undefined && values.revenue > 0) {
      values.totalCom = ((values.calculatedMonthlyBudget + values.managementCost) / values.revenue) * 100;
    }
  }

  return values;
};

// ============================================================================
// TARGET VALIDATION UTILITIES
// ============================================================================

/**
 * Gets the default values for all input fields
 */
export function getDefaultValues(): FieldValue {
  const defaults: FieldValue = {};

  Object.values(targetFields).forEach((section: any) => {
    section.forEach((field: any) => {
      if (field.fieldType === "input" && field.defaultValue !== undefined) {
        defaults[field.value] = field.defaultValue;
      }
    });
  });

  return defaults;
}

/**
 * Validates input values against field constraints
 */
export function validateInputs(values: FieldValue): { [key: string]: string } {
  const errors: { [key: string]: string } = {};

  Object.values(targetFields).forEach((section: any) => {
    section.forEach((field: any) => {
      if (field.fieldType === "input") {
        const value = values[field.value];

        if (value === undefined || value === null) {
          errors[field.value] = `${field.name} is required`;
        } else if (field.min !== undefined && value < field.min) {
          errors[field.value] = `${field.name} must be at least ${field.min}`;
        } else if (field.max !== undefined && value > field.max) {
          errors[field.value] = `${field.name} must be at most ${field.max}`;
        }
      }
    });
  });

  return errors;
}

/**
 * Validates target fields and returns names of fields with zero values
 */
export const targetValidation = (
  inputFieldNames: string[],
  fieldValues: FieldValue
): string[] => {
  const zeroFields: string[] = [];

  inputFieldNames.forEach((name) => {
    if (fieldValues[name] === 0) {
      // Find the actual field name from targetFields
      let fieldName = name;
      for (const section of Object.values(targetFields)) {
        const field = section.find((f: FieldConfig) => f.value === name);
        if (field) {
          fieldName = field.name;
          break;
        }
      }
      zeroFields.push(fieldName);
    }
  });

  return zeroFields;
};

// ============================================================================
// TARGET DATA UTILITIES
// ============================================================================

/**
 * Get unique query types from current target data
 */
export const getUniqueQueryTypes = (currentTarget: any[] | null): string[] => {
  if (!currentTarget || currentTarget.length === 0) return [];
  
  let allTargetData: any[] = [];
  
  // Handle yearly data structure (array of 12 monthly arrays)
  if (currentTarget.length === 12 && Array.isArray(currentTarget[0])) {
    // Flatten all weeks from all months
    currentTarget.forEach(monthData => {
      if (Array.isArray(monthData)) {
        allTargetData = allTargetData.concat(monthData);
      }
    });
  } else {
    // Handle monthly/weekly data structure
    allTargetData = currentTarget;
  }
  
  const queryTypes = allTargetData
    .map((target) => target.queryType)
    .filter((queryType) => queryType && queryType.trim() !== "");
  return [...new Set(queryTypes)];
};

/**
 * Check if all query types are empty
 */
export const areAllQueryTypesEmpty = (currentTarget: any[] | null): boolean => {
  if (!currentTarget || currentTarget.length === 0) return true;
  
  let allTargetData: any[] = [];
  
  // Handle yearly data structure (array of 12 monthly arrays)
  if (currentTarget.length === 12 && Array.isArray(currentTarget[0])) {
    // Flatten all weeks from all months
    currentTarget.forEach(monthData => {
      if (Array.isArray(monthData)) {
        allTargetData = allTargetData.concat(monthData);
      }
    });
  } else {
    // Handle monthly/weekly data structure
    allTargetData = currentTarget;
  }
  
  return allTargetData.every(
    (target) => !target.queryType || target.queryType.trim() === ""
  );
};

// ============================================================================
// DATE VALIDATION UTILITIES
// ============================================================================

/**
 * Determines how many weeks are in a given month
 * A week is considered part of the month if it has 4 or more days in that month
 * Weeks start on Monday and end on Sunday
 */
export const getWeeksInMonth = (date: Date): number => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  
  // Get the Monday of the week that contains the first day of the month
  const firstWeekStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  
  // Get the Sunday of the week that contains the last day of the month
  const lastWeekEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  // Generate all weeks that overlap with the month
  const weeks = eachWeekOfInterval(
    { start: firstWeekStart, end: lastWeekEnd },
    { weekStartsOn: 1 }
  );
  
  let weekCount = 0;
  
  weeks.forEach(weekStart => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    
    // Count how many days of this week fall within the month
    let daysInMonth = 0;
    let currentDay = weekStart;
    
    while (currentDay <= weekEnd) {
      if (isSameMonth(currentDay, date)) {
        daysInMonth++;
      }
      currentDay = addDays(currentDay, 1);
    }
    
    // If 4 or more days of this week are in the month, count it
    if (daysInMonth >= 4) {
      weekCount++;
    }
  });
  
  return weekCount;
};

/**
 * Check if the selected time frame is editable (not in the past)
 */
export const isTimeFrameEditable = (
  period: PeriodType,
  selectedDate: Date
): boolean => {
  const currentDate = new Date();

  switch (period) {
    case "weekly":
      const selectedWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const nextSunday = endOfWeek(currentDate, { weekStartsOn: 1 });
      return isAfter(selectedWeekStart, nextSunday);
    case "monthly":
      const currentMonthStart = startOfMonth(currentDate);
      const selectedMonthStart = startOfMonth(selectedDate);
      const nextMonthStart = new Date(currentMonthStart);
      nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);
      return !isBefore(selectedMonthStart, nextMonthStart);
    case "yearly":
      const currentYearStart = startOfYear(currentDate);
      const selectedYearStart = startOfYear(selectedDate);
      return !isBefore(selectedYearStart, currentYearStart);
    case "ytd":
      const currentYearStartYTD = startOfYear(currentDate);
      const selectedYearStartYTD = startOfYear(selectedDate);
      // For YTD, allow current year as it's ongoing
      return !isBefore(selectedYearStartYTD, currentYearStartYTD);
    default:
      return true;
  }
}; 