import { CampaignDataItem, ProcessedCampaignData, AdSet, Ad } from '@/types';

export function processCampaignData(
  rawData: CampaignDataItem[]
): ProcessedCampaignData {
  // Group by adset_id
  const adsetMap = new Map<string, AdSet>();

  rawData.forEach((item) => {
    const adsetId = item.adset_id;
    const spend = parseFloat(item.spend) || 0;

    if (!adsetMap.has(adsetId)) {
      adsetMap.set(adsetId, {
        id: adsetId,
        name: item.adset_name,
        totalSpend: 0,
        ads: [],
      });
    }

    const adset = adsetMap.get(adsetId)!;
    adset.totalSpend += spend;

    // Add ad to this adset
    adset.ads.push({
      id: item.ad_id,
      name: item.ad_name,
      spend: spend,
    });
  });

  // Calculate campaign total
  let campaignTotal = 0;
  adsetMap.forEach((adset) => {
    campaignTotal += adset.totalSpend;
  });

  // Convert map to array
  const adsets = Array.from(adsetMap.values());

  return {
    campaignTotal,
    adsets,
  };
}

