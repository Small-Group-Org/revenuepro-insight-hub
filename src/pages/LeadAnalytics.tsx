import { useState, useEffect, useCallback, useMemo } from "react";
import { useUserStore } from "@/stores/userStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import {
  TrendingUp,
  MapPin,
  Wrench,
  Tag,
  FileText,
  Users,
  CheckCircle,
  XCircle,
  Calendar,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Trophy,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SortSwitch } from "@/components/ui/sort-switch";
import { TopCard } from "@/components/DashboardTopCards";
import {
  getAnalyticsSummary,
  getAnalyticsTable,
  GetAnalyticsSummaryPayload,
  GetAnalyticsTablePayload,
  AnalyticsSummaryResponse,
  AnalyticsTableResponse,
} from "@/service/leadService";
import { TimeFilter, TIME_FILTER_LABELS } from "@/types/timeFilter";
import {
  createDateRangeFromTimeFilter,
  createNumericDayRanges,
} from "@/utils/leads/dateRangeHelpers";
import { format } from "date-fns";
import { Calendar as UICalendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Chart colors
const COLORS = ["#1f1c13", "#9ca3af", "#306BC8", "#2A388F", "#396F9C"];

const TOP_N_ZIP = 15;

const CHART_DIMENSIONS = {
  minWidth: "600px", // Minimum width for charts on small screens
  height: "320px", // Chart height (h-80 = 320px)
};

// Currency formatter
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);

// Helper function to format custom date range label
const formatCustomRangeLabel = (startDate: Date, endDate: Date): string => {
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  
  if (startYear === endYear) {
    // Same year: "Sept 29 - Oct 5, 2025"
    return `${format(startDate, "MMM dd")} - ${format(endDate, "MMM dd, yyyy")}`;
  } else {
    // Different years: "Dec 29, 2024 - Jan 4, 2025"
    return `${format(startDate, "MMM dd, yyyy")} - ${format(endDate, "MMM dd, yyyy")}`;
  }
};

type AnalyticsTimeFilter = TimeFilter | "custom";

