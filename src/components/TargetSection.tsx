import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldConfig, InputField, CalculatedField, FieldValue } from "@/types";
import { formatCurrency, formatPercent, calculateManagementCost } from "@/utils/utils";

interface TargetSectionProps {
  sectionKey: string;
  title: string;
  icon: React.ReactNode;
  gradientClass: string;
  fields: FieldConfig[];
  fieldValues: FieldValue;
  calculatedValues: FieldValue;
  onInputChange: (fieldName: string, value: number) => void;
  isHighlighted: (fieldName: string) => boolean;
  isLoading?: boolean;
}

export const TargetSection: React.FC<TargetSectionProps> = ({
  title,
  icon,
  gradientClass,
  fields,
  fieldValues,
  calculatedValues,
  onInputChange,
  isHighlighted,
  isLoading = false,
}) => {
  const renderInputField = (field: InputField) => {
    const value = fieldValues[field.value] || 0;
    
    return (
      <div key={field.value} className="space-y-2">
        <Label htmlFor={field.value} className="text-sm font-medium text-gray-700">
          {field.name}
        </Label>
        <div className="relative">
          <Input
            id={field.value}
            type={field.type || "number"}
            min={field.min}
            max={field.max}
            step={field.step || 1}
            value={value}
            onChange={(e) => {
              const inputValue = e.target.value;
              const numValue = inputValue === '' ? 0 : Number(inputValue);
              onInputChange(field.value, numValue);
            }}
            onFocus={(e) => e.target.select()}
            onWheel={(e) => e.currentTarget.blur()}
            className="appearance-none pr-12"
            style={{ MozAppearance: 'textfield' }}
            disabled={isLoading}
          />
          {field.unit && (
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              {field.unit}
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderCalculatedField = (field: CalculatedField) => {
    let value = calculatedValues[field.value] || 0;
    const isHighlightedField = isHighlighted(field.value);
    
    if (field.value === 'managementCost') {
      const monthlyBudget = calculatedValues.calculatedMonthlyBudget || 0;
      value = calculateManagementCost(monthlyBudget);
    }
    
    return (
      <div 
        key={field.value} 
        className={`bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm p-3 rounded-xl border border-gray-200/40 ${
          isHighlightedField 
            ? 'bg-gradient-to-r from-sky-100/80 border-blue-200 via-blue-100/80 to-transparentd border-sky-200/60' 
            : 'hover:shadow-mdd'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-900">{field.name}</div>
            {field.description && (
              <div className="text-[10px] mt-[2px] text-gray-500">{field.description}</div>
            )}
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {field.unit === '$' ? formatCurrency(Math.round(value)) : 
             field.unit === '%' ? formatPercent(Math.round(value)) : 
             isNaN(value) ? 0 : Math.round(value)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xld">
      <div className={`p-6 border-b border-gray-100/50 ${gradientClass}`}>
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {title}
          </h2>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          {fields
            .filter((field: FieldConfig): field is InputField => field.fieldType === 'input')
            .map(renderInputField)}
        </div>

        <div className="space-y-3">
          {fields
            .filter((field: FieldConfig): field is CalculatedField => field.fieldType === 'calculated')
            .map(renderCalculatedField)}
        </div>
      </div>
    </Card>
  );
}; 