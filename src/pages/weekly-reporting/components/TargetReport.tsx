import React, { useEffect, useMemo } from "react";
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
} from "@/utils/page-utils/commonUtils";

interface TargetReportProps {
  title: string;
  icon: React.ReactNode;
  fields: FieldConfig[];
  fieldValues: FieldValue;
  onInputChange: (fieldName: string, value: number) => void;
  isLoading?: boolean;
  period?: PeriodType;
  isDisabled?: boolean;
  disabledMessage?: string;
  shouldDisableNonRevenueFields?: boolean;
  targetValues?: FieldValue;
  showOpportunitySyncButton?: boolean;
  onOpportunitySyncClick?: () => void;
  isOpportunitySyncing?: boolean;
}

export const TargetReport: React.FC<TargetReportProps> = ({
  title,
  icon,
  fields,
  fieldValues,
  onInputChange,
  isLoading = false,
  period = "monthly",
  isDisabled = false,
  disabledMessage,
  shouldDisableNonRevenueFields = false,
  targetValues = {},
  showOpportunitySyncButton = false,
  onOpportunitySyncClick,
  isOpportunitySyncing = false,
}) => {
  const [focusedField, setFocusedField] = React.useState<string | null>(null);
  const [displayValues, setDisplayValues] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const newDisplayValues: Record<string, string> = {};
    Object.keys(fieldValues).forEach(key => {
      if (!focusedField || focusedField !== key) {
        newDisplayValues[key] = fieldValues[key]?.toString() || '0';
      }
    });
    setDisplayValues(prev => ({ ...prev, ...newDisplayValues }));
  }, [fieldValues, focusedField]);

  const filterFieldsByPeriod = (fields: FieldConfig[]): FieldConfig[] => {
    return fields.filter((field) => {
      if (field.isHidden) return false;

      if (!field.applicable) return true;

      return field.applicable.includes(period);
    });
  };

  const renderInputField = (field: InputField) => {
    const value = fieldValues[field.value] || 0;
    const displayValue = displayValues[field.value] || value.toString();

    return (
      <div key={field.value} className="flex-grow">
        <Label
          htmlFor={field.value}
          className="flex items-baseline gap-1"
        >
          <span className="text-[13px] font-medium text-card-foreground">{field.name}</span>
          <span className="text-[10px] text-muted-foreground float-right">
            {targetValues[field.value] !== undefined ? 
              `(Target: ${field.unit === "$" ? formatCurrency(targetValues[field.value]) : 
                        field.unit === "%" ? formatPercent(targetValues[field.value]) : 
                        isNaN(targetValues[field.value]) ? 0 : Math.round(targetValues[field.value]) || 0})` : ""}
          </span>
        </Label>
        <div className="relative mt-1">
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
              isDisabled
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : ""
            }`}
            style={{ MozAppearance: "textfield" }}
            disabled={isLoading || isDisabled}
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

  const filteredFields = filterFieldsByPeriod(fields);
  const inputFields = useMemo(() => {
    return filteredFields
      .filter(
        (field: FieldConfig): field is InputField =>
          field.fieldType === "input"
      )
  }, [filteredFields]);
  
  return (
    <Card className={`bg-card/90 p-6 pt-4 backdrop-blur-sm border border-border/200 hover:shadow-lg`}>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">
                {title}
            </h2>
            </div>
            <div className="flex items-center gap-2">
            {/* TEMPORARY: Opportunity Sync Refresh Button - only shown for weekly period and specific user */}
            {showOpportunitySyncButton && title === "Target Report" && period === "weekly" && (
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

      <div className="space-y-6 mt-6">
        <div className={`flex flex-row gap-4 justify-between`}>
          {inputFields.map(renderInputField)}
        </div>
      </div>
    </Card>
  );
};
