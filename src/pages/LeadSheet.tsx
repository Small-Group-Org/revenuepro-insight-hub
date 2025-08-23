import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Users, Calendar, Phone, Mail, Tag, Target, Star, Download } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { DatePeriodSelector } from '@/components/DatePeriodSelector';
import { PeriodType } from '@/types';
import { getWeekInfo } from '@/utils/weekLogic';
import { useLeadStore } from '@/stores/leadStore';
import { useUserStore } from '@/stores/userStore';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { handleInputDisable } from '@/utils/page-utils/compareUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TopCard } from '@/components/DashboardTopCards';
import { calculateLeadScore, getScoreInfo, getStatusInfo, FIELD_WEIGHTS, getConversionRate, getDateConversionRate } from '@/utils/leadProcessing';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// ULR = Unqualified Lead Reason
export const LeadSheet = () => {
  const { toast } = useToast();
  const { userRole } = useRoleAccess();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfYear(new Date()));
  const [period, setPeriod] = useState<PeriodType>('yearly');
  const [pendingULRLeadId, setPendingULRLeadId] = useState<string | null>(null);
  const [customULR, setCustomULR] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<'date' | 'score'>('date');
  const [dateOrder, setDateOrder] = useState<'asc' | 'desc'>('desc');
  const [scoreOrder, setScoreOrder] = useState<'asc' | 'desc'>('desc');
  
  // Filter states
  const [adsetFilter, setAdsetFilter] = useState<string>('');
  const [adFilter, setAdFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [ulrFilter, setUlrFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  const { leads, conversionRates, loading, error, fetchLeads, fetchConversionRates, updateLeadData, updateLeadLocal } = useLeadStore();
  const { selectedUserId } = useUserStore();

  // Calculate disable logic for LeadSheet page with role-based restrictions
  const disableLogic = useMemo(() => 
    handleInputDisable(period, selectedDate, null, 'leadSheet', userRole), 
    [period, selectedDate, userRole]
  );

  const { isDisabled } = disableLogic;

  // Helper functions to reduce code duplication
  const findLead = useCallback((leadId: string) => leads.find(l => l.id === leadId), [leads]);

  const showErrorToast = useCallback((message: string) => {
    toast({
      title: "❌ Error Updating Lead",
      description: message,
      variant: "destructive",
    });
  }, [toast]);

  const showSuccessToast = useCallback((message: string) => {
    toast({
      title: "✅ Lead Updated",
      description: message,
    });
  }, [toast]);

  const clearULRStates = useCallback(() => {
    setPendingULRLeadId(null);
    setShowCustomInput(null);
    setCustomULR('');
  }, []);

  const handleLeadUpdate = useCallback(async (
    leadId: string, 
    updateData: { status: 'new' | 'in_progress' | 'estimate_set' | 'unqualified'; unqualifiedLeadReason?: string },
    successMessage: string,
    revertOnError = false
  ) => {
    const result = await updateLeadData({ _id: leadId, ...updateData });
    
    if (result.error) {
      showErrorToast(result.message);
      if (revertOnError) {
        updateLeadLocal(leadId, { status: 'estimate_set' });
      }
      return false;
    } else {
      showSuccessToast(successMessage);
      return true;
    }
  }, [updateLeadData, updateLeadLocal, showErrorToast, showSuccessToast]);

  // Unqualified Lead Reason options
  const ULR_OPTIONS = [
    'Bad Phone Number',
    'Out of Area',
    'Job Too Small',
    'Said Didn\'t Fill Out Form',
    'No Longer Interested',
    'Service we don\'t offer',
    'Never responded',
    'In contact, estimate not yet set',
  ];

  // Helper function to get date range based on selected date and period
  const getDateRange = useCallback((date: Date, periodType: PeriodType) => {
    let startDate: string, endDate: string;

    if (periodType === 'weekly') {
      const weekInfo = getWeekInfo(date);
      startDate = format(weekInfo.weekStart, 'yyyy-MM-dd');
      endDate = format(weekInfo.weekEnd, 'yyyy-MM-dd');
    } else if (periodType === 'monthly') {
      startDate = format(startOfMonth(date), 'yyyy-MM-dd');
      endDate = format(endOfMonth(date), 'yyyy-MM-dd');
    } else {
      startDate = format(startOfYear(date), 'yyyy-MM-dd');
      endDate = format(endOfYear(date), 'yyyy-MM-dd');
    }

    return { startDate, endDate };
  }, []);

  // Fetch leads and conversion rates when selectedUserId, selectedDate, or period changes
  useEffect(() => {
    if (selectedUserId) {
      const { startDate, endDate } = getDateRange(selectedDate, period);
      fetchLeads(selectedUserId, startDate, endDate);
      fetchConversionRates(selectedUserId);
    }
  }, [selectedUserId, selectedDate, period, fetchLeads, fetchConversionRates, getDateRange]);

  useEffect(() => {
    if (error) {
      toast({
        title: "❌ Error Loading Leads",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleDatePeriodChange = useCallback((date: Date, periodType: PeriodType) => {
    setSelectedDate(date);
    setPeriod(periodType);
    // Leads will be fetched automatically via useEffect
  }, []);

  const handleLeadStatusChange = useCallback(async (leadId: string, value: 'new' | 'in_progress' | 'estimate_set' | 'unqualified') => {
    const lead = findLead(leadId);
    if (!lead) return;

    if (value === 'unqualified') {
      // Set status to unqualified and show ULR dropdown
      updateLeadLocal(leadId, { status: 'unqualified' });
      setPendingULRLeadId(leadId);
      
      toast({
        title: "ℹ️ Select Unqualified Reason",
        description: "Please select a reason from the dropdown to complete this action.",
      });
    } else {
      // Update the lead with the selected status and clear unqualified reason
      const success = await handleLeadUpdate(
        leadId,
        { status: value, unqualifiedLeadReason: '' },
        `Lead status has been updated to "${getStatusInfo(value).label}".`
      );
      
      if (success) {
        // Only update local state after successful API response
        updateLeadLocal(leadId, { status: value, unqualifiedLeadReason: '' });
        clearULRStates();
      }
    }
  }, [findLead, handleLeadUpdate, updateLeadLocal, toast, clearULRStates]);

  const handleULRChange = useCallback(async (leadId: string, value: string) => {
    const lead = findLead(leadId);
    if (!lead) return;

    if (value === 'custom') {
      // Show custom input for this lead with current value pre-filled only if it's a custom reason
      setShowCustomInput(leadId);
      const currentReason = lead.unqualifiedLeadReason || '';
      const isCustomReason = currentReason && !ULR_OPTIONS.includes(currentReason);
      setCustomULR(isCustomReason ? currentReason : '');
      return;
    }

    // Update the lead with the selected ULR
    const success = await handleLeadUpdate(
      leadId,
      { status: 'unqualified', unqualifiedLeadReason: value },
      "Unqualified lead reason has been set.",
      true // revert on error
    );
    
    if (success) {
      // Only update local state after successful API response
      updateLeadLocal(leadId, { status: 'unqualified', unqualifiedLeadReason: value });
      clearULRStates();
    }
  }, [findLead, handleLeadUpdate, updateLeadLocal, clearULRStates, ULR_OPTIONS]);

  const handleCustomULRSubmit = useCallback(async (leadId: string) => {
    if (!customULR.trim()) {
      showErrorToast("Please enter a custom reason.");
      return;
    }

    const lead = findLead(leadId);
    if (!lead) return;

    // Update the lead with the custom ULR
    const success = await handleLeadUpdate(
      leadId,
      { status: 'unqualified', unqualifiedLeadReason: customULR.trim() },
      "Custom unqualified lead reason has been set.",
      true // revert on error
    );
    
    if (success) {
      // Only update local state after successful API response
      updateLeadLocal(leadId, { status: 'unqualified', unqualifiedLeadReason: customULR.trim() });
      clearULRStates();
    }
  }, [customULR, findLead, handleLeadUpdate, updateLeadLocal, showErrorToast, clearULRStates]);

  const formatDate = useCallback((dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  }, []);

  // Pre-process leads with scores and tooltip data when leads or conversion rates change
  const processedLeads = useMemo(() => {
    return leads.map(lead => {
      const score = calculateLeadScore(lead, conversionRates);
      
      // Pre-calculate tooltip data to avoid recalculations on hover
      const serviceRate = getConversionRate(conversionRates, 'service', lead.service);
      const adSetRate = getConversionRate(conversionRates, 'adSet', lead.adSetName);
      const adNameRate = getConversionRate(conversionRates, 'adName', lead.adName);
      const dateRate = getDateConversionRate(conversionRates, lead.leadDate);
      
      const tooltipData = {
        serviceRate: serviceRate.toFixed(1),
        adSetRate: adSetRate.toFixed(1),
        adNameRate: adNameRate.toFixed(1),
        dateRate: dateRate.toFixed(1)
      };
      
      return {
        ...lead,
        score,
        tooltipData
      };
    });
  }, [leads, conversionRates]);



  // Pre-compute unique values for filter options
  const uniqueAdsets = useMemo(() => {
    const adsets = [...new Set(processedLeads.map(lead => lead.adSetName))].sort();
    return adsets;
  }, [processedLeads]);

  const uniqueAds = useMemo(() => {
    const ads = [...new Set(processedLeads.map(lead => lead.adName))].sort();
    return ads;
  }, [processedLeads]);

  const uniqueULRs = useMemo(() => {
    const ulrs = [...new Set(processedLeads
      .filter(lead => lead.status === 'unqualified' && lead.unqualifiedLeadReason)
      .map(lead => lead.unqualifiedLeadReason!)
    )].sort();
    return ulrs;
  }, [processedLeads]);

  // Filter leads based on selected filters (using pre-processed data)
  const filteredLeads = useMemo(() => {
    return processedLeads.filter(lead => {
      // Adset filter
      if (adsetFilter && !lead.adSetName.toLowerCase().includes(adsetFilter.toLowerCase())) {
        return false;
      }
      
      // Ad filter
      if (adFilter && !lead.adName.toLowerCase().includes(adFilter.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (statusFilter && lead.status !== statusFilter) {
        return false;
      }
      
      // Unqualified reason filter
      if (ulrFilter) {
        if (lead.status !== 'unqualified') {
          return false;
        }
        if (!lead.unqualifiedLeadReason || !lead.unqualifiedLeadReason.toLowerCase().includes(ulrFilter.toLowerCase())) {
          return false;
        }
      }
      
      return true;
    });
  }, [processedLeads, adsetFilter, adFilter, statusFilter, ulrFilter]);

  // Apply sorting to filtered leads (scores already pre-calculated)
  const sortedLeads = useMemo(() => {
    const compareScoreDesc = (a: { score: number }, b: { score: number }) => b.score - a.score;
    const compareScorePrimary = (a: { score: number }, b: { score: number }) =>
      scoreOrder === 'desc' ? b.score - a.score : a.score - b.score;

    const compareDateDesc = (a: { leadDate: string }, b: { leadDate: string }) => {
      const aDate = new Date(a.leadDate).getTime();
      const bDate = new Date(b.leadDate).getTime();
      return bDate - aDate; // Newest first
    };

    const compareDatePrimary = (a: { leadDate: string }, b: { leadDate: string }) => {
      const aDate = new Date(a.leadDate).getTime();
      const bDate = new Date(b.leadDate).getTime();
      return dateOrder === 'desc' ? bDate - aDate : aDate - bDate;
    };

    return filteredLeads.sort((a, b) => {
      if (sortMode === 'date') {
        const byDate = compareDatePrimary(a, b);
        if (byDate !== 0) return byDate;
        return compareScoreDesc(a, b);
      } else {
        const byScore = compareScorePrimary(a, b);
        if (byScore !== 0) return byScore;
        return compareDateDesc(a, b);
      }
    });
  }, [filteredLeads, sortMode, dateOrder, scoreOrder]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setAdsetFilter('');
    setAdFilter('');
    setStatusFilter('');
    setUlrFilter('');
    setShowFilters(false);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return adsetFilter || adFilter || statusFilter || ulrFilter;
  }, [adsetFilter, adFilter, statusFilter, ulrFilter]);



  // Excel Export Function
  const exportToExcel = useCallback(() => {
    try {
      // Prepare data for export
      const exportData = sortedLeads.map(lead => ({
        'Lead Name': lead.name,
        'Email': lead.email,
        'Phone': lead.phone,
        'Service': lead.service,
        'ZIP Code': lead.zip,
        'Lead Date': formatDate(lead.leadDate),
        'Ad Set Name': lead.adSetName,
        'Ad Name': lead.adName,
        'Lead Status': getStatusInfo(lead.status).label,
        'Lead Score': lead.score,
        'Unqualified Reason': lead.status === 'unqualified' ? (lead.unqualifiedLeadReason || 'Not specified') : '',
      }));

      // Create CSV content
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `leads_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "✅ Export Successful",
        description: `Exported ${exportData.length} leads to Excel file.`,
      });
    } catch (error) {
      toast({
        title: "❌ Export Failed",
        description: "Failed to export leads. Please try again.",
        variant: "destructive",
      });
    }
  }, [sortedLeads, formatDate, getStatusInfo, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <div className="relative z-10 pt-6 pb-16 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/60 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="leading-[130%] text-3xl font-bold text-gradient-primary">
                Lead Sheet
              </h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base mb-6 mt-2">
              Track and manage your leads with detailed information and lead status
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="max-w-7xl mx-auto mb-8">
          <DatePeriodSelector
            initialDate={selectedDate}
            initialPeriod={period}
            onChange={handleDatePeriodChange}
            allowedPeriods={['weekly', 'monthly', 'yearly']}
            disableLogic={disableLogic}
          />



        {/* Lead Cards */}
        <div className="max-w-7xl mx-auto space-y-6">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
              <p className="text-lg">Loading leads...</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                <TopCard
                  title="New Leads"
                  icon={<Users className="h-5 w-5 opacity-50 text-blue-500" />}
                  metrics={[
                    {
                      label: "New Leads",
                      value: processedLeads.filter(lead => lead.status === 'new').length,
                      format: 'number'
                    }
                  ]}
                  description="Leads that are newly received and not yet processed."
                  twoRowDesign={true}
                />
                <TopCard
                  title="In Progress Leads"
                  icon={<Users className="h-5 w-5 opacity-50 text-yellow-500" />}
                  metrics={[
                    {
                      label: "In Progress Leads",
                      value: processedLeads.filter(lead => lead.status === 'in_progress').length,
                      format: 'number'
                    }
                  ]}
                  description="Leads currently being worked on by the team."
                  twoRowDesign={true}
                />
                <TopCard
                  title="Estimate Set Leads"
                  icon={<Users className="h-5 w-5 opacity-50 text-green-500" />}
                  metrics={[
                    {
                      label: "Estimate Set Leads",
                      value: processedLeads.filter(lead => lead.status === 'estimate_set').length,
                      format: 'number'
                    }
                  ]}
                  description="Leads where estimates have been provided to customers."
                  twoRowDesign={true}
                />
                <TopCard
                  title="Unqualified Leads"
                  icon={<Users className="h-5 w-5 opacity-50 text-red-500" />}
                  metrics={[
                    {
                      label: "Unqualified Leads",
                      value: processedLeads.filter(lead => lead.status === 'unqualified').length,
                      format: 'number'
                    }
                  ]}
                  description="Leads that don't meet qualification criteria."
                  twoRowDesign={true}
                />
              </div>

              {/* Filters and Sorting Controls */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-lg p-4">
                {/* Filters Section - Appears Above When Toggled */}
                {showFilters && (
                  <div className="mb-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Adset Name Filter */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">Ad Set Name</label>
                        <Select value={adsetFilter || 'all'} onValueChange={(v) => setAdsetFilter(v === 'all' ? '' : v)}>
                          <SelectTrigger className="h-8 bg-gray-50 border-0 hover:bg-gray-100 focus:bg-white focus:border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all rounded-lg text-xs">
                            <SelectValue placeholder="All Ad Sets" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Ad Sets</SelectItem>
                            {uniqueAdsets.map(adset => (
                              <SelectItem key={adset} value={adset}>
                                {adset}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Ad Name Filter */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">Ad Name</label>
                        <Select value={adFilter || 'all'} onValueChange={(v) => setAdFilter(v === 'all' ? '' : v)}>
                          <SelectTrigger className="h-8 bg-gray-50 border-0 hover:bg-gray-100 focus:bg-white focus:border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all rounded-lg text-xs">
                            <SelectValue placeholder="All Ads" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Ads</SelectItem>
                            {uniqueAds.map(ad => (
                              <SelectItem key={ad} value={ad}>
                                {ad}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Lead Status Filter */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">Lead Status</label>
                        <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
                          <SelectTrigger className="h-8 bg-gray-50 border-0 hover:bg-gray-100 focus:bg-white focus:border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all rounded-lg text-xs">
                            <SelectValue placeholder="All Statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="estimate_set">Estimate Set</SelectItem>
                            <SelectItem value="unqualified">Unqualified</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Unqualified Reason Filter */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">Unqualified Reason</label>
                        <Select value={ulrFilter || 'all'} onValueChange={(v) => setUlrFilter(v === 'all' ? '' : v)}>
                          <SelectTrigger className="h-8 bg-gray-50 border-0 hover:bg-gray-100 focus:bg-white focus:border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all rounded-lg text-xs">
                            <SelectValue placeholder="All Reasons" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Reasons</SelectItem>
                            {uniqueULRs.map(ulr => (
                              <SelectItem key={ulr} value={ulr}>
                                {ulr}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Active Filters Summary */}
                    {hasActiveFilters && (
                      <div className="mt-3 pt-2 border-t border-gray-100">
                        <div className="flex flex-wrap gap-1.5">
                          {adsetFilter && (
                            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              Ad Set: {adsetFilter}
                            </Badge>
                          )}
                          {adFilter && (
                            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              Ad: {adFilter}
                            </Badge>
                          )}
                          {statusFilter && (
                            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              Status: {getStatusInfo(statusFilter as 'new' | 'in_progress' | 'estimate_set' | 'unqualified').label}
                            </Badge>
                          )}
                          {ulrFilter && (
                            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              ULR: {ulrFilter}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <p className="text-xs text-gray-600">
                            Showing {sortedLeads.length} of {processedLeads.length} leads
                          </p>
                          <span className="text-gray-400">•</span>
                          <button
                            onClick={clearFilters}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Main Controls Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Filter Button */}
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all text-xs font-medium shadow-sm ${
                        showFilters 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      Filters
                      {hasActiveFilters && (
                        <span className="ml-1 bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full text-xs font-medium">
                          {Object.values({adsetFilter, adFilter, statusFilter, ulrFilter}).filter(Boolean).length}
                        </span>
                      )}
                    </button>

                    {/* Sort Controls */}
                    <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                      <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                      Sort by
                    </span>
                    <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
                      <button
                        onClick={() => setSortMode('date')}
                        className={`px-3 py-1.5 text-xs font-medium transition-all ${
                          sortMode === 'date' 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        } border-r border-gray-200`}
                      >
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> 
                          Date
                        </span>
                      </button>
                      <button 
                        onClick={() => setSortMode('score')}
                        className={`px-3 py-1.5 text-xs font-medium transition-all ${
                          sortMode === 'score' 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1">
                          <Star className="w-3 h-3" /> 
                          Lead Score
                        </span>
                      </button>
                    </div>
                    {sortMode === 'date' ? (
                      <button
                        onClick={() => setDateOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-xs font-medium text-gray-700 shadow-sm"
                      >
                        <Calendar className="w-3 h-3 text-gray-500" />
                        <span>{dateOrder === 'desc' ? 'Newest → Oldest' : 'Oldest → Newest'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setScoreOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-xs font-medium text-gray-700 shadow-sm"
                      >
                        <Star className="w-3 h-3 text-gray-500" />
                        <span>{scoreOrder === 'desc' ? 'High → Low' : 'Low → High'}</span>
                      </button>
                    )}
                  </div>
                  
                  {/* Export Button */}
                  <button
                    onClick={exportToExcel}
                    disabled={sortedLeads.length === 0}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-xs font-medium shadow-sm"
                  >
                    <Download className="w-3 h-3" />
                    Export ({sortedLeads.length})
                  </button>
                </div>
              </div>

              {/* No Results Message */}
              {sortedLeads.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg mb-2">
                    {hasActiveFilters 
                      ? `No leads found matching your filters.` 
                      : `No leads found for the selected period.`
                    }
                  </p>
                  {hasActiveFilters && (
                    <p className="text-sm text-gray-500">
                      Try adjusting your filters or click "Clear All" to see all leads.
                    </p>
                  )}
            </div>
              )}

              {/* Lead Tiles */}
              {sortedLeads.length > 0 && (
                <div className="space-y-4">
                  {sortedLeads.map((lead) => {
              const scoreInfo = getScoreInfo(lead.score);
                  const statusInfo = getStatusInfo(lead.status);
                  
                  // Determine hover styling based on status
                  const getHoverStyling = () => {
                    switch (lead.status) {
                      case 'estimate_set':
                        return 'hover:border-green-300 hover:shadow-xl hover:shadow-green-200/50';
                      case 'unqualified':
                        return 'hover:border-red-300 hover:shadow-xl hover:shadow-red-200/50';
                      case 'in_progress':
                        return 'hover:border-yellow-300 hover:shadow-xl hover:shadow-yellow-200/50';
                      case 'new':
                        return 'hover:border-blue-300 hover:shadow-xl hover:shadow-blue-200/50';
                      default:
                        return 'hover:border-gray-300 hover:shadow-xl hover:shadow-gray-200/50';
                    }
                  };

              return (
                      <div 
                  key={lead.id} 
                        className={`rounded-lg border-2 border-gray-200 p-6 transition-all duration-200 bg-white shadow-sm ${getHoverStyling()} ${isDisabled ? 'opacity-60' : ''}`}
                      >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Lead Score */}
                        <div className="col-span-1 flex items-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="relative cursor-wait hover:cursor-help group">
                                  <div className="w-14 h-14 relative">
                                    {/* Loading overlay - appears on hover before tooltip */}
                                    <div className="absolute inset-0 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                    {/* Background circle */}
                                    <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 36 36">
                                      <path
                                        d="M18 2.0845
                                          a 15.9155 15.9155 0 0 1 0 31.831
                                          a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="#e5e7eb"
                                        strokeWidth="3"
                                      />
                                      <path
                                        d="M18 2.0845
                                          a 15.9155 15.9155 0 0 1 0 31.831
                                          a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke={scoreInfo.color.includes('green') ? '#10b981' : 
                                               scoreInfo.color.includes('yellow') ? '#f59e0b' : 
                                               scoreInfo.color.includes('red') ? '#ef4444' : '#6366f1'}
                                        strokeWidth="3"
                                        strokeDasharray={`${lead.score}, 100`}
                                        strokeLinecap="round"
                                      />
                                    </svg>
                                    {/* Score text */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="text-xs font-bold text-gray-900">
                                        {lead.score}%
                                      </span>
                                    </div>

                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs p-4 bg-white border border-gray-200 shadow-lg rounded-lg">
                                <div className="space-y-4">
                                  {/* Header with score */}
                                  <div className="bg-blue-50 px-3 py-2 rounded-lg">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-semibold text-blue-800">Lead Score:</span>
                                      <span className="text-xl font-bold text-blue-600">{lead.score}%</span>
                                    </div>
                                    <p className="text-xs text-blue-700">
                                      Calculated as weighted average of conversion rates
                                    </p>
                                  </div>

                                  {/* Conversion rates */}
                                  <div className="space-y-2 bg-gray-50 px-3 py-2 rounded-lg">
                                    <div className="text-xs font-semibold text-gray-700 mb-1">Conversion Rates:</div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-gray-600">Service ({lead.service}):</span>
                                      <span className="font-semibold text-gray-800">{lead.tooltipData.serviceRate}%</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-gray-600">Ad Set ({lead.adSetName}):</span>
                                      <span className="font-semibold text-gray-800">{lead.tooltipData.adSetRate}%</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-gray-600">Ad Name ({lead.adName}):</span>
                                      <span className="font-semibold text-gray-800">{lead.tooltipData.adNameRate}%</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-gray-600">Date ({formatDate(lead.leadDate)}):</span>
                                      <span className="font-semibold text-gray-800">{lead.tooltipData.dateRate}%</span>
                                    </div>
                                  </div>

                                  {/* Weights at bottom */}
                                  <div className="bg-gray-100 px-3 py-2 rounded-lg">
                                  <div className="text-xs font-semibold text-gray-700 mb-1">Weights:</div>
                                    <p className="text-xs text-gray-500">
                                      (Service - {FIELD_WEIGHTS.service}% • Ad Set - {FIELD_WEIGHTS.adSet}% • Ad Name - {FIELD_WEIGHTS.adName}% • Date - {FIELD_WEIGHTS.date}%)
                                    </p>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        {/* Name */}
                        <div className="col-span-2 flex items-center">
                            <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 text-sm truncate">
                                {lead.name}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Contact Details */}
                        <div className="col-span-2 flex items-center">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <a 
                                href={`mailto:${lead.email}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline truncate"
                                title={lead.email}
                              >
                                {lead.email}
                              </a>
                        </div>
                            <div className="flex items-center gap-1 text-xs">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <a 
                                href={`tel:${lead.phone}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {lead.phone}
                              </a>
                            </div>
                          </div>
                            </div>

                        {/* Date */}
                        <div className="col-span-2 flex items-center">
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>{formatDate(lead.leadDate)}</span>
                        </div>
                        </div>

                        {/* Service & Ads */}
                        <div className="col-span-3 flex items-center">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs">
                              <Tag className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-600 truncate font-medium" title={lead.service}>
                                {lead.service}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <Target className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-600 truncate" title={lead.adSetName}>
                                {lead.adSetName}
                              </span>
                        </div>
                            <div className="flex items-center gap-1 text-xs">
                              <Target className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-600 truncate" title={lead.adName}>
                                {lead.adName}
                              </span>
                        </div>
                        </div>
                        </div>

                        {/* Lead Status */}
                        <div className="col-span-2 flex items-center">
                          <div className="w-full">
                              <Select
                                value={lead.status}
                                onValueChange={(value) => !isDisabled ? handleLeadStatusChange(lead.id, value as 'new' | 'in_progress' | 'estimate_set' | 'unqualified') : undefined}
                            disabled={isDisabled}
                              >
                                <SelectTrigger 
                                  className={`w-full h-8 text-xs border-2 ${
                                    pendingULRLeadId === lead.id 
                                      ? 'ring-2 ring-warning/40 bg-warning/10 border-warning-300 shadow-lg' 
                                      : 'border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50'
                                  } transition-all duration-200`}
                                >
                                  <SelectValue>
                                    <span className={`px-2 py-1 rounded text-xs border ${statusInfo.color}`}>
                                      {statusInfo.label}
                                    </span>
                                  </SelectValue>
                                </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new" className="text-sm">
                                  <span className="inline-flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    New
                                  </span>
                                </SelectItem>
                                <SelectItem value="in_progress" className="text-sm">
                                  <span className="inline-flex items-center gap-2">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                    In Progress
                                  </span>
                                </SelectItem>
                                <SelectItem value="estimate_set" className="text-sm">
                                  <span className="inline-flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    Estimate Set
                                  </span>
                                </SelectItem>
                                <SelectItem value="unqualified" className="text-sm">
                                  <span className="inline-flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    Unqualified
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>

                            {/* Unqualified Reason Dropdown - Only show when status is unqualified */}
                            {lead.status === 'unqualified' && (
                              <div className="mt-3">
                                {showCustomInput === lead.id ? (
                                  <div className="space-y-1 mt-2">
                              <input
                                type="text"
                                value={customULR}
                                onChange={(e) => setCustomULR(e.target.value)}
                                      placeholder="Enter reason..."
                                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                onKeyPress={(e) => e.key === 'Enter' && handleCustomULRSubmit(lead.id)}
                                disabled={isDisabled}
                              />
                                    <div className="flex gap-1">
                                  <button
                                    onClick={() => handleCustomULRSubmit(lead.id)}
                                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isDisabled}
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setShowCustomInput(null);
                                      setCustomULR('');
                                    }}
                                        className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                                  >
                                    Cancel
                                  </button>
                                </div>
                            </div>
                          ) : (
                            <Select
                              value={lead.unqualifiedLeadReason || ''}
                              onValueChange={(value) => !isDisabled ? handleULRChange(lead.id, value) : undefined}
                              disabled={isDisabled}
                            >
                              <SelectTrigger 
                                      className={`w-full h-8 text-xs border-2 ${
                                  pendingULRLeadId === lead.id 
                                    ? 'ring-2 ring-warning/40 bg-warning/10 border-warning-300 shadow-lg' 
                                          : 'border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50'
                                      } transition-all duration-200`}
                              >
                                      <SelectValue placeholder={pendingULRLeadId === lead.id ? "Select reason!" : "Reason..."}>
                                  {lead.unqualifiedLeadReason && !ULR_OPTIONS.includes(lead.unqualifiedLeadReason) ? (
                                          <span className="text-blue-600 font-medium text-xs">"{lead.unqualifiedLeadReason}"</span>
                                  ) : (
                                          <span className="text-xs">{lead.unqualifiedLeadReason}</span>
                                  )}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {ULR_OPTIONS.map((option) => (
                                  <SelectItem key={option} value={option} className="text-sm">
                                    {option}
                                  </SelectItem>
                                ))}
                                <SelectItem value="custom" className="text-sm font-medium text-blue-600">
                                  + Add Custom Reason
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                              </div>
                            )}
                          </div>
              </div>
                </div>
                </div>
              );
                })}
              </div>
              )}
            </>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}; 