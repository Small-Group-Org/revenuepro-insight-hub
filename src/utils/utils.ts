import { FieldValue, FormulaContext, PeriodType } from "@/types";
import { targetFields } from "./constant";
import { startOfWeek, endOfWeek, isAfter, startOfMonth, isBefore, startOfYear } from "date-fns";

// Utility for formatting
export const formatCurrency = (val: number) => {
  if (isNaN(val) || !isFinite(val)) return "$0";
  return `$${val.toLocaleString()}`;
};
export const formatPercent = (val: number) => {
  if (isNaN(val) || !isFinite(val)) return "0.00%";
  return `${val.toFixed(2)}%`;
};

// Safe calculation utilities to prevent NaN values
export const safeDivide = (
  numerator: number,
  denominator: number,
  defaultValue: number = 0
): number => {
  if (denominator === 0 || isNaN(denominator) || isNaN(numerator)) {
    return defaultValue;
  }
  const result = numerator / denominator;
  return isNaN(result) ? defaultValue : result;
};

export const safeRound = (value: number, defaultValue: number = 0): number => {
  if (isNaN(value) || !isFinite(value)) {
    return defaultValue;
  }
  return Math.round(value);
};

export const safePercentage = (
  value: number,
  defaultValue: number = 0
): number => {
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
  if(adSpend >= 35001 && adSpend <= 40000) return 5500;
  if(adSpend >= 40001 && adSpend <= 45000) return 6000;
  if(adSpend >= 45001 && adSpend <= 50000) return 6500;
  if(adSpend >= 50001 && adSpend <= 55000) return 7000;
  if(adSpend >= 55001 && adSpend <= 60000) return 7500;
  if(adSpend >= 60001 && adSpend <= 65000) return 8000;
  if(adSpend >= 65001 && adSpend <= 70000) return 8500;
  return 0;
};

// Get days in month for a given date
export const getDaysInMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

  /**
   * Evaluates a formula string using the provided context values
   * @param formula - The formula string to evaluate
   * @param context - Object containing values and additional context
   * @returns The calculated result
   */
  export function evaluateFormula(formula: string, context: FormulaContext, fieldValue?: string): number {
    const { values, daysInMonth, period } = context;
    
    // Create a safe evaluation environment
    const safeEval = (expression: string): number => {
      try {
        // Replace variable names with their values
        let processedExpression = expression;
        
        // Handle special functions
        if (expression.includes('calculateManagementCost')) {
          const argMatch = expression.match(/calculateManagementCost\(([^)]+)\)/);
          if (argMatch) {
            const arg = evaluateFormula(argMatch[1], context, fieldValue);
            return calculateManagementCost(arg);
          }
        }
        
        // Handle budget field calculation based on period
        if (fieldValue === 'budget') {
          if (period === 'yearly') {
            return values.annualBudget || 0;
          } else {
            return values.calculatedMonthlyBudget || 0;
          }
        }
        
        // Handle calculatedMonthlyBudget field calculation
        if (fieldValue === 'calculatedMonthlyBudget') {
          if (period === 'yearly') {
            const annualBudget = values.annualBudget || 0;
            return annualBudget / 12;
          } else {
            const revenue = values.revenue || 0;
            const com = values.com || 0;
            return revenue * (com / 100);
          }
        }
        
        // Handle annualBudget field calculation
        if (fieldValue === 'annualBudget') {
          const revenue = values.revenue || 0;
          const com = values.com || 0;
          return revenue * (com / 100);
        }
        
        // Replace budget references in formulas with the appropriate value based on period
        if (expression.includes('budget')) {
          const budgetValue = period === 'yearly' ? (values.annualBudget || 0) : (values.calculatedMonthlyBudget || 0);
          processedExpression = processedExpression.replace(/\bbudget\b/g, budgetValue.toString());
        }
        
        Object.keys(values).forEach(key => {
          const regex = new RegExp(`\\b${key}\\b`, 'g');
          processedExpression = processedExpression.replace(regex, values[key].toString());
        });
        
        // Replace daysInMonth
        processedExpression = processedExpression.replace(/\bdaysInMonth\b/g, daysInMonth.toString());
        
        // Evaluate the expression
        const result = Function('"use strict"; return (' + processedExpression + ')')();
        return isNaN(result) ? 0 : result;
      } catch (error) {
        console.error('Formula evaluation error:', error, 'Formula:', formula);
        return 0;
      }
    };
    
    return safeEval(formula);
  }
  
  /**
   * Calculates all calculated fields based on input values
   * @param inputValues - Object containing input field values
   * @param daysInMonth - Number of days in the current month
   * @param period - The selected period (weekly, monthly, yearly)
   * @returns Object containing all calculated values
   */
  export function calculateAllFields(inputValues: FieldValue, daysInMonth: number, period: PeriodType = 'monthly'): FieldValue {
    const allValues = { ...inputValues };
    const context: FormulaContext = { values: allValues, daysInMonth, period };

    const calculateSection = (sectionKey: keyof typeof targetFields) => {
      targetFields[sectionKey].forEach((field: any) => {
        if (field.fieldType === 'calculated' && field.formula) {
          const calculatedValue = evaluateFormula(field.formula, context, field.value);
          allValues[field.value] = Math.round(calculatedValue);
        }
      });
    };

    const calculateBudgetSection = () => {
      // Calculate budget section fields in dependency order
      const budgetFields = targetFields.budget;
      
      // First, calculate sales (depends on revenue and avgJobSize)
      const salesField = budgetFields.find((field: any) => field.value === 'sales');
      if (salesField && salesField.fieldType === 'calculated' && salesField.formula) {
        const salesValue = evaluateFormula(salesField.formula, context, 'sales');
        allValues['sales'] = Math.round(salesValue);
      }
      
      // Then calculate estimatesRan (depends on sales)
      const estimatesRanField = budgetFields.find((field: any) => field.value === 'estimatesRan');
      if (estimatesRanField && estimatesRanField.fieldType === 'calculated' && estimatesRanField.formula) {
        const estimatesRanValue = evaluateFormula(estimatesRanField.formula, context, 'estimatesRan');
        allValues['estimatesRan'] = Math.round(estimatesRanValue);
      }
      
      // Then calculate estimatesSet (depends on estimatesRan)
      const estimatesSetField = budgetFields.find((field: any) => field.value === 'estimatesSet');
      if (estimatesSetField && estimatesSetField.fieldType === 'calculated' && estimatesSetField.formula) {
        const estimatesSetValue = evaluateFormula(estimatesSetField.formula, context, 'estimatesSet');
        allValues['estimatesSet'] = Math.round(estimatesSetValue);
      }
      
      // Finally calculate leads (depends on estimatesSet)
      const leadsField = budgetFields.find((field: any) => field.value === 'leads');
      if (leadsField && leadsField.fieldType === 'calculated' && leadsField.formula) {
        const leadsValue = evaluateFormula(leadsField.formula, context, 'leads');
        allValues['leads'] = Math.round(leadsValue);
      }
    };
    
    // Calculate in order: funnelRate, budget (with proper dependency order), budgetTarget
    calculateSection('funnelRate');
    calculateBudgetSection();
    
    // Calculate budget field specifically to ensure it's available for budgetTarget calculations
    const budgetField = targetFields.budgetTarget.find((field: any) => field.value === 'budget');
    if (budgetField && budgetField.fieldType === 'calculated' && budgetField.formula) {
      const budgetValue = evaluateFormula(budgetField.formula, context, 'budget');
      allValues['budget'] = Math.round(budgetValue);
    }
    
    calculateSection('budgetTarget');
    
    return allValues;
  }

