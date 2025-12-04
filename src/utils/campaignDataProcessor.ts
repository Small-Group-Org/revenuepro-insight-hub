import { CampaignDataItem, ProcessedCampaignData, Campaign, AdSet, Ad } from '@/types';

export function processCampaignData(
  rawData: CampaignDataItem[]
): ProcessedCampaignData {
  // Group by campaign_id (or use 'default' if not available), then adset_id
  const campaignMap = new Map<string, Campaign>();
  const campaignAdsetMap = new Map<string, Map<string, AdSet>>();

  rawData.forEach((item) => {
    const campaignId = item.campaign_id || 'default';
    const campaignName = item.campaign_name || 'Default Campaign';
    const adsetId = item.adset_id;
    const spend = parseFloat(item.spend) || 0;

    if (!campaignMap.has(campaignId)) {
      campaignMap.set(campaignId, {
        id: campaignId,
        name: campaignName,
        totalSpend: 0,
        adsets: [],
      });
      campaignAdsetMap.set(campaignId, new Map<string, AdSet>());
    }

    const campaign = campaignMap.get(campaignId)!;
    const adsetMap = campaignAdsetMap.get(campaignId)!;

    if (!adsetMap.has(adsetId)) {
      const newAdset: AdSet = {
        id: adsetId,
        name: item.adset_name,
        totalSpend: 0,
        ads: [],
      };
      adsetMap.set(adsetId, newAdset);
      campaign.adsets.push(newAdset);
    }

    const adset = adsetMap.get(adsetId)!;
    adset.totalSpend += spend;
    campaign.totalSpend += spend;

    adset.ads.push({
      id: item.ad_id,
      name: item.ad_name,
      spend: spend,
    });
  });

  let campaignTotal = 0;
  campaignMap.forEach((campaign) => {
    campaignTotal += campaign.totalSpend;
  });

  const campaigns = Array.from(campaignMap.values());

  return {
    campaignTotal,
    campaigns,
  };
}

