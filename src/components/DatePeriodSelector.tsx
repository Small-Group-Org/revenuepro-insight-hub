import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, addWeeks, subWeeks, startOfYear } from "date-fns";
import { Button } from "@/components/ui/button";
import { getWeekInfo, formatWeekRange } from "@/utils/weekLogic";
import { PeriodType } from "@/types";
import { DisableMetadata } from "@/types";

interface DatePeriodSelectorProps {
  initialDate?: Date;
  initialPeriod?: PeriodType;
  onChange?: (date: Date, period: PeriodType) => void;
  buttonText?: string;
  onButtonClick?: () => void;
  allowedPeriods?: PeriodType[];
  disableLogic?: DisableMetadata;
  onDisableStatusChange?: (status: DisableMetadata) => void;
  onNavigationAttempt?: (newDate: Date, newPeriod: PeriodType) => boolean; // Returns true if navigation should proceed
}

export const DatePeriodSelector: React.FC<DatePeriodSelectorProps> = ({
  initialDate = new Date(),
  initialPeriod = "monthly",
  onChange,
  buttonText,
  onButtonClick,
  allowedPeriods = ["weekly", "monthly", "yearly"],
  disableLogic,
  onDisableStatusChange,
  onNavigationAttempt,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [period, setPeriod] = useState<PeriodType>(
    allowedPeriods.includes(initialPeriod) ? initialPeriod : allowedPeriods[0]
  );

  const getButtonText = () => {
    return buttonText || "Save";
  };

  const finalDisableLogic = disableLogic || {
    isDisabled: false,
    disabledMessage: null,
    noteMessage: null,
    shouldDisableNonRevenueFields: false,
    isButtonDisabled: false,
  };

  useEffect(() => {
    if (onDisableStatusChange) {
      onDisableStatusChange(finalDisableLogic);
    }
  }, [finalDisableLogic, onDisableStatusChange]);

  const getLabel = () => {
    if (period === "weekly") {
      const weekInfo = getWeekInfo(selectedDate);
      const weekRange = formatWeekRange(weekInfo.weekStart, weekInfo.weekEnd);
      const monthName = format(new Date(weekInfo.belongsToYear, weekInfo.belongsToMonth), 'MMM');
      return (
        <span>
          {weekRange} <span className="text-sm text-muted-foreground">({monthName})</span>
        </span>
      );
    } else if (period === "monthly") {
      return format(selectedDate, "MMMM yyyy");
    } else if (period === "ytd") {
      const yearStart = startOfYear(selectedDate);
      const currentDate = new Date();
      return `YTD ${format(yearStart, "yyyy")} (${format(yearStart, "MMM dd")} - ${format(currentDate, "MMM dd")})`;
    } else {
      return format(selectedDate, "yyyy");
    }
  };

  // Navigation logic
  const handlePrev = () => {
    let newDate;
    if (period === "weekly") {
      newDate = subWeeks(selectedDate, 1);
    } else if (period === "monthly") {
      newDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth() - 1,
        1
      );
    } else {
      newDate = new Date(selectedDate.getFullYear() - 1, 0, 1);
    }
    
    // Check if navigation should proceed
    if (onNavigationAttempt && !onNavigationAttempt(newDate, period)) {
      return; // Navigation blocked by parent component
    }
    
    setSelectedDate(newDate);
    onChange?.(newDate, period);
  };

  const handleNext = () => {
    let newDate;
    if (period === "weekly") {
      newDate = addWeeks(selectedDate, 1);
    } else if (period === "monthly") {
      newDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        1
      );
    } else {
      newDate = new Date(selectedDate.getFullYear() + 1, 0, 1);
    }
    
    // Check if navigation should proceed
    if (onNavigationAttempt && !onNavigationAttempt(newDate, period)) {
      return; // Navigation blocked by parent component
    }
    
    setSelectedDate(newDate);
    onChange?.(newDate, period);
  };

  const handlePeriodChange = (value: PeriodType) => {
    // Check if navigation should proceed
    if (onNavigationAttempt && !onNavigationAttempt(selectedDate, value)) {
      return; // Navigation blocked by parent component
    }
    
    setPeriod(value);
    onChange?.(selectedDate, value);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between w-full py-2 px-4 bg-card rounded-xl shadow border border-border">
        <div className="flex items-center gap-2">
          <button
            className={`rounded-full p-2 transition ${
              period === "ytd" 
                ? "bg-muted/50 cursor-not-allowed opacity-50" 
                : "bg-muted hover:bg-muted/80"
            }`}
            onClick={handlePrev}
            aria-label="Previous"
            type="button"
            disabled={period === "ytd"}
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <button
            className={`rounded-full p-2 transition ${
              period === "ytd" 
                ? "bg-muted/50 cursor-not-allowed opacity-50" 
                : "bg-muted hover:bg-muted/80"
            }`}
            onClick={handleNext}
            aria-label="Next"
            type="button"
            disabled={period === "ytd"}
          >
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
          <span className="ml-4 text-xl font-medium text-card-foreground">
            {getLabel()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allowedPeriods.includes("weekly") && (
                <SelectItem value="weekly">Week</SelectItem>
              )}
              {allowedPeriods.includes("monthly") && (
                <SelectItem value="monthly">Month</SelectItem>
              )}
              {allowedPeriods.includes("yearly") && (
                <SelectItem value="yearly">Year</SelectItem>
              )}
              {allowedPeriods.includes("ytd") && (
                <SelectItem value="ytd">YTD</SelectItem>
              )}
            </SelectContent>
          </Select>
          {onButtonClick && (
            <Button
              onClick={onButtonClick}
              className="bg-gradient-primary hover:bg-gradient-accent text-primary-foreground px-6 h-[38px]"
              type="button"
              disabled={
                finalDisableLogic.isButtonDisabled ||
                !allowedPeriods.includes(period)
              }
            >
              {getButtonText()}
            </Button>
          )}
        </div>
      </div>
      {finalDisableLogic.noteMessage && (
        <div className="px-4 py-2 bg-accent/10 border border-accent/20 rounded-lg">
          <p className="text-sm text-accent-foreground">
            {finalDisableLogic.noteMessage}
          </p>
        </div>
      )}
    </div>
  );
};
