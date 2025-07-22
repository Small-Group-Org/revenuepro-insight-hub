import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, addWeeks, subWeeks } from "date-fns";
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

  // Notify parent component of disable status changes
  useEffect(() => {
    if (onDisableStatusChange) {
      onDisableStatusChange(finalDisableLogic);
    }
  }, [finalDisableLogic, onDisableStatusChange]);

  const getLabel = () => {
    if (period === "weekly") {
      const weekInfo = getWeekInfo(selectedDate);
      return formatWeekRange(weekInfo.weekStart, weekInfo.weekEnd);
    } else if (period === "monthly") {
      return format(selectedDate, "MMMM yyyy");
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
    setSelectedDate(newDate);
    onChange?.(newDate, period);
  };

  const handlePeriodChange = (value: PeriodType) => {
    setPeriod(value);
    onChange?.(selectedDate, value);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between w-full py-2 px-4 bg-white rounded-xl shadow border border-gray-200">
        <div className="flex items-center gap-2">
          <button
            className="rounded-full bg-gray-100 hover:bg-gray-200 p-2 transition"
            onClick={handlePrev}
            aria-label="Previous"
            type="button"
          >
            <ChevronLeft className="h-5 w-5 text-gray-500" />
          </button>
          <button
            className="rounded-full bg-gray-100 hover:bg-gray-200 p-2 transition"
            onClick={handleNext}
            aria-label="Next"
            type="button"
          >
            <ChevronRight className="h-5 w-5 text-gray-500" />
          </button>
          <span className="ml-4 text-xl font-medium text-gray-900">
            {getLabel()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Week</SelectItem>
              <SelectItem value="monthly">Month</SelectItem>
              <SelectItem value="yearly">Year</SelectItem>
            </SelectContent>
          </Select>
          {onButtonClick && (
            <Button
              onClick={onButtonClick}
              className="bg-gray-900 hover:bg-gray-800 text-white px-6 h-[38px]"
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
        <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            {finalDisableLogic.noteMessage}
          </p>
        </div>
      )}
    </div>
  );
};
