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
import { processTargetData, calculateFields, getWeeksInMonth } from "@/utils/page-utils/targetUtils";
import { calculateReportingFields } from "@/utils/page-utils/actualDataUtils";
import { calculateManagementCost, formatCurrencyValue } from "@/utils/page-utils/commonUtils";
import { targetFields, reportingFields } from "@/utils/constant";
import { FieldValue } from "@/types";
import { exportToExcel, ExportData } from "@/utils/excelExport";
import { useUserStore } from "@/stores/userStore";

export const CompareResults = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<"weekly" | "monthly" | "yearly">(
    "weekly"
  );

  const { reportingData, targetData, getReportingData } = useReportingDataStore();
  const { selectedUserId } = useUserStore();
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
    getReportingData(startDate, endDate, queryType, period);
  }, [selectedDate, period, selectedUserId, getReportingData]);

  // Process target data with all calculated fields
  const processedTargetData = useMemo(() => {
    if (!targetData) return undefined;
    const baseTargetData = processTargetData(Array.isArray(targetData) ? targetData : [targetData]);
    
    // Apply all target field calculations
    return calculateFields(baseTargetData, period, period === 'weekly' ? 7 : 30);
  }, [targetData, period]);

  // Process actual data with all calculated fields
  const processedActualData = useMemo(() => {
    if (!reportingData || reportingData.length === 0) return undefined;
    
    // Aggregate actual data from reporting fields
    const aggregatedActual: FieldValue = {};
    reportingData.forEach((data) => {
      Object.keys(data).forEach((key) => {
        if (key !== 'userId' && key !== 'startDate' && key !== 'endDate' && 
            key !== '_id' && key !== 'createdAt' && key !== 'updatedAt' && key !== '__v') {
          aggregatedActual[key] = (aggregatedActual[key] || 0) + (data[key] || 0);
        }
      });
    });

    // Add target data for budget calculations
    const actualWithTargets = {
      ...aggregatedActual,
      com: processedTargetData?.com || 0,
      targetRevenue: processedTargetData?.revenue || 0,
    };

    // Apply reporting field calculations
    return calculateReportingFields(actualWithTargets);
  }, [reportingData, processedTargetData]);

  // Helper function to calculate actual metrics from reporting data
  const calculateActualMetrics = useMemo(() => {
    if (!processedActualData) return {};
    
    const actual = processedActualData;
    const metrics: FieldValue = {};

    // Map reporting fields to comparison metrics
    // Revenue from targetReport
    metrics.revenue = actual.revenue || 0;
    
    // Jobs Booked from targetReport
    metrics.sales = actual.sales || 0;
    
    // Estimates Ran from targetReport
    metrics.estimatesRan = actual.estimatesRan || 0;
    
    // Estimates Set from targetReport
    metrics.estimatesSet = actual.estimatesSet || 0;
    
    // Leads from targetReport
    metrics.leads = actual.leads || 0;
    
    // Budget spent from budgetReport
    metrics.budgetSpent = actual.budgetSpent || 0;
    
    // Calculate funnel rates from actual data
    if (metrics.leads > 0 && metrics.estimatesSet > 0) {
      metrics.appointmentRate = (metrics.estimatesSet / metrics.leads) * 100;
    }
    
    if (metrics.estimatesSet > 0 && metrics.estimatesRan > 0) {
      metrics.showRate = (metrics.estimatesRan / metrics.estimatesSet) * 100;
    }
    
    if (metrics.estimatesRan > 0 && metrics.sales > 0) {
      metrics.closeRate = (metrics.sales / metrics.estimatesRan) * 100;
    }
    
    // Calculate lead to sale
    if (metrics.appointmentRate && metrics.showRate && metrics.closeRate) {
      metrics.leadToSale = (metrics.appointmentRate * metrics.showRate * metrics.closeRate) / 10000;
    }
    
    // Calculate average job size from actual revenue and jobs booked
    // This is different from target avgJobSize which is set as a target
    if (metrics.revenue > 0 && metrics.sales > 0) {
      metrics.avgJobSize = metrics.revenue / metrics.sales;
    }
    
    // Calculate cost metrics if budget is available
    if (actual.weeklyBudget) {
      if (metrics.leads > 0) {
        metrics.cpl = actual.budgetSpent / metrics.leads;
      }
      if (metrics.estimatesSet > 0) {
        metrics.cpEstimateSet = actual.budgetSpent / metrics.estimatesSet;
      }
      if (metrics.estimatesRan > 0) {
        metrics.cpEstimate = actual.budgetSpent / metrics.estimatesRan;
      }
      if (metrics.sales > 0) {
        metrics.cpJobBooked = actual.budgetSpent / metrics.sales;
      }
    }
    
    // Calculate actual budget from budgetSpent (aggregation of testing, awareness, and lead generation budgets)
    metrics.budget = actual.budgetSpent || 0;
    
    // COM% from target data
    metrics.com = processedTargetData?.com || 0;
    
    if (metrics.revenue > 0 && period !== "weekly") {
      let managementCost = 0;
      const budget = processedTargetData?.weeklyBudget || 0;

      if (period === "monthly") {
        managementCost = calculateManagementCost(budget);
      } else if (period === "yearly") {
        managementCost = calculateManagementCost(budget / 12);
      }

      metrics.totalCom = ((managementCost + metrics.budget) / metrics.revenue) * 100;
    }

    return metrics;
  }, [processedActualData, processedTargetData]);

  // Prepare metrics from processed data
  const metrics = useMemo(
    () => [
      {
        category: "Revenue Metrics",
        items: [
          {
            name: "Revenue",
            actual: calculateActualMetrics.revenue ?? 0,
            target: processedTargetData?.revenue ?? 0,
            format: "currency" as const,
          },
          ...(period !== "weekly" ? [{
            name: "Total COM%",
            actual: calculateActualMetrics.totalCom ?? 0,
            target: processedTargetData?.totalCom ?? 0,
            format: "percent" as const,
          }] : []),
          {
            name: "Ad CoM%",
            actual: calculateActualMetrics.com ?? 0,
            target: processedTargetData?.com ?? 0,
            format: "percent" as const,
          },
        ],
      },
      {
        category: "Funnel Metrics",
        items: [
          {
            name: "Appointment Rate",
            actual: calculateActualMetrics.appointmentRate ?? 0,
            target: processedTargetData?.appointmentRate ?? 0,
            format: "percent" as const,
          },
          {
            name: "Show Rate",
            actual: calculateActualMetrics.showRate ?? 0,
            target: processedTargetData?.showRate ?? 0,
            format: "percent" as const,
          },
          {
            name: "Close Rate",
            actual: calculateActualMetrics.closeRate ?? 0,
            target: processedTargetData?.closeRate ?? 0,
            format: "percent" as const,
          },
          {
            name: "Lead to Sale",
            actual: calculateActualMetrics.leadToSale ?? 0,
            target: processedTargetData?.leadToSale ?? 0,
            format: "percent" as const,
          },
        ],
      },
      {
        category: "Performance Metrics",
        items: [
          {
            name: "Leads",
            actual: calculateActualMetrics.leads ?? 0,
            target: processedTargetData?.leads ?? 0,
            format: "number" as const,
          },
          {
            name: "Estimates Set",
            actual: calculateActualMetrics.estimatesSet ?? 0,
            target: processedTargetData?.estimatesSet ?? 0,
            format: "number" as const,
          },
          {
            name: "Estimates",
            actual: calculateActualMetrics.estimatesRan ?? 0,
            target: processedTargetData?.estimatesRan ?? 0,
            format: "number" as const,
          },
          {
            name: "Jobs Booked",
            actual: calculateActualMetrics.sales ?? 0,
            target: processedTargetData?.sales ?? 0,
            format: "number" as const,
          },
          {
            name: "Average Job Size",
            actual: calculateActualMetrics.avgJobSize ?? 0,
            target: processedTargetData?.avgJobSize ?? 0,
            format: "currency" as const,
          },
        ],
      },
      {
        category: "Expense Metrics",
        items: [
          {
            name: "Budget",
            actual: calculateActualMetrics.budget ?? 0,
            target: processedTargetData?.budget ?? 0,
            format: "currency" as const,
          },
          {
            name: "Cost Per Lead",
            actual: calculateActualMetrics.cpl ?? 0,
            target: processedTargetData?.cpl ?? 0,
            format: "currency" as const,
          },
          {
            name: "Cost Per Estimate Set",
            actual: calculateActualMetrics.cpEstimateSet ?? 0,
            target: processedTargetData?.cpEstimateSet ?? 0,
            format: "currency" as const,
          },
          {
            name: "Cost Per Estimate",
            actual: calculateActualMetrics.cpEstimate ?? 0,
            target: processedTargetData?.cpEstimate ?? 0,
            format: "currency" as const,
          },
          {
            name: "Cost Per Job Booked",
            actual: calculateActualMetrics.cpJobBooked ?? 0,
            target: processedTargetData?.cpJobBooked ?? 0,
            format: "currency" as const,
          },
        ],
      },
      
    ],
    [calculateActualMetrics, processedTargetData, period]
  );

  // Format value helper
  const formatValue = (value: number, format: string) => {
    if (format === "currency") {
      return formatCurrencyValue(value);
    }
    if (format === "percent") {
      return `${value.toFixed(2)}%`;
    }
    return Math.round(value)?.toLocaleString();
  };

  // Handler for DatePeriodSelector
  const handleDatePeriodChange = (
    date: Date,
    newPeriod: "weekly" | "monthly" | "yearly"
  ) => {
    setSelectedDate(date);
    setPeriod(newPeriod);
  };

  // Export button handler
  const handleExport = () => {
    if (!processedActualData || !processedTargetData) {
      alert("No data available to export. Please wait for data to load.");
      return;
    }

    const exportData: ExportData = {
      metrics,
      period,
      selectedDate,
      actualMetrics: calculateActualMetrics,
      targetData: processedTargetData
    };

    try {
      exportToExcel(exportData);
      // Show success message
      alert('Excel file exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="relative z-10 pt-6 pb-16 px-4">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/60 rounded-lg  flex items-center justify-center shadow-lg">
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="leading-[130%] text-4xl font-bold text-gradient-primary">
                Target Vs Actual
              </h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg mb-8 mt-2">
              Compare your actual performance against targets with calculated metrics
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="max-w-7xl mx-auto mb-10">
            <DatePeriodSelector
              initialDate={selectedDate}
              initialPeriod={period}
              onChange={handleDatePeriodChange}
              buttonText="Export to Excel"
              onButtonClick={handleExport}
              allowedPeriods={["weekly", "monthly", "yearly", "ytd"]}
            />
        </div>

        {/* Metrics Tables Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {metrics.map((section) => (
            <Card key={section.category} className="p-6 shadow-lg transition-all duration-300 border hover:shadow-2xl border-primary/10 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-card-foreground mb-6 flex items-center gap-2">
                {section.category}
              </h3>
              <div className="overflow-hidden rounded-lg border border-border/50">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/50">
                      <th className="text-left p-3 font-semibold text-muted-foreground text-sm">
                        Metric
                      </th>
                      <th className="text-right p-3 font-semibold text-muted-foreground text-sm">
                        Actual
                      </th>
                      <th className="text-right p-3 font-semibold text-muted-foreground text-sm">
                        Target
                      </th>
                      <th className="text-right p-3 font-semibold text-muted-foreground text-sm">
                        Progress
                      </th>
                      <th className="text-right p-3 font-semibold text-muted-foreground text-sm">
                        Performance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.items.map((item, index) => {
                      const percent =
                        item.target === 0
                          ? 0
                          : ((item.actual - item.target) / item.target) * 100;
                      const isPositive = percent >= 0;
                      const progressPercent = item.target > 0 ? (item.actual / item.target) * 100 : 0;
                      
                      return (
                        <tr
                          key={`${section.category}-${item.name}`}
                          className={`border-b border-border/30 hover:bg-muted/30 hover:shadow-md transition-all duration-300 cursor-pointer group ${
                            index % 2 === 0 ? 'bg-background/50' : 'bg-muted/5'
                          }`}
                        >
                          <td className="px-3 py-5 font-medium text-card-foreground text-sm group-hover:text-primary transition-colors duration-200">
                            <div className="flex items-center gap-3">
                              {item.name}
                            </div>
                          </td>
                          <td className="p-3 text-right font-bold text-card-foreground text-sm">
                            <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary font-semibold group-hover:bg-primary/20 group-hover:shadow-sm transition-all duration-200">
                              {formatValue(item.actual, item.format)}
                            </span>
                          </td>
                          <td className="p-3 text-right font-medium text-muted-foreground text-sm">
                            <span className="px-3 py-2 rounded-lg bg-muted/30 text-muted-foreground group-hover:bg-muted/50 group-hover:shadow-sm transition-all duration-200">
                              {formatValue(item.target, item.format)}
                            </span>
                          </td>
                          <td className="p-3 text-right font-semibold text-sm">
                            <div className="flex flex-col items-end gap-2">
                              <span className="text-muted-foreground text-sm group-hover:text-foreground transition-colors duration-200">
                                {item.target > 0 ? `${progressPercent.toFixed(1)}%` : 'N/A'}
                              </span>
                              {item.target > 0 && (
                                <div className="w-20 h-2 bg-muted rounded-full overflow-hidden group-hover:shadow-inner transition-all duration-200">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      progressPercent >= 100 
                                        ? 'bg-success' 
                                        : progressPercent >= 80 
                                        ? 'bg-warning' 
                                        : 'bg-destructive'
                                    }`}
                                    style={{ width: `${Math.min(progressPercent, 100)}%` }}
                                  ></div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-right font-semibold">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                                isPositive
                                  ? "bg-success/20 text-success border border-success/30 hover:bg-success/30 hover:shadow-lg"
                                  : "bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30 hover:shadow-lg"
                              }`}
                            >
                              {isPositive ? (
                                <TrendingUp className="h-4 w-4 mr-2" />
                              ) : (
                                <TrendingDown className="h-4 w-4 mr-2" />
                              )}
                              {percent > 0 ? "+" : ""}
                              {percent.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
