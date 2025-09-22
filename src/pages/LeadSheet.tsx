import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Users, Calendar, Phone, Mail, Tag, Target, Trash2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { DatePeriodSelector } from '@/components/DatePeriodSelector';
import { PeriodType } from '@/types';
import { getWeekInfo } from '@/utils/weekLogic';
import { useLeadStore } from '@/stores/leadStore';
import { useUserStore } from '@/stores/userStore';
import { processLeadSheet } from '@/service/leadService';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { handleInputDisable } from '@/utils/page-utils/compareUtils';
import { getScoreInfo, getStatusInfo, FIELD_WEIGHTS } from '@/utils/leadProcessing';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { LeadSummaryCards } from '@/components/LeadSheet/LeadSummaryCards';
import { LeadFiltersAndControls } from '@/components/LeadSheet/LeadFiltersAndControls';
import { LeadPagination } from '@/components/LeadSheet/LeadPagination';
import { useUserContext } from '@/utils/UserContext';
import { LeadTiles } from '@/components/LeadSheet/LeadTiles';

// ULR = Unqualified Lead Reason
export const LeadSheet = () => {
  const { toast } = useToast();
  const { userRole } = useRoleAccess();
  const { user } = useUserContext();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfYear(new Date()));
  const [period, setPeriod] = useState<PeriodType>('yearly');
  const [pendingULRLeadId, setPendingULRLeadId] = useState<string | null>(null);
  const [customULR, setCustomULR] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [leadToDelete, setLeadToDelete] = useState<string[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
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
    bulkDeleteLeadsData,
    updateLeadLocal,
    setFilters,
    setSorting,
    clearFilters
  } = useLeadStore();
  const { selectedUserId, users } = useUserStore();

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

  const handleLeadDelete = useCallback((leadId: string) => {
    setLeadToDelete([leadId]);
  }, []);

  // Checkbox selection handlers
  const handleLeadSelect = useCallback((leadId: string, isSelected: boolean) => {
    setSelectedLeads(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(leadId);
      } else {
        newSet.delete(leadId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((isSelected: boolean) => {
    if (isSelected) {
      setSelectedLeads(new Set(leads.map(lead => lead.id)));
    } else {
      setSelectedLeads(new Set());
    }
  }, [leads]);

  const handleBulkDelete = useCallback(() => {
    if (selectedLeads.size > 0) {
      setLeadToDelete(Array.from(selectedLeads));
    }
  }, [selectedLeads]);

  const confirmBulkDelete = useCallback(async () => {
    if (selectedLeads.size === 0) return;

    try {
      const result = await bulkDeleteLeadsData({ leadIds: Array.from(selectedLeads) });
      
      if (result.error) {
        showErrorToast(result.message || "Failed to delete leads. Please try again.");
      } else {
        showSuccessToast(result.message || `${selectedLeads.size} leads deleted successfully.`);
        setSelectedLeads(new Set());
      }
    } catch (error) {
      showErrorToast("Failed to delete leads. Please try again.");
    }
  }, [selectedLeads, bulkDeleteLeadsData, showSuccessToast, showErrorToast]);

  const cancelBulkDelete = useCallback(() => {
    setLeadToDelete([]);
  }, []);

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
                  selectedLeads={selectedLeads}
                  setFilters={setFilters}
                  setSorting={setSorting}
                  setCurrentPage={setCurrentPage}
                  handleClearFilters={handleClearFilters}
                  exportToExcel={exportToExcel}
                  handleBulkDelete={handleBulkDelete}
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
                    selectedLeads={selectedLeads}
                    handleLeadStatusChange={handleLeadStatusChange}
                    handleULRChange={handleULRChange}
                    handleCustomULRSubmit={handleCustomULRSubmit}
                    handleLeadDelete={handleLeadDelete}
                    handleLeadSelect={handleLeadSelect}
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

      {/* Bulk Delete Confirmation Modal */}
      <AlertDialog open={leadToDelete.length > 0} onOpenChange={(open) => !open && cancelBulkDelete()}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Leads</AlertDialogTitle>
            <AlertDialogDescription>
                <>
                  Are you sure you want to delete <strong>{leadToDelete.length} selected lead(s)</strong>? 
                  <br />
                  This action cannot be undone.
                </>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {/* Selected Leads Details */}
          {leadToDelete.length > 0 && (
            <div className="max-h-60 overflow-y-auto">
              <div className="bg-gray-50 rounded-lg py-2 px-1">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Name</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Date</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Ad Set</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Ad Name</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {leadToDelete.map((leadId) => {
                        const lead = findLead(leadId);
                        if (!lead) return null;
                        
                        return (
                          <tr key={leadId} className="hover:bg-gray-50">
                            <td className="py-2 px-2">
                              <span className="font-medium text-gray-900 truncate block max-w-32 text-xs">
                                {lead.name}
                              </span>
                            </td>
                            <td className="py-2 px-2">
                              <span className="text-gray-600 text-xs">
                                {formatDate(lead.leadDate)}
                              </span>
                            </td>
                            <td className="py-2 px-2">
                              <span className="text-gray-600 truncate block max-w-32 text-xs ">
                                {lead.adSetName}
                              </span>
                            </td>
                            <td className="py-2 px-2">
                              <span className="text-gray-600 truncate block max-w-32 text-xs ">
                                {lead.adName}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelBulkDelete}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBulkDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}; 