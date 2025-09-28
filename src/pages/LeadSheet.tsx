import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Users } from 'lucide-react';
import { startOfYear } from 'date-fns';
import { DatePeriodSelector } from '@/components/DatePeriodSelector';
import { PeriodType } from '@/types';
import { useLeadStore } from '@/stores/leadStore';
import { useUserStore } from '@/stores/userStore';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { handleInputDisable } from '@/utils/page-utils/compareUtils';
import { getScoreInfo, getStatusInfo, FIELD_WEIGHTS } from '@/utils/leads/leadProcessing';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { LeadSummaryCards } from '@/components/LeadSheet/LeadSummaryCards';
import { LeadFiltersAndControls } from '@/components/LeadSheet/LeadFiltersAndControls';
import { LeadPagination } from '@/components/LeadSheet/LeadPagination';
import { LeadTiles } from '@/components/LeadSheet/LeadTiles';
import { processLeadSheet } from '@/service/leadService';

// Import refactored utilities and constants
import { ULR_OPTIONS, TOAST_MESSAGES, REFRESH_RATE_LIMIT } from '@/constants/leadSheet.constants';
import { getDateRange, processLeadsData, formatDate, hasActiveFilters, hasValidLeadSheetUrl, findLeadById, validateCustomULR, isRefreshRateLimited, isCustomULR, generateExportFileName, generateExportDescription, convertLeadsToExportFormat, generateCSVContent, downloadCSVFile } from '@/utils/leads/leadSheet.utils';
import { LeadStatus, LeadUpdateData } from '@/types/leadSheet.types';