export function calculateReportingFields(inputValues: FieldValue): FieldValue {
  const allValues = { ...inputValues };
  const context: FormulaContext = { values: allValues, daysInMonth: 30, period: 'weekly' };

  // Calculate budget report fields
  const budgetSpent = (allValues.testingBudgetSpent || 0) + 
                     (allValues.awarenessBrandingBudgetSpent || 0) + 
                     (allValues.leadGenerationBudgetSpent || 0);
  allValues.budgetSpent = budgetSpent;

  // Calculate over/under budget (assuming budget is available)
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
        if (field.fieldType === 'input' && field.defaultValue !== undefined) {
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
    const { targetFields } = require('./constant');
    const errors: { [key: string]: string } = {};
    
    Object.values(targetFields).forEach((section: any) => {
      section.forEach((field: any) => {
        if (field.fieldType === 'input') {
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

export interface DisableLogicResult {
  isDisabled: boolean;
  disabledMessage: string;
  isButtonDisabled: boolean;
}

/**
 * Calculate disable logic for AddActualData page
 * - Only allows weekly periods for editing
 * - Disables future dates
 */
export const calculateAddActualDataDisableLogic = (
  period: PeriodType,
  selectedDate: Date
): DisableLogicResult => {
  const currentDate = new Date();
  
  // Check if selected date is in the future (only for weekly periods)
  if (period === 'weekly') {
    const selectedWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const isFutureDate = isAfter(selectedWeekStart, currentWeekStart);
    
    if (isFutureDate) {
      return {
        isDisabled: true,
        disabledMessage: 'Future dates cannot be edited',
        isButtonDisabled: true
      };
    }
  }
  
  // For non-weekly periods, only disable the button, not the inputs
  if (period !== 'weekly') {
    return {
      isDisabled: false,
      disabledMessage: 'Only weekly data can be edited in this view',
      isButtonDisabled: true
    };
  }
  
  return {
    isDisabled: false,
    disabledMessage: '',
    isButtonDisabled: false
  };
};

/**
 * Calculate disable logic for SetTargets page (original logic)
 * - Allows all periods
 * - Disables past dates
 */
export const calculateSetTargetsDisableLogic = (
  period: PeriodType,
  selectedDate: Date
): DisableLogicResult => {
  if (!selectedDate) {
    return {
      isDisabled: false,
      disabledMessage: '',
      isButtonDisabled: false
    };
  }

  const currentDate = new Date();

  if (period === "weekly") {
    const selectedWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const nextSunday = endOfWeek(currentDate, { weekStartsOn: 1 });
    const shouldDisable = !isAfter(selectedWeekStart, nextSunday);
    return {
      isDisabled: shouldDisable,
      disabledMessage: shouldDisable ? 'Past Targets cannot be updated' : '',
      isButtonDisabled: shouldDisable
    };
  } else if (period === "monthly") {
    const currentMonthStart = startOfMonth(currentDate);
    const selectedMonthStart = startOfMonth(selectedDate);
    const nextMonthStart = new Date(currentMonthStart);
    nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);
    const shouldDisable = isBefore(selectedMonthStart, nextMonthStart);
    return {
      isDisabled: shouldDisable,
      disabledMessage: shouldDisable ? 'Past Targets cannot be updated' : '',
      isButtonDisabled: shouldDisable
    };
  } else if (period === "yearly") {
    const currentYearStart = startOfYear(currentDate);
    const selectedYearStart = startOfYear(selectedDate);
    const shouldDisable = isBefore(selectedYearStart, currentYearStart);
    return {
      isDisabled: shouldDisable,
      disabledMessage: shouldDisable ? 'Past Targets cannot be updated' : '',
      isButtonDisabled: shouldDisable
    };
  }

  return {
    isDisabled: false,
    disabledMessage: '',
    isButtonDisabled: false
  };
}; 