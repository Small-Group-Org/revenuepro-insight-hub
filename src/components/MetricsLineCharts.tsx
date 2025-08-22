import React, { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
} from "recharts";
import { BarChart3, DollarSign, ChevronDown } from "lucide-react";
import { formatCurrencyValue } from "@/utils/page-utils/commonUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { prepareChartDataWithComparison } from "@/utils/page-utils/compareUtils";
import { monthLabels } from "@/utils/page-utils/dashboardUtils";

interface ChartConfig {
  key: string;
  title: string;
  description?: string;
  actualColor: string;
  targetColor: string;
  format: string;
}

interface MetricsLineChartsProps {
  chartData: {
    [key: string]: Array<{
      week: string;
      actual: number | null;
      target: number | null;
      format: string;
      message?: string;
    }>;
  };
  chartConfigs: ChartConfig[];
  title: string;
  icon?: React.ReactNode;
  gridCols?: string;
  periodType?: "monthly" | "yearly";
  selectedDate?: Date;
  onComparisonChange?: (selectedPeriod: string) => void;
  comparisonData?: any;
  isComparisonEnabled?: boolean;
  comparisonPeriod?: string;
}

// Format value helper
const formatValue = (value: number, format: string) => {
  if (format === "currency") {
    return formatCurrencyValue(value);
  }
  if (format === "percent") {
    return `${value.toFixed(1)}%`;
  }
  return Math.round(value)?.toLocaleString();
};