export const LeadAnalytics = () => {
  const { selectedUserId } = useUserStore();
  const [timeFilter, setTimeFilter] = useState<AnalyticsTimeFilter>("all");
  const [customRange, setCustomRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  const [openPicker, setOpenPicker] = useState(false);
  const [customStart, setCustomStart] = useState<Date>(new Date());
  const [customEnd, setCustomEnd] = useState<Date>(new Date());
  const [customRangeApplied, setCustomRangeApplied] = useState(false);
  const [startMonth, setStartMonth] = useState<Date>(new Date());
  const [endMonth, setEndMonth] = useState<Date>(new Date());
  const currentYear = new Date().getFullYear();

  // Analytics data states
  const [analyticsData, setAnalyticsData] = useState<
    AnalyticsSummaryResponse["data"] | null
  >(null);
  const [tableData, setTableData] = useState<
    AnalyticsTableResponse["data"] | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination states for each table
  const [adSetPage, setAdSetPage] = useState(1);
  const [adNamePage, setAdNamePage] = useState(1);
  const adSetItemsPerPage = 15;
  const adNameItemsPerPage = 10;

  // Sorting states for each table
  const [adSetSortField, setAdSetSortField] = useState<
    "adSetName" | "total" | "estimateSet" | "jobBookedAmount" | "percentage"
  >("estimateSet");
  const [adSetSortOrder, setAdSetSortOrder] = useState<"asc" | "desc">("desc");
  const [adNameSortField, setAdNameSortField] = useState<
    "adName" | "total" | "estimateSet" | "jobBookedAmount" | "percentage"
  >("estimateSet");
  const [adNameSortOrder, setAdNameSortOrder] = useState<"asc" | "desc">(
    "desc"
  );

  // Common time filter for both tables
  const [commonTimeFilter, setCommonTimeFilter] = useState<
    "all" | "7" | "14" | "30" | "60" | "custom"
  >("all");
  const [tableCustomRange, setTableCustomRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  const [openTablePicker, setOpenTablePicker] = useState(false);
  const [tableCustomStart, setTableCustomStart] = useState<Date>(new Date());
  const [tableCustomEnd, setTableCustomEnd] = useState<Date>(new Date());
  const [tableCustomRangeApplied, setTableCustomRangeApplied] = useState(false);
  const [tableStartMonth, setTableStartMonth] = useState<Date>(new Date());
  const [tableEndMonth, setTableEndMonth] = useState<Date>(new Date());

  // Top ranking toggle states
  const [showTopRankedAdSets, setShowTopRankedAdSets] = useState(true);
  const [showTopRankedAdNames, setShowTopRankedAdNames] = useState(true);

  // Fetch analytics summary data
  const fetchAnalyticsSummary = useCallback(async () => {
    if (!selectedUserId) return;
    if (timeFilter === "custom" && !customRangeApplied) return;

    setLoading(true);
    setError(null);

    try {
      // Resolve date range from filter or custom range
      const { startDate, endDate } =
        timeFilter === "custom" && customRange.startDate && customRange.endDate
          ? { startDate: customRange.startDate, endDate: customRange.endDate }
          : createDateRangeFromTimeFilter(timeFilter as TimeFilter);

      const payload: GetAnalyticsSummaryPayload = {
        clientId: selectedUserId,
        startDate,
        endDate,
      };

      const response = await getAnalyticsSummary(payload);

      if (!response.error && response.data && response.data.success) {
        setAnalyticsData(response.data.data);
      } else {
        setError(response.message || "Failed to fetch analytics data");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch analytics data"
      );
    } finally {
      setLoading(false);
    }
  }, [selectedUserId, timeFilter, customRange, customRangeApplied]);

  // Fetch analytics table data
  const fetchAnalyticsTable = useCallback(async () => {
    if (!selectedUserId) return;
    if (commonTimeFilter === "custom" && !tableCustomRangeApplied) return;

    try {
      // Convert commonTimeFilter to date ranges
      const { startDate, endDate } =
        commonTimeFilter === "custom" &&
        tableCustomRange.startDate &&
        tableCustomRange.endDate
          ? {
              startDate: tableCustomRange.startDate,
              endDate: tableCustomRange.endDate,
            }
          : createNumericDayRanges(
              commonTimeFilter as "all" | "7" | "14" | "30" | "60"
            );

      const payload: GetAnalyticsTablePayload = {
        clientId: selectedUserId,
        startDate,
        endDate,
        adSetPage,
        adNamePage,
        adSetItemsPerPage,
        adNameItemsPerPage,
        adSetSortField,
        adSetSortOrder,
        adNameSortField,
        adNameSortOrder,
        showTopRanked: showTopRankedAdSets || showTopRankedAdNames,
      };

      const response = await getAnalyticsTable(payload);

      if (!response.error && response.data && response.data.success) {
        setTableData(response.data.data);
      } else {
        setError(response.message || "Failed to fetch table data");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch table data"
      );
    }
  }, [
    selectedUserId,
    commonTimeFilter,
    tableCustomRange,
    adSetPage,
    adNamePage,
    adSetSortField,
    adSetSortOrder,
    adNameSortField,
    adNameSortOrder,
    showTopRankedAdSets,
    showTopRankedAdNames,
    tableCustomRangeApplied,
  ]);

  // Fetch analytics summary when time filter or user changes
  useEffect(() => {
    fetchAnalyticsSummary();
  }, [selectedUserId, timeFilter, fetchAnalyticsSummary, customRange, customRangeApplied]);

  // Fetch table data when table-related states change
  useEffect(() => {
    fetchAnalyticsTable();
  }, [
    selectedUserId,
    commonTimeFilter,
    tableCustomRange,
    adSetPage,
    adNamePage,
    adSetSortField,
    adSetSortOrder,
    adNameSortField,
    adNameSortOrder,
    showTopRankedAdSets,
    showTopRankedAdNames,
    fetchAnalyticsTable,
    tableCustomRangeApplied,
  ]);

  // Reset pagination when filters change
  useEffect(() => {
    setAdSetPage(1);
    setAdNamePage(1);
  }, [
    timeFilter,
    commonTimeFilter,
    tableCustomRange,
    showTopRankedAdSets,
    showTopRankedAdNames,
  ]);

  // Helper function to render sortable table header
  const renderSortableHeader = (
    field: string,
    label: string,
    currentSortField: string,
    currentSortOrder: "asc" | "desc",
    onSort: (field: string) => void,
    isDisabled: boolean = false
  ) => (
    <th
      className={`text-left p-1 transition-colors ${
        isDisabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:bg-gray-50"
      }`}
      onClick={isDisabled ? undefined : () => onSort(field)}
    >
      <div className="flex items-center justify-start gap-1">
        <span className="text-center">{label}</span>
        {isDisabled ? (
          <Trophy className="w-3 h-3 text-orange-500" />
        ) : currentSortField === field ? (
          currentSortOrder === "desc" ? (
            <ChevronDown className="w-4 h-4 text-blue-600" />
          ) : (
            <ChevronUp className="w-4 h-4 text-blue-600" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 text-gray-400" />
        )}
      </div>
    </th>
  );

  // Helper function to render pagination controls
  const renderPagination = (
    currentPage: number,
    totalItems: number,
    onPageChange: (page: number) => void,
    itemsPerPage: number
  ) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-600">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
          results
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5 font-bold stroke-2 text-gray-700" />
          </button>
          <span className="text-sm text-gray-600 px-2">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5 font-bold stroke-2 text-gray-700" />
          </button>
        </div>
      </div>
    );
  };

  const chartConfig = {
    count: {
      label: "Count",
    },
    estimateSet: {
      label: "Estimates Set",
    },
  };

  // Zip chart metric toggle state
  const [zipMetric, setZipMetric] = useState<"estimateSetCount" | "jobBookedAmount">(
    "estimateSetCount"
  );

  // Process ZIP data to show top N ZIP sorted by selected metric
  const getProcessedZipData = useCallback(() => {
    if (!analyticsData?.zipData) return [];
    const metric = zipMetric;
    return [...analyticsData.zipData]
      .sort((a: any, b: any) => ((b?.[metric] ?? 0) - (a?.[metric] ?? 0)))
      .slice(0, TOP_N_ZIP);
  }, [analyticsData, zipMetric]);

  const totalEffectiveLeads =
    analyticsData?.overview.estimateSetCount +
      analyticsData?.overview.unqualifiedCount || 0;

  const estimateSetRate =
    totalEffectiveLeads > 0
      ? (analyticsData?.overview.estimateSetCount / totalEffectiveLeads) * 100
      : 0;

  const unqualifiedRate =
    totalEffectiveLeads > 0
      ? (analyticsData?.overview.unqualifiedCount / totalEffectiveLeads) * 100
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 overflow-x-hidden">
      <div className="relative z-10 pt-4 pb-12 px-4">
        <div className="max-w-7xl mx-auto space-y-10 w-full">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/60 rounded-lg flex items-center justify-center shadow-lg">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="leading-[130%] text-4xl font-bold text-gradient-primary">
                Lead Analytics
              </h1>
            </div>
            <div className="flex items-center justify-center gap-4 mb-10 mt-2">
              <p className="text-muted-foreground text-lg">
                Complete analysis of lead performance - focusing on successful
                conversions and trends
              </p>
              <div className="flex items-center gap-1 relative">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="relative">
                  <Select
                    value={timeFilter}
                    onValueChange={(value: string) => {
                      const newFilter = value as AnalyticsTimeFilter;
                      setTimeFilter(newFilter);
                      if (newFilter === "custom") {
                        setCustomRangeApplied(false);
                      }
                    }}
                  >
                    <SelectTrigger className="w-40 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TIME_FILTER_LABELS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {timeFilter === "custom" && (
                    <div className="absolute top-full left-[2%] text-xs whitespace-nowrap mt-2">
                      {!customRangeApplied ? (
                        <span className="text-gray-400">(Select Date Range)</span>
                      ) : (
                        <span className="text-muted-foreground">({formatCustomRangeLabel(customStart, customEnd)})</span>
                      )}
                    </div>
                  )}
                </div>
                {timeFilter === "custom" && (
                  <Popover open={openPicker} onOpenChange={setOpenPicker}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-8 px-3 text-xs bg-black/80 hover:bg-black text-white border-black/80 hover:border-black">
                        Select Dates
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[570px] mr-10 md:mr-40 py-0 pl-2 border border-black/40"
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                        <div className="">
                          <p className="absolute top-6 left-12 text-sm font-medium">Start</p>
                          <UICalendar
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
                            disabled={(date) => date > new Date()}
                            classNames={{
                              day_today:
                                "relative text-muted-foreground after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-muted-foreground",
                              day_disabled:
                                "cursor-not-allowed opacity-50",
                              caption:
                                "flex pl-10 justify-center pt-1 relative items-center",
                              caption_label: "hidden",
                              caption_dropdowns:
                                "flex items-center gap-1 justify-center",
                              dropdown_month:
                                "h-9 text-sm bg-background border border-input rounded-md flex items-center leading-none text-foreground focus:outline-none focus:ring-0",
                              dropdown_year:
                                "h-9 text-sm bg-background border border-input rounded-md flex items-center leading-none text-foreground focus:outline-none focus:ring-0",
                            }}
                            captionLayout="dropdown"
                            fromYear={1990}
                            toYear={currentYear + 10}
                            pagedNavigation
                          />
                        </div>
                        <div className="">
                          <p className="absolute  top-6 left-[44%] text-sm font-medium">End</p>
                          <UICalendar
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
                            disabled={(date) => date > new Date()}
                            classNames={{
                              day_today:
                                "relative text-muted-foreground after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-muted-foreground",
                              day_disabled:
                                "cursor-not-allowed opacity-50",
                              caption:
                                "flex justify-center pt-1 relative items-center",
                              caption_label: "hidden",
                              caption_dropdowns:
                                "flex pl-10 items-center gap-1 justify-center",
                              dropdown_month:
                                "h-9  text-sm bg-background border border-input rounded-md flex items-center leading-none text-foreground focus:outline-none focus:ring-0",
                              dropdown_year:
                                "h-9 text-sm bg-background border border-input rounded-md flex items-center leading-none text-foreground focus:outline-none focus:ring-0",
                            }}
                            captionLayout="dropdown"
                            fromYear={1990}
                            toYear={currentYear + 10}
                            pagedNavigation
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-1  px-0 pb-3">
                        <Button
                          variant="ghost"
                          onClick={() => setOpenPicker(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => {
                            const start = new Date(
                              customStart.getFullYear(),
                              customStart.getMonth(),
                              customStart.getDate(),
                              0,
                              0,
                              0,
                              0
                            ).toISOString();
                            const end = new Date(
                              customEnd.getFullYear(),
                              customEnd.getMonth(),
                              customEnd.getDate(),
                              23,
                              59,
                              59,
                              999
                            ).toISOString();
                            setCustomRange({ startDate: start, endDate: end });
                            setCustomRangeApplied(true);
                            setOpenPicker(false);
                          }}
                          className="mr-1"
                        >
                          Apply
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          </div>

          {/* Loading / Error / No-data States below header */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
                <p className="text-muted-foreground">Loading analytics...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : !analyticsData ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No leads data available for "
                  {TIME_FILTER_LABELS[timeFilter] || "the selected range"}".
                </p>
                <p className="text-xs text-muted-foreground">
                  Try selecting a different time period above.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <TopCard
                  title="Total Leads"
                  icon={<Users className="h-5 w-5 opacity-50 text-accent" />}
                  metrics={[
                    {
                      label: "Total Leads",
                      value: analyticsData.overview.totalLeads,
                      format: "number" as const,
                    },
                  ]}
                  description={
                    timeFilter === "custom" &&
                    customRange.startDate &&
                    customRange.endDate
                      ? `${format(
                          new Date(customRange.startDate),
                          "MMM dd, yyyy"
                        )} - ${format(
                          new Date(customRange.endDate),
                          "MMM dd, yyyy"
                        )}`
                      : TIME_FILTER_LABELS[timeFilter as TimeFilter] ||
                        "All Time"
                  }
                />

                <TopCard
                  title="Estimates Set"
                  icon={
                    <CheckCircle className="h-5 w-5 opacity-50 text-green-600" />
                  }
                  metrics={[
                    {
                      label: "Estimates Set",
                      value: analyticsData.overview.estimateSetCount,
                      format: "number" as const,
                    },
                    {
                      label: "Estimate Set Rate",
                      value: estimateSetRate,
                      format: "percent" as const,
                    },
                  ]}
                  description="Leads with estimates set"
                />

                <TopCard
                  title="Unqualified"
                  icon={<XCircle className="h-5 w-5 opacity-50 text-red-600" />}
                  metrics={[
                    {
                      label: "Unqualified",
                      value: analyticsData.overview.unqualifiedCount,
                      format: "number" as const,
                    },
                    {
                      label: "Unqualified Rate",
                      value: unqualifiedRate,
                      format: "percent" as const,
                    },
                  ]}
                  description="Leads marked as unqualified"
                />

                <TopCard
                  title="Estimate Set Rate"
                  icon={
                    <TrendingUp className="h-5 w-5 opacity-50 text-blue-600" />
                  }
                  metrics={[
                    {
                      label: "Estimate Set Rate",
                      value: estimateSetRate,
                      format: "percent" as const,
                    },
                  ]}
                  description="Estimate Set / (Estimate Set + Unqualified)"
                />
              </div>

              {/* Charts Grid */}
              {analyticsData.overview.estimateSetCount === 0 ? (
                <Card className="mx-auto max-w-md">
                  <CardContent className="text-center pt-4 pb-12">
                    <CheckCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      No Estimate Set Leads
                    </h3>
                    <p className="text-gray-500">
                      Charts will appear here once you have leads with estimates
                      set.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Service Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-1">
                        <Wrench className="h-5 w-5 text-blue-600" />
                        Service Analysis (Estimate Set Leads)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto lg:overflow-visible">
                        <div
                          style={{ minWidth: CHART_DIMENSIONS.minWidth }}
                          className="lg:min-w-0"
                        >
                          <ChartContainer
                            config={chartConfig}
                            style={{ height: CHART_DIMENSIONS.height }}
                          >
                            <PieChart>
                              <Pie
                                data={analyticsData.serviceData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={120}
                                innerRadius={0}
                                paddingAngle={2}
                                fill="#8884d8"
                                dataKey="estimateSetCount"
                              >
                                {analyticsData.serviceData.map(
                                  (entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={COLORS[index % COLORS.length]}
                                    />
                                  )
                                )}
                              </Pie>
                              <ChartTooltip
                                content={({ active, payload, label }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                        <p className="font-semibold text-gray-900 mb-1">
                                          {data.service}
                                        </p>
                                        <p className="text-sm text-gray-700">
                                          <span className="font-medium">
                                            Count:
                                          </span>{" "}
                                          {data.estimateSetCount} leads
                                        </p>
                                        <p className="text-sm text-gray-700">
                                          <span className="font-medium">
                                            Percentage:
                                          </span>{" "}
                                          {data.percentage}%
                                        </p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                            </PieChart>
                          </ChartContainer>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Zip Code Analysis */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-1">
                          <MapPin className="h-5 w-5 text-purple-600" />
                          Top Performing Zip Codes
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          
                          <SortSwitch
                            checked={zipMetric === "jobBookedAmount"}
                            onCheckedChange={(checked) =>
                              setZipMetric(checked ? "jobBookedAmount" : "estimateSetCount")
                            }
                            className=""
                          />
                          <span className="text-xs text-gray-700 font-medium"> Job Booked Amount</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto lg:overflow-visible">
                        <div
                          style={{ minWidth: CHART_DIMENSIONS.minWidth }}
                          className="lg:min-w-0"
                        >
                          <ChartContainer
                            config={chartConfig}
                            style={{ height: CHART_DIMENSIONS.height }}
                          >
                            <BarChart data={getProcessedZipData()}>
                              <defs>
                                <linearGradient
                                  id="zipGradient"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="0%"
                                    stopColor="#8b5cf6"
                                    stopOpacity={0.9}
                                  />
                                  <stop
                                    offset="100%"
                                    stopColor="#a78bfa"
                                    stopOpacity={0.6}
                                  />
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="zip" />
                              <YAxis />
                              <ChartTooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg w-52">
                                        <p className="font-semibold text-gray-900 mb-1">
                                          {data.zip}
                                        </p>
                                        <p className="text-sm text-gray-700">
                                          <span className="font-medium">Estimated Set Count:</span>{" "}
                                          {data.estimateSetCount}
                                        </p>
                                        <p className="text-sm text-gray-700">
                                          <span className="font-medium">Estimate Set Rate:</span>{" "}
                                          {data.estimateSetRate}%
                                        </p>
                                        {typeof data.jobBookedAmount !== "undefined" && (
                                          <p className="text-sm text-gray-700">
                                            <span className="font-medium">Job Booked Amount:</span>{" "}
                                            {formatCurrency(data.jobBookedAmount)}
                                          </p>
                                        )}
                                        {typeof data.proposalAmount !== "undefined" && (
                                          <p className="text-sm text-gray-700">
                                            <span className="font-medium">Proposal Amount:</span>{" "}
                                            {formatCurrency(data.proposalAmount)}
                                          </p>
                                        )}
                                        
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar
                                dataKey={zipMetric}
                                fill="url(#zipGradient)"
                                name={zipMetric === "estimateSetCount" ? "Estimate Set Count" : "Job Booked Amount"}
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ChartContainer>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Day of Week Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-1">
                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                        Day of Week Analysis
                      </CardTitle>
                      {/* Color Legend */}
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: "#94a3b8" }}
                          ></div>
                          <span className="text-sm text-gray-600">
                            Total Leads
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: "#10b981" }}
                          ></div>
                          <span className="text-sm text-gray-600">
                            Estimate Set Leads
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto lg:overflow-visible">
                        <div
                          style={{ minWidth: CHART_DIMENSIONS.minWidth }}
                          className="lg:min-w-0"
                        >
                          <ChartContainer
                            config={chartConfig}
                            style={{ height: CHART_DIMENSIONS.height }}
                          >
                            <BarChart data={analyticsData.dayOfWeekData}>
                              <defs>
                                <linearGradient
                                  id="totalGradient"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="0%"
                                    stopColor="#94a3b8"
                                    stopOpacity={0.9}
                                  />
                                  <stop
                                    offset="100%"
                                    stopColor="#cbd5e1"
                                    stopOpacity={0.6}
                                  />
                                </linearGradient>
                                <linearGradient
                                  id="estimateGradient"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="0%"
                                    stopColor="#10b981"
                                    stopOpacity={0.9}
                                  />
                                  <stop
                                    offset="100%"
                                    stopColor="#34d399"
                                    stopOpacity={0.6}
                                  />
                                </linearGradient>
                              </defs>
                              <XAxis
                                dataKey="day"
                                tick={{ fontSize: 11 }}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                              />
                              <YAxis />
                              <ChartTooltip
                                content={({ active, payload, label }) => {
                                  if (
                                    active &&
                                    payload &&
                                    payload.length &&
                                    label
                                  ) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                        <p className="font-semibold text-gray-900 mb-2">
                                          {label}
                                        </p>
                                        <p className="text-sm text-gray-700">
                                          <span className="font-medium">
                                            Total leads:
                                          </span>{" "}
                                          {data.totalLeads}
                                        </p>
                                        <p className="text-sm text-gray-700">
                                          <span className="font-medium">
                                            Estimate Set:
                                          </span>{" "}
                                          {data.estimateSetCount}
                                        </p>
                                        <p className="text-sm text-gray-700">
                                          <span className="font-medium">
                                            Estimate Set Rate:{" "}
                                          </span>{" "}
                                          {data.estimateSetRate}%
                                        </p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar
                                dataKey="totalLeads"
                                fill="url(#totalGradient)"
                                name="Total Leads"
                                radius={[4, 4, 0, 0]}
                              />
                              <Bar
                                dataKey="estimateSetCount"
                                fill="url(#estimateGradient)"
                                name="Estimate Set Leads"
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ChartContainer>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Unqualified Reasons Pie Chart */}
                  {analyticsData.ulrData.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-1">
                          <XCircle className="h-5 w-5 text-red-600" />
                          Unqualified Reasons
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto lg:overflow-visible">
                          <div
                            style={{ minWidth: CHART_DIMENSIONS.minWidth }}
                            className="lg:min-w-0"
                          >
                            <ChartContainer
                              config={chartConfig}
                              style={{ height: CHART_DIMENSIONS.height }}
                            >
                              <PieChart>
                                <Pie
                                  data={analyticsData.ulrData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  outerRadius={110}
                                  innerRadius={0}
                                  paddingAngle={2}
                                  fill="#8884d8"
                                  dataKey="totalLeads"
                                >
                                  {analyticsData.ulrData.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={COLORS[index % COLORS.length]}
                                    />
                                  ))}
                                </Pie>
                                <ChartTooltip
                                  content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0].payload;
                                      return (
                                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                          <p className="font-semibold text-gray-900 mb-1">
                                            {data.reason}
                                          </p>
                                          <p className="text-sm text-gray-700">
                                            <span className="font-medium">
                                              Count:
                                            </span>{" "}
                                            {data.totalLeads}
                                          </p>
                                          <p className="text-sm text-gray-700">
                                            <span className="font-medium">
                                              Percentage:
                                            </span>{" "}
                                            {data.percentage}%
                                          </p>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                              </PieChart>
                            </ChartContainer>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Performance Tables Section */}
              <div className="space-y-4">
                {/* Table Time Filter */}
                <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Table Time Filter:
                    </span>
                    <Select
                      value={commonTimeFilter}
                      onValueChange={(value: string) => {
                        const newFilter = value as "all" | "7" | "14" | "30" | "60" | "custom";
                        setCommonTimeFilter(newFilter);
                        if (newFilter === "custom") {
                          setTableCustomRangeApplied(false);
                        }
                      }}
                    >
                      <SelectTrigger className="w-40 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="7">Last 7 Days</SelectItem>
                        <SelectItem value="14">Last 14 Days</SelectItem>
                        <SelectItem value="30">Last 30 Days</SelectItem>
                        <SelectItem value="60">Last 60 Days</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    {commonTimeFilter === "custom" && (
                      <>
                        <Popover
                          open={openTablePicker}
                          onOpenChange={setOpenTablePicker}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="h-9 px-3 text-xs bg-black/80 hover:bg-black text-white border-black/80 hover:border-black"
                            >
                              Select Dates
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[570px] mr-10 md:mr-40 py-0 pl-2 border border-black/40"
                            onOpenAutoFocus={(e) => e.preventDefault()}
                          >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                            <div className="">
                              <p className=" absolute top-6 left-10 text-sm font-medium">Start</p>
                              <UICalendar
                                mode="single"
                                selected={tableCustomStart}
                                onSelect={(d) => {
                                  if (!d) return;
                                  setTableCustomStart(d);
                                  setTableStartMonth(d);
                                }}
                                showOutsideDays
                                month={tableStartMonth}
                                onMonthChange={(m) =>
                                  m && setTableStartMonth(m)
                                }
                                disabled={(date) => date > new Date()}
                                classNames={{
                                  day_today:
                                    "relative text-muted-foreground after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-muted-foreground",
                                  day_disabled:
                                    "cursor-not-allowed opacity-50",
                                  caption:
                                    "flex  pl-10  justify-center pt-1 relative items-center",
                                  caption_label: "hidden",
                                  caption_dropdowns:
                                    "flex items-center gap-1 justify-center",
                                  dropdown_month:
                                    "h-9 text-sm bg-background border border-input rounded-md flex items-center leading-none text-foreground focus:outline-none focus:ring-0",
                                  dropdown_year:
                                    "h-9 text-sm bg-background border border-input rounded-md flex items-center leading-none text-foreground focus:outline-none focus:ring-0",
                                }}
                                captionLayout="dropdown"
                                fromYear={1990}
                                toYear={currentYear + 10}
                                pagedNavigation
                              />
                            </div>
                            <div className="">
                              <p className="absolute top-6 left-[56%] text-sm font-medium">End</p>
                              <UICalendar
                                mode="single"
                                selected={tableCustomEnd}
                                onSelect={(d) => {
                                  if (!d) return;
                                  setTableCustomEnd(d);
                                  setTableEndMonth(d);
                                }}
                                showOutsideDays
                                month={tableEndMonth}
                                onMonthChange={(m) => m && setTableEndMonth(m)}
                                disabled={(date) => date > new Date()}
                                classNames={{
                                  day_today:
                                    "relative text-muted-foreground after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-muted-foreground",
                                  day_disabled:
                                    "cursor-not-allowed opacity-50",
                                  caption:
                                    "flex justify-center pt-1 relative items-center",
                                  caption_label: "hidden",
                                  caption_dropdowns:
                                    "flex pl-10 items-center gap-1 justify-center",
                                  dropdown_month:
                                    "h-9 text-sm bg-background border border-input rounded-md flex items-center leading-none text-foreground focus:outline-none focus:ring-0",
                                  dropdown_year:
                                    "h-9 text-sm bg-background border border-input rounded-md flex items-center leading-none text-foreground focus:outline-none focus:ring-0",
                                }}
                                captionLayout="dropdown"
                                fromYear={1990}
                                toYear={currentYear + 10}
                                pagedNavigation
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-1 px-0 pb-3">
                            <Button
                              variant="ghost"
                              onClick={() => setOpenTablePicker(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                            className="mr-1"
                              onClick={() => {
                                const start = new Date(
                                  tableCustomStart.getFullYear(),
                                  tableCustomStart.getMonth(),
                                  tableCustomStart.getDate(),
                                  0,
                                  0,
                                  0,
                                  0
                                ).toISOString();
                                const end = new Date(
                                  tableCustomEnd.getFullYear(),
                                  tableCustomEnd.getMonth(),
                                  tableCustomEnd.getDate(),
                                  23,
                                  59,
                                  59,
                                  999
                                ).toISOString();
                                setTableCustomRange({
                                  startDate: start,
                                  endDate: end,
                                });
                                setTableCustomRangeApplied(true);
                                setOpenTablePicker(false);
                              }}
                            >
                              Apply
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                        <span className={`text-sm font-medium  ${!tableCustomRangeApplied ? "text-gray-400" : "text-gray-700"}`}>
                          {!tableCustomRangeApplied ? (
                            "(Select Date Range)"
                          ) : (
                            formatCustomRangeLabel(tableCustomStart, tableCustomEnd)
                          )}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Sort Mode:
                    </span>
                    <Button
                      variant={
                        showTopRankedAdSets || showTopRankedAdNames
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        setShowTopRankedAdSets(!showTopRankedAdSets);
                        setShowTopRankedAdNames(!showTopRankedAdNames);
                      }}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <Trophy className="h-3.5 w-3.5" />
                      {showTopRankedAdSets || showTopRankedAdNames
                        ? "Show Custom Sort"
                        : "Top Ranked"}
                    </Button>
                  </div>
                </div>

                {/* Performance Tables Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Ad Set Performance Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-1">
                        <Tag className="h-5 w-5 text-orange-600" />
                        Top Ad Set Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-1 w-10 text-amber-900 font-semibold">
                                {showTopRankedAdSets ? "Rank" : "S. No."}
                              </th>
                              {renderSortableHeader(
                                "adSetName",
                                "Ad Set Name",
                                adSetSortField,
                                adSetSortOrder,
                                (field) => {
                                  if (adSetSortField === field) {
                                    setAdSetSortOrder(
                                      adSetSortOrder === "asc" ? "desc" : "asc"
                                    );
                                  } else {
                                    setAdSetSortField(
                                      field as
                                        | "adSetName"
                                        | "total"
                                        | "estimateSet"
                                        | "jobBookedAmount"
                                        | "percentage"
                                    );
                                    setAdSetSortOrder("desc");
                                  }
                                },
                                showTopRankedAdSets
                              )}
                              {renderSortableHeader(
                                "total",
                                "Total Leads",
                                adSetSortField,
                                adSetSortOrder,
                                (field) => {
                                  if (adSetSortField === field) {
                                    setAdSetSortOrder(
                                      adSetSortOrder === "asc" ? "desc" : "asc"
                                    );
                                  } else {
                                    setAdSetSortField(
                                      field as
                                        | "adSetName"
                                        | "total"
                                        | "estimateSet"
                                        | "jobBookedAmount"
                                        | "percentage"
                                    );
                                    setAdSetSortOrder("desc");
                                  }
                                },
                                showTopRankedAdSets
                              )}
                              {renderSortableHeader(
                                "estimateSet",
                                "Estimate Set",
                                adSetSortField,
                                adSetSortOrder,
                                (field) => {
                                  if (adSetSortField === field) {
                                    setAdSetSortOrder(
                                      adSetSortOrder === "asc" ? "desc" : "asc"
                                    );
                                  } else {
                                    setAdSetSortField(
                                      field as
                                        | "adSetName"
                                        | "total"
                                        | "estimateSet"
                                        | "jobBookedAmount"
                                        | "percentage"
                                    );
                                    setAdSetSortOrder("desc");
                                  }
                                },
                                showTopRankedAdSets
                              )}
                              {renderSortableHeader(
                                "jobBookedAmount",
                                "Job Booked Amount",
                                adSetSortField,
                                adSetSortOrder,
                                (field) => {
                                  if (adSetSortField === field) {
                                    setAdSetSortOrder(
                                      adSetSortOrder === "asc" ? "desc" : "asc"
                                    );
                                  } else {
                                    setAdSetSortField(
                                      field as
                                        | "adSetName"
                                        | "total"
                                        | "estimateSet"
                                        | "jobBookedAmount"
                                        | "jobBookedAmount"
                                        | "percentage"
                                    );
                                    setAdSetSortOrder("desc");
                                  }
                                },
                                showTopRankedAdSets
                              )}
                              {renderSortableHeader(
                                "percentage",
                                "Estimate Set Rate",
                                adSetSortField,
                                adSetSortOrder,
                                (field) => {
                                  if (adSetSortField === field) {
                                    setAdSetSortOrder(
                                      adSetSortOrder === "asc" ? "desc" : "asc"
                                    );
                                  } else {
                                    setAdSetSortField(
                                      field as
                                        | "adSetName"
                                        | "total"
                                        | "estimateSet"
                                        | "jobBookedAmount"
                                        | "percentage"
                                    );
                                    setAdSetSortOrder("desc");
                                  }
                                },
                                showTopRankedAdSets
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {tableData?.adSetData.data &&
                            tableData.adSetData.data.length > 0 ? (
                              tableData.adSetData.data.map((adSet, index) => (
                                <tr
                                  key={adSet.adSetName}
                                  className="border-b hover:bg-muted/50"
                                >
                                  <td className="p-1 text-amber-900 font-semibold">
                                    {showTopRankedAdSets
                                      ? `#${
                                          (adSetPage - 1) * adSetItemsPerPage +
                                          index +
                                          1
                                        }`
                                      : `${
                                          (adSetPage - 1) * adSetItemsPerPage +
                                          index +
                                          1
                                        }`}
                                  </td>
                                  <td className="p-1 font-medium">
                                    {adSet.adSetName}
                                  </td>
                                  <td className="text-center p-1">
                                    {adSet.totalLeads}
                                  </td>
                                  <td className="text-center p-1 text-green-600 font-medium">
                                    {adSet.estimateSet}
                                  </td>
                                  <td className="text-center p-1">
                                    {formatCurrency(adSet.jobBookedAmount ?? 0)}
                                  </td>
                                  <td className="text-center p-1">
                                    <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                      {adSet.estimateSetRate}%
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan={6}
                                  className="text-center py-8 text-gray-500"
                                >
                                  <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                  <p className="text-sm">
                                    No data found for selected time filter.
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Try selecting a different time period.
                                  </p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      {tableData?.adSetData.pagination &&
                        renderPagination(
                          tableData.adSetData.pagination.currentPage,
                          tableData.adSetData.pagination.totalCount,
                          setAdSetPage,
                          adSetItemsPerPage
                        )}
                    </CardContent>
                  </Card>

                  {/* Ad Name Performance Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-1">
                        <FileText className="h-5 w-5 text-green-600" />
                        Top Ad Name Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2 w-10 text-amber-900 font-semibold">
                                {showTopRankedAdNames ? "Rank" : "S. No."}
                              </th>
                              {renderSortableHeader(
                                "adName",
                                "Ad Name",
                                adNameSortField,
                                adNameSortOrder,
                                (field) => {
                                  if (adNameSortField === field) {
                                    setAdNameSortOrder(
                                      adNameSortOrder === "asc" ? "desc" : "asc"
                                    );
                                  } else {
                                    setAdNameSortField(
                                      field as
                                        | "adName"
                                        | "total"
                                        | "estimateSet"
                                        | "jobBookedAmount"
                                        | "percentage"
                                    );
                                    setAdNameSortOrder("desc");
                                  }
                                },
                                showTopRankedAdNames
                              )}
                              {renderSortableHeader(
                                "total",
                                "Total Leads",
                                adNameSortField,
                                adNameSortOrder,
                                (field) => {
                                  if (adNameSortField === field) {
                                    setAdNameSortOrder(
                                      adNameSortOrder === "asc" ? "desc" : "asc"
                                    );
                                  } else {
                                    setAdNameSortField(
                                      field as
                                        | "adName"
                                        | "total"
                                        | "estimateSet"
                                        | "jobBookedAmount"
                                        | "percentage"
                                    );
                                    setAdNameSortOrder("desc");
                                  }
                                },
                                showTopRankedAdNames
                              )}
                              {renderSortableHeader(
                                "estimateSet",
                                "Estimate Set",
                                adNameSortField,
                                adNameSortOrder,
                                (field) => {
                                  if (adNameSortField === field) {
                                    setAdNameSortOrder(
                                      adNameSortOrder === "asc" ? "desc" : "asc"
                                    );
                                  } else {
                                    setAdNameSortField(
                                      field as
                                        | "adName"
                                        | "total"
                                        | "estimateSet"
                                        | "jobBookedAmount"
                                        | "percentage"
                                    );
                                    setAdNameSortOrder("desc");
                                  }
                                },
                                showTopRankedAdNames
                              )}
                              {renderSortableHeader(
                                "jobBookedAmount",
                                "Job Booked Amount",
                                adNameSortField,
                                adNameSortOrder,
                                (field) => {
                                  if (adNameSortField === field) {
                                    setAdNameSortOrder(
                                      adNameSortOrder === "asc" ? "desc" : "asc"
                                    );
                                  } else {
                                    setAdNameSortField(
                                      field as
                                        | "adName"
                                        | "total"
                                        | "estimateSet"
                                        | "jobBookedAmount"
                                        | "jobBookedAmount"
                                        | "percentage"
                                    );
                                    setAdNameSortOrder("desc");
                                  }
                                },
                                showTopRankedAdNames
                              )}
                              {renderSortableHeader(
                                "percentage",
                                "Estimate Set Rate",
                                adNameSortField,
                                adNameSortOrder,
                                (field) => {
                                  if (adNameSortField === field) {
                                    setAdNameSortOrder(
                                      adNameSortOrder === "asc" ? "desc" : "asc"
                                    );
                                  } else {
                                    setAdNameSortField(
                                      field as
                                        | "adName"
                                        | "total"
                                        | "estimateSet"
                                        | "jobBookedAmount"
                                        | "percentage"
                                    );
                                    setAdNameSortOrder("desc");
                                  }
                                },
                                showTopRankedAdNames
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {tableData?.adNameData.data &&
                            tableData.adNameData.data.length > 0 ? (
                              tableData.adNameData.data.map((ad, index) => (
                                <tr
                                  key={`${ad.adName}-${ad.adSetName}`}
                                  className="border-b hover:bg-muted/50"
                                >
                                  <td className="p-1 text-amber-900 font-semibold">
                                    {showTopRankedAdNames
                                      ? `#${
                                          (adNamePage - 1) *
                                            adNameItemsPerPage +
                                          index +
                                          1
                                        }`
                                      : `${
                                          (adNamePage - 1) *
                                            adNameItemsPerPage +
                                          index +
                                          1
                                        }`}
                                  </td>
                                  <td className="p-1">
                                    <div className="flex flex-col">
                                      <span className="font-medium text-gray-900">
                                        {ad.adName}
                                      </span>
                                      <span className="text-xs text-gray-500 font-italic">
                                        ({ad.adSetName})
                                      </span>
                                    </div>
                                  </td>
                                  <td className="text-center p-1">
                                    {ad.totalLeads}
                                  </td>
                                  <td className="text-center p-1 text-green-600 font-medium">
                                    {ad.estimateSet}
                                  </td>
                                  <td className="text-center p-1">
                                    {formatCurrency(ad.jobBookedAmount ?? 0)}
                                  </td>
                                  <td className="text-center p-1">
                                    <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                      {ad.estimateSetRate}%
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan={6}
                                  className="text-center py-8 text-gray-500"
                                >
                                  <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                  <p className="text-sm">
                                    No data found for selected time filter.
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Try selecting a different time period.
                                  </p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      {tableData?.adNameData.pagination &&
                        renderPagination(
                          tableData.adNameData.pagination.currentPage,
                          tableData.adNameData.pagination.totalCount,
                          setAdNamePage,
                          adNameItemsPerPage
                        )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
