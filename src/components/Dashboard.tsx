
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

export const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<"weekly" | "monthly" | "yearly">("weekly");
  const [timeFilter, setTimeFilter] = useState('weekly');
  const [metricFilter, setMetricFilter] = useState('all');

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

  // Calculate KPIs from actual data
  const calculateKPIs = () => {
    const actual = calculateActualMetrics;
    
    return {
      totalLeads: actual.leads || 0,
      totalAppointments: actual.estimatesSet || 0,
      totalRevenue: actual.revenue || 0,
      conversionRate: actual.appointmentRate || 0,
      totalBudget: actual.budget || 0,
      funnelCost: actual.cpl || 0
    };
  };

  const kpis = calculateKPIs();

  // Prepare comprehensive comparison chart data
  const comprehensiveChartData = useMemo(() => {
    const actual = calculateActualMetrics;
    const target = processedTargetData || {};

    return [
      {
        name: "Total CoM%",
        actual: actual.totalCom || 0,
        target: target.totalCom || 0,
        format: "percent",
        color: "#3b82f6"
      },
      {
        name: "Total Revenue",
        actual: actual.revenue || 0,
        target: target.revenue || 0,
        format: "currency",
        color: "#10b981"
      },
      {
        name: "Cost per Appointment Set",
        actual: actual.cpEstimateSet || 0,
        target: target.cpEstimateSet || 0,
        format: "currency",
        color: "#f59e0b"
      },
      {
        name: "Cost Per Lead",
        actual: actual.cpl || 0,
        target: target.cpl || 0,
        format: "currency",
        color: "#ef4444"
      },
      {
        name: "Appointment Rate",
        actual: actual.appointmentRate || 0,
        target: target.appointmentRate || 0,
        format: "percent",
        color: "#8b5cf6"
      },
      {
        name: "Show Rate",
        actual: actual.showRate || 0,
        target: target.showRate || 0,
        format: "percent",
        color: "#06b6d4"
      },
      {
        name: "Close Rate",
        actual: actual.closeRate || 0,
        target: target.closeRate || 0,
        format: "percent",
        color: "#84cc16"
      },
      {
        name: "Average Job Size",
        actual: actual.avgJobSize || 0,
        target: target.avgJobSize || 0,
        format: "currency",
        color: "#f97316"
      }
    ];
  }, [calculateActualMetrics, processedTargetData]);

  // Prepare weekly trend data
  const chartData = useMemo(() => {
    if (!reportingData || reportingData.length === 0) return [];
    
    return reportingData.map((data, index) => ({
      week: `Week ${index + 1}`,
      leads: data.leads || 0,
      estimatesSet: data.estimatesSet || 0,
      sales: data.sales || 0,
      revenue: (data.revenue || 0) / 1000, // Scale for better visualization
      budgetSpent: (data.budgetSpent || 0) / 1000,
    }));
  }, [reportingData]);

  // Funnel data
  const funnelData = useMemo(() => {
    const actual = calculateActualMetrics;
    if (!actual.leads && !actual.estimatesSet && !actual.sales) return [];
    
    return [
      { name: 'Leads', value: actual.leads || 0, fill: '#3b82f6' },
      { name: 'Appointments Set', value: actual.estimatesSet || 0, fill: '#10b981' },
      { name: 'Sales', value: actual.sales || 0, fill: '#f59e0b' },
    ];
  }, [calculateActualMetrics]);

  const KPICard = ({ title, value, icon: Icon, format = 'number', trend = 0 }: any) => (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900">
            {format === 'currency' ? formatCurrencyValue(value) : 
             format === 'percentage' ? `${value.toFixed(1)}%` :
             Math.round(value).toLocaleString()}
          </p>
        </div>
        <div className="p-3 bg-blue-100 rounded-full">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
      </div>
    </Card>
  );

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

        {/* KPI Cards */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard 
              title="Total Leads" 
              value={kpis.totalLeads} 
              icon={Users}
            />
            <KPICard 
              title="Total Appointments" 
              value={kpis.totalAppointments} 
              icon={TargetIcon}
            />
            <KPICard 
              title="Total Revenue" 
              value={kpis.totalRevenue} 
              icon={DollarSign}
              format="currency"
            />
            <KPICard 
              title="Conversion Rate" 
              value={kpis.conversionRate} 
              icon={TrendingUp}
              format="percentage"
            />
          </div>
        </div>

        {/* Comprehensive Metrics Comparison Chart */}
        <div className="max-w-7xl mx-auto mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900">Comprehensive Metrics Comparison</h3>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={comprehensiveChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="actual" fill="#3b82f6" name="Actual" />
                <Bar dataKey="target" fill="#10b981" name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Trends */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="estimatesSet" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="sales" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Weekly Comparison */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Weekly Metrics</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="leads" fill="#3b82f6" />
                  <Bar dataKey="estimatesSet" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>

        {/* Funnel Chart */}
        {funnelData.length > 0 && (
          <div className="max-w-7xl mx-auto mb-8">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>
              <ResponsiveContainer width="100%" height={300}>
                <FunnelChart>
                  <Tooltip />
                  <Funnel dataKey="value" data={funnelData} isAnimationActive>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* Quick Stats */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{formatCurrencyValue(kpis.funnelCost)}</p>
                <p className="text-sm text-blue-700">Cost per Lead</p>
              </div>
            </Card>
            <Card className="p-6 bg-gradient-to-r from-green-50 to-green-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{kpis.conversionRate.toFixed(1)}%</p>
                <p className="text-sm text-green-700">Lead to Appointment Rate</p>
              </div>
            </Card>
            <Card className="p-6 bg-gradient-to-r from-purple-50 to-purple-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{formatCurrencyValue(kpis.totalBudget)}</p>
                <p className="text-sm text-purple-700">Total Ad Spend</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
