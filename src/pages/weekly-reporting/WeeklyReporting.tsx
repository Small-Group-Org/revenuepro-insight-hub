
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useReportingDataStore } from '@/stores/reportingDataStore';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Plus, TrendingUp } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { DatePeriodSelector } from '@/components/DatePeriodSelector';
import { TargetSection } from '@/components/TargetSection';
import { PeriodType, FieldValue } from '@/types';
import { reportingFields } from '@/utils/constant';
import { calculateReportingFields, calculatePerformanceMetrics } from '@/utils/page-utils/actualDataUtils';
import { handleInputDisable } from '@/utils/page-utils/compareUtils';
import { processTargetData } from '@/utils/page-utils/targetUtils';
import { getWeekInfo, getCurrentWeek } from '@/utils/weekLogic';
import { useUserStore } from '@/stores/userStore';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useUserContext } from '@/utils/UserContext';
import { FullScreenLoader } from '@/components/ui/full-screen-loader';
import { useCombinedLoading } from '@/hooks/useCombinedLoading';
import DailyBudgetManager from '@/pages/weekly-reporting/components/DailyBudgetManager';
import { useGhlClientStore } from '@/stores/ghlClientStore';
import { triggerOpportunitySync } from '@/service/ghlClientService';
import { doPOST } from '@/utils/HttpUtils';
import { API_ENDPOINTS } from '@/utils/constant';
import CampaignAccordion from '@/pages/weekly-reporting/components/CampaignAccordion';
import { processCampaignData } from '@/utils/campaignDataProcessor';
import { dummyCampaignData } from '@/utils/campaignData';
import { formatPercent, formatCurrency } from '@/utils/page-utils/commonUtils';
import { Card } from '@/components/ui/card';
import { TargetReport } from './components/TargetReport';
import StatsCards from './components/StatsCards';
import { getStatsCards } from './utils/utils';
import { getEnrichedAds } from '@/service/facebookEnrichedAdsService';
import { getUserProfile } from '@/service/metaAdAccountService';
import { transformEnrichedAdsToCampaignData } from '@/utils/facebookAdsTransformer';

// TEMPORARY: Specific user ID for opportunity sync feature
const OPPORTUNITY_SYNC_USER_ID = '68c82dfdac1491efe19d5df0';

