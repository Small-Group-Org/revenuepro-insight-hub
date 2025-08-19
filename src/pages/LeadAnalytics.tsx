import React, { useState, useEffect, useMemo } from 'react';
import { useLeadStore } from '@/stores/leadStore';
import { useUserStore } from '@/stores/userStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, MapPin, Wrench, Tag, FileText, Users, CheckCircle, XCircle, Calendar, BarChart3 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter, subMonths, subQuarters, subYears } from 'date-fns';
import { TopCard } from '@/components/DashboardTopCards';

//9ca3af
const COLORS = ['#1f1c13', '#f7f5f5', '#306BC8', '#2A388F', '#396F9C'];

// Time filter labels for display
const TIME_FILTER_LABELS: Record<string, string> = {
  all: 'All Time',
  this_month: 'This Month',
  last_month: 'Last Month',
  this_quarter: 'This Quarter',
  last_quarter: 'Last Quarter',
  this_year: 'This Year',
  last_year: 'Last Year',
};

export const LeadAnalytics = () => {
  const { leads, loading, error, fetchLeads } = useLeadStore();
  const { selectedUserId } = useUserStore();
  const [selectedMetric, setSelectedMetric] = useState<string>('overview');
  const [timeFilter, setTimeFilter] = useState<'all' | 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'last_year'>('all');

  useEffect(() => {
    if (selectedUserId) {
      fetchLeads(selectedUserId); // Pass selectedUserId as clientId
    }
  }, [selectedUserId, fetchLeads]);

  // Filter leads based on time period
  const filteredLeads = useMemo(() => {
    if (timeFilter === 'all') return leads;

    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (timeFilter) {
      case 'this_month': {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      }
      case 'last_month': {
        const lastMonth = subMonths(now, 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
        break;
      }
      case 'this_quarter': {
        startDate = startOfQuarter(now);
        endDate = endOfQuarter(now);
        break;
      }
      case 'last_quarter': {
        const lastQuarter = subQuarters(now, 1);
        startDate = startOfQuarter(lastQuarter);
        endDate = endOfQuarter(lastQuarter);
        break;
      }
      case 'this_year': {
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      }
      case 'last_year': {
        const lastYear = subYears(now, 1);
        startDate = startOfYear(lastYear);
        endDate = endOfYear(lastYear);
        break;
      }
      default:
        return leads;
    }

    return leads.filter(lead => {
      const leadDate = new Date(lead.leadDate);
      return (!startDate || leadDate >= startDate) && (!endDate || leadDate <= endDate);
    });
  }, [leads, timeFilter]);

  // Analytics Data Processing
  const analyticsData = useMemo(() => {
    if (!filteredLeads.length) return null;

    const totalLeads = filteredLeads.length;

    // Filter leads with estimates set for chart analysis
    const estimateSetLeads = filteredLeads.filter(lead => lead.status === 'estimate_set');

    const estimateSetCount = estimateSetLeads.length;
    const unqualifiedCount = totalLeads - estimateSetCount;
    const conversionRate = ((estimateSetCount / totalLeads) * 100).toFixed(1);

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
      if (lead.status === 'estimate_set') {
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
      const key = `${lead.adName}|${lead.adSetName}`; // Use combination of ad name and ad set name
      if (!acc[key]) {
        acc[key] = { adName: lead.adName, adSetName: lead.adSetName, total: 0, estimateSet: 0 };
      }
      acc[key].total += 1;
      if (lead.status === 'estimate_set') {
        acc[key].estimateSet += 1;
      }
      return acc;
    }, {} as Record<string, { adName: string; adSetName: string; total: number; estimateSet: number }>);

    const adNameData = Object.entries(adNameAnalysis)
      .map(([key, data]) => ({ 
        adName: data.adName, 
        adSetName: data.adSetName,
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
      if (lead.status === 'estimate_set') {
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
      .filter(lead => lead.status === 'unqualified' && lead.unqualifiedLeadReason)
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

  // Top Ads and Ad Sets Analysis (Last 2 Weeks - Independent of time filter)
  const topPerformersData = useMemo(() => {
    // Calculate last 2 weeks date range
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
    
    // Filter leads from last 2 weeks for top performers analysis
    const lastTwoWeeksLeads = leads.filter(lead => {
      const leadDate = new Date(lead.leadDate);
      return leadDate >= twoWeeksAgo && leadDate <= now;
    });

    // Top Ads by Estimate Set Count (Last 2 Weeks)
    const topAdsAnalysis = lastTwoWeeksLeads.reduce((acc, lead) => {
      const key = `${lead.adName}|${lead.adSetName}`; // Use combination of ad name and ad set name
      if (!acc[key]) {
        acc[key] = { adName: lead.adName, adSetName: lead.adSetName, total: 0, estimateSet: 0 };
      }
      acc[key].total += 1;
      if (lead.status === 'estimate_set') {
        acc[key].estimateSet += 1;
      }
      return acc;
    }, {} as Record<string, { adName: string; adSetName: string; total: number; estimateSet: number }>);

    const topAdsData = Object.entries(topAdsAnalysis)
      .map(([key, data]) => ({ 
        adName: data.adName,
        adSetName: data.adSetName,
        total: data.total,
        estimateSet: data.estimateSet,
        percentage: data.total > 0 ? ((data.estimateSet / data.total) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.estimateSet - a.estimateSet)
      .slice(0, 10); // Top 10 ads

    // Top Ad Sets by Estimate Set Count (Last 2 Weeks)
    const topAdSetsAnalysis = lastTwoWeeksLeads.reduce((acc, lead) => {
      if (!acc[lead.adSetName]) {
        acc[lead.adSetName] = { total: 0, estimateSet: 0 };
      }
      acc[lead.adSetName].total += 1;
      if (lead.status === 'estimate_set') {
        acc[lead.adSetName].estimateSet += 1;
      }
      return acc;
    }, {} as Record<string, { total: number; estimateSet: number }>);

    const topAdSetsData = Object.entries(topAdSetsAnalysis)
      .map(([adSetName, data]) => ({ 
        adSetName, 
        total: data.total,
        estimateSet: data.estimateSet,
        percentage: data.total > 0 ? ((data.estimateSet / data.total) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.estimateSet - a.estimateSet)
      .slice(0, 10); // Top 10 ad sets

    return {
      topAdsData,
      topAdSetsData
    };
  }, [leads]);


  const chartConfig = {
    count: {
      label: "Count",
    },
    estimateSet: {
      label: "Estimates Set",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <div className="relative z-10 pt-4 pb-12 px-4">
        <div className="max-w-7xl mx-auto space-y-10">
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
                Complete analysis of lead performance - focusing on successful conversions and trends
              </p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={timeFilter} onValueChange={(value: string) => setTimeFilter(value as 'all' | 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'last_year')}>
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this_month">This Month</SelectItem>
                    <SelectItem value="this_quarter">This Quarter</SelectItem>
                    <SelectItem value="last_quarter">Last Quarter</SelectItem>
                    <SelectItem value="this_year">This Year</SelectItem>
                    <SelectItem value="last_month">Last Month</SelectItem>
                    <SelectItem value="last_year">Last Year</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
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
                <p className="text-muted-foreground">No leads data available for "{TIME_FILTER_LABELS[timeFilter] || 'the selected range'}".</p>
                <p className="text-xs text-muted-foreground">Try selecting a different time period above.</p>
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
                  format: 'number' as const
                }
              ]}
              description={TIME_FILTER_LABELS[timeFilter] || 'All Time'}
            />

            <TopCard
              title="Estimates Set"
              icon={<CheckCircle className="h-5 w-5 opacity-50 text-green-600" />}
              metrics={[
                {
                  label: "Estimates Set",
                  value: analyticsData.overview.estimateSetCount,
                  format: 'number' as const
                },
                {
                  label: "Conversion Rate",
                  value: parseFloat(analyticsData.overview.conversionRate),
                  format: 'percent' as const
                }
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
                  format: 'number' as const
                },
                {
                  label: "Unqualified %",
                  value: 100 - parseFloat(analyticsData.overview.conversionRate),
                  format: 'percent' as const
                }
              ]}
              description="Leads marked as unqualified"
            />

            <TopCard
              title="Conversion Rate"
              icon={<TrendingUp className="h-5 w-5 opacity-50 text-blue-600" />}
              metrics={[
                {
                  label: "Conversion Rate",
                  value: parseFloat(analyticsData.overview.conversionRate),
                  format: 'percent' as const
                }
              ]}
              description="Estimate to lead ratio"
            />
          </div>

          {/* Charts Grid */}
          {analyticsData.overview.estimateSetCount === 0 ? (
            <Card className="mx-auto max-w-md">
              <CardContent className="text-center pt-4 pb-12">
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

          {/* Performance Tables Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        <tr key={`${ad.adName}-${ad.adSetName}`} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium">
                            {ad.adName} <span className="text-gray-500 font-normal">({ad.adSetName})</span>
                          </td>
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

                        {/* Top Ad Sets by Estimate Set Count (Last 2 Weeks) */}
                        {topPerformersData.topAdSetsData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-orange-600" />
                    Top Ad Sets (by estimate set count)
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Performance ranking based on estimate set count over the past 2 weeks
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Rank</th>
                          <th className="text-left p-2">Ad Set Name</th>
                          <th className="text-right p-2">Total Leads</th>
                          <th className="text-right p-2">Estimate Set</th>
                          <th className="text-right p-2">Estimate Set %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topPerformersData.topAdSetsData.map((adSet, index) => (
                          <tr key={adSet.adSetName} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-medium">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
                                #{index + 1}
                              </span>
                            </td>
                            <td className="p-2 font-medium">{adSet.adSetName}</td>
                            <td className="text-right p-2">{adSet.total}</td>
                            <td className="text-right p-2 text-green-600 font-medium">{adSet.estimateSet}</td>
                            <td className="text-right p-2">
                              <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
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
            )}

            {/* Top Ads by Estimate Set Count (Last 2 Weeks) */}
            {topPerformersData.topAdsData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    Top Ads (by estimate set count)
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Performance ranking based on estimate set count over the past 2 weeks
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Rank</th>
                          <th className="text-left p-2">Ad Name</th>
                          <th className="text-right p-2">Total Leads</th>
                          <th className="text-right p-2">Estimate Set</th>
                          <th className="text-right p-2">Estimate Set %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topPerformersData.topAdsData.map((ad, index) => (
                          <tr key={`${ad.adName}-${ad.adSetName}`} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-medium">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                                #{index + 1}
                              </span>
                            </td>
                            <td className="p-2 font-medium">
                              {ad.adName} <span className="text-gray-500 font-normal">({ad.adSetName})</span>
                            </td>
                            <td className="text-right p-2">{ad.total}</td>
                            <td className="text-right p-2 text-green-600 font-medium">{ad.estimateSet}</td>
                            <td className="text-right p-2">
                              <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
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
            )}

          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
};