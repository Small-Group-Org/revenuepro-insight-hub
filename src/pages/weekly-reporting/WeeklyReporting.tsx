
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useReportingDataStore } from '@/stores/reportingDataStore';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Plus, TrendingUp } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { DatePeriodSelector } from '@/components/DatePeriodSelector';
import { PeriodType, FieldValue } from '@/types';
import { reportingFields } from '@/utils/constant';
import { calculateReportingFields, calculatePerformanceMetrics } from '@/utils/page-utils/actualDataUtils';
import { handleInputDisable } from '@/utils/page-utils/compareUtils';
import { processTargetData } from '@/utils/page-utils/targetUtils';
import { getWeekInfo, getCurrentWeek } from '@/utils/weekLogic';
import { useUserStore } from '@/stores/userStore';
import { ContentLoader } from '@/components/ui/content-loader';
import { useCombinedLoading } from '@/hooks/useCombinedLoading';
import DailyBudgetManager from '@/pages/weekly-reporting/components/DailyBudgetManager';
import { useGhlClientStore } from '@/stores/ghlClientStore';
import { triggerOpportunitySync } from '@/service/ghlClientService';
import CampaignAccordion from '@/pages/weekly-reporting/components/CampaignAccordion';
import { processCampaignData } from '@/utils/campaignDataProcessor';
import { TargetReport } from './components/TargetReport';
import { BudgetReport } from './components/BudgetReport';
import StatsCards from './components/StatsCards';
import { getStatsCards } from './utils/utils';
import { useMetaBudgetSpent } from '@/hooks/useMetaBudgetSpent';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const AddActualData = () => {
  const { reportingData, targetData, getReportingData, upsertReportingData, error } = useReportingDataStore();
  const { isLoading } = useCombinedLoading();
  const { toast } = useToast();
  const { selectedUserId } = useUserStore();
  const { getClientByRevenueProId } = useGhlClientStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<PeriodType>('weekly');
  const [isOpportunitySyncing, setIsOpportunitySyncing] = useState(false);

  const [fieldValues, setFieldValues] = useState<FieldValue>({});
  const [lastChanged, setLastChanged] = useState<string | null>(null);
  const [prevValues, setPrevValues] = useState<FieldValue>({});
  const [clientHasFbAccount, setClientHasFbAccount] = useState(false);
  const [showSyncConfirmation, setShowSyncConfirmation] = useState(false);
  const autoSaveMetaBudgetKeysRef = React.useRef<Set<string>>(new Set());

  // Use meta budget spent hook
  const {
    hasMetaIntegration,
    campaignData,
    setCampaignData,
    isLoadingCampaignData,
    totalCampaignSpend,
    fetchCampaignData: fetchCampaignDataFromHook,
  } = useMetaBudgetSpent(selectedUserId);


  // Use processed target data from store (single API)
  const processedTargetData = useMemo(() => {
    if (!targetData) return undefined;
    return processTargetData(targetData);
  }, [targetData]);

  // Helper function to calculate date range based on period
  const getDateRange = useCallback((date: Date, periodType: PeriodType): {
    startDate: string;
    endDate: string;
    queryType: string;
  } => {
    if (periodType === 'weekly') {
      const weekInfo = getWeekInfo(date);
      return {
        startDate: format(weekInfo.weekStart, 'yyyy-MM-dd'),
        endDate: format(weekInfo.weekEnd, 'yyyy-MM-dd'),
        queryType: 'weekly',
      };
    } else if (periodType === 'monthly') {
      return {
        startDate: format(startOfMonth(date), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(date), 'yyyy-MM-dd'),
        queryType: 'monthly',
      };
    } else {
      return {
        startDate: format(startOfYear(date), 'yyyy-MM-dd'),
        endDate: format(endOfYear(date), 'yyyy-MM-dd'),
        queryType: 'yearly',
      };
    }
  }, []);

  // Helper function to get period label
  const getPeriodLabel = useCallback((periodType: PeriodType): string => {
    return periodType === 'weekly' ? 'Week' : periodType === 'monthly' ? 'Month' : 'Year';
  }, []);

  // Metadata fields to exclude when processing data
  const METADATA_FIELDS = useMemo(() => new Set([
    'userId', '_id', 'createdAt', 'updatedAt', '__v', 'startDate', 'endDate'
  ]), []);

  // Helper function to get default values for reporting fields
  const getReportingDefaultValues = useCallback((): FieldValue => {
    const defaults: FieldValue = {};
    Object.values(reportingFields).forEach((section: any) => {
      section.forEach((field: any) => {
        if (field.fieldType === "input" && field.defaultValue !== undefined) {
          defaults[field.value] = field.defaultValue;
        }
      });
    });
    return defaults;
  }, []);

  React.useEffect(() => {
    const { startDate, endDate, queryType } = getDateRange(selectedDate, period);
    getReportingData(startDate, endDate, queryType, period);
  }, [selectedDate, period, selectedUserId, getReportingData, getDateRange]);

  // Fetch Facebook enriched ads data for campaign section
  React.useEffect(() => {
    const fetchCampaignData = async () => {
      // Only fetch if we have a selected user and meta integration is confirmed
      // Don't call API if no integration or still checking (null)
      if (!selectedUserId || hasMetaIntegration !== true) {
        setClientHasFbAccount(false);
        setCampaignData([]);
        return;
      }

      // Show campaign section with loader while data is being fetched
      setClientHasFbAccount(true);
      
      // Get date range based on selected period
      const { startDate, endDate, queryType } = getDateRange(selectedDate, period);

      // Fetch campaign data using the hook
      const result = await fetchCampaignDataFromHook(
        selectedUserId,
        startDate,
        endDate,
        queryType as "weekly" | "monthly" | "yearly"
      );

      if (result.success && result.data && result.data.length > 0) {
        setCampaignData(result.data);
        setClientHasFbAccount(true);
      } else {
        // If error, set empty data and hide section
        setCampaignData([]);
        setClientHasFbAccount(false);
      }
    };

    fetchCampaignData();
  }, [selectedDate, period, selectedUserId, hasMetaIntegration, getDateRange, fetchCampaignDataFromHook]);

  // totalCampaignSpend is now provided by the hook

React.useEffect(() => {
  if (reportingData && Array.isArray(reportingData)) {
    const newValues = { ...getReportingDefaultValues() };
    
    reportingData.forEach(data => {
      if (!data) return;
      
      Object.keys(data).forEach(key => {
        if (!METADATA_FIELDS.has(key)) {
          newValues[key] = (newValues[key] || 0) + (data[key] || 0);
        }
      });
    });

    setFieldValues(newValues);
    setLastChanged(null);
    // Update prevValues with calculated values to track changes properly
    const combinedValues = {
      ...newValues,
      com: processedTargetData?.com || 0,
      targetRevenue: processedTargetData?.revenue || 0,
    };
    const calculatedNewValues = calculateReportingFields(combinedValues, hasMetaIntegration === true ? totalCampaignSpend : undefined);
    setPrevValues(calculatedNewValues);
    
  } else {
    // If no data, set to defaults
    const defaults = getReportingDefaultValues();
    setFieldValues(defaults);
    setLastChanged(null);
    const combinedDefaults = {
      ...defaults,
      com: processedTargetData?.com || 0,
      targetRevenue: processedTargetData?.revenue || 0,
    };
    const calculatedDefaults = calculateReportingFields(combinedDefaults, hasMetaIntegration === true ? totalCampaignSpend : undefined);
    setPrevValues(calculatedDefaults);
  }
}, [reportingData, processedTargetData, getReportingDefaultValues, METADATA_FIELDS, hasMetaIntegration, totalCampaignSpend]);

  // Auto-upsert metaBudgetSpent when all 3 budget spent items are zero and meta integration is active
  React.useEffect(() => {
    const upsertMetaBudgetSpent = async () => {
      // Only proceed if:
      // 1. Reporting data has been loaded
      // 2. User has meta integration enabled
      // 3. Campaign spend data is available
      // 4. All three budget spent fields are zero
      if (!reportingData || !Array.isArray(reportingData) || reportingData.length === 0) {
        return;
      }

      if (hasMetaIntegration !== true) {
        return;
      }

      // Use totalCampaignSpend from hook (0 if undefined/null)
      const campaignSpend = totalCampaignSpend || 0;
      if (campaignSpend === 0) {
        return;
      }

      const { startDate, endDate, queryType } = getDateRange(selectedDate, period);
      const periodKey = `${startDate}_${endDate}`;

      // Prevent repeated attempts for the same period during this session
      if (autoSaveMetaBudgetKeysRef.current.has(periodKey)) {
        return;
      }

      // Check if all three budget spent fields are zero
      const firstData = reportingData[0];
      if (!firstData) return;

      // Check if metaBudgetSpent already exists and matches - avoid unnecessary upsert
      const existingMetaBudgetSpent = firstData.metaBudgetSpent;
      if (existingMetaBudgetSpent !== undefined && existingMetaBudgetSpent !== null) {
        // If the value is already set and matches (within 0.01 tolerance), skip upsert
        if (Math.abs(existingMetaBudgetSpent - campaignSpend) < 0.01) {
          autoSaveMetaBudgetKeysRef.current.add(periodKey);
          return;
        }
      }

      // Check if all three budget spent fields are zero
      const testingBudgetSpent = firstData.testingBudgetSpent || 0;
      const awarenessBrandingBudgetSpent = firstData.awarenessBrandingBudgetSpent || 0;
      const leadGenerationBudgetSpent = firstData.leadGenerationBudgetSpent || 0;

      // If any of the three budget spent fields is non-zero, don't upsert
      if (testingBudgetSpent !== 0 || awarenessBrandingBudgetSpent !== 0 || leadGenerationBudgetSpent !== 0) {
        autoSaveMetaBudgetKeysRef.current.add(periodKey);
        return;
      }

      // All conditions met - proceed with upsert
      try {
        // Mark as attempted to avoid recursion even if backend returns unchanged data
        autoSaveMetaBudgetKeysRef.current.add(periodKey);
        
        // Get existing reporting data to preserve all fields
        const existingData = firstData;
        
        // Preserve ALL existing fields except metadata
        const preservedFields: any = {};
        Object.keys(existingData).forEach(key => {
          if (!METADATA_FIELDS.has(key)) {
            const value = existingData[key];
            if (value !== undefined) {
              preservedFields[key] = value !== null ? value : 0;
            }
          }
        });

        const dataToUpsert = {
          startDate: startDate,
          endDate: endDate,
          // ...preservedFields,
          metaBudgetSpent: campaignSpend,
        };

        await upsertReportingData(dataToUpsert);
        
        // Refetch reporting data to get updated data from API
        const { queryType } = getDateRange(selectedDate, period);
        await getReportingData(startDate, endDate, queryType, period);
      } catch (error) {
        // Silently fail - don't show error toast for auto-upsert
        console.error('Error auto-upserting metaBudgetSpent:', error);
      }
    };

    upsertMetaBudgetSpent();
  }, [reportingData, hasMetaIntegration, totalCampaignSpend, selectedDate, period, upsertReportingData, getReportingData, getDateRange, METADATA_FIELDS]);

  const calculatedValues = useMemo(() => {
    const combinedValues = {
      ...fieldValues,
      com: processedTargetData?.com || 0,
      targetRevenue: processedTargetData?.revenue || 0,
    };
    
    // Pass totalCampaignSpend when meta integration is active
    // This will override the manual budget entries (testingBudgetSpent, etc.)
    const campaignSpend = hasMetaIntegration === true && totalCampaignSpend > 0 ? totalCampaignSpend : undefined;
    return calculateReportingFields(combinedValues, campaignSpend);
  }, [fieldValues, processedTargetData, hasMetaIntegration, totalCampaignSpend]);

  // Calculate disable logic for AddActualData page with role-based restrictions
  const disableLogic = useMemo(() => 
    handleInputDisable(period, selectedDate, null, 'addActualData'), 
    [period, selectedDate]
  );  

  const { isDisabled, disabledMessage } = disableLogic;

  // Helper to get all input field names from reportingFields
  const getInputFieldNames = useCallback(() => {
    const inputNames: string[] = [];
    Object.values(reportingFields).forEach(section => {
      section.forEach(field => {
        if (field.fieldType === 'input') {
          inputNames.push(field.value);
        }
      });
    });
    return inputNames;
  }, []);

  // Check if there are any changes by comparing calculatedValues with prevValues
  const hasChanges = useMemo(() => {
    const inputFieldNames = getInputFieldNames();
    return inputFieldNames.some((fieldName) => {
      const currentValue = calculatedValues[fieldName] ?? 0;
      const prevValue = prevValues[fieldName] ?? 0;
      // Use a small epsilon for floating point comparison
      return Math.abs(currentValue - prevValue) > 0.01;
    });
  }, [calculatedValues, prevValues, getInputFieldNames]);

  const handleInputChange = useCallback((fieldName: string, value: number) => {
    if (value === undefined || value === null || isNaN(value)) {
      value = 0;
    }
    
    const validatedValue = Math.max(0, value);
    
    setLastChanged(fieldName);
    
    setFieldValues(prev => ({
      ...prev,
      [fieldName]: validatedValue
    }));
  }, []);

  const handleSave = useCallback(async () => {
    // Get date range based on selected period
    const { startDate, endDate, queryType } = getDateRange(selectedDate, period);

    const inputFieldNames = getInputFieldNames();
    const inputData: { [key: string]: number | undefined } = {};
    inputFieldNames.forEach(name => {
      inputData[name] = fieldValues[name];
    });

    // Get existing reporting data to preserve all fields
    const existingData = reportingData && reportingData[0] ? reportingData[0] : null;
    
    // Preserve ALL existing fields except metadata
    // This ensures target report fields (revenue, sales, etc.) and adNamesAmount are preserved
    const preservedFields: any = {};
    if (existingData) {
      Object.keys(existingData).forEach(key => {
        // Skip metadata fields
        if (!METADATA_FIELDS.has(key)) {
          // Preserve ALL existing fields (including target report input fields and adNamesAmount)
          // Include even if value is 0, null, or undefined to ensure API has all fields
          const value = existingData[key];
          if (value !== undefined) {
            preservedFields[key] = value !== null ? value : 0;
          }
        }
      });
    }

    const dataToSave = {
      startDate: startDate,
      endDate: endDate,
      ...preservedFields, // Preserve ALL existing fields first (including target report fields)
      ...inputData, // Then add/update input fields (this will overwrite only changed fields)
    };

    try {
      await upsertReportingData(dataToSave);
      
      // Refetch reporting data to get complete data from API
      await getReportingData(startDate, endDate, queryType, period);
      
      // Update prevValues after successful save to reset change detection
      // The useEffect will update prevValues when reportingData changes
      // But we also update it here to ensure immediate reset
      setPrevValues(calculatedValues);
      setLastChanged(null);
      
      const periodLabel = getPeriodLabel(period);
      toast({
        title: "✅ Data Saved Successfully!",
        description: `${periodLabel} of ${format(new Date(startDate), 'MMM dd, yyyy')} has been updated.`,
      });
    } catch (e) {
      toast({
        title: "❌ Error Saving Data",
        description: error || 'An error occurred while saving.',
        variant: 'destructive',
      });
    }
  }, [selectedDate, period, fieldValues, reportingData, upsertReportingData, getReportingData, toast, getInputFieldNames, calculatedValues, error, getDateRange, getPeriodLabel, METADATA_FIELDS]);

  const handleDatePeriodChange = useCallback((date: Date, period: PeriodType) => {
    setSelectedDate(date);
    setPeriod(period);
  }, []);

  // Check if opportunity sync button should be shown (only for specific user and current week)
  const isCurrentWeek = useMemo(() => {
    if (period !== 'weekly') return false;
    const currentWeek = getCurrentWeek();
    const selectedWeek = getWeekInfo(selectedDate);
    // Compare week start dates to determine if it's the current week
    return format(currentWeek.weekStart, 'yyyy-MM-dd') === format(selectedWeek.weekStart, 'yyyy-MM-dd');
  }, [period, selectedDate]);

  // Check if opportunity sync button should be shown
  // Show button if: weekly period, current week, user has an active GHL client configured
  const shouldShowOpportunitySync = useMemo(() => {
    if (period !== 'weekly' || !selectedUserId) return false;
    if (!isCurrentWeek) return false; // Only show for current week
    const client = getClientByRevenueProId(selectedUserId);
    return client?.status === 'active';
  }, [period, selectedUserId, isCurrentWeek, getClientByRevenueProId]);

  // Handle opportunity sync button click - show confirmation modal
  const handleOpportunitySyncClick = useCallback(() => {
    setShowSyncConfirmation(true);
  }, []);

  // Handle opportunity sync trigger after confirmation
  const handleOpportunitySyncConfirm = useCallback(async () => {
    if (!selectedUserId) {
      setShowSyncConfirmation(false);
      return;
    }

    setShowSyncConfirmation(false);
    setIsOpportunitySyncing(true);

    try {
      // Get active GHL clients for the current user
      const client = getClientByRevenueProId(selectedUserId);
      
      if (!client || client.status !== 'active') {
        toast({
          title: "❌ No Active GHL Client",
          description: 'No active GHL client configuration found for this user',
          variant: 'destructive',
        });
        setIsOpportunitySyncing(false);
        return;
      }

      // Step 1: Start opportunity sync for this client's location
      toast({
        title: "🔄 Starting Opportunity Sync",
        description: 'Opportunity sync has been triggered. This may take 2-3 minutes. Please wait...',
      });

      const opportunityResponse = await triggerOpportunitySync([client.locationId]);

      if (opportunityResponse.error) {
        toast({
          title: "❌ Opportunity Sync Failed",
          description: opportunityResponse.message || 'Failed to sync opportunities',
          variant: 'destructive',
        });
        setIsOpportunitySyncing(false);
        return;
      }

      toast({
        title: "✅ Opportunity Sync Completed",
        description: 'Opportunity sync has been completed successfully',
      });

      // Step 2: After successful opportunity sync, refresh the data for current week
      const { startDate, endDate, queryType } = getDateRange(selectedDate, period);

      // Refresh the reporting data
      await getReportingData(startDate, endDate, queryType, period);

      // Reset loading state
      setIsOpportunitySyncing(false);
    } catch (error) {
      toast({
        title: "❌ Sync Error",
        description: error instanceof Error ? error.message : 'An error occurred while syncing',
        variant: 'destructive',
      });
      setIsOpportunitySyncing(false);
    }
  }, [toast, selectedDate, period, selectedUserId, getReportingData, getClientByRevenueProId, getDateRange])

  return (
    <div className="min-h-screen bg-background">
      <div className="relative z-10 pt-4 pb-12 px-4">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/60 rounded-lg  flex items-center justify-center shadow-lg">
                <Plus className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="leading-[130%] text-4xl font-bold text-gradient-primary">
                Weekly Reporting
              </h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg mb-10 mt-2">
              Enter your weekly performance metrics for tracking and analysis
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mb-8">
          <DatePeriodSelector
            initialDate={selectedDate}
            initialPeriod={period}
            onChange={handleDatePeriodChange}
            buttonText="Save Report"
            onButtonClick={handleSave}
            disableLogic={{
              ...disableLogic,
              isButtonDisabled: disableLogic.isButtonDisabled || !hasChanges,
            }}
            onNavigationAttempt={(_: Date, __: PeriodType) => {
              return true;
            }}
          />
        </div>

        <div className="flex flex-col gap-8 mb-8">
          <TargetReport
            title="Target Report"
            icon={<TrendingUp className="h-5 w-5 text-accent" />}
            fields={reportingFields['targetReport']}
            fieldValues={fieldValues}
            onInputChange={handleInputChange}
            isLoading={isLoading}
            period={period}
            isDisabled={isDisabled}
            disabledMessage={disabledMessage}
            targetValues={processedTargetData}
            showOpportunitySyncButton={shouldShowOpportunitySync}
            onOpportunitySyncClick={handleOpportunitySyncClick}
            isOpportunitySyncing={isOpportunitySyncing}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {getStatsCards(calculatedValues, isLoadingCampaignData, hasMetaIntegration === true).map((card) => (
              <StatsCards 
                key={card.title} 
                title={card.title} 
                value={card.value} />
            ))}
          </div>
         
          {/* Show Campaign Spend if client has meta integration and period is not yearly */}
          {hasMetaIntegration === true && clientHasFbAccount && period !== 'yearly' && (
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col max-h-[785px]">
                <div className="p-4 border-b border-gray-200 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-800">Campaign Spend</h2>
                    {isLoadingCampaignData && (
                      <span className="text-sm text-muted-foreground ml-2">Loading...</span>
                    )}
                  </div>
                </div>
                <div className="p-0 overflow-y-auto flex-1 min-h-0">
                  {isLoadingCampaignData ? (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-muted-foreground">Loading campaign data...</p>
                    </div>
                  ) : campaignData.length > 0 ? (
                    <CampaignAccordion data={processCampaignData(campaignData)} />
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-muted-foreground">No campaign data available for this period</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Show Budget Report if client does not have meta integration OR period is yearly */}
          {(hasMetaIntegration === false || period === 'yearly') && (
            <BudgetReport
              title="Budget Report"
              fields={reportingFields['budgetReport']}
              fieldValues={fieldValues}
              onInputChange={handleInputChange}
              isLoading={isLoading}
              period={period}
              isDisabled={isDisabled}
              disabledMessage={disabledMessage}
            />
          )}
        </div>

        {/* Daily Budget + Ad Names Amount (Weekly only) placed below sections */}
        {period === 'weekly' && (
          <div className="w-full mx-auto mb-8">
            <DailyBudgetManager
              selectedDate={selectedDate}
              weeklyBudget={Number(calculatedValues?.weeklyBudget || 0)}
              initialAdNamesAmount={(reportingData && reportingData[0]?.adNamesAmount) || []}
            />
          </div>
        )}
      </div>
      
      {/* Opportunity Sync Confirmation Modal */}
      <AlertDialog open={showSyncConfirmation} onOpenChange={setShowSyncConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Opportunity Sync</AlertDialogTitle>
            <AlertDialogDescription>
              This operation will sync opportunities from GHL and may take 2-3 minutes to complete. 
              Please do not close this page or navigate away while the sync is in progress.
              <br /><br />
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isOpportunitySyncing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleOpportunitySyncConfirm}
              disabled={isOpportunitySyncing}
              className="bg-gradient-primary hover:opacity-90 hover:shadow-lg text-primary-foreground transition-all duration-200"
            >
              {isOpportunitySyncing ? 'Syncing...' : 'Yes, Start Sync'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Content Loader - Only covers main content area */}
      <ContentLoader isLoading={isLoading} message="Loading reporting data..." />
    </div>
  );
};
