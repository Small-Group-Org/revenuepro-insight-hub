import React, { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import {
  FieldConfig,
  InputField,
  CalculatedField,
  FieldValue,
  PeriodType,
} from "@/types";
import {
  formatCurrency,
  formatPercent,
  calculateManagementCost,
} from "@/utils/utils";
import { useTargetStore } from "@/stores/targetStore";

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
  period?: PeriodType;
  selectedDate?: Date;
  isDisabled?: boolean; // New prop for disable state
  disabledMessage?: string; // New prop for disable message
  showTarget?: boolean;
}

export const TargetSection: React.FC<TargetSectionProps> = ({
  sectionKey,
  title,
  icon,
  gradientClass,
  fields,
  fieldValues,
  calculatedValues,
  onInputChange,
  isHighlighted,
  isLoading = false,
  period = "monthly",
  selectedDate,
  isDisabled = false,
  disabledMessage,
  showTarget = false
}) => {
  const { currentTarget } = useTargetStore();

  const filterFieldsByPeriod = (fields: FieldConfig[]): FieldConfig[] => {
    return fields.filter((field) => {
      if (field.isHidden) return false;

      if (!field.applicable) return true;

      return field.applicable.includes(period);
    });
  };

  const filteredFields = filterFieldsByPeriod(fields);

  const renderInputField = (field: InputField) => {
    const value = fieldValues[field.value] || 0;

    return (
      <div key={field.value} className="space-y-2">
        <Label
          htmlFor={field.value}
          className="flex items-center justify-between"
        >
          <span className="text-sm font-medium text-gray-700">{field.name}</span>
          <span className="text-[10px] text-gray-500">
            {showTarget ? `Target: ${10}` : ""}
          </span>
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
              const numValue = inputValue === "" ? 0 : Number(inputValue);
              onInputChange(field.value, numValue);
            }}
            onFocus={(e) => e.target.select()}
            onWheel={(e) => e.currentTarget.blur()}
            className={`appearance-none pr-12 ${
              isDisabled
                ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                : ""
            }`}
            style={{ MozAppearance: "textfield" }}
            disabled={isLoading || isDisabled}
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

    if (field.value === "managementCost") {
      const monthlyBudget = calculatedValues.calculatedMonthlyBudget || 0;
      
      if(period === "monthly"){
        value = calculateManagementCost(monthlyBudget);
      } else if(period === "yearly"){
        value = calculateManagementCost(monthlyBudget)*12;
      } else {
        value = calculateManagementCost(monthlyBudget) / (currentTarget?.length || 1);
      }
    }

    // Calculate per-week value for monthly budget
    const perWeekValue =
      period === "monthly" && sectionKey === "budget" && currentTarget?.length
        ? Math.round(value / currentTarget.length)
        : null;

    return (
      <div
        key={field.value}
        className={`bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm p-3 rounded-xl border border-gray-200/40 ${
          isHighlightedField
            ? "bg-gradient-to-r from-sky-100/80 border-blue-200 via-blue-100/80 to-transparentd border-sky-200/60"
            : "hover:shadow-mdd"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">
              {field.name}
            </div>
            {field.description && (
              <div className="text-[10px] mt-[2px] text-gray-500">
                {field.description}
              </div>
            )}
          </div>
          <div className="text-right">
            <span className="text-sm font-semibold text-gray-900">
              {field.unit === "$"
                ? formatCurrency(Math.round(value))
                : field.unit === "%"
                ? formatPercent(Math.round(value))
                : isNaN(value)
                ? 0
                : Math.round(value)}
            </span>
          </div>
        </div>

        {/* Enhanced per-week breakdown for monthly budget */}
        {perWeekValue !== null && (
          <div className="mt-3 pt-3 border-t border-gray-200/40">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="">
                  <span className="text-xs font-medium text-gray-700">
                    Weekly Allocation
                  </span>
                  <div className="text-[10px] text-gray-500">
                  {currentTarget?.length || 0} weeks
                </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-700">
                    {perWeekValue}
                  </div>
                  <div className="text-[10px] text-gray-500">per week</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xld">
      <div className={`p-6 border-b border-gray-100/50 ${gradientClass}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <h2 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {title}
            </h2>
          </div>
          {isDisabled && disabledMessage && (
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-amber-600 hover:text-amber-700 cursor-pointer">
                    <Info className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="left"
                  className="bg-amber-50 border-amber-200 text-amber-800 z-[9999]"
                >
                  <p className="text-xs">{disabledMessage}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-4">
          {filteredFields
            .filter(
              (field: FieldConfig): field is InputField =>
                field.fieldType === "input"
            )
            .map(renderInputField)}
        </div>

        <div className="space-y-3">
          {filteredFields
            .filter(
              (field: FieldConfig): field is CalculatedField =>
                field.fieldType === "calculated"
            )
            .map(renderCalculatedField)}
        </div>
      </div>
    </Card>
  );
};
