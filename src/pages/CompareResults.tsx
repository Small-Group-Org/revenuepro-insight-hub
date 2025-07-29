import React, { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePeriodSelector } from "@/components/DatePeriodSelector";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Target,
} from "lucide-react";
import { useReportingDataStore } from "@/stores/reportingDataStore";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { getWeekInfo } from "@/utils/weekLogic";
import { processTargetData } from "@/utils/utils";

const metricIcons: Record<string, React.ReactNode> = {
  "Appointment Rate": <TrendingUp className="h-5 w-5 text-blue-600" />,
  "Show Rate": <TrendingUp className="h-5 w-5 text-blue-700" />,
  "Close Rate": <TrendingUp className="h-5 w-5 text-green-600" />,
  "Lead to Sale": <TrendingUp className="h-5 w-5 text-purple-600" />,
  Revenue: <DollarSign className="h-5 w-5 text-yellow-600" />,
  "Total COM%": <BarChart3 className="h-5 w-5 text-indigo-600" />,
  "AD COM%": <BarChart3 className="h-5 w-5 text-indigo-700" />,
  "Cost Per Lead": <DollarSign className="h-5 w-5 text-green-700" />,
  "Cost Per Estimate Set": <DollarSign className="h-5 w-5 text-blue-700" />,
  "Cost Per Estimate": <DollarSign className="h-5 w-5 text-blue-600" />,
  "Cost Per Job Booked": <DollarSign className="h-5 w-5 text-purple-700" />,
  Leads: <BarChart3 className="h-5 w-5 text-blue-600" />,
  "Estimates Set": <Target className="h-5 w-5 text-green-600" />,
  Estimates: <Target className="h-5 w-5 text-green-700" />,
  "Jobs Booked": <Target className="h-5 w-5 text-purple-600" />,
  "Average Job Size": <DollarSign className="h-5 w-5 text-yellow-700" />,
};

export const CompareResults = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<"weekly" | "monthly" | "yearly">(
    "weekly"
  );

  const { reportingData, targetData, getReportingData } = useReportingDataStore();

  // Fetch actual+target data from single API
  useEffect(() => {
    let startDate: string, endDate: string, queryType: string;
    if (period === "weekly") {
      const weekInfo = getWeekInfo(selectedDate);
      startDate = format(weekInfo.weekStart, "yyyy-MM-dd");
      endDate = format(weekInfo.weekEnd, "yyyy-MM-dd");
      queryType = "weekly";
    } else if (period === "monthly") {
      startDate = format(startOfMonth(selectedDate), "yyyy-MM-dd");
      endDate = format(endOfMonth(selectedDate), "yyyy-MM-dd");
      queryType = "monthly";
    } else {
      startDate = format(startOfYear(selectedDate), "yyyy-MM-dd");
      endDate = format(endOfYear(selectedDate), "yyyy-MM-dd");
      queryType = "yearly";
    }
    getReportingData(startDate, endDate, queryType);
  }, [selectedDate, period, getReportingData]);

  // Aggregate actual data
  const allMetricKeys = [
  "appointmentRate", "showRate", "closeRate", "leadToSale",
  "revenue", "com", "adCom",
  "costPerLead", "costPerEstimateSet", "costPerEstimate", "costPerJobBooked",
  "leads", "estimatesSet", "estimates", "jobsBooked", "avgJobSize"
];

