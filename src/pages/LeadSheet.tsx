import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Users, Lock, Calendar, MapPin, Phone, Mail, Tag, Target, Star, Download } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { DatePeriodSelector } from '@/components/DatePeriodSelector';
import { PeriodType } from '@/types';
import { getWeekInfo } from '@/utils/weekLogic';
import { useLeadStore } from '@/stores/leadStore';
import { useUserStore } from '@/stores/userStore';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { handleInputDisable } from '@/utils/page-utils/compareUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// ULR = Unqualified Lead Reason
export const LeadSheet = () => {
  const { toast } = useToast();
  const { userRole } = useRoleAccess();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfYear(new Date()));
  const [period, setPeriod] = useState<PeriodType>('yearly');
  const [pendingULRLeadId, setPendingULRLeadId] = useState<string | null>(null);
  const [customULR, setCustomULR] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<string | null>(null);
  const [leadScores, setLeadScores] = useState<Record<string, number>>({});
  const [sortMode, setSortMode] = useState<'date' | 'score'>('date');
  const [dateOrder, setDateOrder] = useState<'asc' | 'desc'>('desc');
  const [scoreOrder, setScoreOrder] = useState<'asc' | 'desc'>('desc');
  
  // Filter states
  const [adsetFilter, setAdsetFilter] = useState<string>('');
  const [adFilter, setAdFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [ulrFilter, setUlrFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const { leads, loading, error, fetchLeads, updateLeadData, updateLeadLocal } = useLeadStore();
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

  // Fetch leads when selectedUserId, selectedDate, or period changes
  useEffect(() => {
    if (selectedUserId) {
      const { startDate, endDate } = getDateRange(selectedDate, period);
      fetchLeads(selectedUserId, startDate, endDate);
    }
  }, [selectedUserId, selectedDate, period, fetchLeads, getDateRange]);

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

  // Generate random lead score (temporary - will be replaced with API call)
  const generateLeadScore = useCallback((lead: { status: string; service: string; zip: string }) => {
    // Simple algorithm based on lead properties
    let score = 50; // Base score
    
    // Lead status affects score
    if (lead.status === 'estimate_set') score += 30;
    else if (lead.status === 'in_progress') score += 20;
    else if (lead.status === 'new') score += 10;
    else if (lead.status === 'unqualified') score -= 20;
    
    // Service type affects score
    if (lead.service === 'Roofing') score += 15;
    else if (lead.service === 'Siding') score += 10;
    else if (lead.service === 'Windows') score += 8;
    
    // Zip code analysis (simplified)
    if (lead.zip && lead.zip.length === 5) score += 5;
    
    // Random variation to simulate real scoring
    score += Math.floor(Math.random() * 20) - 10;
    
    return Math.max(0, Math.min(100, score));
  }, []);

  // Initialize and cache scores per lead id; stays stable until page refresh, jugaad for now
  useEffect(() => {
    setLeadScores((prev) => {
      let changed = false;
      const next: Record<string, number> = { ...prev };
      for (const lead of leads) {
        if (next[lead.id] === undefined) {
          next[lead.id] = generateLeadScore(lead);
          changed = true;
        }
      }
      // Optional cleanup of scores for leads no longer present
      for (const id of Object.keys(next)) {
        if (!leads.find((l) => l.id === id)) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [leads, generateLeadScore]);

  // Get unique values for filter options
  const uniqueAdsets = useMemo(() => {
    const adsets = [...new Set(leads.map(lead => lead.adSetName))].sort();
    return adsets;
  }, [leads]);

  const uniqueAds = useMemo(() => {
    const ads = [...new Set(leads.map(lead => lead.adName))].sort();
    return ads;
  }, [leads]);

  const uniqueULRs = useMemo(() => {
    const ulrs = [...new Set(leads
      .filter(lead => lead.status === 'unqualified' && lead.unqualifiedLeadReason)
      .map(lead => lead.unqualifiedLeadReason!)
    )].sort();
    return ulrs;
  }, [leads]);

  // Filter leads based on selected filters
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
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
  }, [leads, adsetFilter, adFilter, statusFilter, ulrFilter]);

  // Apply sorting to filtered leads
  const sortedLeads = useMemo(() => {
    const leadsWithScores = filteredLeads.map(lead => ({
      ...lead,
      score: leadScores[lead.id] ?? 0,
    }));

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

    return leadsWithScores.sort((a, b) => {
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
  }, [filteredLeads, leadScores, sortMode, dateOrder, scoreOrder]);

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

  // Get score color and label
  const getScoreInfo = useCallback((score: number) => {
    if (score >= 80) return { color: 'bg-gradient-to-r from-green-500 to-emerald-600', textColor: 'text-white', label: 'Excellent' };
    if (score >= 60) return { color: 'bg-gradient-to-r from-yellow-500 to-orange-500', textColor: 'text-white', label: 'Good' };
    if (score >= 40) return { color: 'bg-gradient-to-r from-orange-500 to-red-500', textColor: 'text-white', label: 'Fair' };
    return { color: 'bg-gradient-to-r from-red-500 to-pink-600', textColor: 'text-white', label: 'Poor' };
  }, []);

  // Get status color and label
  const getStatusInfo = useCallback((status: string) => {
    switch (status) {
      case 'new':
        return { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'New' };
      case 'in_progress':
        return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'In Progress' };
      case 'estimate_set':
        return { color: 'bg-green-100 text-green-800 border-green-200', label: 'Estimate Set' };
      case 'unqualified':
        return { color: 'bg-red-100 text-red-800 border-red-200', label: 'Unqualified' };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Unknown' };
    }
  }, []);

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
        'Lead Score': leadScores[lead.id] ?? 0,
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
  }, [sortedLeads, leadScores, formatDate, getStatusInfo, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
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

          {/* Filters Section */}
          {showFilters && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Adset Name Filter */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Ad Set Name</label>
                  <Select value={adsetFilter || 'all'} onValueChange={(v) => setAdsetFilter(v === 'all' ? '' : v)}>
                    <SelectTrigger className="h-9 bg-gray-50 border-0 hover:bg-gray-100 focus:bg-white focus:border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all rounded-lg">
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
                  <label className="text-sm font-medium text-gray-700">Ad Name</label>
                  <Select value={adFilter || 'all'} onValueChange={(v) => setAdFilter(v === 'all' ? '' : v)}>
                    <SelectTrigger className="h-9 bg-gray-50 border-0 hover:bg-gray-100 focus:bg-white focus:border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all rounded-lg">
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
                  <label className="text-sm font-medium text-gray-700">Lead Status</label>
                  <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
                    <SelectTrigger className="h-9 bg-gray-50 border-0 hover:bg-gray-100 focus:bg-white focus:border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all rounded-lg">
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
                  <label className="text-sm font-medium text-gray-700">Unqualified Reason</label>
                  <Select value={ulrFilter || 'all'} onValueChange={(v) => setUlrFilter(v === 'all' ? '' : v)}>
                    <SelectTrigger className="h-9 bg-gray-50 border-0 hover:bg-gray-100 focus:bg-white focus:border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all rounded-lg">
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
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2">
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
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-sm text-gray-600">
                      Showing {sortedLeads.length} of {leads.length} leads
                    </p>
                    <span className="text-gray-400">•</span>
                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sort Controls */}
          <div className="mt-4 mb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium text-gray-700 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters {hasActiveFilters && `(${Object.values({adsetFilter, adFilter, statusFilter, ulrFilter}).filter(Boolean).length})`}
                </button>
                
                <span className="text-sm font-medium text-gray-700">Sort by</span>
                <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
                  <button
                    onClick={() => setSortMode('date')}
                    className={`px-4 py-2 text-sm font-medium transition-all ${
                      sortMode === 'date' 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    } border-r border-gray-200`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> 
                      Date
                    </span>
                  </button>
                  <button
                    onClick={() => setSortMode('score')}
                    className={`px-4 py-2 text-sm font-medium transition-all ${
                      sortMode === 'score' 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Star className="w-4 h-4" /> 
                      Lead Score
                    </span>
                  </button>
                </div>
                {sortMode === 'date' ? (
                  <button
                    onClick={() => setDateOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium text-gray-700 shadow-sm"
                  >
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>{dateOrder === 'desc' ? 'Newest → Oldest' : 'Oldest → Newest'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setScoreOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium text-gray-700 shadow-sm"
                  >
                    <Star className="w-4 h-4 text-gray-500" />
                    <span>{scoreOrder === 'desc' ? 'High → Low' : 'Low → High'}</span>
                  </button>
                )}
              </div>
              
              {/* Export Button */}
              <button
                onClick={exportToExcel}
                disabled={sortedLeads.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-sm font-medium shadow-sm"
              >
                <Download className="w-4 h-4" />
                Export ({sortedLeads.length})
              </button>
            </div>
          </div>

        {/* Lead Cards */}
        <div className="max-w-7xl mx-auto space-y-3">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
              <p className="text-lg">Loading leads...</p>
            </div>
          ) : sortedLeads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg">No leads found for the selected period.</p>
            </div>
          ) : (
            sortedLeads.map((lead) => {
              const scoreInfo = getScoreInfo(lead.score);
              const statusInfo = getStatusInfo(lead.status);
              return (
                <Card 
                  key={lead.id} 
                  className={`w-full transition-all duration-300 hover:shadow-xl border-2 ${
                    lead.status === 'estimate_set'
                      ? 'border-green-200 bg-gradient-to-r from-green-50/50 to-emerald-50/50' 
                      : lead.status === 'unqualified'
                      ? 'border-red-200 bg-gradient-to-r from-red-50/50 to-pink-50/50'
                      : 'border-border hover:border-primary/30'
                  } ${isDisabled ? 'opacity-60' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-start">
                      {/* Left Section - Lead Score (Main Focus) */}
                      <div className="flex-shrink-0">
                        <div className={`${scoreInfo.color} rounded-xl p-4 text-center shadow-lg min-w-[120px]`}>
                          <div className="text-2xl font-bold ${scoreInfo.textColor} mb-1">
                            {lead.score}
                          </div>
                          <div className={`text-xs font-medium ${scoreInfo.textColor} opacity-90`}>
                            {scoreInfo.label}
                          </div>
                          <div className="mt-1">
                            <Star className={`w-4 h-4 mx-auto ${scoreInfo.textColor} opacity-80`} />
                          </div>
                        </div>
                      </div>

                      {/* Center Section - Lead Details */}
                      <div className="flex-1 min-w-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {/* Name and Service */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold text-base text-card-foreground truncate">
                                {lead.name}
                              </span>
                            </div>
                            <Badge variant="secondary" className="w-fit text-xs">
                              <Tag className="w-3 h-3 mr-1" />
                              {lead.service}
                            </Badge>
                          </div>

                          {/* Contact Info */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <a 
                                href={`mailto:${lead.email}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline truncate"
                              >
                                {lead.email}
                              </a>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <a 
                                href={`tel:${lead.phone}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {lead.phone}
                              </a>
                            </div>
                          </div>

                          {/* Location and Date */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">ZIP: {lead.zip}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{formatDate(lead.leadDate)}</span>
                            </div>
                          </div>

                          {/* Ad Information */}
                          <div className="space-y-1 md:col-span-2 lg:col-span-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Target className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                <span className="font-medium">Ad Set:</span> {lead.adSetName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Target className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                <span className="font-medium">Ad:</span> {lead.adName}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Section - Actions */}
                      <div className="flex-shrink-0 space-y-3 min-w-[180px]">
                        {/* Lead Status */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Lead Status
                            {isDisabled && (
                              <Lock className="h-3 w-3 text-amber-600 ml-1 inline" />
                            )}
                          </label>
                          
                          <Select
                            value={lead.status}
                            onValueChange={(value) => !isDisabled ? handleLeadStatusChange(lead.id, value as 'new' | 'in_progress' | 'estimate_set' | 'unqualified') : undefined}
                            disabled={isDisabled}
                          >
                            <SelectTrigger 
                              className={`w-full h-9 text-sm border-2 ${
                                pendingULRLeadId === lead.id 
                                  ? 'ring-2 ring-warning/40 bg-warning/10 border-warning-300 shadow-lg' 
                                  : 'border-blue-300 hover:border-blue-400 bg-blue-50/50 hover:bg-blue-100/50'
                              } transition-all duration-200 shadow-sm`}
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
                        </div>

                        {/* Unqualified Lead Reason - Only show when status is unqualified */}
                        {lead.status === 'unqualified' && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                              Unqualified Reason
                              {isDisabled && (
                                <Lock className="h-3 w-3 text-amber-600 ml-1 inline" />
                              )}
                            </label>
                            
                            {showCustomInput === lead.id ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={customULR}
                                  onChange={(e) => setCustomULR(e.target.value)}
                                  placeholder="Enter custom reason..."
                                  className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50/50 shadow-sm transition-all duration-200"
                                  onKeyPress={(e) => e.key === 'Enter' && handleCustomULRSubmit(lead.id)}
                                  disabled={isDisabled}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleCustomULRSubmit(lead.id)}
                                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                    disabled={isDisabled}
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setShowCustomInput(null);
                                      setCustomULR('');
                                    }}
                                    className="px-3 py-1 text-xs bg-muted-foreground text-primary-foreground rounded-md hover:bg-muted-foreground/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
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
                                  className={`w-full h-9 text-sm border-2 ${
                                    pendingULRLeadId === lead.id 
                                      ? 'ring-2 ring-warning/40 bg-warning/10 border-warning-300 shadow-lg' 
                                      : 'border-blue-300 hover:border-blue-400 bg-blue-50/50 hover:bg-blue-100/50'
                                  } transition-all duration-200 shadow-sm`}
                                >
                                  <SelectValue placeholder={pendingULRLeadId === lead.id ? "Select reason required!" : "Select reason..."}>
                                    {lead.unqualifiedLeadReason && !ULR_OPTIONS.includes(lead.unqualifiedLeadReason) ? (
                                      <span className="text-blue-600 font-medium">"{lead.unqualifiedLeadReason}"</span>
                                    ) : (
                                      lead.unqualifiedLeadReason
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
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
    </div>
  );
}; 