// Custom tooltip component
const CustomTooltip = ({
  active,
  payload,
  label,
  format,
  actualColor,
  targetColor,
  isComparisonEnabled,
  comparisonPeriod,
  selectedDate,
  periodType,
  formattedComparisonPeriod,
}: any) => {
  if (active && payload && payload.length) {
    const actualValue = payload.find((p) => p.dataKey === "actual")?.value || 0;

    let targetValue = 0;
    let comparisonValue = 0;

    if (!isComparisonEnabled) {
      targetValue = payload.find((p) => p.dataKey === "target")?.value || 0;
    } else {
      comparisonValue =
        payload.find((p) => p.dataKey === "comparison")?.value || 0;
    }

    // Format the selected date for display
    const formatSelectedDate = (date: Date) => {
      if (!date) return "";
      if (periodType === "monthly") {
        const month = date.toLocaleDateString("en-US", { month: "short" });
        const year = date.getFullYear();
        return `${month} ${year}`;
      } else if (periodType === "yearly") {
        return date.getFullYear().toString();
      }
      return "";
    };

    // Calculate performance metrics
    const performancePercent =
      targetValue > 0 ? (actualValue / targetValue) * 100 : 0;
    const difference = actualValue - targetValue;
    const differencePercent =
      targetValue > 0 ? (difference / targetValue) * 100 : 0;

    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 min-w-[240px]">
        <div className="mb-3">
          <p className="text-sm font-semibold text-card-foreground mb-1">
            {label}
          </p>
          <div className="w-full h-0.5 bg-gradient-primary rounded"></div>
        </div>

        <div className="space-y-3">
          {/* Current Period (Actual) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: actualColor }}
              ></div>
              <span className="text-sm font-medium text-card-foreground">
                {isComparisonEnabled
                  ? formatSelectedDate(selectedDate)
                  : "Actual"}
              </span>
            </div>
            <span className="text-sm font-bold" style={{ color: actualColor }}>
              {formatValue(actualValue, format)}
            </span>
          </div>

          {!isComparisonEnabled ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: targetColor }}
                ></div>
                <span className="text-sm font-medium text-card-foreground">
                  Target
                </span>
              </div>
              <span
                className="text-sm font-bold"
                style={{ color: targetColor }}
              >
                {formatValue(targetValue, format)}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#649cf7" }}
                ></div>
                <span className="text-sm font-medium text-card-foreground">
                  {periodType === "monthly"
                    ? formattedComparisonPeriod
                    : comparisonPeriod}{" "}
                  <span className="text-xs text-muted-foreground">
                    (Comparison)
                  </span>
                </span>
              </div>
              <span className="text-sm font-bold" style={{ color: "#649cf7" }}>
                {formatValue(comparisonValue, format)}
              </span>
            </div>
          )}

          {/* Performance metrics */}
          {((!isComparisonEnabled && targetValue > 0) ||
            (isComparisonEnabled && comparisonValue > 0)) && (
            <div className="mt-3 pt-3 border-t border-border space-y-3">
              {!isComparisonEnabled ? (
                // Target vs Actual metrics
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Performance
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        performancePercent >= 100
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {performancePercent.toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Difference
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        difference >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {difference >= 0 ? "+" : ""}
                      {formatValue(difference, format)}
                      <span className="ml-1">
                        ({differencePercent >= 0 ? "+" : ""}
                        {differencePercent.toFixed(1)}%)
                      </span>
                    </span>
                  </div>

                  <div className="mt-2 w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        performancePercent >= 100
                          ? "bg-success"
                          : "bg-destructive"
                      }`}
                      style={{
                        width: `${Math.min(performancePercent, 100)}%`,
                      }}
                    ></div>
                  </div>
                </>
              ) : (
                // Comparison vs Actual metrics
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Growth
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        actualValue >= comparisonValue
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {actualValue >= comparisonValue ? "+" : ""}
                      {(
                        ((actualValue - comparisonValue) / comparisonValue) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Difference
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        actualValue >= comparisonValue
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {actualValue >= comparisonValue ? "+" : ""}
                      {formatValue(actualValue - comparisonValue, format)}
                    </span>
                  </div>

                  <div className="mt-2 w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        actualValue >= comparisonValue
                          ? "bg-success"
                          : "bg-destructive"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, (actualValue / comparisonValue) * 100)
                        )}%`,
                      }}
                    ></div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const MetricsLineCharts: React.FC<MetricsLineChartsProps> = ({
  chartData,
  chartConfigs,
  title,
  icon = <BarChart3 className="h-5 w-5 text-primary" />,
  gridCols = "grid-cols-1 lg:grid-cols-2",
  periodType = "monthly",
  selectedDate = new Date(),
  onComparisonChange,
  comparisonData,
  isComparisonEnabled = false,
  comparisonPeriod,
}) => {
  const [comparisonOptions, setComparisonOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [selectedComparison, setSelectedComparison] = useState<string>("");
  const isFunnelMetrics = title === "Funnel Metrics";
  const formattedComparisonPeriod = useMemo(() => {
    if (periodType === "monthly") {
      const [year, month] = comparisonPeriod?.split("-") || [];
      return month && year ? `${monthLabels[parseInt(month) - 1]} ${year}` : "";
    } else if (periodType === "yearly") {
      return comparisonPeriod || "";
    }
    return "";
  }, [comparisonPeriod, periodType]);

  // Handle comparison change
  const handleComparisonChange = (value: string) => {
    setSelectedComparison(value);
    if (onComparisonChange) {
      onComparisonChange(value);
    }
  };

  // Update selected comparison when comparisonPeriod prop changes
  useEffect(() => {
    if (comparisonPeriod && comparisonPeriod !== selectedComparison) {
      setSelectedComparison(comparisonPeriod);
    }
  }, [comparisonPeriod, selectedComparison]);

  // Generate comparison options based on period type
  useEffect(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11
    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth(); // 0-11

    if (periodType === "monthly") {
      const months = [];

      if (selectedYear === currentYear) {
        for (let month = 0; month <= currentMonth; month++) {
          const monthName = new Date(currentYear, month).toLocaleDateString(
            "en-US",
            { month: "long" }
          );
          months.push({
            value: `${currentYear}-${String(month + 1).padStart(2, "0")}`,
            label: `${monthName} ${currentYear}`,
          });
        }
        if (months.length > 0) {
          setSelectedComparison(months[months.length - 1].value);
        }
      } else {
        for (let month = 0; month <= 11; month++) {
          const monthName = new Date(selectedYear, month).toLocaleDateString(
            "en-US",
            { month: "long" }
          );
          months.push({
            value: `${selectedYear}-${String(month + 1).padStart(2, "0")}`,
            label: `${monthName} ${selectedYear}`,
          });
        }
        setSelectedComparison(
          `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`
        );
      }

      setComparisonOptions(months);
    } else if (periodType === "yearly") {
      // Generate last 3 years
      const years = [];
      for (let year = currentYear - 2; year <= currentYear; year++) {
        years.push({
          value: year.toString(),
          label: year.toString(),
        });
      }
      setComparisonOptions(years);
      setSelectedComparison(selectedYear.toString());
    }
  }, [periodType, selectedDate]);

  const showTotal = (config: ChartConfig) => {
    if (config.key === "avgJobSize") {
      return false;
    }
    return config.format === "currency" || config.format === "number";
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-background via-muted/15 to-primary/3 shadow-lg border border-border hover:shadow-2xl hover:border-primary/10 transition-all duration-300 group backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-[20px] font-semibold text-card-foreground">
            {title}
          </h3>
        </div>

        {/* Comparison dropdown for all chart sections */}
        {isFunnelMetrics && (
          <div className="flex flex-col gap-1 self-end sm:self-auto">
            <label className="text-[10px] text-muted-foreground whitespace-nowrap">
              Compare with {periodType === "monthly" ? "Month" : "Year"}
            </label>
            <Select
              value={selectedComparison}
              onValueChange={handleComparisonChange}
              disabled={comparisonOptions.length === 0}
            >
              <SelectTrigger
                className={`w-[140px] h-8 text-xs bg-[#1f1c13] border-[#2a2518] text-amber-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${
                  selectedComparison
                    ? "border-amber-600/60 bg-[#2a2518] shadow-md ring-1 ring-amber-600/30"
                    : "hover:border-amber-500/50 hover:bg-[#2a2518] hover:shadow-md"
                }`}
              >
                <SelectValue
                  placeholder={
                    comparisonOptions.length === 0
                      ? "No options"
                      : `Select ${periodType === "monthly" ? "month" : "year"}`
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] shadow-xl border-[#2a2518] bg-[#1f1c13]">
                {comparisonOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-xs cursor-pointer text-amber-50 hover:bg-[#2a2518] focus:bg-[#2a2518] focus:text-amber-50 data-[state=checked]:bg-amber-600/20 data-[state=checked]:text-amber-100"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className={`grid ${gridCols} gap-8`}>
        {chartConfigs.map((config) => {
          const chartDataForConfig = chartData[config.key];
          const hasMessage =
            chartDataForConfig &&
            chartDataForConfig.some((item) => item.message);

          const totalActual = chartDataForConfig
            ? chartDataForConfig.reduce(
                (sum, item) => sum + (item.actual || 0),
                0
              )
            : 0;

          return (
            <div key={config.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-medium text-card-foreground">
                  {config.title}
                </h4>
                {showTotal(config) && totalActual > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-sm font-semibold text-success">
                      {config.format === "currency"
                        ? formatCurrencyValue(totalActual)
                        : totalActual}
                    </p>
                  </div>
                )}
              </div>

              {hasMessage ? (
                <div className="h-[250px] flex items-center justify-center bg-muted/50 rounded-lg border border-border">
                  <div className="text-center">
                    <p className="text-muted-foreground text-sm">
                      {chartDataForConfig[0]?.message || "Data not available"}
                    </p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart
                    data={prepareChartDataWithComparison(
                      chartData[config.key],
                      comparisonData,
                      config.key
                    )}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="week"
                      fontSize={12}
                      tickFormatter={(value) => {
                        // If it's a period label (like "Period 1"), format it based on period type
                        if (
                          typeof value === "string" &&
                          value.startsWith("Period ")
                        ) {
                          const periodNum = parseInt(
                            value.replace("Period ", "")
                          );
                          if (periodType === "monthly") {
                            return `Week ${periodNum}`;
                          } else if (periodType === "yearly") {
                            // For yearly, show month abbreviations
                            return (
                              monthLabels[periodNum - 1] || `M${periodNum}`
                            );
                          }
                        }
                        return value;
                      }}
                    />
                    <YAxis
                      fontSize={12}
                      domain={
                        config.format === "percent" ? [0, 100] : undefined
                      }
                      tickFormatter={
                        config.format === "percent"
                          ? (value) => `${value}%`
                          : config.format === "currency"
                          ? (value) => `$${value.toLocaleString()}`
                          : undefined
                      }
                    />
                    <Tooltip
                      content={
                        <CustomTooltip
                          format={config.format}
                          actualColor={config.actualColor}
                          targetColor={config.targetColor}
                          isComparisonEnabled={isComparisonEnabled}
                          comparisonPeriod={formattedComparisonPeriod}
                          selectedDate={selectedDate}
                          periodType={periodType}
                          formattedComparisonPeriod={formattedComparisonPeriod}
                        />
                      }
                      cursor={{ strokeDasharray: "3 3", stroke: "#e2e8f0" }}
                      offset={30}
                    />

                    {/* Define gradient for each chart */}
                    <defs>
                      <linearGradient
                        id={`${config.key}-gradient`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#396bbd"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="50%"
                          stopColor="#396bbd"
                          stopOpacity={0.025}
                        />
                        <stop
                          offset="100%"
                          stopColor="#396bbd"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    {/* Gradient area under the actual line */}
                    <Area
                      type="monotone"
                      dataKey="comparison"
                      stroke="none"
                      fill={`url(#${config.key}-gradient)`}
                      fillOpacity={1}
                      connectNulls={true}
                    />
                    <Area
                      type="monotone"
                      dataKey="actual"
                      stroke="none"
                      fill={`url(#${config.key}-gradient)`}
                      fillOpacity={1}
                      connectNulls={true}
                    />

                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#396bbd"
                      strokeWidth={2}
                      dot={{ fill: "#396bbd", strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 4, stroke: "#396bbd", strokeWidth: 2 }}
                    />

                    {/* Show target line only when comparison is not enabled */}
                    {!isComparisonEnabled && (
                      <Line
                        type="monotone"
                        dataKey="target"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: "#3B82F6", strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 4, stroke: "#3B82F6", strokeWidth: 2 }}
                      />
                    )}

                    {/* Show comparison line when comparison is enabled */}
                    {isComparisonEnabled && comparisonData && (
                      <Line
                        type="monotone"
                        dataKey="comparison"
                        stroke="#649cf7"
                        strokeWidth={2}
                        dot={{ fill: "#649cf7", strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 4, stroke: "#649cf7", strokeWidth: 2 }}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              )}

              {/* Individual chart legend - only show if no message */}
              {!hasMessage && (
                <div className="flex items-center justify-center gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-0.5"
                      style={{
                        backgroundColor: config.actualColor,
                        borderColor: config.actualColor,
                      }}
                    ></div>
                    <span className="text-xs text-muted-foreground">
                      {isComparisonEnabled
                        ? selectedDate
                          ? periodType === "monthly"
                            ? `${selectedDate.toLocaleDateString("en-US", {
                                month: "short",
                              })} ${selectedDate.getFullYear()}`
                            : selectedDate.getFullYear().toString()
                          : "Current Period"
                        : "Actual"}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <div
                      className="w-1 h-0.5 border"
                      style={{
                        backgroundColor: config.targetColor,
                        borderColor: config.targetColor,
                      }}
                    ></div>
                    <div
                      className="w-1 h-0.5 border"
                      style={{
                        backgroundColor: isComparisonEnabled
                          ? config.targetColor
                          : "#fff",
                        borderColor: isComparisonEnabled
                          ? config.targetColor
                          : "#fff",
                      }}
                    ></div>
                    <div
                      className="w-1 h-0.5 border"
                      style={{
                        backgroundColor: config.targetColor,
                        borderColor: config.targetColor,
                      }}
                    ></div>
                    <div
                      className="w-1 h-0.5 border"
                      style={{
                        backgroundColor: isComparisonEnabled
                          ? config.targetColor
                          : "#fff",
                        borderColor: isComparisonEnabled
                          ? config.targetColor
                          : "#fff",
                      }}
                    ></div>
                    <div
                      className="w-1 h-0.5 border"
                      style={{
                        backgroundColor: config.targetColor,
                        borderColor: config.targetColor,
                      }}
                    ></div>
                    <span className="text-xs text-muted-foreground ml-1">
                      {isComparisonEnabled
                        ? formattedComparisonPeriod
                        : "Target"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
