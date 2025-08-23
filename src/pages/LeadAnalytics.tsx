import React, { useState, useEffect, useMemo } from 'react';
import { useLeadStore } from '@/stores/leadStore';
import { useUserStore } from '@/stores/userStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, MapPin, Wrench, Tag, FileText, Users, CheckCircle, XCircle, Calendar, BarChart3, ChevronLeft, ChevronRight, ArrowUpDown, ChevronUp, ChevronDown, Trophy } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter, subMonths, subQuarters, subYears } from 'date-fns';
import { TopCard } from '@/components/DashboardTopCards';

// Chart colors
const COLORS = ['#1f1c13', '#9ca3af', '#306BC8', '#2A388F', '#396F9C'];

// Modern gradient colors for bar charts
const GRADIENT_COLORS = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140']
];

// Responsive breakpoints and dimensions
const SCREEN_BREAKPOINTS = {
  lg: '1024px', // Large screen breakpoint
  xl: '1280px', // Extra large screen breakpoint
};

const CHART_DIMENSIONS = {
  minWidth: '600px', // Minimum width for charts on small screens
  height: '320px', // Chart height (h-80 = 320px)
};

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
  
  // Pagination states for each table
  const [adSetPage, setAdSetPage] = useState(1);
  const [adNamePage, setAdNamePage] = useState(1);
  const adSetItemsPerPage = 15;
  const adNameItemsPerPage = 10;
  
  // Sorting states for each table
  const [adSetSortField, setAdSetSortField] = useState<'adSetName' | 'total' | 'estimateSet' | 'percentage'>('estimateSet');
  const [adSetSortOrder, setAdSetSortOrder] = useState<'asc' | 'desc'>('desc');
  const [adNameSortField, setAdNameSortField] = useState<'adName' | 'total' | 'estimateSet' | 'percentage'>('estimateSet');
  const [adNameSortOrder, setAdNameSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Common time filter for both tables
  const [commonTimeFilter, setCommonTimeFilter] = useState<'all' | '7' | '14' | '30' | '60'>('all');
  
  // Top ranking toggle states
  const [showTopRankedAdSets, setShowTopRankedAdSets] = useState(false);
  const [showTopRankedAdNames, setShowTopRankedAdNames] = useState(false);

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

  // Enhanced data processing with common time filtering
  const enhancedData = useMemo(() => {
    // Filter leads based on commonTimeFilter
    let timeFilteredLeads = leads;
    
    if (commonTimeFilter !== 'all') {
      const now = new Date();
      const daysAgo = new Date(now.getTime() - (parseInt(commonTimeFilter) * 24 * 60 * 60 * 1000));
      
      timeFilteredLeads = leads.filter(lead => {
        const leadDate = new Date(lead.leadDate);
        return leadDate >= daysAgo && leadDate <= now;
      });
    }

    // Ad Set Analysis with time filtering
    const adSetAnalysis = timeFilteredLeads.reduce((acc, lead) => {
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

    // Ad Name Analysis with time filtering
    const adNameAnalysis = timeFilteredLeads.reduce((acc, lead) => {
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

    return {
      adSetData,
      adNameData
    };
  }, [leads, commonTimeFilter]);

  // Sorting functions
  const sortData = (
    data: any[], 
    sortField: string, 
    sortOrder: 'asc' | 'desc'
  ): any[] => {
    return [...data].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Special handling for percentage field - convert string percentage to number
      if (sortField === 'percentage') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
  };

  // Pagination functions
  const paginateData = (data: any[], page: number, itemsPerPage: number): any[] => {
    const startIndex = (page - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalPages = (totalItems: number, itemsPerPage: number): number => {
    return Math.ceil(totalItems / itemsPerPage);
  };

  // Top ranking sort function (by percentage desc, then estimateSet desc)
  const topRankingSort = (data: any[]): any[] => {
    return [...data].sort((a, b) => {
      const aPercentage = parseFloat(a.percentage);
      const bPercentage = parseFloat(b.percentage);
      
      // First sort by percentage (descending)
      if (aPercentage !== bPercentage) {
        return bPercentage - aPercentage;
      }
      
      // If percentages are equal, sort by estimate count (descending)
      return b.estimateSet - a.estimateSet;
    });
  };

  // Sort and paginate data for each table
  const sortedAdSetData = useMemo(() => {
    if (showTopRankedAdSets) {
      return topRankingSort(enhancedData.adSetData);
    }
    return sortData(enhancedData.adSetData, adSetSortField, adSetSortOrder);
  }, [enhancedData.adSetData, adSetSortField, adSetSortOrder, showTopRankedAdSets]);
  
  const paginatedAdSetData = useMemo(() => 
    paginateData(sortedAdSetData, adSetPage, adSetItemsPerPage), 
    [sortedAdSetData, adSetPage]
  );

  const sortedAdNameData = useMemo(() => {
    if (showTopRankedAdNames) {
      return topRankingSort(enhancedData.adNameData);
    }
    return sortData(enhancedData.adNameData, adNameSortField, adNameSortOrder);
  }, [enhancedData.adNameData, adNameSortField, adNameSortOrder, showTopRankedAdNames]);
  
  const paginatedAdNameData = useMemo(() => 
    paginateData(sortedAdNameData, adNamePage, adNameItemsPerPage), 
    [sortedAdNameData, adNamePage]
  );

  // Reset pagination when data changes
  useEffect(() => {
    setAdSetPage(1);
    setAdNamePage(1);
  }, [timeFilter, commonTimeFilter, showTopRankedAdSets, showTopRankedAdNames]);

    // Helper function to render sortable table header
  const renderSortableHeader = (
    field: string,
    label: string,
    currentSortField: string,
    currentSortOrder: 'asc' | 'desc',
    onSort: (field: string) => void,
    isDisabled: boolean = false
  ) => (
    <th 
      className={`text-left p-2 transition-colors ${
        isDisabled 
          ? 'cursor-not-allowed opacity-60' 
          : 'cursor-pointer hover:bg-gray-50'
      }`}
      onClick={isDisabled ? undefined : () => onSort(field)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {isDisabled ? (
          <Trophy className="w-3 h-3 text-orange-500" />
        ) : currentSortField === field ? (
          currentSortOrder === 'desc' ? (
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
    const totalPages = getTotalPages(totalItems, itemsPerPage);
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-600">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5 font-bold stroke-2 text-gray-700" />
          </button>
          <span className="text-sm text-gray-600 px-2">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                <div className="overflow-x-auto lg:overflow-visible">
                  <div style={{ minWidth: CHART_DIMENSIONS.minWidth }} className="lg:min-w-0">
                    <ChartContainer config={chartConfig} style={{ height: CHART_DIMENSIONS.height }}>
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
                      dataKey="count"
                    >
                      {analyticsData.serviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                              <p className="font-semibold text-gray-900 mb-1">{data.service}</p>
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Count:</span> {data.count} leads
                              </p>
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Percentage:</span> {data.percentage}%
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
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  Zip Codes (Estimate Set Leads)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto lg:overflow-visible">
                  <div style={{ minWidth: CHART_DIMENSIONS.minWidth }} className="lg:min-w-0">
                    <ChartContainer config={chartConfig} style={{ height: CHART_DIMENSIONS.height }}>
                  <BarChart data={analyticsData.zipData}>
                    <defs>
                      <linearGradient id="zipGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.6}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="zip" />
                    <YAxis />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value, name, props) => [
                        `${value} leads (${props.payload.percentage}%)`
                      ]}
                    />
                    <Bar dataKey="count" fill="url(#zipGradient)" name="Estimate Set Leads" radius={[4, 4, 0, 0]} />
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
                <div className="overflow-x-auto lg:overflow-visible">
                  <div style={{ minWidth: CHART_DIMENSIONS.minWidth }} className="lg:min-w-0">
                    <ChartContainer config={chartConfig} style={{ height: CHART_DIMENSIONS.height }}>
                  <BarChart data={analyticsData.dayOfWeekData}>
                    <defs>
                      <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#cbd5e1" stopOpacity={0.6}/>
                      </linearGradient>
                      <linearGradient id="estimateGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#34d399" stopOpacity={0.6}/>
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
                    <Bar dataKey="total" fill="url(#totalGradient)" name="Total Leads" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="estimateSet" fill="url(#estimateGradient)" name="Estimate Set Leads" radius={[4, 4, 0, 0]} />
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
                  <div className="overflow-x-auto lg:overflow-visible">
                    <div style={{ minWidth: CHART_DIMENSIONS.minWidth }} className="lg:min-w-0">
                      <ChartContainer config={chartConfig} style={{ height: CHART_DIMENSIONS.height }}>
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
                            dataKey="count"
                          >
                            {analyticsData.ulrData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip 
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                    <p className="font-semibold text-gray-900 mb-1">{data.reason}</p>
                                    <p className="text-sm text-gray-700">
                                      <span className="font-medium">Count:</span> {data.count} leads
                                    </p>
                                    <p className="text-sm text-gray-700">
                                      <span className="font-medium">Percentage:</span> {data.percentage}%
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
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Table Time Filter:</span>
              </div>
              <Select value={commonTimeFilter} onValueChange={(value: string) => setCommonTimeFilter(value as 'all' | '7' | '14' | '30' | '60')}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="14">Last 14 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="60">Last 60 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Performance Tables Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Ad Set Performance Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-orange-600" />
                    Top Ad Set Performance
                  </CardTitle>
                  <Button
                    variant={showTopRankedAdSets ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowTopRankedAdSets(!showTopRankedAdSets)}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <Trophy className="h-3.5 w-3.5" />
                    {showTopRankedAdSets ? 'Show Custom Sort' : 'Top Ranked'}
                  </Button>
                </div>
                {showTopRankedAdSets && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Sorted by Appointment % (highest first), then by Estimate Count
                  </p>
                )}
              </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                        <th className="text-left p-2 w-16">S.No.</th>
                        {renderSortableHeader('adSetName', 'Ad Set Name', adSetSortField, adSetSortOrder, (field) => {
                          if (adSetSortField === field) {
                            setAdSetSortOrder(adSetSortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setAdSetSortField(field as any);
                            setAdSetSortOrder('desc');
                          }
                        }, showTopRankedAdSets)}
                        {renderSortableHeader('total', 'Total Leads', adSetSortField, adSetSortOrder, (field) => {
                          if (adSetSortField === field) {
                            setAdSetSortOrder(adSetSortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setAdSetSortField(field as any);
                            setAdSetSortOrder('desc');
                          }
                        }, showTopRankedAdSets)}
                        {renderSortableHeader('estimateSet', 'Estimate Set', adSetSortField, adSetSortOrder, (field) => {
                          if (adSetSortField === field) {
                            setAdSetSortOrder(adSetSortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setAdSetSortField(field as any);
                            setAdSetSortOrder('desc');
                          }
                        }, showTopRankedAdSets)}
                        {renderSortableHeader('percentage', 'Appointment %', adSetSortField, adSetSortOrder, (field) => {
                          if (adSetSortField === field) {
                            setAdSetSortOrder(adSetSortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setAdSetSortField(field as any);
                            setAdSetSortOrder('desc');
                          }
                        }, showTopRankedAdSets)}
                    </tr>
                  </thead>
                  <tbody>
                      {paginatedAdSetData.length > 0 ? (
                        paginatedAdSetData.map((adSet, index) => (
                      <tr key={adSet.adSetName} className="border-b hover:bg-muted/50">
                            <td className="p-2 text-gray-600 font-medium">
                              {((adSetPage - 1) * adSetItemsPerPage) + index + 1}
                            </td>
                        <td className="p-2 font-medium">{adSet.adSetName}</td>
                        <td className="text-right p-2">{adSet.total}</td>
                        <td className="text-right p-2 text-green-600 font-medium">{adSet.estimateSet}</td>
                        <td className="text-right p-2">
                          <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                            {adSet.percentage}%
                          </span>
                        </td>
                      </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-500">
                            <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No data found for selected time filter.</p>
                            <p className="text-xs text-gray-400 mt-1">Try selecting a different time period.</p>
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>
                {renderPagination(adSetPage, sortedAdSetData.length, setAdSetPage, adSetItemsPerPage)}
            </CardContent>
          </Card>

                      {/* Ad Name Performance Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    Top Ad Name Performance
                  </CardTitle>
                  <Button
                    variant={showTopRankedAdNames ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowTopRankedAdNames(!showTopRankedAdNames)}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <Trophy className="h-3.5 w-3.5" />
                    {showTopRankedAdNames ? 'Show Custom Sort' : 'Top Ranked'}
                  </Button>
                </div>
                {showTopRankedAdNames && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Sorted by Appointment % (highest first), then by Estimate Count
                  </p>
                )}
              </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                        <th className="text-left p-2 w-16">S.No.</th>
                        {renderSortableHeader('adName', 'Ad Name', adNameSortField, adNameSortOrder, (field) => {
                          if (adNameSortField === field) {
                            setAdNameSortOrder(adNameSortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setAdNameSortField(field as any);
                            setAdNameSortOrder('desc');
                          }
                        }, showTopRankedAdNames)}
                        {renderSortableHeader('total', 'Total Leads', adNameSortField, adNameSortOrder, (field) => {
                          if (adNameSortField === field) {
                            setAdNameSortOrder(adNameSortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setAdNameSortField(field as any);
                            setAdNameSortOrder('desc');
                          }
                        }, showTopRankedAdNames)}
                        {renderSortableHeader('estimateSet', 'Estimate Set', adNameSortField, adNameSortOrder, (field) => {
                          if (adNameSortField === field) {
                            setAdNameSortOrder(adNameSortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setAdNameSortField(field as any);
                            setAdNameSortOrder('desc');
                          }
                        }, showTopRankedAdNames)}
                        {renderSortableHeader('percentage', 'Appointment %', adNameSortField, adNameSortOrder, (field) => {
                          if (adNameSortField === field) {
                            setAdNameSortOrder(adNameSortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setAdNameSortField(field as any);
                            setAdNameSortOrder('desc');
                          }
                        }, showTopRankedAdNames)}
                    </tr>
                  </thead>
                  <tbody>
                      {paginatedAdNameData.length > 0 ? (
                        paginatedAdNameData.map((ad, index) => (
                          <tr key={`${ad.adName}-${ad.adSetName}`} className="border-b hover:bg-muted/50">
                            <td className="p-2 text-gray-600 font-medium">
                              {((adNamePage - 1) * adNameItemsPerPage) + index + 1}
                            </td>
                            <td className="p-2">
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900">{ad.adName}</span>
                                <span className="text-xs text-gray-500 font-italic">
                                  ({ad.adSetName})
                                </span>
                              </div>
                            </td>
                        <td className="text-right p-2">{ad.total}</td>
                        <td className="text-right p-2 text-green-600 font-medium">{ad.estimateSet}</td>
                        <td className="text-right p-2">
                          <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                            {ad.percentage}%
                          </span>
                        </td>
                      </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-500">
                            <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No data found for selected time filter.</p>
                            <p className="text-xs text-gray-400 mt-1">Try selecting a different time period.</p>
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>
                {renderPagination(adNamePage, sortedAdNameData.length, setAdNamePage, adNameItemsPerPage)}
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