
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, Cell } from 'recharts';
import { useReportingDataStore } from '@/stores/reportingDataStore';
import { DatePeriodSelector } from '@/components/DatePeriodSelector';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { processTargetData, calculateFields, getWeeksInMonth } from '@/utils/page-utils/targetUtils';
import { calculateManagementCost } from '@/utils/page-utils/commonUtils';
import { FieldValue } from '@/types';
import { MetricsLineCharts } from './MetricsLineCharts';
import { useUserStore } from '@/stores/userStore';
import { BarChart3, TrendingUp } from 'lucide-react';
import { generalMetricsChartConfigs, performanceMetricsChartConfigs } from '@/utils/constant';

export const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<"weekly" | "monthly" | "yearly" | "ytd">("monthly");

  const { reportingData, targetData, getReportingData } = useReportingDataStore();
  const { selectedUserId } = useUserStore();

  useEffect(() => {
    let startDate: string, endDate: string, queryType: string;
    if (period === "monthly") {
      startDate = format(startOfMonth(selectedDate), "yyyy-MM-dd");
      endDate = format(endOfMonth(selectedDate), "yyyy-MM-dd");
      queryType = "monthly";
    } else if (period === "ytd") {
      startDate = format(startOfYear(selectedDate), "yyyy-MM-dd");
      endDate = format(new Date(), "yyyy-MM-dd");
      queryType = "yearly";
    } else {
      startDate = format(startOfYear(selectedDate), "yyyy-MM-dd");
      endDate = format(endOfYear(selectedDate), "yyyy-MM-dd");
      queryType = "yearly";
    }
    getReportingData(startDate, endDate, queryType);
  }, [selectedDate, period, selectedUserId, getReportingData]);

  const processedTargetData = useMemo(() => {
    if (!targetData) return undefined;
    const baseTargetData = processTargetData(Array.isArray(targetData) ? targetData : [targetData]);
    
    return calculateFields(baseTargetData, period, period === 'weekly' ? 7 : 30);
  }, [targetData, period]);

  const getXAxisLabels = () => {
    if (period === 'monthly') {
      const weekCount = getWeeksInMonth(selectedDate);
      return Array.from({ length: weekCount }, (_, i) => `Week ${i + 1}`);
    } else if (period === 'yearly') {
      return [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
    } else if (period === 'ytd') {
      const currentMonth = new Date().getMonth();
      const monthLabels = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      return monthLabels.slice(0, currentMonth + 1);
    }
    // fallback - default to 4 weeks
    return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  };

  const comprehensiveChartData = useMemo(() => {
    if (!reportingData || reportingData.length === 0) {
      return {};
    }

    const xLabels = getXAxisLabels();

    const processDataPoint = (dataPoint: any, index: number) => {
      const metrics: FieldValue = {};
      
      metrics.revenue = dataPoint.revenue || 0;
      metrics.sales = dataPoint.sales || 0;
      metrics.estimatesRan = dataPoint.estimatesRan || 0;
      metrics.estimatesSet = dataPoint.estimatesSet || 0;
      metrics.leads = dataPoint.leads || 0;
      metrics.budgetSpent = dataPoint.budgetSpent || 0;
      
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
      
      // Calculate totalCom if we have target data
      if (metrics.revenue > 0 && processedTargetData) {
        const targetCom = processedTargetData.com || 0;
        const targetBudget = processedTargetData.weeklyBudget || 0;
        
        let managementCost = 0;
        if (period === "monthly") {
          managementCost = calculateManagementCost(targetBudget);
        } else if (period === "yearly") {
          managementCost = calculateManagementCost(targetBudget / 12);
        } else if (period === "ytd") {
          const currentMonth = new Date().getMonth();
          const monthsElapsed = currentMonth + 1;
          managementCost = calculateManagementCost((targetBudget / 12) * monthsElapsed);
        }
        
        metrics.totalCom = ((managementCost + metrics.budget) / metrics.revenue) * 100;
      }
      
      return metrics;
    };

    const chartData: any = {};
    const target = processedTargetData || {};
    const metricTypes = [
      'totalCom', 'revenue', 'cpEstimateSet', 'cpl', 
      'appointmentRate', 'showRate', 'closeRate', 'avgJobSize'
    ];
    
    metricTypes.forEach(metricType => {
      chartData[metricType] = reportingData.map((dataPoint, index) => {
        const metrics = processDataPoint(dataPoint, index);
        const actualValue = metrics[metricType] || 0;
        
        return {
          week: xLabels[index] || `Period ${index + 1}`,
          actual: actualValue,
          target: target[metricType] || 0,
          format: metricType.includes('Rate') || metricType === 'totalCom' ? 'percent' : 
                 metricType === 'revenue' || metricType === 'avgJobSize' || metricType.includes('cp') ? 'currency' : 'number'
        };
      });
    });
    
    return chartData;
  }, [reportingData, processedTargetData, period, selectedDate]);

  const handleDatePeriodChange = (
    date: Date,
    newPeriod: "weekly" | "monthly" | "yearly" | "ytd"
  ) => {
    setSelectedDate(date);
    setPeriod(newPeriod);
  };

  console.log("[Comprehensive Chart Data]", {comprehensiveChartData});

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
            allowedPeriods={["monthly", "yearly", "ytd"]}
          />
        </div>

        {/* General Metrics Charts */}
        <div className="max-w-7xl mx-auto mb-8">
          <MetricsLineCharts 
            chartData={comprehensiveChartData} 
            chartConfigs={generalMetricsChartConfigs}
            title="General Metrics"
            icon={<BarChart3 className="h-5 w-5 text-blue-600" />}
          />
        </div>

        {/* Performance Metrics Charts */}
        <div className="max-w-7xl mx-auto mb-8">
          <MetricsLineCharts 
            chartData={comprehensiveChartData} 
            chartConfigs={performanceMetricsChartConfigs}
            title="Performance Metrics"
            icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          />
        </div>
      </div>
    </div>
  );
};
