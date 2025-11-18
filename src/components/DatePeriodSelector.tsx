import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, Loader2, Info, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, addWeeks, subWeeks, startOfYear } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getWeekInfo, formatWeekRange } from "@/utils/weekLogic";
import { PeriodType } from "@/types";
import { DisableMetadata } from "@/types";

// Custom debounce hook
const useDebounce = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): [T, boolean] => {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [isPending, setIsPending] = useState(false);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      setIsPending(true);
      
      const newTimeoutId = setTimeout(() => {
        callback(...args);
        setIsPending(false);
      }, delay);
      
      setTimeoutId(newTimeoutId);
    },
    [callback, delay, timeoutId]
  ) as T;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return [debouncedCallback, isPending];
};

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
  /** 
   * Debounce delay in milliseconds for onChange calls. 
   * Prevents excessive API calls when users quickly change dates/periods.
   * Default: 300ms
   */
  debounceDelay?: number;
  /** 
   * Show refresh button for lead sheet processing
   */
  showRefreshButton?: boolean;
  onRefreshClick?: () => void;
  isRefreshing?: boolean;
  /** 
   * TEMPORARY: Show opportunity sync refresh button (only for specific user)
   */
  showOpportunitySyncButton?: boolean;
  onOpportunitySyncClick?: () => void;
  isOpportunitySyncing?: boolean;
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
  debounceDelay = 700, // Default 300ms debounce delay
  showRefreshButton = false,
  onRefreshClick,
  isRefreshing = false,
  showOpportunitySyncButton = false,
  onOpportunitySyncClick,
  isOpportunitySyncing = false,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [period, setPeriod] = useState<PeriodType>(
    allowedPeriods.includes(initialPeriod) ? initialPeriod : allowedPeriods[0]
  );

  // Debounced onChange callback with pending state
  const [debouncedOnChange, isChangePending] = useDebounce(
    useCallback((date: Date, newPeriod: PeriodType) => {
      onChange?.(date, newPeriod);
    }, [onChange]),
    debounceDelay
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
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const yearStart = new Date(currentYear, 0, 1); // January 1st of current year
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
    // Use debounced onChange to prevent rapid API calls
    debouncedOnChange(newDate, period);
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
    // Use debounced onChange to prevent rapid API calls
    debouncedOnChange(newDate, period);
  };

  const handlePeriodChange = (value: PeriodType) => {
    // Check if navigation should proceed
    if (onNavigationAttempt && !onNavigationAttempt(selectedDate, value)) {
      return; // Navigation blocked by parent component
    }
    
    setPeriod(value);
    
    if (value === "ytd") {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const yearStart = new Date(currentYear, 0, 1);
      // Use debounced onChange to prevent rapid API calls
      debouncedOnChange(yearStart, value);
    } else {
      // Use debounced onChange to prevent rapid API calls
      debouncedOnChange(selectedDate, value);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between w-full py-2 px-4 bg-card rounded-lg shadow border border-border">
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
          {showRefreshButton && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onRefreshClick}
                    className="h-8 w-8 rounded-full hover:bg-muted/50 transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group"
                    disabled={isRefreshing}
                    type="button"
                  >
                    {isRefreshing ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <RefreshCw className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh Leads</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {/* TEMPORARY: Opportunity Sync Refresh Button - only shown for weekly period and specific user */}
          {/* {showOpportunitySyncButton && period === "weekly" && (
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
          )} */}
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
        <div className="px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800">
            {finalDisableLogic.noteMessage}
          </p>
        </div>
      )}
    </div>
  );
};