// ULR = Unqualified Lead Reason
export const LeadSheet = () => {
  const { toast } = useToast();
  const { userRole } = useRoleAccess();
  
  // Local state for date and period
  const [selectedDate, setSelectedDate] = useState<Date>(startOfYear(new Date()));
  const [period, setPeriod] = useState<PeriodType>('yearly');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  
  // Lead operations state
  const [pendingULRLeadId, setPendingULRLeadId] = useState<string | null>(null);
  const [customULR, setCustomULR] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [leadToDelete, setLeadToDelete] = useState<string[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const lastRefreshRef = useRef<number>(0);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { leads, loading, error, pagination, filterOptions, statusCounts, filterOptionsLoading, currentFilters, currentSorting, fetchPaginatedLeads, fetchFilterOptions, exportAllFilteredLeads, updateLeadData, bulkDeleteLeadsData, updateLeadLocal, setFilters, setSorting, clearFilters } = useLeadStore();
  const { selectedUserId, users } = useUserStore();

  // Calculate disable logic for LeadSheet page with role-based restrictions
  const disableLogic = useMemo(() => 
    handleInputDisable(period, selectedDate, null, 'leadSheet', userRole), 
    [period, selectedDate, userRole]
  );

  const { isDisabled } = disableLogic;

  // Helper functions
  const showErrorToast = useCallback((message: string) => {
    toast({
      title: TOAST_MESSAGES.ERROR.TITLE,
      description: message,
      variant: "destructive",
    });
  }, [toast]);

  const showSuccessToast = useCallback((message: string) => {
    toast({
      title: TOAST_MESSAGES.SUCCESS.TITLE,
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
    updateData: LeadUpdateData,
    successMessage: string,
    revertOnError = false
  ): Promise<boolean> => {
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
  }, [selectedUserId, selectedDate, period, currentPage, pageSize, currentSorting, currentFilters.adSetName, currentFilters.adName, currentFilters.status, currentFilters.unqualifiedLeadReason, fetchPaginatedLeads, getDateRange]);

  // Debounced search effect - handle search with 3+ characters or clear search when empty
  useEffect(() => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const searchName = currentFilters.searchName;

    if (searchName && searchName.length < 3) {
      return;
    }

    // Debounce the search API call by 500ms (for both search and clear)
    searchTimeoutRef.current = setTimeout(async () => {
      if (selectedUserId && !isDisabled) {
        const { startDate, endDate } = getDateRange(selectedDate, period);
        
        // If searchName is empty, remove it from filters to fetch all leads
        const filtersToUse = searchName 
          ? currentFilters 
          : { ...currentFilters, searchName: undefined };
        
        await fetchPaginatedLeads({
          clientId: selectedUserId,
          startDate,
          endDate,
          page: 1,
          limit: pageSize,
          sortBy: currentSorting.sortBy,
          sortOrder: currentSorting.sortOrder,
          ...filtersToUse
        });
        setCurrentPage(1);
      }
    }, 500);

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [currentFilters.searchName, selectedUserId, selectedDate, period, pageSize, currentSorting, currentFilters, fetchPaginatedLeads, getDateRange, setCurrentPage, isDisabled]);

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

  // Lead status change handler
  const handleLeadStatusChange = useCallback(async (leadId: string, value: LeadStatus) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    if (value === 'unqualified') {
      // Set status to unqualified and show ULR dropdown
      updateLeadLocal(leadId, { status: 'unqualified' });
      setPendingULRLeadId(leadId);
      
      toast({
        title: TOAST_MESSAGES.INFO.SELECT_ULR,
        description: TOAST_MESSAGES.INFO.SELECT_ULR_DESCRIPTION,
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
  }, [leads, handleLeadUpdate, updateLeadLocal, toast, clearULRStates]);

  // ULR change handler
  const handleULRChange = useCallback(async (leadId: string, value: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    if (value === 'custom') {
      // Show custom input for this lead with current value pre-filled only if it's a custom reason
      setShowCustomInput(leadId);
      const currentReason = lead.unqualifiedLeadReason || '';
      const isCustomReason = isCustomULR(currentReason, ULR_OPTIONS);
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
  }, [leads, handleLeadUpdate, updateLeadLocal, clearULRStates]);

  // Custom ULR submit handler
  const handleCustomULRSubmit = useCallback(async (leadId: string) => {
    const validation = validateCustomULR(customULR);
    if (!validation.isValid) {
      showErrorToast(validation.message!);
      return;
    }

    const lead = leads.find(l => l.id === leadId);
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
  }, [customULR, leads, handleLeadUpdate, updateLeadLocal, showErrorToast, clearULRStates]);

  // Lead delete handler
  const handleLeadDelete = useCallback((leadId: string) => {
    setLeadToDelete([leadId]);
  }, []);

  // Lead selection handlers
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

  // Bulk delete handler
  const handleBulkDelete = useCallback(() => {
    if (selectedLeads.size > 0) {
      setLeadToDelete(Array.from(selectedLeads));
    }
  }, [selectedLeads]);

  // Confirm bulk delete
  const confirmBulkDelete = useCallback(async () => {
    if (selectedLeads.size === 0) return;

    try {
      const result = await bulkDeleteLeadsData({ leadIds: Array.from(selectedLeads) });
      
      if (result.error) {
        showErrorToast(result.message || TOAST_MESSAGES.ERROR.BULK_DELETE_FAILED);
      } else {
        showSuccessToast(result.message || `${selectedLeads.size} ${TOAST_MESSAGES.SUCCESS.BULK_DELETE_SUCCESS}`);
        setSelectedLeads(new Set());
      }
    } catch (error) {
      showErrorToast(TOAST_MESSAGES.ERROR.BULK_DELETE_FAILED);
    }
  }, [selectedLeads, bulkDeleteLeadsData, showSuccessToast, showErrorToast]);

  // Cancel bulk delete
  const cancelBulkDelete = useCallback(() => {
    setLeadToDelete([]);
  }, []);

  // Export to Excel
  const exportToExcel = useCallback(async (exportType: 'current' | 'all') => {
    try {
      let exportData: any[] = [];
      let fileName = '';
      let description = '';

      if (exportType === 'current') {
        // Export current page data
        exportData = convertLeadsToExportFormat(processedLeads, formatDate);
        fileName = generateExportFileName('current');
        description = generateExportDescription('current', exportData.length);
      } else {
        // Export all filtered data
        if (!selectedUserId) {
          showErrorToast(TOAST_MESSAGES.ERROR.NO_USER_SELECTED);
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
          showErrorToast(result.message || TOAST_MESSAGES.ERROR.EXPORT_FAILED);
          return;
        }

        exportData = convertLeadsToExportFormat(processLeadsData(result.data || []), formatDate);
        fileName = generateExportFileName('all');
        description = generateExportDescription('all', exportData.length);
      }

      // Create and download CSV
      const csvContent = generateCSVContent(exportData);
      downloadCSVFile(csvContent, fileName);

      showSuccessToast(description);
    } catch (error) {
      showErrorToast(TOAST_MESSAGES.ERROR.EXPORT_FAILED);
    }
  }, [selectedUserId, selectedDate, period, currentSorting, currentFilters.adSetName, currentFilters.adName, currentFilters.status, currentFilters.unqualifiedLeadReason, currentFilters.searchName, exportAllFilteredLeads, showErrorToast, showSuccessToast]);

  // Refresh leads
  const handleRefreshLeads = useCallback(async () => {
    // Prevent spam clicking - allow only one refresh per 3 seconds
    if (isRefreshRateLimited(lastRefreshRef.current, REFRESH_RATE_LIMIT)) {
      return;
    }
    lastRefreshRef.current = Date.now();

    const selectedUser = users.find(user => user.id === selectedUserId);
    if (!selectedUser) return;

    setIsRefreshing(true);
    
    try {
      const response = await processLeadSheet({
        sheetUrl: selectedUser.leadSheetUrl,
        clientId: selectedUserId,
        uniquenessByPhoneEmail: true
      });

      if (!response.error) {
        showSuccessToast(TOAST_MESSAGES.SUCCESS.LEADS_REFRESHED);
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
        showErrorToast(TOAST_MESSAGES.ERROR.REFRESH_FAILED);
      }
    } catch (error) {
      console.error('Error refreshing leads:', error);
      showErrorToast(TOAST_MESSAGES.ERROR.REFRESH_FAILED);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedUserId, users, selectedDate, period, currentPage, pageSize, currentSorting, currentFilters.adSetName, currentFilters.adName, currentFilters.status, currentFilters.unqualifiedLeadReason, currentFilters.searchName, fetchPaginatedLeads, fetchFilterOptions, showSuccessToast, showErrorToast]);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    clearFilters();
    setShowFilters(false);
    setCurrentPage(1); // Reset to first page when clearing filters
  }, [clearFilters]);

  // Process leads data using utility function
  const processedLeads = useMemo(() => processLeadsData(leads), [leads]);

  // Check if any filters are active
  const hasActiveFiltersValue = useMemo(() => hasActiveFilters(currentFilters), [currentFilters]);

  // Check if current user has a valid leadSheetUrl
  const hasValidLeadSheetUrlValue = useMemo(() => hasValidLeadSheetUrl(selectedUserId, users), [selectedUserId, users]);


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
            showRefreshButton={hasValidLeadSheetUrlValue}
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
                  hasActiveFilters={hasActiveFiltersValue}
                  selectedLeads={selectedLeads}
                  userRole={userRole}
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
                      {hasActiveFiltersValue 
                        ? `No leads found matching your filters.` 
                        : `No leads found for the selected period.`
                      }
                    </p>
                    {hasActiveFiltersValue && (
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
                    ULR_OPTIONS={[...ULR_OPTIONS]}
                    selectedLeads={selectedLeads}
                    userRole={userRole}
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
                        const lead = findLeadById(processedLeads, leadId);
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