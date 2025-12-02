import { CampaignDataItem } from "@/types";
import { EnrichedAdItem } from "@/service/facebookEnrichedAdsService";

/**
 * Transform Facebook enriched ads API response to CampaignDataItem format
 * This matches the dummy data structure used in the campaign accordion
 */
export function transformEnrichedAdsToCampaignData(
  enrichedAds: EnrichedAdItem[]
): CampaignDataItem[] {
  return enrichedAds.map((item) => {
    const { ad_name, adset_name, ad_id, adset_id, campaign_name, campaign_id, insights } = item;

    const impressions = insights.impressions || 0;
    const clicks = insights.clicks || 0;
    const spend = insights.spend || 0;

    // Calculate CTR (Click-Through Rate) as percentage
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

    // Calculate CPC (Cost Per Click)
    const cpc = clicks > 0 ? spend / clicks : 0;

    // Calculate CPM (Cost Per Mille - per 1000 impressions)
    const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;

    // Calculate CPP (Cost Per Person/Point) - using impressions as reach
    const reach = impressions; // Use impressions as reach
    const cpp = reach > 0 ? spend / reach : 0;

    // Extract website CTR from creative or use default
    const websiteCtr = item.creative?.raw
      ? [
          {
            action_type: "link_click",
            value: ctr.toFixed(6), // Use calculated CTR
          },
        ]
      : [
          {
            action_type: "link_click",
            value: ctr.toFixed(6),
          },
        ];

    return {
      impressions: impressions.toString(),
      ad_name,
      adset_name,
      ad_id,
      adset_id,
      campaign_name,
      campaign_id,
      spend: spend.toFixed(2),
      clicks: clicks.toString(),
      cpp: cpp.toFixed(6),
      cpm: cpm.toFixed(6),
      cpc: cpc.toFixed(6),
      ctr: ctr.toFixed(6),
      full_view_impressions: "0", // Not available in enriched ads
      full_view_reach: "0", // Not available in enriched ads
      instagram_profile_visits: "0", // Not available in enriched ads
      reach: impressions.toString(),
      social_spend: "0", // Not available in enriched ads
      website_ctr: websiteCtr,
      date_start: insights.date_start || "",
      date_stop: insights.date_stop || "",
    };
  });
}

