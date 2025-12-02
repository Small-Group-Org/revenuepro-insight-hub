import { doGET } from "@/utils/HttpUtils";
import { API_ENDPOINTS } from "@/utils/constant";

export interface EnrichedAdsParams {
  adAccountId: string; // Can be numeric or act_XXXXX format
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  queryType: "weekly" | "monthly" | "yearly";
}

export interface EnrichedAdItem {
  ad_name: string;
  adset_name: string;
  campaign_name: string;
  ad_id: string;
  adset_id: string;
  campaign_id: string;
  creative?: {
    id: string;
    name: string;
    primary_text?: string;
    headline?: string;
    raw?: unknown;
  };
  lead_form?: {
    id: string;
    name: string;
  };
  insights: {
    impressions: number;
    clicks: number;
    spend: number;
    date_start: string;
    date_stop: string;
  };
}

export interface WeeklyMetaSpend {
  startDate: string;
  endDate: string;
  adAccountId: string;
  spend: number;
  impressions: number;
  clicks: number;
}

export interface EnrichedAdsResponse {
  success: boolean;
  data: EnrichedAdItem[];
  count: number;
  error?: string;
}

export interface WeeklyMetaSpendResponse {
  success: boolean;
  data: WeeklyMetaSpend[];
  count: number;
  error?: string;
}

/**
 * Get enriched Facebook ads data
 * @param params - Query parameters including adAccountId, dates, and queryType
 * @returns Enriched ads response or weekly meta spend response
 */
export const getEnrichedAds = async (
  params: EnrichedAdsParams
): Promise<{
  error: boolean;
  message?: string;
  data?: EnrichedAdItem[] | WeeklyMetaSpend[];
  count?: number;
}> => {
  // Validate required parameters
  if (!params.adAccountId || !params.startDate || !params.endDate || !params.queryType) {
    return {
      error: true,
      message: "adAccountId, startDate, endDate, and queryType are required",
    };
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(params.startDate) || !dateRegex.test(params.endDate)) {
    return {
      error: true,
      message: "Dates must be in YYYY-MM-DD format",
    };
  }

  // Validate queryType
  const validQueryTypes = ["weekly", "monthly", "yearly"];
  if (!validQueryTypes.includes(params.queryType)) {
    return {
      error: true,
      message: "queryType must be one of: weekly, monthly, yearly",
    };
  }

  // Normalize adAccountId (ensure it has act_ prefix if it's numeric)
  let normalizedAdAccountId = params.adAccountId;
  if (!normalizedAdAccountId.startsWith("act_")) {
    normalizedAdAccountId = `act_${normalizedAdAccountId}`;
  }

  // Build query string
  const queryParams = new URLSearchParams({
    adAccountId: normalizedAdAccountId,
    startDate: params.startDate,
    endDate: params.endDate,
    queryType: params.queryType,
  });

  const response = await doGET(
    `${API_ENDPOINTS.FACEBOOK_ENRICHED_ADS}?${queryParams.toString()}`
  );

  if (!response.error && response.data?.success) {
    return {
      error: false,
      data: response.data.data,
      count: response.data.count,
    };
  }

  return {
    error: true,
    message:
      response.data?.error ||
      response.message ||
      "Failed to fetch enriched ads data",
  };
};

