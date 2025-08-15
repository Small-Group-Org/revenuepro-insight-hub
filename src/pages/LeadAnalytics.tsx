import React, { useState, useEffect, useMemo } from 'react';
import { useLeadStore } from '@/stores/leadStore';
import { useUserStore } from '@/stores/userStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, MapPin, Wrench, Tag, FileText, Users, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { Lead } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subQuarters, subYears } from 'date-fns';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b'];

// Time period constants in days
const DAYS_IN_MONTH = 30;
const DAYS_IN_QUARTER = 90;
const DAYS_IN_YEAR = 365;

export const LeadAnalytics = () => {
  const { leads, loading, error, fetchLeads } = useLeadStore();
  const { selectedUserId } = useUserStore();
  const [selectedMetric, setSelectedMetric] = useState<string>('overview');
  const [timeFilter, setTimeFilter] = useState<'all' | 'monthly' | 'quarterly' | 'yearly'>('all');

  useEffect(() => {
    if (selectedUserId) {
      fetchLeads(selectedUserId); // Pass selectedUserId as clientId
    }
  }, [selectedUserId, fetchLeads]);

  // Filter leads based on time period
  const filteredLeads = useMemo(() => {
    if (timeFilter === 'all') return leads;
    
    const now = new Date();
    let startDate: Date;
    
    switch (timeFilter) {
      case 'monthly':
        // Last 1 month from today
        startDate = new Date(now.getTime() - (DAYS_IN_MONTH * 24 * 60 * 60 * 1000));
        break;
      case 'quarterly':
        // Last 3 months from today
        startDate = new Date(now.getTime() - (DAYS_IN_QUARTER * 24 * 60 * 60 * 1000));
        break;
      case 'yearly':
        // Last 1 year from today
        startDate = new Date(now.getTime() - (DAYS_IN_YEAR * 24 * 60 * 60 * 1000));
        break;
      default:
        return leads;
    }
    
    return leads.filter(lead => new Date(lead.leadDate) >= startDate);
  }, [leads, timeFilter]);

  // Analytics Data Processing
  const analyticsData = useMemo(() => {
    if (!filteredLeads.length) return null;

    const totalLeads = filteredLeads.length;
    const estimateSetCount = filteredLeads.filter(lead => lead.estimateSet).length;
    const unqualifiedCount = totalLeads - estimateSetCount;
    const conversionRate = ((estimateSetCount / totalLeads) * 100).toFixed(1);

    // Filter leads with estimates set for chart analysis
    const estimateSetLeads = filteredLeads.filter(lead => lead.estimateSet);

    // Zip Code Analysis (Only Estimate Set Leads)
    const zipAnalysis = estimateSetLeads.reduce((acc, lead) => {
      acc[lead.zip] = (acc[lead.zip] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const zipData = estimateSetCount > 0 ? Object.entries(zipAnalysis)
      .map(([zip, count]) => ({ 
        zip, 
        count, 
        percentage: ((count / estimateSetCount) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count) : [];

    // Service Analysis (Only Estimate Set Leads)
    const serviceAnalysis = estimateSetLeads.reduce((acc, lead) => {
      acc[lead.service] = (acc[lead.service] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const serviceData = estimateSetCount > 0 ? Object.entries(serviceAnalysis)
      .map(([service, count]) => ({ 
        service, 
        count, 
        percentage: ((count / estimateSetCount) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count) : [];

    // Ad Set Analysis (All Leads + Estimate Set Leads)
    const adSetAnalysis = filteredLeads.reduce((acc, lead) => {
      if (!acc[lead.adSetName]) {
        acc[lead.adSetName] = { total: 0, estimateSet: 0 };
      }
      acc[lead.adSetName].total += 1;
      if (lead.estimateSet) {
        acc[lead.adSetName].estimateSet += 1;
      }
      return acc;
    }, {} as Record<string, { total: number; estimateSet: number }>);

    const adSetData = Object.entries(adSetAnalysis)
      .map(([adSetName, data]) => ({ 
        adSetName, 
        total: data.total,
        estimateSet: data.estimateSet,
        percentage: data.total > 0 ? ((data.estimateSet / data.total) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.estimateSet - a.estimateSet);

    // Ad Name Analysis (All Leads + Estimate Set Leads)
    const adNameAnalysis = filteredLeads.reduce((acc, lead) => {
      if (!acc[lead.adName]) {
        acc[lead.adName] = { total: 0, estimateSet: 0 };
      }
      acc[lead.adName].total += 1;
      if (lead.estimateSet) {
        acc[lead.adName].estimateSet += 1;
      }
      return acc;
    }, {} as Record<string, { total: number; estimateSet: number }>);

    const adNameData = Object.entries(adNameAnalysis)
      .map(([adName, data]) => ({ 
        adName, 
        total: data.total,
        estimateSet: data.estimateSet,
        percentage: data.total > 0 ? ((data.estimateSet / data.total) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.estimateSet - a.estimateSet);

    // Lead Date Analysis (Only Estimate Set Leads)
    const leadDateAnalysis = estimateSetLeads.reduce((acc, lead) => {
      const date = new Date(lead.leadDate).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const leadDateData = estimateSetCount > 0 ? Object.entries(leadDateAnalysis)
      .map(([date, count]) => ({ 
        date, 
        count, 
        percentage: ((count / estimateSetCount) * 100).toFixed(1)
      }))
      .sort((a, b) => new Date(a.date + ', 2024').getTime() - new Date(b.date + ', 2024').getTime()) : [];

    // Day of Week Analysis (Both Total Leads and Estimate Set Leads)
    const dayOfWeekAnalysis = filteredLeads.reduce((acc, lead) => {
      const dayOfWeek = new Date(lead.leadDate).toLocaleDateString('en-US', { weekday: 'long' });
      if (!acc[dayOfWeek]) {
        acc[dayOfWeek] = { total: 0, estimateSet: 0 };
      }
      acc[dayOfWeek].total += 1;
      if (lead.estimateSet) {
        acc[dayOfWeek].estimateSet += 1;
      }
      return acc;
    }, {} as Record<string, { total: number; estimateSet: number }>);

    const dayOfWeekData = Object.entries(dayOfWeekAnalysis)
      .map(([day, data]) => ({ 
        day, 
        total: data.total,
        estimateSet: data.estimateSet,
        percentage: data.total > 0 ? ((data.estimateSet / data.total) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => {
        const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      });

    // Unqualified Reasons Analysis
    const ulrAnalysis = filteredLeads
      .filter(lead => !lead.estimateSet && lead.unqualifiedLeadReason)
      .reduce((acc, lead) => {
        const reason = lead.unqualifiedLeadReason!;
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const ulrData = Object.entries(ulrAnalysis)
      .map(([reason, count]) => ({ 
        reason, 
        count, 
        percentage: ((count / unqualifiedCount) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);

    return {
      overview: {
        totalLeads,
        estimateSetCount,
        unqualifiedCount,
        conversionRate
      },
      zipData,
      serviceData,
      adSetData,
      adNameData,
      leadDateData,
      dayOfWeekData,
      ulrData
    };
  }, [filteredLeads]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">{error || 'No data available for analysis'}</p>
        </div>
      </div>
    );
  }

  const chartConfig = {
    count: {
      label: "Count",
    },
    estimateSet: {
      label: "Estimates Set",
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative z-10 py-12 px-4">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-4">
              <h1 className="leading-[130%] text-4xl font-bold text-gradient-primary">
                Lead Analytics
              </h1>
            </div>
            <div className="flex items-center justify-center gap-4 mb-10 mt-2">
              <p className="text-muted-foreground text-lg">
                Complete analysis of lead performance - focusing on successful conversions and trends
              </p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={timeFilter} onValueChange={(value: any) => setTimeFilter(value)}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="monthly">Last Month</SelectItem>
                    <SelectItem value="quarterly">Last Quarter</SelectItem>
                    <SelectItem value="yearly">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.overview.totalLeads}</div>
                <p className="text-xs text-muted-foreground">
                  All-time lead data
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estimates Set</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{analyticsData.overview.estimateSetCount}</div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData.overview.conversionRate}% conversion rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unqualified</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{analyticsData.overview.unqualifiedCount}</div>
                <p className="text-xs text-muted-foreground">
                  {(100 - parseFloat(analyticsData.overview.conversionRate)).toFixed(1)}% unqualified
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{analyticsData.overview.conversionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Estimate to lead ratio
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          {analyticsData.overview.estimateSetCount === 0 ? (
            <Card className="mx-auto max-w-md">
              <CardContent className="text-center py-12">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Estimate Set Leads</h3>
                <p className="text-gray-500">
                  Charts will appear here once you have leads with estimates set.
                </p>
              </CardContent>
            </Card>
          ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Service Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-blue-600" />
                  Service Analysis (Estimate Set Leads)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="min-w-[600px]">
                    <ChartContainer config={chartConfig} className="h-80">
                  <PieChart>
                    <Pie
                      data={analyticsData.serviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ service, percentage }) => `${service}: ${percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.serviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value, name, props) => [
                        `${value} leads (${props.payload.percentage}%)`
                      ]}
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
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  Zip Codes (Estimate Set Leads)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="min-w-[600px]">
                    <ChartContainer config={chartConfig} className="h-80">
                  <BarChart data={analyticsData.zipData}>
                    <XAxis dataKey="zip" />
                    <YAxis />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value, name, props) => [
                        `${value} leads (${props.payload.percentage}%)`
                      ]}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" name="Estimate Set Leads" />
                  </BarChart>
                  </ChartContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Day of Week Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                    Day of Week Analysis
                </CardTitle>
                {/* Color Legend */}
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#94a3b8' }}></div>
                    <span className="text-sm text-gray-600">Total Leads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }}></div>
                    <span className="text-sm text-gray-600">Estimate Set Leads</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="min-w-[600px]">
                    <ChartContainer config={chartConfig} className="h-80">
                  <BarChart data={analyticsData.dayOfWeekData}>
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
                        if (active && payload && payload.length && label) {
                          const data = payload[0].payload;
                          const percentage = data.total > 0 ? ((data.estimateSet / data.total) * 100).toFixed(1) : '0.0';
                          return (
                            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                              <p className="font-semibold text-gray-900 mb-2">{label}</p>
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Total leads:</span> {data.total}
                              </p>
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Estimate set:</span> {data.estimateSet} ({percentage}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="total" fill="#94a3b8" name="Total Leads" />
                    <Bar dataKey="estimateSet" fill="#10b981" name="Estimate Set Leads" />
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
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    Unqualified Reasons
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <div className="min-w-[600px]">
                      <ChartContainer config={chartConfig} className="h-80">
                        <PieChart>
                          <Pie
                            data={analyticsData.ulrData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ reason, percentage }) => `${reason}: ${percentage}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {analyticsData.ulrData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip 
                            content={<ChartTooltipContent />}
                            formatter={(value, name, props) => [
                              `${value} leads (${props.payload.percentage}%)`,
                              'Count'
                            ]}
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

          {/* Ad Set Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-orange-600" />
                Ad Set Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Ad Set Name</th>
                      <th className="text-right p-2">Total Leads</th>
                      <th className="text-right p-2">Estimate Set</th>
                      <th className="text-right p-2">Estimate Set %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.adSetData.map((adSet, index) => (
                      <tr key={adSet.adSetName} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{adSet.adSetName}</td>
                        <td className="text-right p-2">{adSet.total}</td>
                        <td className="text-right p-2 text-green-600 font-medium">{adSet.estimateSet}</td>
                        <td className="text-right p-2">
                          <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                            {adSet.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Ad Name Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Ad Name Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Ad Name</th>
                      <th className="text-right p-2">Total Leads</th>
                      <th className="text-right p-2">Estimate Set</th>
                      <th className="text-right p-2">Estimate Set %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.adNameData.map((ad, index) => (
                      <tr key={ad.adName} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{ad.adName}</td>
                        <td className="text-right p-2">{ad.total}</td>
                        <td className="text-right p-2 text-green-600 font-medium">{ad.estimateSet}</td>
                        <td className="text-right p-2">
                          <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                            {ad.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};