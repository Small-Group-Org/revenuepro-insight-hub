import { DisableMetadata, FieldConfig, FieldValue, PeriodType } from "@/types";
import { targetFields } from "./constant";
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
  getDay,
  addDays,
} from "date-fns";
import { getWeekInfo, formatWeekRange } from "./weekLogic";

// Utility for formatting
export const formatCurrency = (val: number) => {
  if (isNaN(val) || !isFinite(val)) return "$0";
  return `$${Math.round(val).toLocaleString()}`;
};

export const formatPercent = (val: number) => {
  if (isNaN(val) || !isFinite(val)) return "0.00%";
  return `${Math.round(val).toFixed(2)}%`;
};

// New function to format numbers without currency symbol
export const formatNumber = (val: number) => {
  if (isNaN(val) || !isFinite(val)) return "0";
  return Math.round(val).toLocaleString();
};

// Safe calculation utilities
export const safePercentage = (value: number, defaultValue: number = 0): number => {
  if (isNaN(value) || !isFinite(value)) {
    return defaultValue;
  }
  return value;
};

// Management cost calculation based on ad spend
export const calculateManagementCost = (adSpend: number): number => {
  if (adSpend >= 2500 && adSpend <= 5000) return 2000;
  if (adSpend >= 5001 && adSpend <= 10000) return 2500;
  if (adSpend >= 10001 && adSpend <= 15000) return 3000;
  if (adSpend >= 15001 && adSpend <= 20000) return 3500;
  if (adSpend >= 20001 && adSpend <= 25000) return 4000;
  if (adSpend >= 25001 && adSpend <= 30000) return 4500;
  if (adSpend >= 30001 && adSpend <= 35000) return 5000;
  if (adSpend >= 35001 && adSpend <= 40000) return 5500;
  if (adSpend >= 40001 && adSpend <= 45000) return 6000;
  if (adSpend >= 45001 && adSpend <= 50000) return 6500;
  if (adSpend >= 50001 && adSpend <= 55000) return 7000;
  if (adSpend >= 55001 && adSpend <= 60000) return 7500;
  if (adSpend >= 60001 && adSpend <= 65000) return 8000;
  if (adSpend >= 65001 && adSpend <= 70000) return 8500;
  return 0;
};

// Get days in month for a given date
export const getDaysInMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

/**
 * Determines how many weeks are in a given month
 * A week is considered part of the month if it has 4 or more days in that month
 * Weeks start on Monday and end on Sunday
 * @param date - Any date in the month to check
 * @returns Number of weeks in the month
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
 * Main calculation function that handles all field calculations
 */