export const AddActualData = () => {
  const { reportingData, targetData, getReportingData, upsertReportingData, error } = useReportingDataStore();
  const { isLoading } = useCombinedLoading();
  const { toast } = useToast();
  const { selectedUserId } = useUserStore();
  const { userRole } = useRoleAccess();
  const { user: loggedInUser } = useUserContext();
  const { getClientByRevenueProId, getActiveClients } = useGhlClientStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<PeriodType>('weekly');
  const [isOpportunitySyncing, setIsOpportunitySyncing] = useState(false);

  const [fieldValues, setFieldValues] = useState<FieldValue>({});
  const [lastChanged, setLastChanged] = useState<string | null>(null);
  const [prevValues, setPrevValues] = useState<FieldValue>({});
  const [campaignData, setCampaignData] = useState<any[]>([]);
  const [isLoadingCampaignData, setIsLoadingCampaignData] = useState(false);
  const [clientHasFbAccount, setClientHasFbAccount] = useState(false);


  // Use processed target data from store (single API)
  const processedTargetData = useMemo(() => {
    if (!targetData) return undefined;
    return processTargetData(targetData);
  }, [targetData]);

  const selectedWeek = format(selectedDate, 'yyyy-MM-dd');

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
    let startDate: string, endDate: string, queryType: string;

    if (period === 'weekly') {
      const weekInfo = getWeekInfo(selectedDate);
      startDate = format(weekInfo.weekStart, 'yyyy-MM-dd');
      endDate = format(weekInfo.weekEnd, 'yyyy-MM-dd');
      queryType = 'weekly';
    } else if (period === 'monthly') {
      startDate = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
      endDate = format(endOfMonth(selectedDate), 'yyyy-MM-dd');
      queryType = 'monthly';
    } else {
      startDate = format(startOfYear(selectedDate), 'yyyy-MM-dd');
      endDate = format(endOfYear(selectedDate), 'yyyy-MM-dd');
      queryType = 'yearly';
    }
    getReportingData(startDate, endDate, queryType, period);
  }, [selectedDate, period, selectedUserId, getReportingData]);

  // Fetch Facebook enriched ads data for campaign section
  React.useEffect(() => {
    const fetchCampaignData = async () => {
      // Only fetch for weekly period and if we have a selected user and logged-in user
      if (period !== 'weekly' || !selectedUserId || !loggedInUser?._id) {
        setClientHasFbAccount(false);
        setCampaignData([]);
        return;
      }

      setIsLoadingCampaignData(true);
      try {
        // Step 1: Get the logged-in user's (admin) profile to get metaAccessToken
        const adminProfileResponse = await getUserProfile(loggedInUser._id);

        if (adminProfileResponse.error || !adminProfileResponse.data) {
          setClientHasFbAccount(false);
          setCampaignData([]);
          setIsLoadingCampaignData(false);
          return;
        }

        const adminMetaAccessToken = adminProfileResponse.data.metaAccessToken;

        // Step 2: Get the selected client's profile to get fbAdAccountId
        const clientProfileResponse = await getUserProfile(selectedUserId);

        if (clientProfileResponse.error || !clientProfileResponse.data) {
          setClientHasFbAccount(false);
          setCampaignData([]);
          setIsLoadingCampaignData(false);
          return;
        }

        const clientFbAdAccountId = clientProfileResponse.data.fbAdAccountId;

        // Only proceed if client has fbAdAccountId
        if (!clientFbAdAccountId) {
          setClientHasFbAccount(false);
          setCampaignData([]);
          setIsLoadingCampaignData(false);
          return;
        }

        // Also check if admin has metaAccessToken (though API will handle auth)
        if (!adminMetaAccessToken) {
          setClientHasFbAccount(false);
          setCampaignData([]);
          setIsLoadingCampaignData(false);
          return;
        }

        setClientHasFbAccount(true);

        // Get date range for the selected week
        const weekInfo = getWeekInfo(selectedDate);
        const startDate = format(weekInfo.weekStart, 'yyyy-MM-dd');
        const endDate = format(weekInfo.weekEnd, 'yyyy-MM-dd');

        // Fetch enriched ads data using client's fbAdAccountId
        // The API will use the admin's metaAccessToken from headers
        const enrichedAdsResponse = await getEnrichedAds({
          adAccountId: clientFbAdAccountId,
          startDate,
          endDate,
          queryType: 'weekly',
        });

        if (enrichedAdsResponse.error || !enrichedAdsResponse.data) {
          // If error, set empty data (don't show error message, just don't display)
          setCampaignData([]);
          setIsLoadingCampaignData(false);
          return;
        }

        // Transform the enriched ads data to match CampaignDataItem format
        const transformedData = transformEnrichedAdsToCampaignData(
          enrichedAdsResponse.data as any[]
        );

        setCampaignData(transformedData);
      } catch (error) {
        // Silently fail - don't show campaign section if there's an error
        setCampaignData([]);
        setClientHasFbAccount(false);
      } finally {
        setIsLoadingCampaignData(false);
      }
    };

    fetchCampaignData();
  }, [selectedDate, period, selectedUserId, loggedInUser?._id]);

