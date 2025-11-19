
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useReportingDataStore } from '@/stores/reportingDataStore';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Plus, TrendingUp } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { DatePeriodSelector } from '@/components/DatePeriodSelector';
import { TargetSection } from '@/components/TargetSection';
import { PeriodType, FieldValue } from '@/types';
import { reportingFields } from '@/utils/constant';
import { calculateReportingFields } from '@/utils/page-utils/actualDataUtils';
import { handleInputDisable } from '@/utils/page-utils/compareUtils';
import { processTargetData } from '@/utils/page-utils/targetUtils';
import { getWeekInfo } from '@/utils/weekLogic';
import { useUserStore } from '@/stores/userStore';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { FullScreenLoader } from '@/components/ui/full-screen-loader';
import { useCombinedLoading } from '@/hooks/useCombinedLoading';
import DailyBudgetManager from '@/components/DailyBudgetManager';
import { useGhlClientStore } from '@/stores/ghlClientStore';
import { triggerOpportunitySync, triggerLeadSheetSync } from '@/service/ghlClientService';

export const AddActualData = () => {
  const { reportingData, targetData, getReportingData, upsertReportingData, error } = useReportingDataStore();
  const { isLoading } = useCombinedLoading();
  const { toast } = useToast();
  const { selectedUserId } = useUserStore();
  const { userRole } = useRoleAccess();
  const { getClientByRevenueProId, getActiveClients } = useGhlClientStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<PeriodType>('weekly');

  const [fieldValues, setFieldValues] = useState<FieldValue>({});
  const [lastChanged, setLastChanged] = useState<string | null>(null);
  const [prevValues, setPrevValues] = useState<FieldValue>({});
  const [isOpportunitySyncing, setIsOpportunitySyncing] = useState(false);

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
    setPrevValues(newValues);
    
  } else {
    // If no data, set to defaults
    const defaults = getReportingDefaultValues();
    setFieldValues(defaults);
    setLastChanged(null);
    setPrevValues(defaults);
  }
}, [reportingData]);


  const calculatedValues = useMemo(() => {
    const combinedValues = {
      ...fieldValues,
      com: processedTargetData?.com || 0,
      targetRevenue: processedTargetData?.revenue || 0,
    };
    
    return calculateReportingFields(combinedValues);
  }, [fieldValues, processedTargetData]);

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

  const handleInputChange = useCallback((fieldName: string, value: number) => {
    if (value === undefined || value === null || isNaN(value)) {
      value = 0;
    }
    
    const validatedValue = Math.max(0, value);
    
    setLastChanged(fieldName);
    setPrevValues(calculatedValues);
    
    setFieldValues(prev => ({
      ...prev,
      [fieldName]: validatedValue
    }));
  }, [calculatedValues]);

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

  const handleNavigationAttempt = useCallback((newDate: Date, newPeriod: PeriodType) => {
    // Always allow navigation since we removed the unsaved changes modal
    return true;
  }, []);

  const getSectionFields = useCallback((sectionKey: keyof typeof reportingFields) => {
    return reportingFields[sectionKey];
  }, []);

  // Check if opportunity sync button should be shown
  // Show button if: weekly period, user has an active GHL client configured
  const shouldShowOpportunitySync = useMemo(() => {
    if (period !== 'weekly' || !selectedUserId) return false;
    const client = getClientByRevenueProId(selectedUserId);
    return client?.status === 'active';
  }, [period, selectedUserId, getClientByRevenueProId]);

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

      // Step 3: Start leadsheet sync (runs in background)
      toast({
        title: "🔄 Starting Lead Sheet Sync",
        description: 'Lead sheet sync has been triggered and will continue in background...',
      });

      // Trigger leadsheet sync (don't await - let it run in background)
      triggerLeadSheetSync()
        .then((leadSheetResponse) => {
          if (leadSheetResponse.error) {
            toast({
              title: "❌ Lead Sheet Sync Failed",
              description: leadSheetResponse.message || 'Failed to sync lead sheets',
              variant: 'destructive',
            });
          } else {
            toast({
              title: "✅ Lead Sheet Sync Completed",
              description: 'Lead sheet sync has been completed successfully',
            });
          }
        })
        .catch((error) => {
          toast({
            title: "❌ Lead Sheet Sync Error",
            description: error instanceof Error ? error.message : 'An error occurred while syncing lead sheets',
            variant: 'destructive',
          });
        });

      // Reset loading state (leadsheet sync continues in background)
      setIsOpportunitySyncing(false);
    } catch (error) {
      toast({
        title: "❌ Sync Error",
        description: error instanceof Error ? error.message : 'An error occurred while syncing',
        variant: 'destructive',
      });
      setIsOpportunitySyncing(false);
    }
  }, [toast, selectedDate, period, selectedUserId, getReportingData, getClientByRevenueProId]);

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
            disableLogic={disableLogic}
            onNavigationAttempt={handleNavigationAttempt}
          />
        </div>

        {/* Reporting Sections */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          <TargetSection
            sectionKey="targets"
            title="Performance"
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
            gradientClass="bg-gradient-primary/10"
            fields={getSectionFields('targets')}
            fieldValues={fieldValues}
            calculatedValues={calculatedValues}
            onInputChange={handleInputChange}
            isHighlighted={isHighlighted}
            period={period}
            selectedDate={selectedDate}
            isDisabled={isDisabled}
            disabledMessage={disabledMessage}
            targetValues={processedTargetData}
            showTarget={true}
          />

          <TargetSection
            sectionKey="budgetReport"
            title="Budget Report"
            icon={<DollarSign className="h-5 w-5 text-primary" />}
            gradientClass="bg-gradient-secondary/10"
            fields={getSectionFields('budgetReport')}
            fieldValues={fieldValues}
            calculatedValues={calculatedValues}
            onInputChange={handleInputChange}
            isHighlighted={isHighlighted}
            period={period}
            selectedDate={selectedDate}
            isDisabled={isDisabled}
            disabledMessage={disabledMessage}
            targetValues={processedTargetData}
            showTarget={true}
          />

          <TargetSection
            sectionKey="targetReport"
            title="Target Report"
            icon={<TrendingUp className="h-5 w-5 text-accent" />}
            gradientClass="bg-gradient-accent/10"
            fields={getSectionFields('targetReport')}
            fieldValues={fieldValues}
            calculatedValues={calculatedValues}
            onInputChange={handleInputChange}
            isHighlighted={isHighlighted}
            period={period}
            selectedDate={selectedDate}
            isDisabled={isDisabled}
            disabledMessage={disabledMessage}
            targetValues={processedTargetData}
            showTarget={true}
            showOpportunitySyncButton={shouldShowOpportunitySync}
            onOpportunitySyncClick={handleOpportunitySync}
            isOpportunitySyncing={isOpportunitySyncing}
          />
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
