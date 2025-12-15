import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, X, GripVertical, ArrowUp, ArrowDown, Sigma, BarChart3, TrendingDown, TrendingUp, Pin } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FiltersBar } from "./FiltersBar";
import { ColumnCard } from "./ColumnCard";
import {
  AVAILABLE_COLUMNS,
  DEFAULT_COLUMN_ORDER,
  formatCellValue,
  getAggregateValue,
} from "./columnConfig";
import { AddColumnSheet } from "./AddColumnSheet";
import { ColumnSettingsSheet } from "./ColumnSettingsSheet";
import {
  ColumnConfig,
  GroupBy,
  PerformanceBoardFilters,
  PerformanceRow,
} from "@/types/adPerformanceBoard";
import { fetchAdPerformanceBoard } from "@/service/adPerformanceBoardService";
import { useUserContext } from "@/utils/UserContext";
import { useUserStore } from "@/stores/userStore";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

const STORAGE_KEY = "ad-performance-board:v1";

interface SortRule {
  columnId: string;
  direction: "asc" | "desc";
}

const getDefaultDateRange = (): { startDate: string; endDate: string } => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  const format = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: format(start), endDate: format(end) };
};

export const PerformanceBoard = () => {
  const { user } = useUserContext();
  const { selectedUserId } = useUserStore();

  const clientId = selectedUserId || (user as any)?._id;
  const { toast } = useToast();

  const [filters, setFilters] = useState<PerformanceBoardFilters>(() => ({
    ...getDefaultDateRange(),
  }));
  const [appliedFilters, setAppliedFilters] =
    useState<PerformanceBoardFilters>(filters);
  const [groupBy, setGroupBy] = useState<GroupBy>("campaign");
  const [columns, setColumns] = useState<ColumnConfig[]>(
    AVAILABLE_COLUMNS.filter((c) => c.isDefault)
  );
  const [columnOrder, setColumnOrder] =
    useState<string[]>(DEFAULT_COLUMN_ORDER);
  const [sortState, setSortState] = useState<SortRule[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeColumn, setActiveColumn] = useState<ColumnConfig | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [frozenColumns, setFrozenColumns] = useState<string[]>([]);
  const [searchInputValue, setSearchInputValue] = useState<string>("");
  const [availableZipCodes, setAvailableZipCodes] = useState<string[]>([]);
  const [availableServiceTypes, setAvailableServiceTypes] = useState<string[]>([]);
  // Load saved preferences
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.columns) setColumns(parsed.columns);
      if (parsed.columnOrder) setColumnOrder(parsed.columnOrder);
      if (parsed.sortState) setSortState(parsed.sortState);
      if (parsed.filters) {
        setFilters(parsed.filters);
        setAppliedFilters(parsed.filters);
      }
      if (parsed.groupBy) setGroupBy(parsed.groupBy);
      if (parsed.frozenColumns) setFrozenColumns(parsed.frozenColumns);
    } catch (error) {
      // ignore corrupted preferences
    }
  }, []);

  // Persist preferences
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        columns,
        columnOrder,
        sortState,
        filters: appliedFilters,
        groupBy,
        frozenColumns,
      })
    );
  }, [columns, columnOrder, sortState, appliedFilters, groupBy, frozenColumns]);

  const visibleColumns = useMemo(() => {
    const dimensionIds = ["campaignName", "adSetName", "adName"];
    const dimensionOrder = dimensionIds.filter((id) => columnOrder.includes(id));
    const otherColumns = columnOrder
      .filter((id) => !dimensionIds.includes(id))
      .map((id) => columns.find((c) => c.id === id))
      .filter((c): c is ColumnConfig => Boolean(c));
    
    const dimensionColumns = dimensionOrder
        .map((id) => columns.find((c) => c.id === id))
      .filter((c): c is ColumnConfig => Boolean(c));
    
    const allColumns = [...dimensionColumns, ...otherColumns];
    
    // Separate frozen and unfrozen columns
    const frozen = allColumns.filter((col) => frozenColumns.includes(col.id));
    const unfrozen = allColumns.filter((col) => !frozenColumns.includes(col.id));
    
    // Order frozen columns by their freeze order (latest on the right)
    const orderedFrozen = frozenColumns
      .filter((id) => frozen.some((col) => col.id === id))
      .map((id) => frozen.find((col) => col.id === id))
      .filter((c): c is ColumnConfig => Boolean(c));
    
    return [...orderedFrozen, ...unfrozen];
  }, [columns, columnOrder, frozenColumns]);

  const formatZipCodeValue = (value: string | number | undefined): { display: string; full: string; remaining?: number } => {
    if (!value || value === "—" || value === "") return { display: "—", full: "" };
    const valueStr = String(value).trim();
    if (!valueStr) return { display: "—", full: "" };
    const zipCodes = valueStr.split(",").map((z) => z.trim()).filter(Boolean);
    if (zipCodes.length === 0) return { display: "—", full: "" };
    if (zipCodes.length <= 3) {
      return { display: zipCodes.join(", "), full: zipCodes.join(", ") };
    }
    const display = zipCodes.slice(0, 3).join(", ");
    const remaining = zipCodes.length - 3;
    return { display, full: zipCodes.join(", "), remaining };
  };

  const formatServiceValue = (value: string | number | undefined): { display: string; full: string; remaining?: number; showEllipsis?: boolean } => {
    if (!value || value === "—" || value === "") return { display: "—", full: "" };
    const valueStr = String(value).trim();
    if (!valueStr) return { display: "—", full: "" };
    const services = valueStr.split(",").map((s) => s.trim()).filter(Boolean);
    if (services.length === 0) return { display: "—", full: "" };
    if (services.length === 1) {
      return { display: services[0], full: services[0] };
    }
    if (services.length === 2) {
      return { display: services.join(", "), full: services.join(", ") };
    }
    // Show 1 or 2 services, with ellipsis if needed
    const display = services.slice(0, 2).join(", ");
    const remaining = services.length - 2;
    return { display, full: services.join(", "), remaining, showEllipsis: true };
  };

  const getCategoryColors = (category?: string) => {
    // Meta Data: light blue bubble, dark blue text
    const metaDataCategories = ["Delivery", "Performance", "Engagement", "Video", "Conversions", "Cost"];
    // Lead Center Data: Light yellow bubble, dark yellow text
    const leadCenterCategories = ["Leads"];
    // Cost per / Cost of marketing: light green bubble, dark green text
    const costPerCategories = ["Lead KPIs"];

    if (category && metaDataCategories.includes(category)) {
      return {
        bg: "bg-blue-50",
        text: "text-blue-700",
        cellBg: "bg-blue-50/30",
        bgColor: "#eff6ff", // blue-50
        cellBgColor: "rgba(239, 246, 255, 0.3)", // blue-50/30
      };
    }
    if (category && leadCenterCategories.includes(category)) {
      return {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        cellBg: "bg-yellow-50/30",
        bgColor: "#fefce8", // yellow-50
        cellBgColor: "rgba(254, 252, 232, 0.3)", // yellow-50/30
      };
    }
    if (category && costPerCategories.includes(category)) {
      return {
        bg: "bg-green-50",
        text: "text-green-700",
        cellBg: "bg-green-50/30",
        bgColor: "#f0fdf4", // green-50
        cellBgColor: "rgba(240, 253, 244, 0.3)", // green-50/30
      };
    }
    return null;
  };



  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      const parts = searchInputValue
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      const parsed = parts.length === 0 ? undefined : parts.length === 1 ? parts[0] : parts;
      
      const update: Partial<PerformanceBoardFilters> = {};
      if (groupBy === "campaign") {
        update.campaignName = parsed;
      } else if (groupBy === "adset") {
        update.adSetName = parsed;
      } else {
        update.adName = parsed;
      }
      handleApplyFilters({ ...appliedFilters, ...update });
    }, 500); // 500ms debounce delay

    return () => clearTimeout(timer);
  }, [searchInputValue]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset search filter when groupBy changes
  useEffect(() => {
    // Clear the search input
    setSearchInputValue("");
    
    // Clear the filter for the previous groupBy and apply empty filter for new groupBy
    const update: Partial<PerformanceBoardFilters> = {
      campaignName: undefined,
      adSetName: undefined,
      adName: undefined,
    };
    
    // Set the appropriate filter to undefined based on new groupBy
    // (This ensures the old filter is cleared)
    handleApplyFilters({ ...appliedFilters, ...update });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupBy]); // Reset when groupBy changes

  // Transform filters: if operator is "!=", convert to "=" with remaining zip codes
  // Remove operator fields as backend doesn't need them (assumes "=" by default)
  const transformedFilters = useMemo(() => {
    const filters: any = { ...appliedFilters };
    
    // Handle zip code "!=" operator - convert to "=" with remaining zip codes
    if (filters.zipCode && filters.zipCodeOperator === "!=") {
      const excludedZipCodes = Array.isArray(filters.zipCode) 
        ? filters.zipCode 
        : [filters.zipCode];
      
      // Get all available zip codes and exclude the selected ones
      const remainingZipCodes = availableZipCodes.filter(
        (zip) => !excludedZipCodes.includes(zip)
      );
      
      if (remainingZipCodes.length > 0) {
        // Send remaining zip codes (backend assumes "=" by default)
        filters.zipCode = remainingZipCodes.length === 1 ? remainingZipCodes[0] : remainingZipCodes;
      } else {
        // If no remaining zip codes, remove the filter
        filters.zipCode = undefined;
      }
      // Remove operator field as it's not needed
      delete filters.zipCodeOperator;
    } else if (filters.zipCodeOperator === "=") {
      // Remove operator field even for "=" as backend assumes it by default
      delete filters.zipCodeOperator;
    }
    
    // Handle service type "!=" operator - convert to "=" with remaining service types
    if (filters.serviceType && filters.serviceTypeOperator === "!=") {
      const excludedServiceTypes = Array.isArray(filters.serviceType) 
        ? filters.serviceType 
        : [filters.serviceType];
      
      // Get all available service types and exclude the selected ones
      const remainingServiceTypes = availableServiceTypes.filter(
        (service) => !excludedServiceTypes.includes(service)
      );
      
      if (remainingServiceTypes.length > 0) {
        // Send remaining service types (backend assumes "=" by default)
        filters.serviceType = remainingServiceTypes.length === 1 ? remainingServiceTypes[0] : remainingServiceTypes;
      } else {
        // If no remaining service types, remove the filter
        filters.serviceType = undefined;
      }
      // Remove operator field as it's not needed
      delete filters.serviceTypeOperator;
    } else if (filters.serviceTypeOperator === "=") {
      // Remove operator field even for "=" as backend assumes it by default
      delete filters.serviceTypeOperator;
    }
    
    // Remove estimateSetLeads and jobBookedLeads as they're removed from FE
    delete filters.estimateSetLeads;
    delete filters.jobBookedLeads;
    
    return filters;
  }, [appliedFilters, availableZipCodes, availableServiceTypes]);

  const { data, isFetching, refetch } = useQuery<PerformanceRow[]>({
    queryKey: [
      "ad-performance-board",
      clientId,
      groupBy,
      transformedFilters,
      columnOrder,
    ],
    queryFn: async () => {
      const response = await fetchAdPerformanceBoard({
        clientId,
        groupBy,
        filters: transformedFilters,
        // Use apiField names for columns to match backend expectations (fb_* and others)
        columns: Object.fromEntries(
          columnOrder.map((id) => {
            const col = AVAILABLE_COLUMNS.find((c) => c.id === id);
            const key = col?.apiField ?? id;
            return [key, true];
          })
        ),
      });

      if (response.error) {
        toast({
          title: "Unable to load board",
          description: response.message,
          variant: "destructive",
        });
        return [];
      }
      
      // Update available options from API response
      if (response.availableZipCodes) {
        setAvailableZipCodes(response.availableZipCodes);
      }
      if (response.availableServiceTypes) {
        setAvailableServiceTypes(response.availableServiceTypes);
      }
      
      return response.data || [];
    },
    enabled: Boolean(clientId && appliedFilters.startDate && appliedFilters.endDate),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const sortedData = useMemo(() => {
    if (!data) return [];
    
    // Filter out rows without zip codes when zip code filter is active
    let filteredData = data;
    if (appliedFilters.zipCode) {
      const selectedZipCodes = Array.isArray(appliedFilters.zipCode) 
        ? appliedFilters.zipCode 
        : [appliedFilters.zipCode];
      
      // Default to "=" if operator is not set (handles initial load case)
      const operator = appliedFilters.zipCodeOperator || "=";
      
      if (operator === "=") {
        // Include only rows with selected zip codes
        filteredData = data.filter((row) => {
          if (!row.zipCode) return false; // Exclude rows without zip codes
          const rowZipCodes = String(row.zipCode).split(",").map((z) => z.trim());
          return rowZipCodes.some((zip) => selectedZipCodes.includes(zip));
        });
      } else if (operator === "!=") {
        // Exclude rows with selected zip codes
        filteredData = data.filter((row) => {
          if (!row.zipCode) return true; // Include rows without zip codes
          const rowZipCodes = String(row.zipCode).split(",").map((z) => z.trim());
          return !rowZipCodes.some((zip) => selectedZipCodes.includes(zip));
        });
      }
    }
    
    // Filter out rows without service types when service type filter is active
    if (appliedFilters.serviceType) {
      const selectedServiceTypes = Array.isArray(appliedFilters.serviceType) 
        ? appliedFilters.serviceType 
        : [appliedFilters.serviceType];
      
      // Default to "=" if operator is not set (handles initial load case)
      const operator = appliedFilters.serviceTypeOperator || "=";
      
      if (operator === "=") {
        // Include only rows with selected service types
        filteredData = filteredData.filter((row) => {
          if (!row.service) return false; // Exclude rows without service types
          const rowServices = String(row.service).split(",").map((s) => s.trim());
          return rowServices.some((service) => selectedServiceTypes.includes(service));
        });
      } else if (operator === "!=") {
        // Exclude rows with selected service types
        filteredData = filteredData.filter((row) => {
          if (!row.service) return true; // Include rows without service types
          const rowServices = String(row.service).split(",").map((s) => s.trim());
          return !rowServices.some((service) => selectedServiceTypes.includes(service));
        });
      }
    }
    
    if (!sortState.length) return filteredData;

    const rules = sortState
      .map((rule) => {
        const col = columns.find((c) => c.id === rule.columnId);
        return col ? { ...rule, column: col } : null;
      })
      .filter((r): r is { columnId: string; direction: "asc" | "desc"; column: ColumnConfig } => Boolean(r));

    if (!rules.length) return data;

    const sorted = [...filteredData].sort((a, b) => {
      for (const rule of rules) {
        const aVal = a[rule.column.apiField] as number | string | undefined;
        const bVal = b[rule.column.apiField] as number | string | undefined;

        if (aVal === bVal) continue;
        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;

        if (typeof aVal === "number" && typeof bVal === "number") {
          return rule.direction === "asc" ? aVal - bVal : bVal - aVal;
        }

        return rule.direction === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      }
      return 0;
    });

    return sorted;
  }, [data, sortState, columns]);

  const handleApplyFilters = (nextFilters?: PerformanceBoardFilters) => {
    const target = nextFilters ?? filters;
    setFilters(target);
    setAppliedFilters(target);
  };

  const handleResetFilters = () => {
    const defaults = {
      ...getDefaultDateRange(),
    };
    setFilters(defaults);
    setAppliedFilters(defaults);
  };

  const handleRequestSort = (columnId: string) => {
    setSortState((prev) => {
      const existingIndex = prev.findIndex((r) => r.columnId === columnId);
      // If not present, set as asc (first click) - clear any previous sorts
      if (existingIndex === -1) {
        return [{ columnId, direction: "asc" }];
      }
      const existing = prev[existingIndex];
      // cycle asc -> desc -> remove
      if (existing.direction === "asc") {
        return [{ columnId, direction: "desc" }];
      }
      // remove rule (third click)
      return [];
    });
  };

  const handleRemoveColumn = (id: string) => {
    setColumnOrder((order) => order.filter((colId) => colId !== id));
    setFrozenColumns((frozen) => frozen.filter((colId) => colId !== id));
  };

  const handleToggleFreeze = (columnId: string) => {
    setFrozenColumns((prev) => {
      if (prev.includes(columnId)) {
        // Unfreeze
        return prev.filter((id) => id !== columnId);
      } else {
        // Freeze - add to the end (will appear on the right)
        return [...prev, columnId];
      }
    });
  };

  const handleOpenSettings = (column: ColumnConfig) => {
    setActiveColumn(column);
    setSettingsOpen(true);
  };

  const handleSaveSettings = (
    updatedColumn: ColumnConfig,
    sortDirection: "asc" | "desc" | null
  ) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === updatedColumn.id ? updatedColumn : col))
    );
    setSortState((prev) => {
      const without = prev.filter((r) => r.columnId !== updatedColumn.id);
      if (!sortDirection) return without;
      return [...without, { columnId: updatedColumn.id, direction: sortDirection }];
    });
    setSettingsOpen(false);
  };

  const handleDragStart = (id: string) => (e: React.DragEvent) => {
    e.stopPropagation();
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = draggingId || e.dataTransfer.getData("text/plain");
    if (!sourceId || sourceId === targetId) {
      setDraggingId(null);
      return;
    }

    const dimensionIds = ["campaignName", "adSetName", "adName"];
    const isSourceDimension = dimensionIds.includes(sourceId);
    const isTargetDimension = dimensionIds.includes(targetId);

    setColumnOrder((prev) => {
      const next = [...prev];
      const fromIndex = next.indexOf(sourceId);
      const toIndex = next.indexOf(targetId);
      if (fromIndex === -1 || toIndex === -1) {
        setDraggingId(null);
        return prev;
      }
      
      // If both are dimensions, reorder within dimensions
      if (isSourceDimension && isTargetDimension) {
        const dimensionOrder = dimensionIds.filter((id) => next.includes(id));
        const otherColumns = next.filter((id) => !dimensionIds.includes(id));
        const newDimensionOrder = [...dimensionOrder];
        const fromDimIndex = newDimensionOrder.indexOf(sourceId);
        const toDimIndex = newDimensionOrder.indexOf(targetId);
        newDimensionOrder.splice(fromDimIndex, 1);
        newDimensionOrder.splice(toDimIndex, 0, sourceId);
        setDraggingId(null);
        return [...newDimensionOrder, ...otherColumns];
      }
      
      // If source is dimension and target is not, move dimension to start (before first non-dimension)
      if (isSourceDimension && !isTargetDimension) {
        const dimensionOrder = dimensionIds.filter((id) => next.includes(id));
        const otherColumns = next.filter((id) => !dimensionIds.includes(id));
        const newDimensionOrder = dimensionOrder.filter((id) => id !== sourceId);
        const targetIndexInOthers = otherColumns.indexOf(targetId);
        if (targetIndexInOthers === -1) {
          setDraggingId(null);
          return prev;
        }
        otherColumns.splice(targetIndexInOthers, 0, sourceId);
        setDraggingId(null);
        return [...newDimensionOrder, ...otherColumns];
      }
      
      // If source is not dimension and target is dimension, move to after dimensions
      if (!isSourceDimension && isTargetDimension) {
        const dimensionOrder = dimensionIds.filter((id) => next.includes(id));
        const otherColumns = next.filter((id) => !dimensionIds.includes(id));
        const newOtherColumns = otherColumns.filter((id) => id !== sourceId);
        const targetIndexInDims = dimensionOrder.indexOf(targetId);
        if (targetIndexInDims === -1) {
          setDraggingId(null);
          return prev;
        }
        // Insert after the target dimension
        const newDimensionOrder = [...dimensionOrder];
        newDimensionOrder.splice(targetIndexInDims + 1, 0, sourceId);
        setDraggingId(null);
        return [...newDimensionOrder, ...newOtherColumns];
      }
      
      // Both are non-dimensions, allow reordering
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, sourceId);
      setDraggingId(null);
      return next;
    });
  };

  const availableToAdd = AVAILABLE_COLUMNS.filter(
    (col) => !columnOrder.includes(col.id)
  );

  const handleSelectColumns = (selectedIds: string[]) => {
    const uniqueIds = Array.from(new Set(selectedIds));
    const dimensionIds = ["campaignName", "adSetName", "adName"];
    const hasDimension = uniqueIds.some((id) => dimensionIds.includes(id));
    if (!hasDimension) {
      const fallback = dimensionIds.find((id) =>
        AVAILABLE_COLUMNS.some((c) => c.id === id)
      );
      if (fallback) {
        uniqueIds.unshift(fallback);
      } else {
        toast({
          title: "Select a dimension",
          description: "At least one of Campaign, Ad Set, or Ad Name is required.",
          variant: "destructive",
        });
        return;
      }
    }
    const nextColumns = AVAILABLE_COLUMNS.filter((c) =>
      uniqueIds.includes(c.id)
    );
    setColumns(nextColumns);
    setColumnOrder(uniqueIds);
  };

  return (
    <div className="px-6 pb-10">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">
          Ad Performance Board
        </h1>
        <p className="text-sm text-slate-500">
          Analyze and compare Meta ad performance with customizable columns, filters, and sorting.
        </p>
      </div>

      {!clientId && (
        <Card className="mb-4 border border-amber-200 bg-amber-50 text-amber-800 p-4">
          Select a client first to load the Ad Performance Board.
        </Card>
      )}

      <FiltersBar
        filters={filters}
        groupBy={groupBy}
        onFiltersChange={setFilters}
        onGroupByChange={setGroupBy}
        onApply={handleApplyFilters}
        onQuickApply={handleApplyFilters}
        onReset={handleResetFilters}
        availableZipCodes={availableZipCodes}
        availableServiceTypes={availableServiceTypes}
      />

      <Separator className="mb-4" />

      <Card className="p-3 border border-slate-200/70 overflow-hidden">
        <div className="flex items-center justify-between mb-3 gap-3">
          <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-slate-800">
            Columns
            </div>
            <Input
              placeholder="Search Campaign / Ad set / Ad name..."
              value={searchInputValue}
              onChange={(e) => {
                setSearchInputValue(e.target.value);
              }}
              className="w-64"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add column
          </Button>
        </div>

        {isFetching && (
          <div className="flex items-center gap-2 text-sm text-slate-600 pb-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading performance data…
          </div>
        )}

        {!isFetching && sortedData.length === 0 && (
          <div className="text-sm text-slate-500 px-2 py-4">
            No data returned for this range. Try expanding the date window or
            relaxing filters.
          </div>
        )}

        <div
          className="w-full overflow-x-auto overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 220px)" }}
        >
          <div className="inline-block border border-slate-200 rounded-md">
            <table className="border-collapse" style={{ minWidth: `${visibleColumns.length * 200}px` }}>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {visibleColumns.map((column, colIndex) => {
                    const isFrozen = frozenColumns.includes(column.id);
                    const frozenIndex = frozenColumns.indexOf(column.id);
                    const leftOffset = isFrozen ? frozenIndex * 200 : 0;
                    const dimensionIds = ["campaignName", "adSetName", "adName"];
                    const isDimension = dimensionIds.includes(column.id);
                    const isZipCode = column.id === "zipCode";
                    const isService = column.id === "service";
                    const sortRule = sortState.find((r) => r.columnId === column.id);
                    const sortDirection = sortRule?.direction;
                    const categoryColors = getCategoryColors(column.category);
                    
                    return (
                      <th
                        key={column.id}
                        className={`group px-3 py-2 text-left text-[11px] font-semibold tracking-wide border-r border-slate-200 last:border-r-0 relative whitespace-nowrap ${
                          categoryColors ? `${!isFrozen ? categoryColors.bg : ""} ${categoryColors.text}` : "text-slate-700"
                        } ${isFrozen ? "sticky z-20" : ""}`}
                        style={{
                          minWidth: "250px",
                          width: "250px",
                          maxWidth: (isZipCode || isService) ? "250px" : undefined,
                          left: isFrozen ? `${leftOffset}px` : undefined,
                          backgroundColor: isFrozen 
                            ? (categoryColors ? categoryColors.bgColor : "#f8fafc") 
                            : undefined,
                          boxShadow: isFrozen ? "2px 0 4px rgba(0, 0, 0, 0.05)" : undefined,
                          position: isFrozen ? "sticky" : undefined,
                        }}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop(column.id)}
                      >
                        <div className="flex items-center justify-between">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div 
                                  className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity max-w-full"
                                  onClick={() => column.sortable && handleRequestSort(column.id)}
                                >
                                  <span
                                    draggable={true}
                                    onDragStart={(e) => {
                                      e.stopPropagation();
                                      handleDragStart(column.id)(e);
                                    }}
                                    className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <GripVertical className="h-3 w-3 text-slate-400" />
                                  </span>
                                  <span className="text-[11px] leading-tight whitespace-nowrap truncate max-w-[220px]">
                                    {column.label}
                                  </span>
                                  {column.sortable && (
                                    <div className="flex items-center ml-1">
                                      {sortDirection === "asc" ? (
                                        <ArrowUp className={`h-3 w-3 ${categoryColors ? categoryColors.text : "text-slate-600"}`} />
                                      ) : sortDirection === "desc" ? (
                                        <ArrowDown className={`h-3 w-3 ${categoryColors ? categoryColors.text : "text-slate-600"}`} />
                                      ) : (
                                        <div className="h-3 w-3 flex items-center justify-center">
                                          <ArrowUp className={`h-2 w-2 ${categoryColors ? categoryColors.text : "text-slate-400"} opacity-50`} />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="max-w-xs space-y-1">
                                  <p className="text-xs font-semibold text-slate-900">
                                    {column.label}
                                  </p>
                                  {column.description && (
                                    <p className="text-xs text-slate-600 whitespace-normal break-words">
                                      {column.description}
                                    </p>
                                  )}
                                  {column.formula && (
                                    <pre className="mt-1 text-[11px] font-mono bg-slate-900 text-slate-50 px-2 py-1 rounded-md whitespace-pre-wrap break-words">
                                      {column.formula}
                                    </pre>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 hover:bg-white/80 hover:text-slate-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFreeze(column.id);
                              }}
                              title={frozenColumns.includes(column.id) ? "Unfreeze column" : "Freeze column"}
                            >
                              <Pin className={`h-3 w-3 ${frozenColumns.includes(column.id) ? "text-blue-600 fill-blue-600" : categoryColors ? categoryColors.text : "text-slate-600"}`} />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 hover:bg-white/80 hover:text-slate-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveColumn(column.id);
                              }}
                            >
                              <X className={`h-3 w-3 ${categoryColors ? categoryColors.text : "text-slate-600"}`} />
                            </Button>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sortedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumns.length}
                      className="px-3 py-8 text-center text-sm text-slate-500"
                    >
                      No data available
                    </td>
                  </tr>
                ) : (
                  sortedData.map((row, rowIdx) => (
                    <tr
                      key={row.id ?? rowIdx}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      {visibleColumns.map((column) => {
                        const isZipCode = column.id === "zipCode";
                        const isService = column.id === "service";
                        const cellValue = row[column.apiField];
                        const zipCodeFormat = isZipCode ? formatZipCodeValue(cellValue) : null;
                        const serviceFormat = isService ? formatServiceValue(cellValue) : null;
                        const hasMoreZipCodes = isZipCode && zipCodeFormat && zipCodeFormat.remaining !== undefined;
                        const hasMoreServices = isService && serviceFormat && serviceFormat.remaining !== undefined;
                        const categoryColors = getCategoryColors(column.category);
                        const isFrozen = frozenColumns.includes(column.id);
                        const frozenIndex = frozenColumns.indexOf(column.id);
                        const leftOffset = isFrozen ? frozenIndex * 200 : 0;
                        
                        return (
                          <td
                key={column.id}
                            className={`px-3 py-2 text-sm border-r border-slate-100 last:border-r-0 overflow-hidden ${
                              categoryColors && !isFrozen ? categoryColors.cellBg : ""
                            } ${isFrozen ? "sticky z-20" : ""}`}
                            style={{
                              minWidth: "200px",
                              width: (isZipCode || isService) ? "200px" : "200px",
                              maxWidth: (isZipCode || isService) ? "200px" : undefined,
                              left: isFrozen ? `${leftOffset}px` : undefined,
                              backgroundColor: isFrozen 
                                ? (categoryColors ? categoryColors.bgColor : "#ffffff") 
                                : undefined,
                              boxShadow: isFrozen ? "2px 0 4px rgba(0, 0, 0, 0.05)" : undefined,
                              position: isFrozen ? "sticky" : undefined,
                            }}
                          >
                            {isZipCode && hasMoreZipCodes && zipCodeFormat ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center justify-between gap-2 cursor-help min-w-0">
                                      <span className="whitespace-nowrap truncate flex-1 min-w-0 overflow-hidden">
                                        {zipCodeFormat.display}
                                      </span>
                                      <span className="text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded flex-shrink-0">
                                        +{zipCodeFormat.remaining}
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{zipCodeFormat.full}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : isService && hasMoreServices && serviceFormat ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center justify-between gap-2 cursor-help min-w-0">
                                      <span className="truncate flex-1 min-w-0 overflow-hidden">
                                        {serviceFormat.display}
                                        {serviceFormat.showEllipsis && "..."}
                                      </span>
                                      <span className="text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded flex-shrink-0">
                                        +{serviceFormat.remaining}
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{serviceFormat.full}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : isService && serviceFormat ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="truncate overflow-hidden cursor-help">
                                      {serviceFormat.display}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{serviceFormat.full}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : isZipCode && zipCodeFormat ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="whitespace-nowrap truncate cursor-help block">
                                      {zipCodeFormat.display}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{zipCodeFormat.full}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="whitespace-nowrap truncate block cursor-help">
                                      {formatCellValue(column, cellValue)}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{String(formatCellValue(column, cellValue))}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
                {visibleColumns.some((col) => col.aggregate && col.aggregate !== "none") && sortedData.length > 0 && (
                  <tr className="bg-slate-50 border-t-2 border-slate-300 font-semibold">
                    {visibleColumns.map((column, colIndex) => {
                      const isZipCode = column.id === "zipCode";
                      const isService = column.id === "service";
                      const categoryColors = getCategoryColors(column.category);
                      const hasAggregate = column.aggregate && column.aggregate !== "none";
                      const aggregateValue = hasAggregate ? getAggregateValue(column, sortedData) : null;
                      const aggregateInfo = hasAggregate 
                        ? column.aggregate === "sum" 
                          ? { label: "Sum", icon: Sigma }
                          : column.aggregate === "avg" 
                          ? { label: "Average", icon: BarChart3 }
                          : column.aggregate === "min"
                          ? { label: "Minimum", icon: TrendingDown }
                          : column.aggregate === "max"
                          ? { label: "Maximum", icon: TrendingUp }
                          : { label: "Total", icon: Sigma }
                        : null;
                      const isFrozen = frozenColumns.includes(column.id);
                      const frozenIndex = frozenColumns.indexOf(column.id);
                      const leftOffset = isFrozen ? frozenIndex * 200 : 0;
                      
                      return (
                        <td
                          key={column.id}
                          className={`px-3 py-2 text-sm text-slate-700 border-r border-slate-200 last:border-r-0 whitespace-nowrap ${
                            categoryColors && !isFrozen ? categoryColors.cellBg : ""
                          } ${isFrozen ? "sticky z-20" : ""}`}
                          style={{
                            minWidth: "200px",
                            width: "200px",
                            maxWidth: (isZipCode || isService) ? "200px" : undefined,
                            left: isFrozen ? `${leftOffset}px` : undefined,
                            backgroundColor: isFrozen 
                              ? (categoryColors ? categoryColors.bgColor : "#f8fafc") 
                              : undefined,
                            boxShadow: isFrozen ? "2px 0 4px rgba(0, 0, 0, 0.05)" : undefined,
                            position: isFrozen ? "sticky" : undefined,
                          }}
                        >
                          {hasAggregate && aggregateValue && aggregateInfo ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="flex items-center gap-1.5 cursor-help">
                                    <aggregateInfo.icon className="h-3.5 w-3.5 text-slate-500" />
                                    <span>{aggregateValue}</span>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-medium">
                                    {aggregateInfo.label}: {aggregateValue}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            "—"
                          )}
                        </td>
                      );
                    })}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <AddColumnSheet
        open={isAddOpen}
        availableColumns={AVAILABLE_COLUMNS}
        selectedColumnIds={columnOrder}
        groupBy={groupBy}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleSelectColumns}
      />

      <ColumnSettingsSheet
        open={settingsOpen}
        column={activeColumn}
        sortDirection={
          sortState.find((r) => r.columnId === activeColumn?.id)?.direction ??
          null
        }
        onClose={() => setSettingsOpen(false)}
        onSave={handleSaveSettings}
      />
    </div>
  );
};

