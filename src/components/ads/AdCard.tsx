import { Video, Image as ImageIcon, LayoutGrid, Link as LinkIcon } from 'lucide-react';

interface AdCardProps {
  ad: {
    adName?: string;
    fb_cost_per_lead?: number;
    fb_total_leads?: number;
    fb_spend?: number;
    fb_link_clicks?: number;
    fb_impressions?: number;
    fb_video_views?: number;
    fb_clicks?: number;
    fb_post_reactions?: number;
    fb_post_comments?: number;
    fb_post_shares?: number;
    costPerLead?: number | null;
    costPerEstimateSet?: number | null;
    numberOfLeads?: number;
    numberOfEstimateSets?: number;
    estimateSetRate?: number | null;
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
  };
  conversionScore?: number;
  hookScore?: number;
  onClick?: () => void;
}

export function AdCard({ ad, onClick }: AdCardProps) {
  const creative = ad.creative;

  // Determine creative type info
  const getCreativeTypeInfo = () => {
    if (!creative) return { icon: ImageIcon, label: 'No Creative' };

    switch (creative.creativeType) {
      case 'video':
        return { icon: Video, label: 'Video' };
      case 'carousel':
        return { icon: LayoutGrid, label: 'Carousel' };
      case 'link':
        return { icon: LinkIcon, label: 'Link' };
      case 'image':
        return { icon: ImageIcon, label: 'Image' };
      default:
        return { icon: ImageIcon, label: 'Other' };
    }
  };

  const typeInfo = getCreativeTypeInfo();

  // Get the best available image/thumbnail
  const getMediaUrl = () => {
    if (!creative) return null;

    // For image ads, use imageUrl (high-res)
    if (creative.creativeType === 'image' && creative.imageUrl) {
      return creative.imageUrl;
    }

    // For video, carousel, link, and other types, use thumbnailUrl
    return creative.thumbnailUrl || creative.videos?.[0]?.thumbnailUrl || null;
  };

  const mediaUrl = getMediaUrl();

  // Format currency
  const formatCurrency = (value?: number | null) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return `$${value.toFixed(2)}`;
  };

  // Format percentage
  const formatPercentage = (value?: number | null) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  // Calculate Conversion Rate: facebook leads / link clicks
  const conversionRate = ad.fb_total_leads && ad.fb_link_clicks && ad.fb_link_clicks > 0
    ? ((ad.fb_total_leads / ad.fb_link_clicks) * 100)
    : null;

  // Calculate Thumbstop Rate: 3-second video plays / impressions
  // Using fb_video_views as a proxy for 3-second video plays
  const thumbstopRate = ad.fb_video_views && ad.fb_impressions && ad.fb_impressions > 0
    ? ((ad.fb_video_views / ad.fb_impressions) * 100)
    : null;

  // Calculate See More Rate: (Clicks (all) - Link Clicks - Post Reactions - Post Comments - Post Shares) / Impressions
  const seeMoreClicks = (ad.fb_clicks || 0) - (ad.fb_link_clicks || 0) - (ad.fb_post_reactions || 0) - (ad.fb_post_comments || 0) - (ad.fb_post_shares || 0);
  const seeMoreRate = ad.fb_impressions && ad.fb_impressions > 0
    ? ((seeMoreClicks / ad.fb_impressions) * 100)
    : null;

  return (
    <div
      className="w-full bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer"
      onClick={onClick}
    >
      {/* Media */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden rounded-t-xl">
        {mediaUrl ? (
          <img
            src={mediaUrl}
            alt={ad.adName || 'Ad creative'}
            className="w-full h-full object-cover"
            loading="eager"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <typeInfo.icon className="w-12 h-12" />
          </div>
        )}

        <span className="absolute bottom-2 left-2 bg-black/80 text-white text-[11px] px-2 py-1 rounded-md">
          {typeInfo.label}
        </span>
      </div>

      {/* Content */}
      <div className="p-2.5">
        {/* Title */}
        <h4 className="text-sm font-semibold text-gray-900 leading-snug mb-2 line-clamp-2">
          {ad.adName || 'Untitled Ad'}
        </h4>

        {/* Metrics */}
        <div className="space-y-1 text-xs">
          <Metric label="Cost / Lead" value={formatCurrency(ad.costPerLead)} />
          <Metric label="Leads" value={ad.numberOfLeads?.toString() || 'N/A'} />
          <MetricWithBar label="Conv. Rate" value={formatPercentage(conversionRate)} percentage={conversionRate} />
          <MetricWithBar label="Thumbstop Rate" value={formatPercentage(thumbstopRate)} percentage={thumbstopRate} />
          <MetricWithBar label="See More Rate" value={formatPercentage(seeMoreRate)} percentage={seeMoreRate} />
          <Metric label="Cost / Est. Set" value={formatCurrency(ad.costPerEstimateSet)} />
          <MetricWithBar label="Est. Set Rate" value={formatPercentage(ad.estimateSetRate)} percentage={ad.estimateSetRate} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>Amount Spent</span>
          <span className="font-semibold text-gray-900">
            {formatCurrency(ad.fb_spend)}
          </span>
        </div>
      </div>
    </div>
  );
}

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between bg-gray-50 rounded px-1.5 py-0.5">
    <span className="text-gray-500">{label}</span>
    <span className="font-semibold text-gray-900">{value}</span>
  </div>
);

const MetricWithBar = ({ label, value, percentage }: { label: string; value: string; percentage: number | null }) => {
  // Determine color based on percentage value
  const getColor = (pct: number | null) => {
    if (pct === null || pct === undefined || isNaN(pct)) return 'bg-gray-300';
    if (pct >= 70) return 'bg-green-500';
    if (pct >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const safePercentage = percentage === null || percentage === undefined || isNaN(percentage) ? 0 : Math.min(100, Math.max(0, percentage));
  const color = getColor(percentage);

  return (
    <div className="bg-gray-50 rounded px-1.5 py-0.5">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-gray-500">{label}</span>
        <span className="font-semibold text-gray-900">{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-0.5">
        <div
          className={`${color} h-0.5 rounded-full transition-all duration-300`}
          style={{ width: `${safePercentage}%` }}
        />
      </div>
    </div>
  );
};
