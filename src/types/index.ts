export type PeriodType = 'weekly' | 'monthly' | 'yearly';

export interface InputField {
  name: string;
  value: string;
  type: "number";
  min?: number;
  max?: number;
  defaultValue: number;
  fieldType: "input";
  step?: number;
  unit?: string;
  applicable?: PeriodType[];
  isHidden?: boolean;
}

export interface CalculatedField {
  name: string;
  value: string;
  fieldType: "calculated";
  formula: string;
  description?: string;
  unit?: string;
  applicable?: PeriodType[];
  isHidden?: boolean;
}

export type FieldConfig = InputField | CalculatedField;

export interface TargetFieldsConfig {
  funnelRate: FieldConfig[];
  budget: FieldConfig[];
  budgetTarget: FieldConfig[];
}

export interface FieldValue {
    [key: string]: number;
  }
  
  export interface FormulaContext {
    values: FieldValue;
    daysInMonth: number;
    period?: PeriodType;
  }
  
