import { FieldValue, FormulaContext } from "@/types";
import { targetFields } from "./constant";

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
  export function evaluateFormula(formula: string, context: FormulaContext): number {
    const { values, daysInMonth } = context;
    
    // Create a safe evaluation environment
    const safeEval = (expression: string): number => {
      try {
        // Replace variable names with their values
        let processedExpression = expression;
        
        // Handle special functions
        if (expression.includes('calculateManagementCost')) {
          const argMatch = expression.match(/calculateManagementCost\(([^)]+)\)/);
          if (argMatch) {
            const arg = evaluateFormula(argMatch[1], context);
            return calculateManagementCost(arg);
          }
        }
        
        // Replace all variable references with their values
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
   * @returns Object containing all calculated values
   */
  export function calculateAllFields(inputValues: FieldValue, daysInMonth: number): FieldValue {
    const allValues = { ...inputValues };
    const context: FormulaContext = { values: allValues, daysInMonth };
    
    // Calculate fields in dependency order
    const calculateSection = (sectionKey: keyof typeof targetFields) => {
      targetFields[sectionKey].forEach((field: any) => {
        if (field.fieldType === 'calculated' && field.formula) {
          allValues[field.value] = evaluateFormula(field.formula, context);
        }
      });
    };
    
    // Calculate in order: funnelRate, budget, budgetTarget
    calculateSection('funnelRate');
    calculateSection('budget');
    calculateSection('budgetTarget');
    
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