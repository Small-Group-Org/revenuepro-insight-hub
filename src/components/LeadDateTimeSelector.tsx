import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, addWeeks, subWeeks } from "date-fns";
import { PeriodType } from "@/types";

type ExtendedPeriod = PeriodType | "custom";

interface LeadDateTimeSelectorProps {
  initialDate?: Date;
  initialPeriod?: ExtendedPeriod;
  allowedPeriods?: ExtendedPeriod[];
  onChange?: (date: Date, period: ExtendedPeriod) => void;
  onCustomRangeChange?: (payload: {
    startDate: string;
    endDate: string;
  }) => void;
  showRefreshButton?: boolean;
  onRefreshClick?: () => void;
  isRefreshing?: boolean;
}

const toUTCISOString = (d: Date, endOfMinute = false): string => {
  const date = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    d.getHours(),
    d.getMinutes(),
    endOfMinute ? 59 : 0,
    endOfMinute ? 999 : 0
  );
  return date.toISOString();
};

export const LeadDateTimeSelector: React.FC<LeadDateTimeSelectorProps> = ({
  initialDate = new Date(),
  initialPeriod = "monthly",
  allowedPeriods = ["weekly", "monthly", "yearly", "ytd", "custom"],
  onChange,
  onCustomRangeChange,
  showRefreshButton = false,
  onRefreshClick,
  isRefreshing = false,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [period, setPeriod] = useState<ExtendedPeriod>(
    allowedPeriods.includes(initialPeriod) ? initialPeriod : allowedPeriods[0]
  );

  // Custom range state
  const [openPicker, setOpenPicker] = useState(false);
  const [customStart, setCustomStart] = useState<Date>(initialDate);
  const [customEnd, setCustomEnd] = useState<Date>(initialDate);
  const [startTime, setStartTime] = useState<string>("00:00");
  const [endTime, setEndTime] = useState<string>("23:59");
  const currentYear = new Date().getFullYear();
  // Visible months for calendars (avoid jumping back and enable dropdown control)
  const [startMonth, setStartMonth] = useState<Date>(initialDate);
  const [endMonth, setEndMonth] = useState<Date>(initialDate);

  useEffect(() => {
    // Sync times into dates and avoid unnecessary loops
    const [sh, sm] = startTime.split(":").map((x) => parseInt(x || "0", 10));
    const [eh, em] = endTime.split(":").map((x) => parseInt(x || "0", 10));

    const nextStart = new Date(customStart);
    nextStart.setHours(sh || 0, sm || 0, 0, 0);
    if (nextStart.getTime() !== customStart.getTime()) {
      setCustomStart(nextStart);
    }

    const nextEnd = new Date(customEnd);
    nextEnd.setHours(eh || 0, em || 0, 59, 999);
    if (nextEnd.getTime() !== customEnd.getTime()) {
      setCustomEnd(nextEnd);
    }
  }, [startTime, endTime, customStart, customEnd]);

  const label = useMemo(() => {
    if (period === "weekly") return format(selectedDate, "wo 'week' MMM yyyy");
    if (period === "monthly") return format(selectedDate, "MMMM yyyy");
    if (period === "ytd") return `YTD ${format(new Date(), "yyyy")}`;
    if (period === "yearly") return format(selectedDate, "yyyy");
    if (period === "custom")
      return `${format(customStart, "MMM dd, yyyy")} → ${format(
        customEnd,
        "MMM dd, yyyy"
      )}`;
    return format(selectedDate, "MMM dd, yyyy");
  }, [period, selectedDate, customStart, customEnd]);

  const navigatePrev = () => {
    if (period === "ytd" || period === "custom") return;
    let newDate = new Date(selectedDate);
    if (period === "weekly") newDate = subWeeks(selectedDate, 1);
    if (period === "monthly")
      newDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth() - 1,
        1
      );
    if (period === "yearly")
      newDate = new Date(selectedDate.getFullYear() - 1, 0, 1);
    setSelectedDate(newDate);
    onChange?.(newDate, period);
  };

  const navigateNext = () => {
    if (period === "ytd" || period === "custom") return;
    let newDate = new Date(selectedDate);
    if (period === "weekly") newDate = addWeeks(selectedDate, 1);
    if (period === "monthly")
      newDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        1
      );
    if (period === "yearly")
      newDate = new Date(selectedDate.getFullYear() + 1, 0, 1);
    setSelectedDate(newDate);
    onChange?.(newDate, period);
  };

  const handlePeriodChange = (value: ExtendedPeriod) => {
    setPeriod(value);
    if (value === "custom") {
      // Do not auto-open. User will click "Pick range" to open.
      setOpenPicker(false);
    } else {
      onChange?.(selectedDate, value);
      // Ensure popover is closed when leaving custom
      setOpenPicker(false);
    }
  };

  const applyCustomRange = useCallback(() => {
    const startDate = toUTCISOString(customStart, false);
    const endDate = toUTCISOString(customEnd, true);
    onCustomRangeChange?.({ startDate, endDate });
    setOpenPicker(false);
  }, [customStart, customEnd, onCustomRangeChange]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between w-full py-2 px-4 bg-card rounded-lg shadow border border-border">
        <div className="flex items-center gap-2">
          <button
            className={`rounded-full p-2 transition ${
              period === "ytd" || period === "custom"
                ? "bg-muted/50 cursor-not-allowed opacity-50"
                : "bg-muted hover:bg-muted/80"
            }`}
            onClick={navigatePrev}
            aria-label="Previous"
            type="button"
            disabled={period === "ytd" || period === "custom"}
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <button
            className={`rounded-full p-2 transition ${
              period === "ytd" || period === "custom"
                ? "bg-muted/50 cursor-not-allowed opacity-50"
                : "bg-muted hover:bg-muted/80"
            }`}
            onClick={navigateNext}
            aria-label="Next"
            type="button"
            disabled={period === "ytd" || period === "custom"}
          >
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
          <span className="ml-4 text-xl font-medium text-card-foreground">
            {label}
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
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-32">
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
              {allowedPeriods.includes("custom") && (
                <SelectItem value="custom">Custom</SelectItem>
              )}
            </SelectContent>
          </Select>

          {period === "custom" && (
            <Popover open={openPicker} onOpenChange={setOpenPicker}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-9 px-3">
                  Select Dates
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[720px] p-4"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Start</p>
                    <Calendar
                      mode="single"
                      selected={customStart}
                      onSelect={(d) => {
                        if (!d) return;
                        setCustomStart(d);
                        setStartMonth(d);
                      }}
                      showOutsideDays
                      month={startMonth}
                      onMonthChange={(m) => m && setStartMonth(m)}
                      classNames={{
                        day_today:
                          "relative text-muted-foreground after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-muted-foreground",
                        caption:
                          "flex justify-center pt-1 relative items-center",
                        caption_label: "hidden",
                        caption_dropdowns:
                          "flex items-center gap-2 justify-center",
                        dropdown_month:
                          "h-9 px-2 text-sm bg-background border border-input rounded-md flex items-center leading-none text-foreground focus:outline-none focus:ring-0",
                        dropdown_year:
                          "h-9 px-2 text-sm bg-background border border-input rounded-md flex items-center leading-none text-foreground focus:outline-none focus:ring-0",
                      }}
                      captionLayout="dropdown"
                      fromYear={1990}
                      toYear={currentYear + 10}
                      pagedNavigation
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">End</p>
                    <Calendar
                      mode="single"
                      selected={customEnd}
                      onSelect={(d) => {
                        if (!d) return;
                        setCustomEnd(d);
                        setEndMonth(d);
                      }}
                      showOutsideDays
                      month={endMonth}
                      onMonthChange={(m) => m && setEndMonth(m)}
                      classNames={{
                        day_today:
                          "relative text-muted-foreground after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-muted-foreground",
                        caption:
                          "flex justify-center pt-1 relative items-center",
                        caption_label: "hidden",
                        caption_dropdowns:
                          "flex items-center gap-2 justify-center",
                        dropdown_month:
                          "h-9 px-2 text-sm bg-background border border-input rounded-md flex items-center leading-none text-foreground focus:outline-none focus:ring-0",
                        dropdown_year:
                          "h-9 px-2 text-sm bg-background border border-input rounded-md flex items-center leading-none text-foreground focus:outline-none focus:ring-0",
                      }}
                      captionLayout="dropdown"
                      fromYear={1990}
                      toYear={currentYear + 10}
                      pagedNavigation
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-4">
                  <Button variant="ghost" onClick={() => setOpenPicker(false)}>
                    Cancel
                  </Button>
                  <Button onClick={applyCustomRange}>Apply</Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadDateTimeSelector;