export const calculateFields = (
  inputValues: FieldValue,
  period: PeriodType = "monthly",
  daysInMonth: number = 30
): FieldValue => {
  const values = { ...inputValues };
  
  // Calculate budget fields based on input values (for user input changes)
  if (values.revenue !== undefined && values.avgJobSize !== undefined) {
    values.sales = values.revenue / values.avgJobSize;
  }
  
  if (values.sales !== undefined && values.closeRate !== undefined) {
    values.estimatesRan = values.sales / (values.closeRate / 100);
  }
  
  if (values.estimatesRan !== undefined && values.showRate !== undefined) {
    values.estimatesSet = values.estimatesRan / (values.showRate / 100);
  }
  
  if (values.estimatesSet !== undefined && values.appointmentRate !== undefined) {
    values.leads = values.estimatesSet / (values.appointmentRate / 100);
  }

  // Calculate funnel rate
  if (values.appointmentRate !== undefined && values.showRate !== undefined && values.closeRate !== undefined) {
    values.leadToSale = (values.appointmentRate * values.showRate * values.closeRate) / 10000;
  }

  // Calculate budget fields based on period
  if (values.revenue !== undefined && values.com !== undefined) {
    if (period === 'yearly') {
      values.annualBudget = values.revenue * (values.com / 100);
      values.calculatedMonthlyBudget = values.annualBudget / 12;
      values.budget = values.annualBudget;
    } else if (period === 'monthly') {
      values.calculatedMonthlyBudget = values.revenue * (values.com / 100);
      values.budget = values.calculatedMonthlyBudget;
    } else if (period === 'weekly') {
      values.weeklyBudget = values.revenue * (values.com / 100);
      values.budget = values.weeklyBudget;
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
    values.managementCost = calculateManagementCost(values.calculatedMonthlyBudget);
    
    if (values.revenue !== undefined && values.revenue > 0) {
      values.totalCom = ((values.calculatedMonthlyBudget + values.managementCost) / values.revenue) * 100;
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

  // For weekly period, use normal forward calculation (like before)
  if (currentTarget.length === 1) {
    const weekData = currentTarget[0];
    const weekValues: FieldValue = {
      revenue: weekData.revenue || 0,
      avgJobSize: weekData.avgJobSize || 0,
      appointmentRate: weekData.appointmentRate || 0,
      showRate: weekData.showRate || 0,
      closeRate: weekData.closeRate || 0,
      com: weekData.com || 0,
    };

    // Use normal forward calculation for weekly
    return calculateFieldsForApiData(weekValues, 'weekly', 7);
  }

  // For monthly/yearly periods, use the new reverse calculation flow
  // Calculate budget fields for each week individually
  const weeklyCalculations = currentTarget.map(weekData => {
    const weekValues: FieldValue = {
      revenue: weekData.revenue || 0,
      avgJobSize: weekData.avgJobSize || 0,
      appointmentRate: weekData.appointmentRate || 0,
      showRate: weekData.showRate || 0,
      closeRate: weekData.closeRate || 0,
      com: weekData.com || 0,
    };

    weekValues.sales = weekValues.revenue / weekValues.avgJobSize;
    weekValues.estimatesRan = weekValues.sales / (weekValues.closeRate / 100);
    weekValues.estimatesSet = weekValues.estimatesRan / (weekValues.showRate / 100);
    weekValues.leads = weekValues.estimatesSet / (weekValues.appointmentRate / 100);
    weekValues.weeklyBudget = weekValues.revenue * (weekValues.com / 100);

    return weekValues;
  });

  const aggregatedValues = aggregateWeeklyFields(weeklyCalculations);  
  const finalValues: FieldValue = {
    ...getDefaultValues(),
    ...aggregatedValues,
  };

  // Calculate avgJobSize using reverse formula: revenue / sales
  if (finalValues.revenue && finalValues.revenue > 0 && finalValues.sales && finalValues.sales > 0) {
    finalValues.avgJobSize = Math.round(finalValues.revenue / finalValues.sales);
  }

  // Calculate COM% using reverse formula: (aggregated weekly budget / total revenue) * 100
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
 * This function is used specifically for API data processing
 */
export const calculateFieldsForApiData = (
  inputValues: FieldValue,
  period: PeriodType = "monthly",
  daysInMonth: number = 30
): FieldValue => {
  const values = { ...inputValues };
  
  // Only calculate budget fields if they don't already exist (preserve reverse-calculated values)
  // Note: avgJobSize and com are now calculated using reverse formulas for monthly/yearly periods
  if (values.revenue !== undefined && values.avgJobSize !== undefined && values.sales === undefined) {
    values.sales = values.revenue / values.avgJobSize;
  }
  
  if (values.sales !== undefined && values.closeRate !== undefined && values.estimatesRan === undefined) {
    values.estimatesRan = values.sales / (values.closeRate / 100);
  }
  
  if (values.estimatesRan !== undefined && values.showRate !== undefined && values.estimatesSet === undefined) {
    values.estimatesSet = values.estimatesRan / (values.showRate / 100);
  }
  
  if (values.estimatesSet !== undefined && values.appointmentRate !== undefined && values.leads === undefined) {
    values.leads = values.estimatesSet / (values.appointmentRate / 100);
  }

  // Calculate funnel rate
  if (values.appointmentRate !== undefined && values.showRate !== undefined && values.closeRate !== undefined) {
    values.leadToSale = (values.appointmentRate * values.showRate * values.closeRate) / 10000;
  }

  // Calculate budget fields based on period
  if (values.revenue !== undefined && values.com !== undefined) {
    if (period === 'yearly') {
      values.annualBudget = values.revenue * (values.com / 100);
      values.calculatedMonthlyBudget = values.annualBudget / 12;
      values.budget = values.annualBudget;
    } else if (period === 'monthly') {
      values.calculatedMonthlyBudget = values.revenue * (values.com / 100);
      values.budget = values.calculatedMonthlyBudget;
    } else if (period === 'weekly') {
      values.weeklyBudget = values.revenue * (values.com / 100);
      values.budget = values.weeklyBudget;
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
    values.managementCost = calculateManagementCost(values.calculatedMonthlyBudget);
    
    if (values.revenue !== undefined && values.revenue > 0) {
      values.totalCom = ((values.calculatedMonthlyBudget + values.managementCost) / values.revenue) * 100;
    }
  }

  return values;
};

/**
 * Legacy function for backward compatibility
 */
export function calculateAllFields(
  inputValues: FieldValue,
  daysInMonth: number,
  period: PeriodType = "monthly"
): FieldValue {
  return calculateFields(inputValues, period, daysInMonth);
}

/**
 * Legacy function for backward compatibility
 */
export const calculateWeeklyBudgetFields = (weekData: FieldValue): FieldValue => {
  return calculateWeeklyFields(weekData);
};

/**
 * Legacy function for backward compatibility
 */
export const aggregateWeeklyBudgetFields = (weeklyData: FieldValue[]): FieldValue => {
  return aggregateWeeklyFields(weeklyData);
};

/**
 * Calculates reporting fields for actual data entry
 */
export function calculateReportingFields(inputValues: FieldValue): FieldValue {
  const allValues = { ...inputValues };
  
  // Calculate budget report fields
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
 * Gets the default values for all input fields
 * @returns Object containing default values
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
 * @param values - Object containing field values
 * @returns Object containing validation errors
 */
export function validateInputs(values: FieldValue): { [key: string]: string } {
  const { targetFields } = require("./constant");
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

export const targetValidation = (
  inputFieldNames: string[],
  fieldValues: FieldValue
) => {
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

/**
 * Check if the selected time frame is editable (not in the past)
 */
export const isTimeFrameEditable = (
  period: PeriodType,
  selectedDate: Date
): boolean => {
  const currentDate = new Date();

  if (period === "weekly") {
    const selectedWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const nextSunday = endOfWeek(currentDate, { weekStartsOn: 1 });
    return isAfter(selectedWeekStart, nextSunday);
  } else if (period === "monthly") {
    const currentMonthStart = startOfMonth(currentDate);
    const selectedMonthStart = startOfMonth(selectedDate);
    const nextMonthStart = new Date(currentMonthStart);
    nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);
    return !isBefore(selectedMonthStart, nextMonthStart);
  } else if (period === "yearly") {
    const currentYearStart = startOfYear(currentDate);
    const selectedYearStart = startOfYear(selectedDate);
    return !isBefore(selectedYearStart, currentYearStart);
  }

  return true;
};

/**
 * Check if the selected time frame is in the past (for actual data entry)
 */
export const isTimeFrameInPast = (
  period: PeriodType,
  selectedDate: Date
): boolean => {
  const currentDate = new Date();

  if (period === "weekly") {
    const selectedWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    return isBefore(selectedWeekStart, currentWeekStart);
  } else if (period === "monthly") {
    const selectedMonthStart = startOfMonth(selectedDate);
    const currentMonthStart = startOfMonth(currentDate);
    // For monthly period, allow current month as well (not just past months)
    return !isAfter(selectedMonthStart, currentMonthStart);
  } else if (period === "yearly") {
    const selectedYearStart = startOfYear(selectedDate);
    const currentYearStart = startOfYear(currentDate);
    return !isAfter(selectedYearStart, currentYearStart);
  }

  return false;
};

/**
 * Get unique query types from current target data
 */
export const getUniqueQueryTypes = (currentTarget: any[] | null): string[] => {
  if (!currentTarget || currentTarget.length === 0) return [];
  const queryTypes = currentTarget
    .map((target) => target.queryType)
    .filter((queryType) => queryType && queryType.trim() !== "");
  return [...new Set(queryTypes)];
};

/**
 * Check if all query types are empty
 */
export const areAllQueryTypesEmpty = (currentTarget: any[] | null): boolean => {
  if (!currentTarget || currentTarget.length === 0) return true;
  return currentTarget.every(
    (target) => !target.queryType || target.queryType.trim() === ""
  );
};

/**
 * Unified disable logic that combines past date validation and target status logic
 * This function handles all disable scenarios for both SetTargets and AddActualData pages
 */
export const handleInputDisable = (
  period: PeriodType,
  selectedDate: Date,
  currentTarget: any[] | null = null,
  pageType: "setTargets" | "addActualData" = "setTargets"
): DisableMetadata => {
  const currentDate = new Date();
  let isDisabled = false;
  let disabledMessage: string | null = null;
  let noteMessage: string | null = null;
  let shouldDisableNonRevenueFields = false;
  let isButtonDisabled = false;

  // For AddActualData page, check if the time frame is in the past (only past dates allowed)
  if (pageType === "addActualData") {
    const isInPast = isTimeFrameInPast(period, selectedDate);
    if (!isInPast) {
      // Future date logic for actual data - disable everything
      isDisabled = true;
      isButtonDisabled = true;
      disabledMessage = "Actual data can only be entered for past dates";
      return {
        isDisabled,
        disabledMessage,
        noteMessage,
        shouldDisableNonRevenueFields,
        isButtonDisabled,
      };
    }
  } else {
    // For SetTargets page, check if the time frame is editable (not in the past)
    const isEditable = isTimeFrameEditable(period, selectedDate);
    if (!isEditable) {
      // Past date logic - disable everything
      isDisabled = true;
      isButtonDisabled = true;
      disabledMessage = "Past Targets cannot be updated";
      return {
        isDisabled,
        disabledMessage,
        noteMessage,
        shouldDisableNonRevenueFields,
        isButtonDisabled,
      };
    }
  }

  if (pageType === "addActualData" && period !== "weekly") {
    isDisabled = true;
    isButtonDisabled = true;
    noteMessage = "Reporting data can only be added in week view";
    return {
      isDisabled,
      disabledMessage,
      noteMessage,
      shouldDisableNonRevenueFields,
      isButtonDisabled,
    };
  }

  // Target status logic (only for SetTargets page and when time frame is editable)
  if (pageType === "setTargets" && currentTarget) {
    const queryTypes = getUniqueQueryTypes(currentTarget);
    const hasTargets = queryTypes.length > 0;

    // Generate note messages based on target status
    if (period === "yearly") {
      if (
        hasTargets &&
        queryTypes.includes("monthly") &&
        queryTypes.length === 1
      ) {
        noteMessage =
          "You have not set target for this year. These are values are calculated using months previous target";
      }
    } else if (period === "monthly") {
      if (queryTypes.includes("yearly")) {
        const monthName = format(selectedDate, "MMMM");
        noteMessage = `The target for ${monthName} is already set on yearly basis. You can only update the revenue of ${monthName}`;
        shouldDisableNonRevenueFields = true;
        disabledMessage = noteMessage;
      }
    }
    // Removed weekly restrictions - users can now set weekly targets for any upcoming week
  }

  return {
    isDisabled,
    disabledMessage,
    noteMessage,
    shouldDisableNonRevenueFields,
    isButtonDisabled,
  };
};
