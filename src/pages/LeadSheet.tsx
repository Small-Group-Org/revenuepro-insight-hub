import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Users, Lock, Calendar, MapPin, Phone, Mail, Tag, Target, Star } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { DatePeriodSelector } from '@/components/DatePeriodSelector';
import { PeriodType } from '@/types';
import { getWeekInfo } from '@/utils/weekLogic';
import { useLeadStore } from '@/stores/leadStore';
import { useUserStore } from '@/stores/userStore';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { handleInputDisable } from '@/utils/page-utils/compareUtils';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export const LeadSheet = () => {
  const { toast } = useToast();
  const { userRole } = useRoleAccess();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfYear(new Date()));
  const [period, setPeriod] = useState<PeriodType>('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingULRLeadId, setPendingULRLeadId] = useState<string | null>(null);
  const [customULR, setCustomULR] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<string | null>(null);
  const [leadScores, setLeadScores] = useState<Record<string, number>>({});
  const [sortMode, setSortMode] = useState<'date' | 'score'>('date');
  const [dateOrder, setDateOrder] = useState<'asc' | 'desc'>('desc');
  const [scoreOrder, setScoreOrder] = useState<'asc' | 'desc'>('desc');
  
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
    updateData: { estimateSet: boolean; unqualifiedLeadReason?: string },
    successMessage: string,
    revertOnError = false
  ) => {
    const result = await updateLeadData({ _id: leadId, ...updateData });
    
    if (result.error) {
      showErrorToast(result.message);
      if (revertOnError) {
        updateLeadLocal(leadId, { estimateSet: true });
      }
      return false;
    } else {
      showSuccessToast(successMessage);
      return true;
    }
  }, [updateLeadData, updateLeadLocal, showErrorToast, showSuccessToast]);

  // ULR options - moved outside component to prevent recreation
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

  const handleEstimateSetChange = useCallback(async (leadId: string, checked: boolean) => {
    const lead = findLead(leadId);
    if (!lead) return;

    if (checked) {
      // Setting estimate to true - update immediately
      await handleLeadUpdate(
        leadId,
        { estimateSet: true, unqualifiedLeadReason: undefined },
        "Estimate has been set for this lead."
      );
    } else {
      // Unchecking estimate - user must select ULR first
      updateLeadLocal(leadId, { estimateSet: false });
      setPendingULRLeadId(leadId);
      
      toast({
        title: "ℹ️ Select Unqualified Reason",
        description: "Please select a reason from the dropdown to complete this action.",
      });
    }
  }, [findLead, handleLeadUpdate, updateLeadLocal, toast]);

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
      { estimateSet: false, unqualifiedLeadReason: value },
      "Unqualified lead reason has been set.",
      true // revert on error
    );
    
    if (success) {
      clearULRStates();
    }
  }, [findLead, handleLeadUpdate, clearULRStates]);

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
      { estimateSet: false, unqualifiedLeadReason: customULR.trim() },
      "Custom unqualified lead reason has been set.",
      true // revert on error
    );
    
    if (success) {
      clearULRStates();
    }
  }, [customULR, findLead, handleLeadUpdate, showErrorToast, clearULRStates]);

  const formatDate = useCallback((dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  }, []);

  // Generate random lead score (temporary - will be replaced with API call)
  const generateLeadScore = useCallback((lead: any) => {
    // Simple algorithm based on lead properties
    let score = 50; // Base score
    
    // Estimate set adds points
    if (lead.estimateSet) score += 30;
    
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

  // Sort leads by selected primary; ties broken by the other
  const sortedLeads = useMemo(() => {
    const leadsWithScores = leads.map(lead => ({
      ...lead,
      score: leadScores[lead.id] ?? 0,
    }));

    const compareScoreDesc = (a: any, b: any) => b.score - a.score;
    const compareScorePrimary = (a: any, b: any) =>
      scoreOrder === 'desc' ? b.score - a.score : a.score - b.score;

    const compareDateDesc = (a: any, b: any) => {
      const aDate = new Date(a.leadDate).getTime();
      const bDate = new Date(b.leadDate).getTime();
      return bDate - aDate; // Newest first
    };

    const compareDatePrimary = (a: any, b: any) => {
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
  }, [leads, leadScores, sortMode, dateOrder, scoreOrder]);

  // no-op helpers removed; sorting direction is fixed as descending for clarity per spec


  // Get score color and label
  const getScoreInfo = useCallback((score: number) => {
    if (score >= 80) return { color: 'bg-gradient-to-r from-green-500 to-emerald-600', textColor: 'text-white', label: 'Excellent' };
    if (score >= 60) return { color: 'bg-gradient-to-r from-yellow-500 to-orange-500', textColor: 'text-white', label: 'Good' };
    if (score >= 40) return { color: 'bg-gradient-to-r from-orange-500 to-red-500', textColor: 'text-white', label: 'Fair' };
    return { color: 'bg-gradient-to-r from-red-500 to-pink-600', textColor: 'text-white', label: 'Poor' };
  }, []);

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
              Track and manage your leads with detailed information and estimate status
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
        </div>

        {/* Sort Controls */}
        <div className="max-w-7xl mx-auto mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">Sort by</span>
            <div className="flex rounded-md overflow-hidden border border-gray-200">
              <button
                onClick={() => setSortMode('date')}
                className={`px-3 py-2 text-sm ${sortMode === 'date' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} border-r border-gray-200`}
              >
                <span className="inline-flex items-center gap-2"><Calendar className="w-4 h-4" /> Date</span>
              </button>
              <button
                onClick={() => setSortMode('score')}
                className={`px-3 py-2 text-sm ${sortMode === 'score' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                <span className="inline-flex items-center gap-2"><Star className="w-4 h-4" /> Lead Score</span>
              </button>
            </div>
            {sortMode === 'date' ? (
              <button
                onClick={() => setDateOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200 text-sm text-gray-700"
                title={dateOrder === 'desc' ? 'Newest → Oldest' : 'Oldest → Newest'}
              >
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>Date order: {dateOrder === 'desc' ? 'Newest → Oldest' : 'Oldest → Newest'}</span>
              </button>
            ) : (
              <button
                onClick={() => setScoreOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200 text-sm text-gray-700"
                title={scoreOrder === 'desc' ? 'High → Low' : 'Low → High'}
              >
                <Star className="w-4 h-4 text-gray-500" />
                <span>Score order: {scoreOrder === 'desc' ? 'High → Low' : 'Low → High'}</span>
              </button>
            )}
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
              return (
                <Card 
                  key={lead.id} 
                  className={`w-full transition-all duration-300 hover:shadow-xl border-2 ${
                    lead.estimateSet 
                      ? 'border-green-200 bg-gradient-to-r from-green-50/50 to-emerald-50/50' 
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
                        {/* Estimate Set Checkbox */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Checkbox
                            checked={lead.estimateSet}
                            onCheckedChange={(checked) => 
                              !isDisabled ? handleEstimateSetChange(lead.id, checked as boolean) : undefined
                            }
                              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-200"
                            disabled={isDisabled}
                            title={isDisabled ? "Only Revenue PRO team members can modify this field" : "Click to change estimate status"}
                          />
                            <span>Estimate Set</span>
                            {isDisabled && (
                              <Lock className="h-3 w-3 text-amber-600" />
                            )}
                          </label>
                        </div>

                        {/* Unqualified Lead Reason */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Unqualified Reason
                            {isDisabled && (
                              <Lock className="h-3 w-3 text-amber-600 ml-1 inline" />
                            )}
                          </label>
                          
                          {lead.estimateSet ? (
                            <div className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium border-2 border-green-200 shadow-sm">
                              Estimate Set ✓
                            </div>
                          ) : showCustomInput === lead.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={customULR}
                                onChange={(e) => setCustomULR(e.target.value)}
                                placeholder="Enter custom reason..."
                                className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50/50 shadow-sm transition-all duration-200"
                                onKeyPress={(e) => e.key === 'Enter' && handleCustomULRSubmit(lead.id)}
                                disabled={isDisabled}
                                title={isDisabled ? "Only Revenue PRO team members can modify this field" : "Enter a custom unqualified lead reason"}
                              />
                              <div className="flex gap-2">
                                  <button
                                    onClick={() => handleCustomULRSubmit(lead.id)}
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                    disabled={isDisabled}
                                    title={isDisabled ? "Only Revenue PRO team members can modify this field" : "Save custom reason"}
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setShowCustomInput(null);
                                      setCustomULR('');
                                    }}
                                  className="px-3 py-1 text-xs bg-muted-foreground text-primary-foreground rounded-md hover:bg-muted-foreground/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                    title={isDisabled ? "Only Revenue PRO team members can modify this field" : "Cancel custom reason input"}
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
                                title={isDisabled ? "Only Revenue PRO team members can modify this field" : (lead.unqualifiedLeadReason || "Select unqualified lead reason")}
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
  );
}; 