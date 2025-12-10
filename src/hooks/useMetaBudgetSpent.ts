import { useState, useEffect, useMemo, useCallback } from 'react';
import { getEnrichedAds } from '@/service/facebookEnrichedAdsService';
import { transformEnrichedAdsToCampaignData } from '@/utils/facebookAdsTransformer';
import { getUserProfile } from '@/service/metaAdAccountService';
import { CampaignDataItem } from '@/types';

/**
 * Metadata fields to exclude when processing reporting data
 */
const METADATA_FIELDS = new Set([
  'userId', '_id', 'createdAt', 'updatedAt', '__v', 'startDate', 'endDate'
]);

/**
 * Calculate total campaign spend from campaign data
 */
export const calculateTotalCampaignSpend = (campaignData: CampaignDataItem[]): number => {
  if (!campaignData || campaignData.length === 0) return 0;
  return campaignData.reduce((sum, item) => {
    const spend = parseFloat(item.spend) || 0;
    return sum + spend;
  }, 0);
};

/**
 * Check if all three manual budget fields are zero
 */
export const areAllManualBudgetsZero = (dataEntry: any): boolean => {
  const testingBudgetSpent = dataEntry?.testingBudgetSpent || 0;
  const awarenessBrandingBudgetSpent = dataEntry?.awarenessBrandingBudgetSpent || 0;
  const leadGenerationBudgetSpent = dataEntry?.leadGenerationBudgetSpent || 0;
  return testingBudgetSpent === 0 && awarenessBrandingBudgetSpent === 0 && leadGenerationBudgetSpent === 0;
};

/**
 * Preserve all existing fields except metadata
 */
export const preserveReportingFields = (dataEntry: any): any => {
  const preservedFields: any = {};
  Object.keys(dataEntry).forEach(key => {
    if (!METADATA_FIELDS.has(key)) {
      const value = dataEntry[key];
      if (value !== undefined) {
        preservedFields[key] = value !== null ? value : 0;
      }
    }
  });
  return preservedFields;
};

/**
 * Custom hook for managing Meta budget spent functionality
 * Handles meta integration check, campaign data fetching, and auto-upsert logic
 */
export const useMetaBudgetSpent = (selectedUserId: string | null) => {
  const [hasMetaIntegration, setHasMetaIntegration] = useState<boolean | null>(null);
  const [campaignData, setCampaignData] = useState<CampaignDataItem[]>([]);
  const [isLoadingCampaignData, setIsLoadingCampaignData] = useState(false);

  // Check if user has meta integration (fbAdAccountId)
  useEffect(() => {
    const checkMetaIntegration = async () => {
      if (!selectedUserId) {
        setHasMetaIntegration(null);
        return;
      }

      try {
        const userProfile = await getUserProfile(selectedUserId);
        if (!userProfile.error && userProfile.data?.fbAdAccountId) {
          setHasMetaIntegration(true);
        } else {
          setHasMetaIntegration(false);
        }
      } catch (error) {
        // If error checking, assume no integration
        setHasMetaIntegration(false);
      }
    };

    checkMetaIntegration();
  }, [selectedUserId]);

  // Calculate total campaign spend from campaign data
  const totalCampaignSpend = useMemo(() => {
    return calculateTotalCampaignSpend(campaignData);
  }, [campaignData]);

  /**
   * Fetch campaign data for a given date range
   */
  const fetchCampaignData = useCallback(async (
    clientId: string,
    startDate: string,
    endDate: string,
    queryType: "weekly" | "monthly" | "yearly"
  ): Promise<{ success: boolean; data?: CampaignDataItem[]; error?: string }> => {
    if (!clientId || hasMetaIntegration !== true) {
      return { success: false, error: 'No meta integration or client ID' };
    }

    setIsLoadingCampaignData(true);
    try {
      const enrichedAdsResponse = await getEnrichedAds({
        clientId,
        startDate,
        endDate,
        queryType,
      });

      if (enrichedAdsResponse.error || !enrichedAdsResponse.data) {
        return { 
          success: false, 
          error: enrichedAdsResponse.message || 'Failed to fetch enriched ads data' 
        };
      }

      // Handle both array and single item responses
      const adsData = Array.isArray(enrichedAdsResponse.data) 
        ? enrichedAdsResponse.data 
        : [enrichedAdsResponse.data];

      // Transform the enriched ads data to match CampaignDataItem format
      const transformedData = transformEnrichedAdsToCampaignData(adsData as any[]);
      
      return { success: true, data: transformedData };
    } catch (error) {
      console.error('Error fetching campaign data:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    } finally {
      setIsLoadingCampaignData(false);
    }
  }, [hasMetaIntegration]);

  /**
   * Auto-upsert metaBudgetSpent for a single reporting data entry
   */
  const upsertMetaBudgetSpentForEntry = useCallback(async (
    dataEntry: any,
    clientId: string,
    period: "weekly" | "monthly" | "yearly",
    upsertReportingData: (data: any) => Promise<void>,
    getReportingData: (startDate: string, endDate: string, queryType: string, period: string) => Promise<void>,
    getDateRange: (date: Date, period: string | "weekly" | "monthly" | "yearly") => { startDate: string; endDate: string; queryType: string },
    selectedDate: Date
  ): Promise<boolean> => {
    if (!dataEntry) return false;

    // Check if metaBudgetSpent already exists
    const existingMetaBudgetSpent = dataEntry.metaBudgetSpent;
    if (existingMetaBudgetSpent !== undefined && existingMetaBudgetSpent !== null) {
      return false; // Already has metaBudgetSpent, skip
    }

    // Check if all three budget spent fields are zero
    if (!areAllManualBudgetsZero(dataEntry)) {
      return false; // Manual budgets exist, don't upsert
    }

    const startDate = dataEntry.startDate;
    const endDate = dataEntry.endDate;

    if (!startDate || !endDate) {
      return false; // Skip if dates are missing
    }

    try {
      // For individual entries, always use weekly queryType regardless of period
      // This ensures we get the correct data for the specific date range
      const queryType = "weekly" as const;

      // Fetch campaign data
      const result = await fetchCampaignData(clientId, startDate, endDate, queryType);

      if (!result.success || !result.data || result.data.length === 0) {
        return false; // No campaign data available
      }

      const totalCampaignSpend = calculateTotalCampaignSpend(result.data);

      // Only upsert if we have campaign spend data
      if (totalCampaignSpend > 0) {
        const preservedFields = preserveReportingFields(dataEntry);

        const dataToUpsert = {
          startDate: startDate,
          endDate: endDate,
          ...preservedFields,
          metaBudgetSpent: totalCampaignSpend,
        };

        await upsertReportingData(dataToUpsert);

        // Refetch reporting data to get updated data from API
        const { startDate: queryStartDate, endDate: queryEndDate, queryType: refetchQueryType } = getDateRange(selectedDate, period);
        await getReportingData(queryStartDate, queryEndDate, refetchQueryType, period);

        return true; // Successfully upserted
      }
    } catch (error) {
      console.error('Error auto-upserting metaBudgetSpent:', error);
    }

    return false;
  }, [fetchCampaignData]);

  return {
    hasMetaIntegration,
    campaignData,
    setCampaignData,
    isLoadingCampaignData,
    totalCampaignSpend,
    fetchCampaignData,
    upsertMetaBudgetSpentForEntry,
  };
};

