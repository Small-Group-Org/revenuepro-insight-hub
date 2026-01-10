import { useEffect, useMemo, useState, useRef } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, X, GripVertical, ArrowUp, ArrowDown, Pin, Settings, LayoutPanelTop } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FiltersBar } from "./FiltersBar";
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
  PerformanceBoardAverages,
} from "@/types/adPerformanceBoard";
import { fetchAdPerformanceBoard } from "@/service/adPerformanceBoardService";
import { fetchAdGridData, AdGridAd } from "@/service/adGridService";
import { useUserContext } from "@/utils/UserContext";
import { useUserStore } from "@/stores/userStore";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/common-ui/PageHeader";

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

// Helper function to load saved preferences synchronously
const loadSavedPreferences = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    return JSON.parse(saved);
  } catch (error) {
    return null;
  }
};

export const PerformanceBoard = () => {
  const { user } = useUserContext();
  const { selectedUserId } = useUserStore();

  const clientId = selectedUserId || (user as any)?._id;
  const { toast } = useToast();

  // Load saved preferences synchronously during initialization
  const savedPrefs = loadSavedPreferences();
  const defaultFilters = savedPrefs?.filters || getDefaultDateRange();
  const defaultGroupBy = savedPrefs?.groupBy || "campaign";
  
  // Initialize state from localStorage to prevent double API calls
  const [filters, setFilters] = useState<PerformanceBoardFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<PerformanceBoardFilters>(defaultFilters);
  const [groupBy, setGroupBy] = useState<GroupBy>(defaultGroupBy);
  const [columns, setColumns] = useState<ColumnConfig[]>(
    savedPrefs?.columns || AVAILABLE_COLUMNS.filter((c) => c.isDefault)
  );
  const [columnOrder, setColumnOrder] = useState<string[]>(
    savedPrefs?.columnOrder || DEFAULT_COLUMN_ORDER
  );
  const [sortState, setSortState] = useState<SortRule[]>(savedPrefs?.sortState || []);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeColumn, setActiveColumn] = useState<ColumnConfig | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<"left" | "right" | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDropBlocked, setIsDropBlocked] = useState(false);
  const [frozenColumns, setFrozenColumns] = useState<string[]>(savedPrefs?.frozenColumns || []);
  const [searchInputValue, setSearchInputValue] = useState<string>("");
  const [availableZipCodes, setAvailableZipCodes] = useState<string[]>([]);
  const [availableServiceTypes, setAvailableServiceTypes] = useState<string[]>([]);
  const [apiAverages, setApiAverages] = useState<PerformanceBoardAverages | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  
  // Only sync localStorage changes after initial mount (for cross-tab sync)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // This effect only runs for external localStorage changes after initial mount
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.filters) {
            setFilters(parsed.filters);
            setAppliedFilters(parsed.filters);
          }
          if (parsed.groupBy) setGroupBy(parsed.groupBy);
          if (parsed.columns) setColumns(parsed.columns);
          if (parsed.columnOrder) setColumnOrder(parsed.columnOrder);
          if (parsed.sortState) setSortState(parsed.sortState);
          if (parsed.frozenColumns) setFrozenColumns(parsed.frozenColumns);
        } catch (error) {
          // ignore corrupted preferences
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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
    const dimensionHierarchy = ["campaignName", "adSetName", "adName"]; // Enforced order: Campaign > Ad Set > Ad Name
    
    // Get dimensions in hierarchy order (always maintain Campaign > Ad Set > Ad Name)
    const dimensionOrder = dimensionHierarchy.filter((id) => columnOrder.includes(id));
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
    // But maintain dimension hierarchy within frozen columns
    const frozenDimensions = frozen.filter((col) => dimensionIds.includes(col.id));
    const frozenMetrics = frozen.filter((col) => !dimensionIds.includes(col.id));
    const orderedFrozenDimensions = dimensionHierarchy
      .filter((id) => frozenDimensions.some((col) => col.id === id))
      .map((id) => frozenDimensions.find((col) => col.id === id))
      .filter((c): c is ColumnConfig => Boolean(c));
    
    const orderedFrozenMetrics = frozenColumns
      .filter((id) => frozenMetrics.some((col) => col.id === id))
      .map((id) => frozenMetrics.find((col) => col.id === id))
      .filter((c): c is ColumnConfig => Boolean(c));
    
    const orderedFrozen = [...orderedFrozenDimensions, ...orderedFrozenMetrics];
    
    // Unfrozen columns: maintain dimension hierarchy
    const unfrozenDimensions = unfrozen.filter((col) => dimensionIds.includes(col.id));
    const unfrozenMetrics = unfrozen.filter((col) => !dimensionIds.includes(col.id));
    const orderedUnfrozenDimensions = dimensionHierarchy
      .filter((id) => unfrozenDimensions.some((col) => col.id === id))
      .map((id) => unfrozenDimensions.find((col) => col.id === id))
      .filter((c): c is ColumnConfig => Boolean(c));
    
    return [...orderedFrozen, ...orderedUnfrozenDimensions, ...unfrozenMetrics];
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
  }, [searchInputValue, groupBy, appliedFilters]); // Fixed: Added missing dependencies

  // Reset search filter when groupBy changes (but skip on initial mount)
  useEffect(() => {
    // Skip on initial mount to prevent double API call
    if (isInitialMount.current) {
      return;
    }
    
    // Clear the search input
    setSearchInputValue("");
    
    // Clear the filter for the previous groupBy and apply empty filter for new groupBy
    // Use functional update to avoid stale closure issues
    setAppliedFilters((prevFilters) => {
      const update: Partial<PerformanceBoardFilters> = {
        campaignName: undefined,
        adSetName: undefined,
        adName: undefined,
      };
      const newFilters = { ...prevFilters, ...update };
      setFilters(newFilters); // Also update filters state
      return newFilters;
    });
  }, [groupBy]); // Reset when groupBy changes

  // Transform filters: if operator is "!=", convert to "=" with remaining zip codes
  // Remove operator fields as backend doesn't need them (assumes "=" by default)
  // NOTE: We use a ref to access latest availableZipCodes/availableServiceTypes without causing re-renders
  const availableZipCodesRef = useRef<string[]>([]);
  const availableServiceTypesRef = useRef<string[]>([]);
  
  // Update refs when values change (without triggering query re-runs)
  useEffect(() => {
    if (availableZipCodes.length > 0) {
      availableZipCodesRef.current = availableZipCodes;
    }
  }, [availableZipCodes]);
  
  useEffect(() => {
    if (availableServiceTypes.length > 0) {
      availableServiceTypesRef.current = availableServiceTypes;
    }
  }, [availableServiceTypes]);
  
  const transformedFilters = useMemo(() => {
    const filters: any = { ...appliedFilters };
    
    // Handle zip code "!=" operator - convert to "=" with remaining zip codes
    if (filters.zipCode && filters.zipCodeOperator === "!=") {
      const excludedZipCodes = Array.isArray(filters.zipCode) 
        ? filters.zipCode 
        : [filters.zipCode];
      
      // Get all available zip codes and exclude the selected ones
      // Use ref to avoid circular dependency
      const remainingZipCodes = availableZipCodesRef.current.filter(
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
      // Use ref to avoid circular dependency
      const remainingServiceTypes = availableServiceTypesRef.current.filter(
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
  }, [appliedFilters]); // Removed availableZipCodes and availableServiceTypes from dependencies

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

      // Update available options from API response (only if they changed to avoid unnecessary updates)
      if (response.availableZipCodes && response.availableZipCodes.length > 0) {
        setAvailableZipCodes((prev) => {
          // Only update if different to prevent unnecessary re-renders
          const prevStr = JSON.stringify(prev.sort());
          const newStr = JSON.stringify([...response.availableZipCodes].sort());
          return prevStr === newStr ? prev : response.availableZipCodes;
        });
      }
      if (response.availableServiceTypes && response.availableServiceTypes.length > 0) {
        setAvailableServiceTypes((prev) => {
          // Only update if different to prevent unnecessary re-renders
          const prevStr = JSON.stringify(prev.sort());
          const newStr = JSON.stringify([...response.availableServiceTypes].sort());
          return prevStr === newStr ? prev : response.availableServiceTypes;
        });
      }

      // Store API-provided averages
      if (response.averages) {
        setApiAverages(response.averages);
      }

      return response.data || [];
    },
    enabled: Boolean(clientId && appliedFilters.startDate && appliedFilters.endDate),
    staleTime: 60 * 1000, // Consider data fresh for 60 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Only refetch on mount if data is stale
    placeholderData: keepPreviousData, // Keep previous data visible while fetching new data
  });

  // Separate query for ad grid view - uses dedicated API for grid data
  // DISABLED: Currently not used in render (commented out), so we disable to prevent unnecessary API calls
  const { data: adGridData } = useQuery<AdGridAd[]>({
    queryKey: [
      "ad-grid-data",
      clientId,
      transformedFilters,
    ],
    queryFn: async () => {
      const response = await fetchAdGridData({
        clientId,
        filters: transformedFilters,
      });

      if (response.error) {
        return [];
      }

      return response.data || [];
    },
    enabled: false, // Disabled since it's not currently used in the UI
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
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    
    // Create custom drag image
    try {
      const dragElement = e.currentTarget as HTMLElement;
      const rect = dragElement.getBoundingClientRect();
      const dragImage = dragElement.cloneNode(true) as HTMLElement;
      dragImage.style.position = "absolute";
      dragImage.style.top = "-1000px";
      dragImage.style.left = "-1000px";
      dragImage.style.width = `${rect.width}px`;
      dragImage.style.opacity = "0.9";
      dragImage.style.transform = "rotate(2deg)";
      dragImage.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.25)";
      dragImage.style.backgroundColor = "white";
      dragImage.style.border = "2px solid #3b82f6";
      dragImage.style.borderRadius = "4px";
      dragImage.style.pointerEvents = "none";
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, rect.width / 2, rect.height / 2);
      
      // Clean up after a short delay
      setTimeout(() => {
        if (document.body.contains(dragImage)) {
          document.body.removeChild(dragImage);
        }
      }, 0);
    } catch (error) {
      // Fallback to default drag image if custom one fails
      console.warn("Failed to create custom drag image:", error);
    }
  };

  const handleDragEnd = () => {
    // Clear all drag states immediately for instant visual feedback
    setDraggingId(null);
    setDragOverColumnId(null);
    setDropPosition(null);
    setIsDragging(false);
    setIsDropBlocked(false);
  };

  const handleDragOver = (targetId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Auto-scroll when near edges
    if (scrollContainerRef.current && isDragging) {
      const container = scrollContainerRef.current;
      const rect = container.getBoundingClientRect();
      const scrollThreshold = 100;
      const scrollSpeed = 15;
      
      // Left edge scroll
      if (e.clientX < rect.left + scrollThreshold && e.clientX > rect.left) {
        const scrollAmount = Math.min(scrollSpeed, container.scrollLeft);
        if (scrollAmount > 0) {
          container.scrollBy({ left: -scrollAmount, behavior: 'auto' });
        }
      }
      // Right edge scroll
      else if (e.clientX > rect.right - scrollThreshold && e.clientX < rect.right) {
        const maxScroll = container.scrollWidth - container.clientWidth;
        const scrollAmount = Math.min(scrollSpeed, maxScroll - container.scrollLeft);
        if (scrollAmount > 0) {
          container.scrollBy({ left: scrollAmount, behavior: 'auto' });
        }
      }
    }
    
    if (!draggingId || draggingId === targetId) {
      setDragOverColumnId(null);
      setDropPosition(null);
      setIsDropBlocked(false);
      return;
    }

    const dimensionIds = ["campaignName", "adSetName", "adName"];
    const isSourceDimension = dimensionIds.includes(draggingId);
    const isTargetDimension = dimensionIds.includes(targetId);
    
    // Block metrics from dropping in dimension zone
    if (!isSourceDimension && isTargetDimension) {
      setIsDropBlocked(true);
      setDragOverColumnId(targetId);
      setDropPosition(null);
      return;
    }
    
    // Allow dimension-to-dimension and metric-to-metric
    setIsDropBlocked(false);
    setDragOverColumnId(targetId);
    
    // Determine drop position (left or right) based on mouse position
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mouseX = e.clientX;
    const centerX = rect.left + rect.width / 2;
    const newPosition = mouseX < centerX ? "left" : "right";
    
    // Only update if position changed to avoid unnecessary re-renders
    setDropPosition((prev) => prev !== newPosition ? newPosition : prev);
  };

  const handleDragLeave = () => {
    setDragOverColumnId(null);
    setDropPosition(null);
    setIsDropBlocked(false);
  };

  const handleDrop = (targetId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear drag state immediately for instant visual feedback
    const sourceId = draggingId || e.dataTransfer.getData("text/plain");
    handleDragEnd();
    
    if (!sourceId || sourceId === targetId) {
      return;
    }

    const dimensionIds = ["campaignName", "adSetName", "adName"];
    const dimensionHierarchy = ["campaignName", "adSetName", "adName"]; // Enforced order
    const isSourceDimension = dimensionIds.includes(sourceId);
    const isTargetDimension = dimensionIds.includes(targetId);

    // Block metrics from dropping in dimension zone
    if (!isSourceDimension && isTargetDimension) {
      return;
    }

    // Calculate new order immediately
    setColumnOrder((prev) => {
      const next = [...prev];
      const fromIndex = next.indexOf(sourceId);
      const toIndex = next.indexOf(targetId);
      if (fromIndex === -1 || toIndex === -1) {
        return prev;
      }
      
      // If both are dimensions, allow dragging but always enforce hierarchy: Campaign > Ad Set > Ad Name
      if (isSourceDimension && isTargetDimension) {
        const dimensionOrder = dimensionHierarchy.filter((id) => next.includes(id));
        const otherColumns = next.filter((id) => !dimensionIds.includes(id));
        
        // Dimensions are draggable but hierarchy is always enforced
        // Simply re-sort dimensions to maintain hierarchy order
        const sortedDimensions = dimensionHierarchy.filter((id) => dimensionOrder.includes(id));
        return [...sortedDimensions, ...otherColumns];
      }
      
      // If source is dimension and target is not, move dimension to start (before first non-dimension)
      if (isSourceDimension && !isTargetDimension) {
        const dimensionOrder = dimensionHierarchy.filter((id) => next.includes(id));
        const otherColumns = next.filter((id) => !dimensionIds.includes(id));
        const newDimensionOrder = dimensionOrder.filter((id) => id !== sourceId);
        // Re-add source and re-sort to maintain hierarchy
        const allDimensions = [...newDimensionOrder, sourceId];
        const sortedDimensions = dimensionHierarchy.filter((id) => allDimensions.includes(id));
        return [...sortedDimensions, ...otherColumns];
      }
      
      // Both are non-dimensions, allow reordering
      // Use drop position to determine exact placement
      const finalToIndex = dropPosition === "left" ? toIndex : toIndex + 1;
      const adjustedToIndex = finalToIndex > fromIndex ? finalToIndex - 1 : finalToIndex;
      next.splice(fromIndex, 1);
      next.splice(adjustedToIndex, 0, sourceId);
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
    <div className="px-6 pt-6 pb-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <PageHeader
          icon={LayoutPanelTop}
          title="Ad Performance Board"
          description="Analyze and compare Meta ad performance with customizable columns, filters, and sorting."
        />

        {!clientId && (
          <Card className="mb-4 border border-amber-200 bg-amber-50 text-amber-800 p-4">
            Select a client first to load the Ad Performance Board.
          </Card>
        )}

        <FiltersBar
          filters={filters}
          onFiltersChange={setFilters}
          onApply={handleApplyFilters}
          onQuickApply={handleApplyFilters}
          onReset={handleResetFilters}
          availableZipCodes={availableZipCodes}
          availableServiceTypes={availableServiceTypes}
        />

        <Separator className="mb-4" />

        <Card className="p-3 border border-slate-200/70 overflow-hidden relative">
        <div className="flex items-center justify-between mb-3 gap-3">
          <div className="flex items-end gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">
                Group by
              </span>
              <Select
                value={groupBy}
                onValueChange={(value) => setGroupBy(value as GroupBy)}
              >
                <SelectTrigger className="h-10 w-[140px] min-w-[140px]">
                  <SelectValue placeholder="Group by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="campaign">Campaign</SelectItem>
                  <SelectItem value="adset">Ad set</SelectItem>
                  <SelectItem value="ad">Ad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Input
                placeholder="Search Campaign / Ad set / Ad name..."
                value={searchInputValue}
                onChange={(e) => {
                  setSearchInputValue(e.target.value);
                }}
                className="w-[260px]"
              />
            </div>
          </div>
            {/* Blocked drop warning - one liner above table */}
            {isDragging && isDropBlocked && (
            <div className="text-center py-2 text-red-600 text-sm font-semibold">
              Dropping metric columns in this area is not allowed
            </div>
            )}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setIsAddOpen(true)}
            >
              <Settings className="h-4 w-4" />
              Configure columns
            </Button>
          </div>
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

        {/* {adGridData && adGridData.length > 0 && (
          <div className="mb-4">
            <AdGridView
              ads={adGridData}
              startDate={appliedFilters.startDate}
              endDate={appliedFilters.endDate}
              clientId={clientId}
            />
          </div>
        )} */}

        <div
          ref={scrollContainerRef}
          className="w-full overflow-x-auto overflow-y-auto relative"
          style={{ maxHeight: "calc(100vh - 220px)" }}
        >

          <div className="inline-block border border-slate-200 rounded-md">
            <table className="border-collapse" style={{ minWidth: `${visibleColumns.length * 250}px` }}>
              <thead className="sticky top-0 z-30">
                <tr className="bg-slate-50 border-b border-slate-200">
                  {visibleColumns.map((column, colIndex) => {
                    const isFrozen = frozenColumns.includes(column.id);
                    const frozenIndex = frozenColumns.indexOf(column.id);
                    const leftOffset = isFrozen ? frozenIndex * 250 : 0;
                    const dimensionIds = ["campaignName", "adSetName", "adName"];
                    const isDimension = dimensionIds.includes(column.id);
                    const isZipCode = column.id === "zipCode";
                    const isService = column.id === "service";
                    const sortRule = sortState.find((r) => r.columnId === column.id);
                    const sortDirection = sortRule?.direction;
                    const categoryColors = getCategoryColors(column.category);
                    const isBeingDragged = draggingId === column.id;
                    const isDragOver = dragOverColumnId === column.id;
                    const showLeftIndicator = isDragOver && dropPosition === "left" && !isDropBlocked;
                    const showRightIndicator = isDragOver && dropPosition === "right" && !isDropBlocked;
                    const showBlockedIndicator = isDragOver && isDropBlocked;
                    
                    return (
                      <th
                        key={column.id}
                        draggable={!isDimension}
                        onDragStart={!isDimension ? handleDragStart(column.id) : undefined}
                        onDragEnd={!isDimension ? (e) => {
                          // Handle drag end immediately for instant feedback
                          handleDragEnd();
                        } : undefined}
                        onDragOver={handleDragOver(column.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop(column.id)}
                        className={`group px-3 py-2 text-left text-sm font-semibold tracking-wide border-r border-slate-200 last:border-r-0 relative whitespace-nowrap transition-all duration-150 ${
                          categoryColors ? `${!isFrozen ? categoryColors.bg : ""} ${categoryColors.text}` : "text-slate-700"
                        } ${isFrozen ? "sticky z-40" : ""} ${
                          !isDimension && isBeingDragged ? "opacity-50 scale-95 cursor-grabbing" : !isDimension ? "cursor-grab hover:bg-slate-100" : ""
                        } ${
                          isDragOver && !isDropBlocked ? "bg-blue-50 border-blue-300" : ""
                        } ${
                          isDragOver && isDropBlocked ? "bg-red-50" : ""
                        } ${
                          isDimension ? "bg-purple-50/30 border-l-2 border-l-purple-400" : ""
                        }`}
                        style={{
                          minWidth: "250px",
                          width: "250px",
                          maxWidth: (isZipCode || isService) ? "250px" : undefined,
                          top: 0,
                          left: isFrozen ? `${leftOffset}px` : undefined,
                          backgroundColor: isDragOver && isDropBlocked
                            ? "rgba(220, 38, 38, 0.1)"
                            : isDragOver && !isDropBlocked
                            ? "#dbeafe"
                            : isDimension
                            ? "#faf5ff"
                            : (categoryColors && !isFrozen ? categoryColors.bgColor : "#f8fafc"),
                          boxShadow: isFrozen ? "2px 0 4px rgba(0, 0, 0, 0.05)" : undefined,
                          position: "sticky",
                        }}
                      >
                        {/* Drop indicator - Left */}
                        {showLeftIndicator && (
                          <>
                            <div 
                              className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 z-50 animate-pulse"
                              style={{ 
                                boxShadow: "0 0 12px rgba(59, 130, 246, 0.8)"
                              }}
                            />
                            <div 
                              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full z-50 border-2 border-white animate-pulse"
                              style={{ boxShadow: "0 0 8px rgba(59, 130, 246, 0.8)" }}
                            />
                          </>
                        )}
                        {/* Drop indicator - Right */}
                        {showRightIndicator && (
                          <>
                            <div 
                              className="absolute right-0 top-0 bottom-0 w-1.5 bg-blue-500 z-50 animate-pulse"
                              style={{ 
                                boxShadow: "0 0 12px rgba(59, 130, 246, 0.8)"
                              }}
                            />
                            <div 
                              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full z-50 border-2 border-white animate-pulse"
                              style={{ boxShadow: "0 0 8px rgba(59, 130, 246, 0.8)" }}
                            />
                          </>
                        )}
                        <div className="flex items-center justify-between">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div 
                                  className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity max-w-full"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (column.sortable) {
                                      handleRequestSort(column.id);
                                    }
                                  }}
                                  onMouseDown={(e) => {
                                    // Prevent text selection while dragging
                                    if (e.button === 0) {
                                      e.preventDefault();
                                    }
                                  }}
                                >
                                  {!isDimension && (
                                    <span
                                      className={`cursor-grab active:cursor-grabbing transition-opacity ${
                                        isDragging ? "opacity-100" : "opacity-60 group-hover:opacity-100"
                                      }`}
                                      style={{ pointerEvents: "none" }}
                                    >
                                      <GripVertical className="h-4 w-4 text-slate-500" />
                                    </span>
                                  )}
                                  <span className="text-sm leading-tight whitespace-nowrap truncate max-w-[220px]">
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
                          <div className={`flex items-center gap-1 transition-opacity ${
                            isDragging ? "opacity-30" : "opacity-0 group-hover:opacity-100"
                          }`}>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 hover:bg-white/80 hover:text-slate-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleToggleFreeze(column.id);
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
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
                                e.preventDefault();
                                handleRemoveColumn(column.id);
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
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
                        const leftOffset = isFrozen ? frozenIndex * 250 : 0;
                        const dimensionIds = ["campaignName", "adSetName", "adName"];
                        const isDimension = dimensionIds.includes(column.id);
                        const isColumnBlocked = dragOverColumnId === column.id && isDropBlocked;
                        
                        return (
                          <td
                            key={column.id}
                            className={`py-2 pr-3 pl-6 text-sm border-r border-slate-100 last:border-r-0 overflow-hidden relative ${
                              categoryColors && !isFrozen ? categoryColors.cellBg : ""
                            } ${isFrozen ? "sticky z-20" : ""}`}
                            style={{
                              minWidth: "250px",
                              width: "250px",
                              maxWidth: (isZipCode || isService) ? "250px" : undefined,
                              left: isFrozen ? `${leftOffset}px` : undefined,
                              backgroundColor: isColumnBlocked
                                ? "rgba(220, 38, 38, 0.1)"
                                : isFrozen 
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
                  <tr className="bg-slate-50 border-t-2 border-slate-300 font-semibold sticky bottom-0 z-30">
                    {visibleColumns.map((column, colIndex) => {
                      const isZipCode = column.id === "zipCode";
                      const isService = column.id === "service";
                      const categoryColors = getCategoryColors(column.category);
                      const hasAggregate = column.aggregate && column.aggregate !== "none";
                      const aggregateValue = hasAggregate ? getAggregateValue(column, sortedData, apiAverages) : null;
                      const isFrozen = frozenColumns.includes(column.id);
                      const frozenIndex = frozenColumns.indexOf(column.id);
                      const leftOffset = isFrozen ? frozenIndex * 250 : 0;
                      const dimensionIds = ["campaignName", "adSetName", "adName"];
                      const isColumnBlocked = dragOverColumnId === column.id && isDropBlocked;
                      
                      return (
                        <td
                          key={column.id}
                          className={`py-2 pr-3 pl-6 text-sm text-slate-700 border-r border-slate-200 last:border-r-0 whitespace-nowrap relative ${
                            categoryColors && !isFrozen ? categoryColors.cellBg : ""
                          } ${isFrozen ? "sticky z-40" : ""} ${
                            isColumnBlocked ? "bg-red-50" : ""
                          }`}
                          style={{
                            minWidth: "250px",
                            width: "250px",
                            maxWidth: (isZipCode || isService) ? "250px" : undefined,
                            bottom: 0,
                            left: isFrozen ? `${leftOffset}px` : undefined,
                            backgroundColor: isColumnBlocked
                              ? "rgba(220, 38, 38, 0.1)"
                              : (categoryColors ? categoryColors.bgColor : "#f8fafc"),
                            boxShadow: isFrozen ? "2px 0 4px rgba(0, 0, 0, 0.05)" : undefined,
                            position: "sticky",
                          }}
                          >
                            {hasAggregate && aggregateValue ? (
                              column.aggregate === "avg" ? (
                                <span className="flex items-center gap-1.5 text-sm text-slate-700">
                                  <span className="uppercase tracking-wide text-[11px] font-semibold">
                                    AVG:
                                  </span>
                                  <span className="font-semibold">
                                    {aggregateValue}
                                  </span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-sm text-slate-700">
                                  <span className="uppercase tracking-wide text-[11px] font-semibold">
                                    {column.aggregate === "min"
                                      ? "MIN"
                                      : column.aggregate === "max"
                                      ? "MAX"
                                      : "SUM"}
                                    :
                                  </span>
                                  <span className="font-semibold">
                                    {aggregateValue}
                                  </span>
                                </span>
                              )
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
      </div>

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

