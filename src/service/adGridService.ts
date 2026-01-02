import { doPOST } from "@/utils/HttpUtils";
import { API_ENDPOINTS } from "@/utils/constant";

export interface AdGridFilters {
  startDate: string;
  endDate: string;
  campaignName?: string | string[];
  adSetName?: string | string[];
  adName?: string | string[];
}

export interface AdGridRequest {
  clientId: string;
  filters: AdGridFilters;
}

export interface AdGridAd {
  adName?: string;
  campaignName?: string;
  adSetName?: string;
  // Facebook metrics needed for calculations
  fb_total_leads?: number;
  fb_link_clicks?: number;
  fb_video_play_actions?: number;
  fb_impressions?: number;
  fb_clicks?: number;
  fb_post_reactions?: number;
  fb_post_comments?: number;
  fb_post_shares?: number;
  // Cost metrics from backend
  costPerLead?: number | null;
  costPerEstimateSet?: number | null;
  estimateSetRate?: number | null;
  // Additional fields for display
  numberOfLeads?: number;
  numberOfEstimateSets?: number;
  creative?: {
    id: string;
    name?: string;
    creativeType?: 'image' | 'video' | 'carousel' | 'link' | 'other';
    thumbnailUrl?: string;
    imageUrl?: string;
    imageHash?: string;
    videoId?: string;
    videos?: Array<{
      id: string;
      url: string;
      thumbnailUrl?: string;
      duration?: number;
    }>;
    primaryText?: string;
    headline?: string;
  };
}

interface AdGridServiceResponse {
  error: boolean;
  message?: string;
  data?: AdGridAd[];
}

/**
 * Fetches ad data specifically for the grid view with only required fields
 * This is optimized for the AdCard component display
 */
export const fetchAdGridData = async (
  payload: AdGridRequest
): Promise<AdGridServiceResponse> => {
  const { clientId, filters } = payload;
  const query = new URLSearchParams({ clientId }).toString();

  // Request only the columns we need for the ad grid
  const columns = {
    adName: true,
    campaignName: true,
    adSetName: true,
    // Facebook metrics for calculations
    fb_total_leads: true,
    fb_link_clicks: true,
    fb_video_play_actions: true,
    fb_impressions: true,
    fb_clicks: true,
    fb_post_reactions: true,
    fb_post_comments: true,
    fb_post_shares: true,
    // Cost metrics
    costPerLead: true,
    costPerEstimateSet: true,
    estimateSetRate: true,
    // Additional fields
    numberOfLeads: true,
    numberOfEstimateSets: true,
  };

  const body = {
    groupBy: 'ad' as const,
    filters,
    columns,
  };

  const response = await doPOST(
    `${API_ENDPOINTS.FACEBOOK_AD_PERFORMANCE_BOARD}?${query}`,
    body
  );

  if (!response.error) {
    const responseData = response.data as any;
    const ads = responseData?.data ?? (Array.isArray(responseData) ? responseData : []);

    return {
      error: false,
      data: ads as AdGridAd[],
    };
  }

  return {
    error: true,
    message: response.message || "Unable to load ad grid data",
  };
};
