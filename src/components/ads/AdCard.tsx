import { Video, Image as ImageIcon, LayoutGrid, Link as LinkIcon, FileQuestion, Layers } from 'lucide-react';

interface AdCardProps {
  ad: {
    adName?: string;
    fb_cost_per_lead?: number;
    fb_total_leads?: number;
    fb_spend?: number;
    fb_link_clicks?: number;
    fb_impressions?: number;
    fb_video_play_actions?: number; // Using this as proxy for 3-second video views (fb_video_views not available from API)
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

const SimpleMetric = ({ label, value, tooltip }: { label: string; value: string; tooltip?: string }) => (
  <div className="flex items-center justify-between py-0.5 gap-2 group relative">
    <span className="text-gray-600 text-sm">{label}</span>
    <span className="font-semibold text-gray-900 text-sm">{value}</span>
    {tooltip && (
      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap z-10 shadow-lg">
        {tooltip}
        <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
    )}
  </div>
);

const ScoreMetric = ({ label, score, tooltip }: { label: string; score: number; tooltip?: string }) => {
  const getColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-green-400';
    if (score >= 40) return 'bg-yellow-400';
    return 'bg-red-500';
  };

  const color = getColor(score);

  return (
    <div className="flex items-center justify-between py-0.5 gap-2 group relative">
      <span className="text-gray-600 text-sm whitespace-nowrap">{label}</span>
      <div className="flex items-center gap-2 flex-1 min-w-0 max-w-[40%]">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className={`${color} h-2 rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
        <span className="font-semibold text-gray-900 text-sm w-auto text-right flex-shrink-0">{score.toFixed(2)}%</span>
      </div>
      {tooltip && (
        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap z-10 shadow-lg">
          {tooltip}
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export function AdCard({ ad, conversionScore, hookScore, onClick }: AdCardProps) {
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
        return { icon: FileQuestion, label: 'Other' };
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

  // Get video URL for video ads
  const getVideoUrl = () => {
    if (!creative || creative.creativeType !== 'video') return null;
    // Check if videos array exists and has items
    if (!creative.videos || creative.videos.length === 0) return null;
    // Check multiple possible video URL locations
    return creative.videos[0]?.url || creative.videoId || null;
  };

  const mediaUrl = getMediaUrl();
  const videoUrl = getVideoUrl();
  const isVideo = creative?.creativeType === 'video';
  const hasVideos = creative?.videos && creative.videos.length > 0;

  // Debug log to see what data we have
  if (isVideo) {
    console.log('Video Ad:', {
      adName: ad.adName,
      videoUrl,
      hasVideos,
      creative,
    });
  }

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
  // NOTE: Using fb_video_play_actions as proxy since fb_video_views (3-sec threshold) is not available from API
  const thumbstopRate = ad.fb_video_play_actions && ad.fb_impressions && ad.fb_impressions > 0
    ? ((ad.fb_video_play_actions / ad.fb_impressions) * 100)
    : null;

  // Calculate See More Rate: (Clicks (all) - Link Clicks - Post Reactions - Post Comments - Post Shares) / Impressions
  const seeMoreClicks = (ad.fb_clicks || 0) - (ad.fb_link_clicks || 0) - (ad.fb_post_reactions || 0) - (ad.fb_post_comments || 0) - (ad.fb_post_shares || 0);
  const seeMoreRate = ad.fb_impressions && ad.fb_impressions > 0
    ? ((seeMoreClicks / ad.fb_impressions) * 100)
    : null;

  return (
    <div
      className="w-full bg-white border border-slate-200 rounded-lg shadow-lg hover:shadow-2xl hover:border-primary/10 transition-all duration-300 cursor-pointer hover:bg-gray-50 hover:scale-105"
      onClick={onClick}
    >
      {/* Media */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {isVideo && videoUrl ? (
          // Video with actual video URL
          <video
            src={videoUrl}
            className="w-full h-full object-cover"
            preload="metadata"
            playsInline
            muted
            crossOrigin="anonymous"
          />
        ) : isVideo && !hasVideos ? (
          // Video type but no videos array - show video icon with thumbnail background
          <div className="relative w-full h-full">
            {mediaUrl && (
              <img
                src={mediaUrl}
                alt={ad.adName || 'Ad creative'}
                className="w-full h-full object-cover opacity-40"
                loading="eager"
                crossOrigin="anonymous"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
             
            </div>
          </div>
        ) : creative?.creativeType === 'image' && mediaUrl ? (
          // Image with URL
          <img
            src={mediaUrl}
            alt={ad.adName || 'Ad creative'}
            className="w-full h-full object-cover"
            loading="eager"
            crossOrigin="anonymous"
            style={{ imageRendering: '-webkit-optimize-contrast' }}
          />
        ) : creative?.creativeType === 'carousel' && !mediaUrl ? (
          // Carousel without media - show carousel icon
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
            <div className="bg-gray-100 rounded-full p-4 mb-2">
              <LayoutGrid className="w-12 h-12 text-gray-400" />
            </div>
            <span className="text-xs text-gray-400">Carousel</span>
          </div>
        ) : creative?.creativeType === 'link' && !mediaUrl ? (
          // Link without media - show link icon
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
            <div className="bg-gray-100 rounded-full p-4 mb-2">
              <LinkIcon className="w-12 h-12 text-gray-400" />
            </div>
            <span className="text-xs text-gray-400">Link</span>
          </div>
        ) : creative?.creativeType === 'other' ? (
          // Other type - show icon with thumbnail background
          <div className="relative w-full h-full">
            {mediaUrl && (
              <img
                src={mediaUrl}
                alt={ad.adName || 'Ad creative'}
                className="w-full h-full object-cover opacity-40"
                loading="eager"
                crossOrigin="anonymous"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              
            </div>
          </div>
        ) : mediaUrl ? (
          // Any other type with media URL
          <img
            src={mediaUrl}
            alt={ad.adName || 'Ad creative'}
            className="w-full h-full object-cover"
            loading="eager"
            crossOrigin="anonymous"
            style={{ imageRendering: '-webkit-optimize-contrast' }}
          />
        ) : (
          // No media at all
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
            <div className="bg-gray-100 rounded-full p-4 mb-2">
              <FileQuestion className="w-12 h-12 text-gray-400" />
            </div>
            <span className="text-xs text-gray-400">No Media</span>
          </div>
        )}

        <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[13px] px-2 py-1 rounded-md flex items-center gap-1">
          <typeInfo.icon className="w-4 h-4" />
          {typeInfo.label}
        </span>
      </div>

      {/* Content */}
      <div className="px-4 py-2.5 flex flex-col">
        {/* Title */}
        <h4 className="text-lg font-semibold text-gray-900 leading-tight mb-2 line-clamp-2">
          {ad.adName || 'Untitled Ad'}
        </h4>

        {/* Metrics */}
        <div className="space-y-0.5 text-sm">
          <ScoreMetric
            label="Conversion Rate"
            score={conversionRate ?? 0}
            tooltip="Formula: Facebook Leads / Link Clicks"
          />
          <ScoreMetric
            label="Thumbstop Rate"
            score={thumbstopRate ?? 0}
            tooltip="Formula: 3-Second Video Plays / Impressions"
          />
          <ScoreMetric
            label="See More Rate"
            score={seeMoreRate ?? 0}
            tooltip="Formula: (Clicks (all) - Link Clicks - Post Reactions - Post Comments - Post Shares) / Impressions"
          />
          <SimpleMetric
            label="Cost Per Lead"
            value={formatCurrency(ad.costPerLead)}
            tooltip="Total cost divided by number of leads"
          />
          <SimpleMetric
            label="Cost Per Estimate Set"
            value={formatCurrency(ad.costPerEstimateSet)}
            tooltip="Total cost divided by number of estimate sets"
          />
          <ScoreMetric
            label="Estimate Set Rate"
            score={ad.estimateSetRate ?? 0}
            tooltip="Percentage of leads that set estimates"
          />
        </div>
      </div>
    </div>
  );
}

