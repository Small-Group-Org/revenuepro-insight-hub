import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Users, Calendar, Phone, Mail, Tag, Target } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { DatePeriodSelector } from '@/components/DatePeriodSelector';
import { PeriodType } from '@/types';
import { getWeekInfo } from '@/utils/weekLogic';
import { useLeadStore } from '@/stores/leadStore';
import { useUserStore } from '@/stores/userStore';
import { processLeadSheet } from '@/service/leadService';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { handleInputDisable } from '@/utils/page-utils/compareUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getScoreInfo, getStatusInfo, FIELD_WEIGHTS } from '@/utils/leadProcessing';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LeadSummaryCards } from '@/components/LeadSheet/LeadSummaryCards';
import { LeadFiltersAndControls } from '@/components/LeadSheet/LeadFiltersAndControls';
import { LeadPagination } from '@/components/LeadSheet/LeadPagination';
import { useUserContext } from '@/utils/UserContext';

// Memoized component for lead tiles to optimize re-renders
const LeadTiles = React.memo(({ 
  leads, 
  isDisabled, 
  pendingULRLeadId, 
  showCustomInput, 
  customULR, 
  ULR_OPTIONS,
  handleLeadStatusChange,
  handleULRChange,
  handleCustomULRSubmit,
  setCustomULR,
  setShowCustomInput,
  formatDate,
  getScoreInfo,
  getStatusInfo,
  FIELD_WEIGHTS
}: {
  leads: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    zip: string;
    service: string;
    adSetName: string;
    adName: string;
    status: string;
    leadDate: string;
    score: number;
    leadScore?: number;
    unqualifiedLeadReason?: string;
    conversionRates?: {
      service?: number;
      adSetName?: number;
      adName?: number;
      leadDate?: number;
      zip?: number;
    };
    tooltipData?: {
      serviceRate: string;
      adSetRate: string;
      adNameRate: string;
      dateRate: string;
      zipRate: string;
    };
  }>;
  isDisabled: boolean;
  pendingULRLeadId: string | null;
  showCustomInput: string | null;
  customULR: string;
  ULR_OPTIONS: string[];
  handleLeadStatusChange: (leadId: string, value: 'new' | 'in_progress' | 'estimate_set' | 'unqualified') => Promise<void>;
  handleULRChange: (leadId: string, value: string) => Promise<void>;
  handleCustomULRSubmit: (leadId: string) => Promise<void>;
  setCustomULR: (value: string) => void;
  setShowCustomInput: (value: string | null) => void;
  formatDate: (dateString: string) => string;
  getScoreInfo: (score: number) => { color: string; label: string };
  getStatusInfo: (status: string) => { color: string; label: string };
  FIELD_WEIGHTS: { zip: number; service: number; adSetName: number; adName: number };
}) => (
  <div className="space-y-4">
    {leads.map((lead) => {
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
                          <span className="text-gray-600">Zip ({lead.zip}):</span>
                          <span className="font-semibold text-gray-800">{lead.tooltipData.zipRate}%</span>
                        </div>
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
                      </div>

                      {/* Weights at bottom */}
                      <div className="bg-gray-100 px-3 py-2 rounded-lg">
                        <div className="text-xs font-semibold text-gray-700 mb-1">Weights:</div>
                        <p className="text-xs text-gray-500">
                          (Zip - {FIELD_WEIGHTS.zip}% • Service - {FIELD_WEIGHTS.service}% • Ad Set - {FIELD_WEIGHTS.adSetName}% • Ad Name - {FIELD_WEIGHTS.adName}%)
                        </p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Name */}
            <div className="col-span-2 flex items-center">
              <div className="flex items-center gap-2 w-full">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="font-semibold text-gray-900 text-sm truncate cursor-help">
                          {lead.name}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-sm">{lead.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="col-span-2 flex items-center">
              <div className="space-y-1 w-full">
                <div className="flex items-center gap-1 text-xs">
                  <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a 
                          href={`mailto:${lead.email}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline truncate block min-w-0 flex-1 cursor-help"
                        >
                          {lead.email}
                        </a>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-sm">{lead.email}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <a 
                    href={`tel:${lead.phone}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline truncate block min-w-0 flex-1"
                  >
                    {lead.phone}
                  </a>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-blue-600 truncate block min-w-0 flex-1">
                    {lead.zip}
                  </span>
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
              <div className="space-y-1 w-full">
                <div className="flex items-center gap-1 text-xs">
                  <Tag className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-gray-600 truncate font-medium block min-w-0 flex-1 cursor-help">
                          {lead.service}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-sm">{lead.service}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Target className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-gray-600 truncate block min-w-0 flex-1 cursor-help">
                          {lead.adSetName}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-sm">{lead.adSetName}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Target className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-gray-600 truncate block min-w-0 flex-1 cursor-help">
                          {lead.adName}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-sm">{lead.adName}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
));

LeadTiles.displayName = 'LeadTiles';

// ULR = Unqualified Lead Reason
export const LeadSheet = () => {
  const { toast } = useToast();
  const { userRole } = useRoleAccess();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfYear(new Date()));
  const [period, setPeriod] = useState<PeriodType>('yearly');
  const [pendingULRLeadId, setPendingULRLeadId] = useState<string | null>(null);
  const [customULR, setCustomULR] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const lastRefreshRef = useRef<number>(0);
  
  const { 
    leads, 
    loading, 
    error, 
    pagination,
    filterOptions,
    statusCounts,
    filterOptionsLoading,
    currentFilters,
    currentSorting,
    fetchPaginatedLeads, 
    fetchFilterOptions,
    exportAllFilteredLeads,
    updateLeadData, 
    updateLeadLocal,
    setFilters,
    setSorting,
    clearFilters
  } = useLeadStore();
  const { selectedUserId, users, setSelectedUserId } = useUserStore();
  const { user } = useUserContext();

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
  const ULR_OPTIONS = useMemo(() => [
    'Bad Phone Number',
    'Out of Area',
    'Job Too Small',
    'Said Didn\'t Fill Out Form',
    'No Longer Interested',
    'Service we don\'t offer',
    'Never responded',
    'In contact, estimate not yet set',
  ], []);

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

  useEffect(() => {
    if (!selectedUserId && user?.role === 'USER' && user?._id) {
      setSelectedUserId(user._id);
    }
  }, [selectedUserId, user, setSelectedUserId]);

  // Fetch filter options once when component loads or date/period changes
  useEffect(() => {
    if (selectedUserId) {
      const { startDate, endDate } = getDateRange(selectedDate, period);
      
      // Fetch filter options and status counts
      fetchFilterOptions({
        clientId: selectedUserId,
        startDate,
        endDate
      });
    }
  }, [selectedUserId, selectedDate, period, fetchFilterOptions, getDateRange]);

  // Fetch paginated leads when filters, sorting, or pagination changes
  useEffect(() => {
    if (selectedUserId) {
      const { startDate, endDate } = getDateRange(selectedDate, period);
      
      // Fetch paginated leads
      fetchPaginatedLeads({
        clientId: selectedUserId,
        startDate,
        endDate,
        page: currentPage,
        limit: pageSize,
        sortBy: currentSorting.sortBy,
        sortOrder: currentSorting.sortOrder,
        ...currentFilters
      });
    }
  }, [selectedUserId, selectedDate, period, currentPage, pageSize, currentSorting, currentFilters, fetchPaginatedLeads, getDateRange]);

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

  // With backend pagination, we don't need to filter or sort on frontend
  // The backend handles all filtering and sorting
  const processedLeads = useMemo(() => {
    return leads.map(lead => {
      // Use backend-provided lead score
      const score = lead.leadScore || 0;
      
      // Use backend-provided conversion rates for tooltip
      const tooltipData = {
        serviceRate: lead.conversionRates?.service ? (lead.conversionRates.service * 100).toFixed(1) : '0.0',
        adSetRate: lead.conversionRates?.adSetName ? (lead.conversionRates.adSetName * 100).toFixed(1) : '0.0',
        adNameRate: lead.conversionRates?.adName ? (lead.conversionRates.adName * 100).toFixed(1) : '0.0',
        dateRate: lead.conversionRates?.leadDate ? (lead.conversionRates.leadDate * 100).toFixed(1) : '0.0',
        zipRate: lead.conversionRates?.zip ? (lead.conversionRates.zip * 100).toFixed(1) : '0.0'
      };
      
      return {
        ...lead,
        score,
        tooltipData
      };
    });
  }, [leads]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    clearFilters();
    setShowFilters(false);
    setCurrentPage(1); // Reset to first page when clearing filters
  }, [clearFilters]);

  const handleRefreshLeads = useCallback(async () => {
    // Prevent spam clicking - allow only one refresh per 3 seconds
    const now = Date.now();
    if (now - lastRefreshRef.current < 3000) {
      return;
    }
    lastRefreshRef.current = now;

    const selectedUser = users.find(user => user.id === selectedUserId);

    setIsRefreshing(true);
    try {
      const response = await processLeadSheet({
        sheetUrl: selectedUser.leadSheetUrl,
        clientId: selectedUserId,
        uniquenessByPhoneEmail: true
      });

      if (!response.error) {
        showSuccessToast("Leads refreshed successfully!");
        const { startDate, endDate } = getDateRange(selectedDate, period);
        
        // Fetch filter options and status counts
        fetchFilterOptions({
          clientId: selectedUserId,
          startDate,
          endDate
        });
        
        // Fetch paginated leads
        fetchPaginatedLeads({
          clientId: selectedUserId,
          startDate,
          endDate,
          page: currentPage,
          limit: pageSize,
          sortBy: currentSorting.sortBy,
          sortOrder: currentSorting.sortOrder,
          ...currentFilters
        });
      } else {
        showErrorToast("Failed to refresh leads. Please contact Revenue Pro Support.");
      }
    } catch (error) {
      console.error('Error refreshing leads:', error);
      showErrorToast("Failed to refresh leads. Please contact Revenue Pro support.");
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedUserId, users, selectedDate, period, currentPage, pageSize, currentSorting, currentFilters, fetchPaginatedLeads, fetchFilterOptions, getDateRange, showSuccessToast, showErrorToast]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Boolean(currentFilters.adSetName || currentFilters.adName || currentFilters.status || currentFilters.unqualifiedLeadReason);
  }, [currentFilters]);

  // Check if current user has a valid leadSheetUrl
  const hasValidLeadSheetUrl = useMemo(() => {
    if (!selectedUserId) return false;
    const selectedUser = users.find(user => user.id === selectedUserId);
    return Boolean(selectedUser?.leadSheetUrl && selectedUser.leadSheetUrl.trim() !== '');
  }, [selectedUserId, users]);

  // Excel Export Function
  const exportToExcel = useCallback(async (exportType: 'current' | 'all') => {
    try {
      let exportData: Array<{
        'Lead Name': string;
        'Email': string;
        'Phone': string;
        'Service': string;
        'ZIP Code': string;
        'Lead Date': string;
        'Ad Set Name': string;
        'Ad Name': string;
        'Lead Status': string;
        'Lead Score': number;
        'Unqualified Reason': string;
      }> = [];
      let fileName = '';
      let description = '';

      if (exportType === 'current') {
        // Export current page data
        exportData = processedLeads.map(lead => ({
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
        fileName = `leads_current_page_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
        description = `Exported ${exportData.length} leads from current page.`;
      } else {
        // Export all filtered data
        if (!selectedUserId) {
          toast({
            title: "❌ Export Failed",
            description: "No user selected for export.",
            variant: "destructive",
          });
          return;
        }

        const { startDate, endDate } = getDateRange(selectedDate, period);
        
        const result = await exportAllFilteredLeads({
          clientId: selectedUserId,
          startDate,
          endDate,
          sortBy: currentSorting.sortBy,
          sortOrder: currentSorting.sortOrder,
          ...currentFilters
        });

        if (result.error) {
          toast({
            title: "❌ Export Failed",
            description: result.message || "Failed to export all leads.",
            variant: "destructive",
          });
          return;
        }

        exportData = (result.data || []).map(lead => ({
          'Lead Name': lead.name,
          'Email': lead.email,
          'Phone': lead.phone,
          'Service': lead.service,
          'ZIP Code': lead.zip,
          'Lead Date': formatDate(lead.leadDate),
          'Ad Set Name': lead.adSetName,
          'Ad Name': lead.adName,
          'Lead Status': getStatusInfo(lead.status).label,
          'Lead Score': lead.leadScore || 0,
          'Unqualified Reason': lead.status === 'unqualified' ? (lead.unqualifiedLeadReason || 'Not specified') : '',
        }));
        fileName = `leads_all_filtered_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
        description = `Exported ${exportData.length} leads from all filtered data.`;
      }

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
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "✅ Export Successful",
        description: description,
      });
    } catch (error) {
      toast({
        title: "❌ Export Failed",
        description: "Failed to export leads. Please try again.",
        variant: "destructive",
      });
    }
  }, [processedLeads, formatDate, toast, selectedUserId, selectedDate, period, currentSorting, currentFilters, exportAllFilteredLeads, getDateRange]);

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
            showRefreshButton={hasValidLeadSheetUrl}
            onRefreshClick={handleRefreshLeads}
            isRefreshing={isRefreshing}
          />

          {/* Lead Cards */}
          <div className="max-w-7xl mx-auto space-y-6">
            {filterOptionsLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
                <p className="text-lg">Loading leads...</p>
              </div>
            ) : (
              <>
                {/* Summary Cards - Using the new component */}
                <LeadSummaryCards statusCounts={statusCounts} />

                {/* Filters and Controls - Using the new component */}
                <LeadFiltersAndControls
                  showFilters={showFilters}
                  setShowFilters={setShowFilters}
                  currentFilters={currentFilters}
                  currentSorting={currentSorting}
                  filterOptions={filterOptions}
                  processedLeads={processedLeads}
                  pagination={pagination}
                  hasActiveFilters={hasActiveFilters}
                  setFilters={setFilters}
                  setSorting={setSorting}
                  setCurrentPage={setCurrentPage}
                  handleClearFilters={handleClearFilters}
                  exportToExcel={exportToExcel}
                />

                {/* No Results Message */}
                {processedLeads.length === 0 && (
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

                {/* Loading indicator for leads fetching (filtering/sorting) */}
                {loading && processedLeads.length > 0 && (
                  <div className="flex items-center justify-center py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating leads...</span>
                    </div>
                  </div>
                )}

                {/* Lead Tiles - Memoized to optimize re-renders */}
                {processedLeads.length > 0 && !loading && (
                  <LeadTiles
                    leads={processedLeads}
                    isDisabled={isDisabled}
                    pendingULRLeadId={pendingULRLeadId}
                    showCustomInput={showCustomInput}
                    customULR={customULR}
                    ULR_OPTIONS={ULR_OPTIONS}
                    handleLeadStatusChange={handleLeadStatusChange}
                    handleULRChange={handleULRChange}
                    handleCustomULRSubmit={handleCustomULRSubmit}
                    setCustomULR={setCustomULR}
                    setShowCustomInput={setShowCustomInput}
                    formatDate={formatDate}
                    getScoreInfo={getScoreInfo}
                    getStatusInfo={getStatusInfo}
                    FIELD_WEIGHTS={FIELD_WEIGHTS}
                  />
                )}

                {/* Pagination - Using the new component */}
                <LeadPagination
                  pagination={pagination}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  processedLeads={processedLeads}
                  loading={loading}
                  setCurrentPage={setCurrentPage}
                  setPageSize={setPageSize}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 