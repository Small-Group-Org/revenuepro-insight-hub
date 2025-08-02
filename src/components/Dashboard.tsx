
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, Cell } from 'recharts';
import { Calendar, Filter, TrendingUp, Users, Target as TargetIcon, DollarSign, BarChart3 } from 'lucide-react';
import { useReportingDataStore } from '@/stores/reportingDataStore';
import { DatePeriodSelector } from '@/components/DatePeriodSelector';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { getWeekInfo } from '@/utils/weekLogic';
import { processTargetData, calculateFields } from '@/utils/page-utils/targetUtils';
import { calculateReportingFields } from '@/utils/page-utils/actualDataUtils';
import { calculateManagementCost, formatCurrencyValue } from '@/utils/page-utils/commonUtils';
import { FieldValue } from '@/types';
import { MetricsLineCharts } from './MetricsLineCharts';
import { useUserStore } from '@/stores/userStore';

export const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<"weekly" | "monthly" | "yearly">("weekly");

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
    getReportingData(startDate, endDate, queryType);
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
    metrics.revenue = actual.revenue || 0;
    metrics.sales = actual.sales || 0;
    metrics.estimatesRan = actual.estimatesRan || 0;
    metrics.estimatesSet = actual.estimatesSet || 0;
    metrics.leads = actual.leads || 0;
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
    
    if (metrics.appointmentRate && metrics.showRate && metrics.closeRate) {
      metrics.leadToSale = (metrics.appointmentRate * metrics.showRate * metrics.closeRate) / 10000;
    }
    
    if (metrics.revenue > 0 && metrics.sales > 0) {
      metrics.avgJobSize = metrics.revenue / metrics.sales;
    }
    
    // Calculate cost metrics
    if (metrics.leads > 0) {
      metrics.cpl = metrics.budgetSpent / metrics.leads;
    }
    if (metrics.estimatesSet > 0) {
      metrics.cpEstimateSet = metrics.budgetSpent / metrics.estimatesSet;
    }
    
    metrics.budget = metrics.budgetSpent || 0;
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
  }, [processedActualData, processedTargetData, period]);

  // Prepare comprehensive comparison chart data
  const comprehensiveChartData = useMemo(() => {
    const actual = calculateActualMetrics;
    const target = processedTargetData || {};

    // Create time series data for each metric
    const timePoints = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    
    return {
      totalCom: timePoints.map((week, index) => ({
        week,
        actual: (actual.totalCom || 0) * (0.8 + Math.random() * 0.4), // Simulate variation
        target: target.totalCom || 0,
        format: "percent"
      })),
      revenue: timePoints.map((week, index) => ({
        week,
        actual: (actual.revenue || 0) * (0.8 + Math.random() * 0.4),
        target: target.revenue || 0,
        format: "currency"
      })),
      cpEstimateSet: timePoints.map((week, index) => ({
        week,
        actual: (actual.cpEstimateSet || 0) * (0.8 + Math.random() * 0.4),
        target: target.cpEstimateSet || 0,
        format: "currency"
      })),
      cpl: timePoints.map((week, index) => ({
        week,
        actual: (actual.cpl || 0) * (0.8 + Math.random() * 0.4),
        target: target.cpl || 0,
        format: "currency"
      })),
      appointmentRate: timePoints.map((week, index) => ({
        week,
        actual: (actual.appointmentRate || 0) * (0.8 + Math.random() * 0.4),
        target: target.appointmentRate || 0,
        format: "percent"
      })),
      showRate: timePoints.map((week, index) => ({
        week,
        actual: (actual.showRate || 0) * (0.8 + Math.random() * 0.4),
        target: target.showRate || 0,
        format: "percent"
      })),
      closeRate: timePoints.map((week, index) => ({
        week,
        actual: (actual.closeRate || 0) * (0.8 + Math.random() * 0.4),
        target: target.closeRate || 0,
        format: "percent"
      })),
      avgJobSize: timePoints.map((week, index) => ({
        week,
        actual: (actual.avgJobSize || 0) * (0.8 + Math.random() * 0.4),
        target: target.avgJobSize || 0,
        format: "currency"
      }))
    };
  }, [calculateActualMetrics, processedTargetData]);

  // Handler for DatePeriodSelector
  const handleDatePeriodChange = (
    date: Date,
    newPeriod: "weekly" | "monthly" | "yearly"
  ) => {
    setSelectedDate(date);
    setPeriod(newPeriod);
  };

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

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-blue-600">
            Actual: {formatValue(data.actual, data.format)}
          </p>
          <p className="text-green-600">
            Target: {formatValue(data.target, data.format)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative z-10 py-12 px-4">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-4">
              <h1 className="leading-[130%] text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                Performance Dashboard
              </h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg mb-10 mt-2">
              Track your key metrics and performance trends with comprehensive analytics
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="max-w-7xl mx-auto mb-8">
          <DatePeriodSelector
            initialDate={selectedDate}
            initialPeriod={period}
            onChange={handleDatePeriodChange}
            allowedPeriods={["weekly", "monthly", "yearly"]}
          />
        </div>

        {/* Comprehensive Metrics Comparison Charts */}
        <div className="max-w-7xl mx-auto mb-8">
          <MetricsLineCharts comprehensiveChartData={comprehensiveChartData} />
        </div>
      </div>
    </div>
  );
};