const actualTotals = useMemo(() => {
  const totals: Record<string, number> = {};
  // Initialize all keys to 0
  allMetricKeys.forEach(key => { totals[key] = 0; });
  if (!reportingData || reportingData.length === 0) return totals;
  reportingData.forEach((data) => {
    allMetricKeys.forEach((key) => {
      totals[key] += data[key] || 0;
    });
  });
  return totals;
}, [reportingData]);

  // Always process targetData as array
  const processedTargetData = useMemo(() => {
    if (!targetData) return undefined;
    return processTargetData(Array.isArray(targetData) ? targetData : [targetData]);
  }, [targetData]);

  // Prepare metrics from API data
  const metrics = useMemo(
    () => [
      {
        category: "Funnel Metrics",
        items: [
          {
            name: "Appointment Rate",
            actual: actualTotals["appointmentRate"] ?? 0,
            target: processedTargetData?.appointmentRate ?? 0,
            format: "percent",
          },
          {
            name: "Show Rate",
            actual: actualTotals["showRate"] ?? 0,
            target: processedTargetData?.showRate ?? 0,
            format: "percent",
          },
          {
            name: "Close Rate",
            actual: actualTotals["closeRate"] ?? 0,
            target: processedTargetData?.closeRate ?? 0,
            format: "percent",
          },
          {
            name: "Lead to Sale",
            actual: actualTotals["leadToSale"] ?? 0,
            target: 0,
            format: "percent",
          },
        ],
      },
      {
        category: "Revenue Metrics",
        items: [
          {
            name: "Revenue",
            actual: actualTotals["revenue"] ?? 0,
            target: processedTargetData?.revenue ?? 0,
            format: "currency",
          },
          {
            name: "Total COM%",
            actual: actualTotals["com"] ?? 0,
            target: processedTargetData?.com ?? 0,
            format: "percent",
          },
          {
            name: "AD COM%",
            actual: actualTotals["adCom"] ?? 0,
            target: 0,
            format: "percent",
          },
        ],
      },
      {
        category: "Expense Metrics",
        items: [
          {
            name: "Cost Per Lead",
            actual: actualTotals["costPerLead"] ?? 0,
            target: 0,
            format: "currency",
          },
          {
            name: "Cost Per Estimate Set",
            actual: actualTotals["costPerEstimateSet"] ?? 0,
            target: 0,
            format: "currency",
          },
          {
            name: "Cost Per Estimate",
            actual: actualTotals["costPerEstimate"] ?? 0,
            target: 0,
            format: "currency",
          },
          {
            name: "Cost Per Job Booked",
            actual: actualTotals["costPerJobBooked"] ?? 0,
            target: 0,
            format: "currency",
          },
        ],
      },
      {
        category: "Performance Metrics",
        items: [
          {
            name: "Leads",
            actual: actualTotals["leads"] ?? 0,
            target: 0,
            format: "number",
          },
          {
            name: "Estimates Set",
            actual: actualTotals["estimatesSet"] ?? 0,
            target: 0,
            format: "number",
          },
          {
            name: "Estimates",
            actual: actualTotals["estimates"] ?? 0,
            target: 0,
            format: "number",
          },
          {
            name: "Jobs Booked",
            actual: actualTotals["jobsBooked"] ?? 0,
            target: 0,
            format: "number",
          },
          {
            name: "Average Job Size",
            actual: actualTotals["avgJobSize"] ?? 0,
            target: 0,
            format: "currency",
          },
        ],
      },
    ],
    [actualTotals, processedTargetData]
  );

  // Format value helper
  const formatValue = (value: number, format: string) => {
    if (format === "currency") {
      return `$${value?.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    if (format === "percent") {
      return `${value?.toFixed(2)}%`;
    }
    return value?.toLocaleString();
  };

  // Handler for DatePeriodSelector
  const handleDatePeriodChange = (
    date: Date,
    newPeriod: "weekly" | "monthly" | "yearly"
  ) => {
    setSelectedDate(date);
    setPeriod(newPeriod);
  };

  // Export button handler (TODO)
  const handleExport = () => {
    // TODO: Implement export logic
    alert("Export coming soon!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative z-10 py-12 px-4">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-4">
              <h1 className="leading-[130%] text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                Compare & Results
              </h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg mb-10 mt-2">
              Enter your weekly performance metrics for tracking and analysis
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="max-w-7xl mx-auto mb-8">
          <DatePeriodSelector
            initialDate={selectedDate}
            initialPeriod={period}
            onChange={handleDatePeriodChange}
            buttonText="Export"
            onButtonClick={handleExport}
            allowedPeriods={["weekly", "monthly", "yearly"]}
          />
        </div>

        {/* Metrics Table */}
        <Card className="max-w-7xl mx-auto p-6">
          <h3 className="text-xl font-semibold text-slate-900 mb-6">
            📊 Performance Comparison
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left p-4 font-semibold text-slate-700">
                    Metric
                  </th>
                  <th className="text-right p-4 font-semibold text-slate-700">
                    Actual
                  </th>
                  <th className="text-right p-4 font-semibold text-slate-700">
                    Target
                  </th>
                  <th className="text-right p-4 font-semibold text-slate-700">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody>
                {metrics
                  .map((section) => [
                    <tr
                      key={`${section.category}-header`}
                      className="bg-slate-100"
                    >
                      <td
                        colSpan={4}
                        className="font-bold text-blue-900 py-2 pl-4 text-lg"
                      >
                        {section.category}
                      </td>
                    </tr>,
                    ...section.items.map((item) => {
                      const percent =
                        item.target === 0
                          ? 0
                          : ((item.actual - item.target) / item.target) * 100;
                      const isPositive = percent >= 0;
                      return (
                        <tr
                          key={`${section.category}-${item.name}`}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="p-4 font-medium text-slate-900 flex items-center gap-2">
                            {metricIcons[item.name]}
                            {item.name}
                          </td>
                          <td className="p-4 text-right font-bold text-slate-900">
                            {formatValue(item.actual, item.format)}
                          </td>
                          <td className="p-4 text-right font-medium text-slate-700">
                            {formatValue(item.target, item.format)}
                          </td>
                          <td className="p-4 text-right font-semibold">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                                isPositive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {isPositive ? (
                                <TrendingUp className="h-4 w-4 mr-1" />
                              ) : (
                                <TrendingDown className="h-4 w-4 mr-1" />
                              )}
                              {percent > 0 ? "+" : ""}
                              {percent.toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      );
                    }),
                  ])
                  .flat()}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
