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
import { Info, Loader2, RefreshCw } from "lucide-react";
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
  formatNumber,
  calculateManagementCost,
} from "@/utils/page-utils/commonUtils";
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
  shouldDisableNonRevenueFields?: boolean; // New prop to disable all fields except revenue
  targetValues?: FieldValue; // New prop for target values
  /** 
   * TEMPORARY: Show opportunity sync refresh button (only for specific user)
   */
  showOpportunitySyncButton?: boolean;
  onOpportunitySyncClick?: () => void;
  isOpportunitySyncing?: boolean;
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
  showTarget = false,
  shouldDisableNonRevenueFields = false,
  targetValues = {},
  showOpportunitySyncButton = false,
  onOpportunitySyncClick,
  isOpportunitySyncing = false,
}) => {
  const { currentTarget } = useTargetStore();
  
  // Move hooks to component level
  const [focusedField, setFocusedField] = React.useState<string | null>(null);
  const [displayValues, setDisplayValues] = React.useState<Record<string, string>>({});

  const filterFieldsByPeriod = (fields: FieldConfig[]): FieldConfig[] => {
    return fields.filter((field) => {
      if (field.isHidden) return false;

      if (!field.applicable) return true;

      return field.applicable.includes(period);
    });
  };

  const filteredFields = filterFieldsByPeriod(fields);

  // Update display values when fieldValues changes
  React.useEffect(() => {
    const newDisplayValues: Record<string, string> = {};
    Object.keys(fieldValues).forEach(key => {
      if (!focusedField || focusedField !== key) {
        newDisplayValues[key] = fieldValues[key]?.toString() || '0';
      }
    });
    setDisplayValues(prev => ({ ...prev, ...newDisplayValues }));
  }, [fieldValues, focusedField]);

  const renderInputField = (field: InputField) => {
    const value = fieldValues[field.value] || 0;
    const displayValue = displayValues[field.value] || value.toString();

    // Determine if this field should be disabled
    const isFieldDisabled = 
      isDisabled || 
      (shouldDisableNonRevenueFields && field.value !== 'revenue') || 
      (period === 'yearly' && field.value === 'managementCost');

    return (
      <div key={field.value} className="space-y-2">
        <Label
          htmlFor={field.value}
          className="flex items-center justify-between"
        >
          <span className="text-sm font-medium text-card-foreground">{field.name}</span>
          <span className="text-[10px] text-muted-foreground">
            {showTarget && targetValues[field.value] !== undefined ? 
              `Target: ${field.unit === "$" ? formatCurrency(targetValues[field.value]) : 
                        field.unit === "%" ? formatPercent(targetValues[field.value]) : 
                        isNaN(targetValues[field.value]) ? 0 : Math.round(targetValues[field.value]) || 0}` : ""}
          </span>
        </Label>
        <div className="relative">
          <Input
            id={field.value}
            type={field.type || "number"}
            min={field.min}
            max={field.max}
            step={field.step || 1}
            value={focusedField === field.value ? displayValue : value}
            onChange={(e) => {
              const inputValue = e.target.value;
              setDisplayValues(prev => ({ ...prev, [field.value]: inputValue }));
              
              if (inputValue === "") {
                return;
              }
              
              const numValue = Number(inputValue);
              if (!isNaN(numValue)) {
                onInputChange(field.value, numValue);
              }
            }}
            onFocus={(e) => {
              setFocusedField(field.value);
              e.target.select();
            }}
            onBlur={(e) => {
              setFocusedField(null);
              const inputValue = e.target.value;
              
              if (inputValue === "") {
                // Set to 0 if empty when blurred
                onInputChange(field.value, 0);
                setDisplayValues(prev => ({ ...prev, [field.value]: "0" }));
              } else {
                const numValue = Number(inputValue);
                if (!isNaN(numValue)) {
                  onInputChange(field.value, numValue);
                }
              }
            }}
            onWheel={(e) => e.currentTarget.blur()}
            className={`appearance-none pr-12 ${
              isFieldDisabled
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : ""
            }`}
            style={{ MozAppearance: "textfield" }}
            disabled={isLoading || isFieldDisabled}
          />
          {field.unit && (
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
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
        ? value / currentTarget.length
        : null;

    return (
      <div
        key={field.value}
        className={`${
          isHighlightedField
            ? "bg-gradient-to-r from-[#28282b] to-[#404040] backdrop-blur-sm border-primary/40"
            : "bg-card/80 backdrop-blur-sm hover:shadow-md"
        } p-3 rounded-xl border border-border/40`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
                         <div className={`text-sm font-medium ${
               isHighlightedField ? "text-white/90" : "text-card-foreground"
             }`}>
               {field.name}
             </div>
            {field.description && (
              <div className={`text-[10px] mt-[2px] ${
                isHighlightedField ? "text-white/70" : "text-muted-foreground"
              }`}>
                {field.description}
              </div>
            )}
          </div>
          <div className="text-right">
            <span className={`text-base ${
              isHighlightedField ? "font-bold" : "font-semibold"
            } ${
              isHighlightedField ? "text-white/90" : "text-card-foreground"
            }`}>
              {field.unit === "$"
                ? formatCurrency(value)
                : field.unit === "%"
                ? formatPercent(value)
                : isNaN(value)
                ? 0
                : formatNumber(value)}
            </span>
          </div>
        </div>

        {/* Enhanced per-week breakdown for monthly budget */}
        {perWeekValue !== null && (
          <div className="mt-3 pt-3 border-t border-border/40">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="">
                  <span className={`text-xs font-medium ${
                    isHighlightedField ? "text-white/90" : "text-card-foreground"
                  }`}>
                    Weekly Allocation
                  </span>
                  <div className={`text-[10px] font-medium ${
                    isHighlightedField ? "text-white/70" : "text-muted-foreground"
                  }`}>
                  {currentTarget?.length || 0} weeks
                </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-sm ${
                    isHighlightedField ? "font-bold" : "font-semibold"
                  } ${
                    isHighlightedField ? "text-white/90" : "text-card-foreground"
                  }`}>
                    {Math.round(perWeekValue)}
                  </div>
                  <div className={`text-[10px] font-medium ${
                    isHighlightedField ? "text-white/70" : "text-muted-foreground"
                  }`}>per week</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-card/90 backdrop-blur-sm border border-border/20 shadow-xl hover:shadow-2xl">
      <div className={`p-6 border-b border-border/50 ${gradientClass}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <h2 className="text-lg font-semibold text-gradient-primary">
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* TEMPORARY: Opportunity Sync Refresh Button - only shown for weekly period and specific user */}
            {showOpportunitySyncButton && period === "weekly" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onOpportunitySyncClick}
                      className="h-8 w-8 rounded-full hover:bg-muted/50 transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group"
                      disabled={isOpportunitySyncing}
                      type="button"
                    >
                      {isOpportunitySyncing ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : (
                        <RefreshCw className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sync Opportunities</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
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
