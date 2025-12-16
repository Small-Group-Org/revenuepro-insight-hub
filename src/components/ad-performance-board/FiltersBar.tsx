import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PerformanceBoardFilters } from "@/types/adPerformanceBoard";
import { CalendarRange, RotateCw, ChevronDown } from "lucide-react";
import { format, subDays, parseISO, differenceInDays } from "date-fns";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FiltersBarProps {
  filters: PerformanceBoardFilters;
  onFiltersChange: (filters: PerformanceBoardFilters) => void;
  onApply: (nextFilters?: PerformanceBoardFilters) => void;
  onQuickApply: (nextFilters: PerformanceBoardFilters) => void;
  onReset: () => void;
  availableZipCodes?: string[];
  availableServiceTypes?: string[];
}

const quickRanges = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
];

export const FiltersBar = ({
  filters,
  onFiltersChange,
  onApply,
  onQuickApply,
  onReset,
  availableZipCodes = [],
  availableServiceTypes = [],
}: FiltersBarProps) => {
  const [zipCodePopoverOpen, setZipCodePopoverOpen] = useState(false);
  const [serviceTypePopoverOpen, setServiceTypePopoverOpen] = useState(false);

  const listToInputValue = (value?: string | string[]) => {
    if (Array.isArray(value)) return value.join(", ");
    return value ?? "";
  };

  const parseListValue = (value: string): string | string[] | undefined => {
    const parts = value
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (!parts.length) return undefined;
    return parts.length === 1 ? parts[0] : parts;
  };

  const getSelectedArray = (value?: string | string[]): string[] => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  };

  const toggleZipCode = (zipCode: string) => {
    const current = getSelectedArray(filters.zipCode);
    const next = current.includes(zipCode)
      ? current.filter((z) => z !== zipCode)
      : [...current, zipCode];
    const updatedFilters = {
      ...filters,
      zipCode: next.length === 0 ? undefined : next.length === 1 ? next[0] : next,
    };
    onFiltersChange(updatedFilters);
    onQuickApply(updatedFilters);
  };

  const toggleServiceType = (serviceType: string) => {
    const current = getSelectedArray(filters.serviceType);
    const next = current.includes(serviceType)
      ? current.filter((s) => s !== serviceType)
      : [...current, serviceType];
    const updatedFilters = {
      ...filters,
      serviceType: next.length === 0 ? undefined : next.length === 1 ? next[0] : next,
    };
    onFiltersChange(updatedFilters);
    onQuickApply(updatedFilters);
  };

  const clearZipCodes = () => {
    const updatedFilters = { ...filters, zipCode: undefined };
    onFiltersChange(updatedFilters);
    onQuickApply(updatedFilters);
  };

  const clearServiceTypes = () => {
    const updatedFilters = { ...filters, serviceType: undefined };
    onFiltersChange(updatedFilters);
    onQuickApply(updatedFilters);
  };

  // Ensure we have defaults on initial render
  useEffect(() => {
    if (!filters.startDate || !filters.endDate) {
      const end = new Date();
      const start = subDays(end, 6);
      onFiltersChange({
        ...filters,
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyQuickRange = (days: number) => {
    const end = new Date();
    const start = subDays(end, days - 1);
    const next = {
      ...filters,
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
    };
    onQuickApply(next);
  };

  const handleDateInput = (key: "startDate" | "endDate", value: string) => {
    const next = { ...filters, [key]: value };
    onFiltersChange(next);
    if (next.startDate && next.endDate) {
      onQuickApply(next);
    }
  };

  return (
    <Card className="mb-6 border-0 shadow-sm">
      <div className="px-4 py-3 flex flex-wrap items-center gap-4 border-b">
        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <CalendarRange className="h-4 w-4 text-primary" />
          <span>Filters</span>
        </div>
        <div className="flex items-center gap-2">
          {quickRanges.map((range) => (
            <Button
              key={range.label}
              size="sm"
              variant="ghost"
              className={cn(
                "text-xs",
                range.days > 60 && "opacity-50 cursor-not-allowed"
              )}
              disabled={range.days > 60}
              onClick={() => applyQuickRange(range.days)}
            >
              {range.label}
            </Button>
          ))}
        </div>
        <div className="flex-1" />
        <Button
          size="sm"
          variant="ghost"
          className="gap-2"
          onClick={onReset}
        >
          <RotateCw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      <div className="flex flex-wrap items-start gap-3 px-4 py-4">
        <div className="flex-shrink-0">
          <div className="flex flex-col gap-1">
            <div className="flex gap-2">
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleDateInput("startDate", e.target.value)}
                max={filters.endDate || format(new Date(), "yyyy-MM-dd")}
                className="h-10 text-sm pr-10 w-[140px] min-w-[140px] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:ml-[5px] [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:h-5"
              />
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleDateInput("endDate", e.target.value)}
                min={filters.startDate}
                max={format(new Date(), "yyyy-MM-dd")}
                className="h-10 text-sm pr-10 w-[140px] min-w-[140px] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:ml-[5px] [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:h-5"
              />
            </div>
            {filters.startDate && (() => {
              try {
                const startDate = parseISO(filters.startDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const daysFromToday = differenceInDays(today, startDate);
                if (daysFromToday > 60) {
                  return (
                    <p className="text-xs text-red-600 mt-1">
                      Data only available for last 60 days
                    </p>
                  );
                }
              } catch {
                return null;
              }
              return null;
            })()}
          </div>
        </div>

        <div className="flex-shrink-0 w-[240px] max-w-[240px] flex-1">
          <Popover open={zipCodePopoverOpen} onOpenChange={setZipCodePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className={cn(
                  "w-full h-10 justify-between p-0 border border-slate-300 bg-slate-50/50 hover:!bg-slate-50/80 hover:!text-slate-700",
                  !filters.zipCode && "text-muted-foreground"
                )}
                style={{ 
                  backgroundColor: 'rgb(248 250 252 / 0.5)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgb(248 250 252 / 0.8)';
                  e.currentTarget.style.color = 'rgb(51 65 85)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgb(248 250 252 / 0.5)';
                }}
              >
                <div className="flex items-center   h-full flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-700 hover:text-slate-700 flex-shrink-0 px-3 py-2 border-r border-slate-300 h-full flex items-center">Zip code(s)</span>
                  <div onClick={(e) => e.stopPropagation()} className="h-full flex items-center border-r border-slate-300">
                    <Select
                      value={filters.zipCodeOperator || "="}
                      onValueChange={(value: "=" | "!=") => {
                        const updatedFilters = {
                          ...filters,
                          zipCodeOperator: value,
                        };
                        onFiltersChange(updatedFilters);
                        onQuickApply(updatedFilters);
                      }}
                    >
                      <SelectTrigger 
                        className="h-full w-10 px-0 border-0 bg-transparent shadow-none rounded-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:ring-0 data-[state=open]:ring-offset-0 text-slate-700 hover:bg-transparent text-[11px] focus:h-[34.5px] focus:w-[37px] m-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="w-full text-center inline-block">
                          {filters.zipCodeOperator || "="}
                        </span>
                      </SelectTrigger>
                      <SelectContent className="text-slate-700">
                        <SelectItem value="=" className="text-slate-700 text-xs">
                          = (equals)
                        </SelectItem>
                        <SelectItem value="!=" className="text-slate-700 text-xs">
                          != (not equals)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                 <span className="flex items-center gap-1 min-w-[80px] justify-start flex-1 px-2 py-1 h-full">
                    {(() => {
                      const selected = getSelectedArray(filters.zipCode);
                      if (selected.length === 0) {
                         return <span className="text-muted-foreground  text-s hover:text-muted-foreground">Select</span>;
                      }
                      if (selected.length === 1) {
                         return <span className="truncate text-xs text-slate-700 hover:text-slate-700">{selected[0]}</span>;
                      }
                      const first = selected[0];
                       return <span className="truncate text-xs text-slate-700 hover:text-slate-700">{first}</span>;
                    })()}
                  </span>
                </div>
                <div className="flex items-center gap-1 mr-2">
                  {(() => {
                    const selected = getSelectedArray(filters.zipCode);
                    const remaining = selected.length > 1 ? selected.length - 1 : 0;
                    return remaining > 0 ? (
                      <span className="flex-shrink-0 bg-blue-100 text-blue-700 hover:bg-blue-100 hover:text-blue-700 text-xs px-1.5 py-0.5 rounded font-medium">
                        +{remaining}
                      </span>
                    ) : null;
                  })()}
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-250px] p-0" align="start">
              <div className="flex items-center justify-between border-b px-3 py-2">
                <span className="text-sm font-medium">Zip Codes</span>
                {filters.zipCode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={clearZipCodes}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[200px]">
                <div className="p-2">
                  {availableZipCodes.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No zip codes available
                    </p>
                  ) : (
                    availableZipCodes.map((zipCode) => {
                      const selected = getSelectedArray(filters.zipCode).includes(zipCode);
                      return (
                        <label
                          key={zipCode}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-200 cursor-pointer"
                        >
                          <Checkbox
                            checked={selected}
                            onCheckedChange={() => toggleZipCode(zipCode)}
                          />
                          <span className="text-sm">{zipCode}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-shrink-0 w-[265px] max-w-[265px] flex-1">
          <Popover open={serviceTypePopoverOpen} onOpenChange={setServiceTypePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className={cn(
                  "w-full h-10 justify-between p-0 border border-slate-300 bg-slate-50/50 hover:!bg-slate-50/80 hover:!text-slate-700",
                  !filters.serviceType && "text-muted-foreground"
                )}
                style={{ 
                  backgroundColor: 'rgb(248 250 252 / 0.5)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgb(248 250 252 / 0.8)';
                  e.currentTarget.style.color = 'rgb(51 65 85)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgb(248 250 252 / 0.5)';
                }}
              >
                <div className="flex items-center h-full flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-700 hover:text-slate-700 flex-shrink-0 px-3 py-2 border-r border-slate-300 h-full flex items-center">Service type(s)</span>
                  <div onClick={(e) => e.stopPropagation()} className="h-full flex items-center border-r border-slate-300">
                    <Select
                      value={filters.serviceTypeOperator || "="}
                      onValueChange={(value: "=" | "!=") => {
                        const updatedFilters = {
                          ...filters,
                          serviceTypeOperator: value,
                        };
                        onFiltersChange(updatedFilters);
                        onQuickApply(updatedFilters);
                      }}
                    >
                      <SelectTrigger 
                        className="h-full w-10 px-0 border-0 bg-transparent shadow-none rounded-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:ring-0 data-[state=open]:ring-offset-0 text-slate-700 hover:bg-transparent text-[11px] focus:h-[34.5px] focus:w-[37px] m-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="w-full text-center inline-block">
                          {filters.serviceTypeOperator || "="}
                        </span>
                      </SelectTrigger>
                      <SelectContent className="text-slate-700">
                        <SelectItem value="=" className="text-slate-700 text-xs">
                          = (equals)
                        </SelectItem>
                        <SelectItem value="!=" className="text-slate-700 text-xs">
                          != (not equals)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                 <span className="flex items-center gap-1 flex-1 min-w-[80px] px-2 py-1 h-full">
                    {(() => {
                      const selected = getSelectedArray(filters.serviceType);
                      if (selected.length === 0) {
                         return <span className="text-muted-foreground text-s hover:text-muted-foreground">Select</span>;
                      }
                      if (selected.length === 1) {
                         return <span className="truncate text-xs text-slate-700 hover:text-slate-700">{selected[0]}</span>;
                      }
                      const first = selected[0];
                       return <span className="truncate text-xs text-slate-700 hover:text-slate-700">{first}</span>;
                    })()}
                  </span>
                </div>
                <div className="flex items-center gap-1 mr-2">
                  {(() => {
                    const selected = getSelectedArray(filters.serviceType);
                    const remaining = selected.length > 1 ? selected.length - 1 : 0;
                    return remaining > 0 ? (
                      <span className="flex-shrink-0 bg-blue-100 text-blue-700 hover:bg-blue-100 hover:text-blue-700 text-xs px-1.5 py-0.5 rounded font-medium">
                        +{remaining}
                      </span>
                    ) : null;
                  })()}
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <div className="flex items-center justify-between border-b px-3 py-2">
                <span className="text-sm font-medium">Service Types</span>
                {filters.serviceType && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={clearServiceTypes}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[200px]">
                <div className="p-2">
                  {availableServiceTypes.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No service types available
                    </p>
                  ) : (
                    availableServiceTypes.map((serviceType) => {
                      const selected = getSelectedArray(filters.serviceType).includes(serviceType);
                      return (
                        <label
                          key={serviceType}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-200 cursor-pointer"
                        >
                          <Checkbox
                            checked={selected}
                            onCheckedChange={() => toggleServiceType(serviceType)}
                          />
                          <span className="text-sm">{serviceType}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </Card>
  );
};

