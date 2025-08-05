import React, { useState, useEffect, useMemo } from 'react';
import { useLeadStore } from '@/stores/leadStore';
import { useUserStore } from '@/stores/userStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, MapPin, Wrench, Tag, FileText, Users, CheckCircle, XCircle } from 'lucide-react';
import { Lead } from '@/types';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export const LeadAnalytics = () => {
  const { leads, loading, error, fetchLeads } = useLeadStore();
  const { selectedUserId } = useUserStore();
  const [selectedMetric, setSelectedMetric] = useState<string>('overview');

  useEffect(() => {
    if (selectedUserId) {
      fetchLeads(selectedUserId); // Pass selectedUserId as clientId
    }
  }, [selectedUserId, fetchLeads]);

  // Analytics Data Processing
  const analyticsData = useMemo(() => {
    if (!leads.length) return null;

    const totalLeads = leads.length;
    const estimateSetCount = leads.filter(lead => lead.estimateSet).length;
    const unqualifiedCount = totalLeads - estimateSetCount;
    const conversionRate = ((estimateSetCount / totalLeads) * 100).toFixed(1);

    // Filter leads with estimates set for chart analysis
    const estimateSetLeads = leads.filter(lead => lead.estimateSet);

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
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) : [];

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

    // Ad Set Analysis (Only Estimate Set Leads)
    const adSetAnalysis = estimateSetLeads.reduce((acc, lead) => {
      acc[lead.adSetName] = (acc[lead.adSetName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const adSetData = estimateSetCount > 0 ? Object.entries(adSetAnalysis)
      .map(([adSetName, count]) => ({ 
        adSetName, 
        count, 
        percentage: ((count / estimateSetCount) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count) : [];

    // Ad Name Analysis (Only Estimate Set Leads)
    const adNameAnalysis = estimateSetLeads.reduce((acc, lead) => {
      acc[lead.adName] = (acc[lead.adName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const adNameData = estimateSetCount > 0 ? Object.entries(adNameAnalysis)
      .map(([adName, count]) => ({ 
        adName, 
        count, 
        percentage: ((count / estimateSetCount) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) : [];

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

    // Day of Week Analysis (Only Estimate Set Leads)
    const dayOfWeekAnalysis = estimateSetLeads.reduce((acc, lead) => {
      const dayOfWeek = new Date(lead.leadDate).toLocaleDateString('en-US', { weekday: 'long' });
      acc[dayOfWeek] = (acc[dayOfWeek] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dayOfWeekData = estimateSetCount > 0 ? Object.entries(dayOfWeekAnalysis)
      .map(([day, count]) => ({ 
        day, 
        count, 
        percentage: ((count / estimateSetCount) * 100).toFixed(1)
      }))
      .sort((a, b) => {
        const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      }) : [];

    // Unqualified Reasons Analysis
    const ulrAnalysis = leads
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
  }, [leads]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300 animate-pulse" />
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">{error || 'No data available for analysis'}</p>
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
    <div className="min-h-screen bg-gray-50">
      <div className="relative z-10 py-12 px-4">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-4">
              <h1 className="leading-[130%] text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                Lead Analytics
              </h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg mb-10 mt-2">
              Analysis of qualified leads with estimates set - focusing on successful conversions
            </p>
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
                  All leads in selected period
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Service Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-blue-600" />
                  Service Analysis (Estimate Set Leads)
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Zip Code Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  Top Zip Codes (Estimate Set Leads)
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Ad Set Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-orange-600" />
                  Ad Set Performance (Estimate Set Leads)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <BarChart data={analyticsData.adSetData}>
                    <XAxis 
                      dataKey="adSetName" 
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value, name, props) => [
                        `${value} leads (${props.payload.percentage}%)`,
                      ]}
                    />
                    <Bar dataKey="count" fill="#f59e0b" name="Estimate Set Leads" />
                  </BarChart>
                </ChartContainer>
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
                </CardContent>
              </Card>
            )}
          </div>
          )}

          {/* Lead Date Analysis Charts */}
          {analyticsData.overview.estimateSetCount > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* Lead Date Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Lead Date Trend (Estimate Set Leads)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <LineChart data={analyticsData.leadDateData}>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value, name, props) => [
                        `${value} leads (${props.payload.percentage}%)`,
                        `Date: ${props.payload.date}`
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#10b981" 
                      name="Estimate Set Leads"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Day of Week Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  Day of Week Analysis (Estimate Set Leads)
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                      content={<ChartTooltipContent />}
                      formatter={(value, name, props) => [
                        `${value} leads (${props.payload.percentage}%)`,
                        props.payload.day
                      ]}
                    />
                    <Bar dataKey="count" fill="#6366f1" name="Estimate Set Leads" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Top Performing Ad Names Table - Only show if there are estimate set leads */}
          {analyticsData.overview.estimateSetCount > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Top Ad Names (Estimate Set Leads Only)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Ad Name</th>
                      <th className="text-right p-2">Estimate Set Leads</th>
                      <th className="text-right p-2">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.adNameData.slice(0, 8).map((ad, index) => (
                      <tr key={ad.adName} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{ad.adName}</td>
                        <td className="text-right p-2">{ad.count}</td>
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
      </div>
    </div>
  );
};