React.useEffect(() => {
  if (reportingData && Array.isArray(reportingData)) {
    const newValues = { ...getReportingDefaultValues() };
    
    reportingData.forEach(data => {
      if (!data) return;
      
      Object.keys(data).forEach(key => {
        if (key !== 'userId' && key !== 'startDate' && key !== 'endDate' && 
            key !== '_id' && key !== 'createdAt' && key !== 'updatedAt' && key !== '__v') {
          
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
    const calculatedNewValues = calculateReportingFields(combinedValues);
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
    const calculatedDefaults = calculateReportingFields(combinedDefaults);
    setPrevValues(calculatedDefaults);
  }
}, [reportingData, processedTargetData]);


  const calculatedValues = useMemo(() => {
    const combinedValues = {
      ...fieldValues,
      com: processedTargetData?.com || 0,
      targetRevenue: processedTargetData?.revenue || 0,
    };
    
    return calculateReportingFields(combinedValues);
  }, [fieldValues, processedTargetData]);

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (!processedTargetData) return null;
    try {
      return calculatePerformanceMetrics(calculatedValues, processedTargetData);
    } catch (error) {
      console.error('Error calculating performance metrics:', error);
      return null;
    }
  }, [calculatedValues, processedTargetData]);

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
    const weekInfo = getWeekInfo(selectedDate);
    const startDate = format(weekInfo.weekStart, 'yyyy-MM-dd');
    const endDate = format(weekInfo.weekEnd, 'yyyy-MM-dd');

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
        if (key !== 'userId' && 
            key !== '_id' && 
            key !== 'createdAt' && 
            key !== 'updatedAt' && 
            key !== '__v' &&
            key !== 'startDate' &&
            key !== 'endDate') {
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
      await getReportingData(startDate, endDate, 'weekly', period);
      
      // Update prevValues after successful save to reset change detection
      // The useEffect will update prevValues when reportingData changes
      // But we also update it here to ensure immediate reset
      setPrevValues(calculatedValues);
      setLastChanged(null);
      
      toast({
        title: "✅ Data Saved Successfully!",
        description: `Week of ${format(new Date(startDate), 'MMM dd, yyyy')} has been updated.`,
      });
    } catch (e) {
      toast({
        title: "❌ Error Saving Data",
        description: error || 'An error occurred while saving.',
        variant: 'destructive',
      });
    }
  }, [selectedDate, fieldValues, reportingData, period, upsertReportingData, getReportingData, toast, getInputFieldNames, error]);

  const isHighlighted = useCallback((fieldName: string) => {
    if (!lastChanged) return false;
    return prevValues[fieldName] !== calculatedValues[fieldName];
  }, [lastChanged, prevValues, calculatedValues]);

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

  // Handle opportunity sync trigger
  const handleOpportunitySync = useCallback(async () => {
    if (!selectedUserId) return;

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
        description: 'Opportunity sync has been triggered...',
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
      const weekInfo = getWeekInfo(selectedDate);
      const startDate = format(weekInfo.weekStart, 'yyyy-MM-dd');
      const endDate = format(weekInfo.weekEnd, 'yyyy-MM-dd');

      // Refresh the reporting data
      await getReportingData(startDate, endDate, 'weekly', period);

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
  }, [toast, selectedDate, period, selectedUserId, getReportingData, getClientByRevenueProId])

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {getStatsCards(calculatedValues).map((card) => (
              <StatsCards 
                key={card.title} 
                title={card.title} 
                value={card.value} />
            ))}
          </div>

          <TargetReport
            title="Budget Report"
            icon={<TrendingUp className="h-5 w-5 text-accent" />}
            fields={reportingFields['budgetReport']}
            fieldValues={fieldValues}
            onInputChange={handleInputChange}
            isLoading={isLoading}
            period={period}
            isDisabled={isDisabled}
            disabledMessage={disabledMessage}
            targetValues={processedTargetData}
            showOpportunitySyncButton={shouldShowOpportunitySync}
            onOpportunitySyncClick={handleOpportunitySync}
            isOpportunitySyncing={isOpportunitySyncing}
          />

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
            onOpportunitySyncClick={handleOpportunitySync}
            isOpportunitySyncing={isOpportunitySyncing}
          />

          {/* Only show campaign section if client has fbAdAccountId */}
          {clientHasFbAccount && (
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
      
      {/* Full Screen Loader */}
      <FullScreenLoader isLoading={isLoading} message="Loading reporting data..." />
    </div>
  );
};
