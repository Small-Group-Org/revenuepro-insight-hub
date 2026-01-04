import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Video, Image as ImageIcon, LayoutGrid, Link as LinkIcon, ChevronUp, ChevronDown, Loader2, CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';
import { fetchAdPerformanceBoard } from '@/service/adPerformanceBoardService';
import { useUserContext } from '@/utils/UserContext';
import { useUserStore } from '@/stores/userStore';
import { format } from 'date-fns';

interface AdDetailModalProps {
  open: boolean;
  onClose: () => void;
  ad: {
    adName?: string;
    campaignName?: string;
    adSetName?: string;
    fb_cost_per_lead?: number;
    fb_total_leads?: number;
    fb_spend?: number;
    costPerLead?: number | null;
    numberOfLeads?: number;
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
      callToAction?: any;
    };
    // Metrics
    fb_impressions?: number;
    fb_clicks?: number;
    fb_ctr?: number;
    fb_cpc?: number;
    fb_cpm?: number;
    fb_link_clicks?: number;
    fb_video_views?: number;
    fb_post_reactions?: number;
    fb_post_comments?: number;
    fb_post_shares?: number;
    fb_frequency?: number;
    fb_reach?: number;
  };
  conversionScore?: number;
  hookScore?: number;
  leadsConversionRate?: number;
  startDate?: string;
  endDate?: string;
  clientId?: string;
}

export function AdDetailModal({ open, onClose, ad, leadsConversionRate, startDate, endDate, clientId: clientIdProp }: AdDetailModalProps) {
  const creative = ad.creative;
  const { user } = useUserContext();
  const { selectedUserId } = useUserStore();

  // Get clientId from props, or fall back to selectedUserId or user._id
  const clientId = clientIdProp || selectedUserId || (user as any)?._id;

  const [isDimensionsOpen, setIsDimensionsOpen] = useState(true);
  const [isPerformanceOpen, setIsPerformanceOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isEngagementOpen, setIsEngagementOpen] = useState(false);
  const [isConversionOpen, setIsConversionOpen] = useState(false);

  // Modal-specific date filter state (independent from outer filters)
  const [modalStartDate, setModalStartDate] = useState<string>(startDate || '');
  const [modalEndDate, setModalEndDate] = useState<string>(endDate || '');
  const [customStart, setCustomStart] = useState<Date>(startDate ? new Date(startDate) : new Date());
  const [customEnd, setCustomEnd] = useState<Date>(endDate ? new Date(endDate) : new Date());
  const [startMonth, setStartMonth] = useState<Date>(startDate ? new Date(startDate) : new Date());
  const [endMonth, setEndMonth] = useState<Date>(endDate ? new Date(endDate) : new Date());
  const [openPicker, setOpenPicker] = useState(false);
  const currentYear = new Date().getFullYear();

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      // update temporary pick only; do not apply until user clicks Apply
      setCustomStart(date);
      setStartMonth(date);
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      const today = new Date();
      const selected = date > today ? today : date;
      // update temporary pick only; do not apply until user clicks Apply
      setCustomEnd(selected);
      setEndMonth(selected);
    }
  };

  const formatCustomRangeLabel = (start: Date, end: Date): string => {
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    if (startYear === endYear) {
      return `${format(start, "MMM dd")} - ${format(end, "MMM dd, yyyy")}`;
    } else {
      return `${format(start, "MMM dd, yyyy")} - ${format(end, "MMM dd, yyyy")}`;
    }
  };

  // Fetch ad data with modal's date filter
  const { data: modalAdData, isLoading: isLoadingModalData } = useQuery({
    queryKey: ['ad-detail-modal', ad.adName, modalStartDate, modalEndDate, clientId],
    queryFn: async () => {
      if (!modalStartDate || !modalEndDate || !clientId) {
        console.log('Missing required params:', { modalStartDate, modalEndDate, clientId });
        return null;
      }

      console.log('Fetching ad detail with params:', {
        clientId,
        startDate: modalStartDate,
        endDate: modalEndDate,
        adName: ad.adName,
      });

      const response = await fetchAdPerformanceBoard({
        clientId,
        groupBy: 'ad',
        filters: {
          startDate: modalStartDate,
          endDate: modalEndDate,
          adName: ad.adName,
        },
        columns: {
          adName: true,
          fb_cost_per_lead: true,
          fb_total_leads: true,
          fb_spend: true,
          fb_impressions: true,
          fb_clicks: true,
          fb_ctr: true,
          fb_cpc: true,
          fb_cpm: true,
          fb_frequency: true,
          fb_reach: true,
          fb_link_clicks: true,
          fb_video_views: true,
          fb_post_reactions: true,
          fb_post_comments: true,
          fb_post_shares: true,
          costPerLead: true,
          numberOfLeads: true,
        },
      });

      console.log('API Response:', response);

      if (response.error) {
        console.error('API Error:', response.error, response.message);
        return null;
      }

      if (!response.data || response.data.length === 0) {
        console.log('No data returned for ad:', ad.adName);
        return null;
      }

      console.log('Successfully fetched modal data:', response.data[0]);
      return response.data[0];
    },
    enabled: Boolean(modalStartDate && modalEndDate && clientId && open),
    staleTime: 60 * 1000,
  });

  // Use modal data if available, otherwise fall back to prop data
  const displayAd = modalAdData || ad;

  console.log('Display Ad Data:', {
    modalAdData,
    ad,
    displayAd,
    isUsingModalData: !!modalAdData,
  });

  // Format date range
  const formatDateRange = () => {
    if (!startDate || !endDate) return 'Select date range';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };
    
    return `Since ${formatDate(start)}: ${formatDate(start)} - ${formatDate(end)}`;
  };

  // Get creative type info
  const getCreativeTypeInfo = () => {
    if (!creative) return { icon: ImageIcon, label: 'No Creative', color: 'bg-gray-500' };
    
    switch (creative.creativeType) {
      case 'video':
        return { icon: Video, label: 'Video', color: 'bg-blue-500' };
      case 'carousel':
        return { icon: LayoutGrid, label: 'Carousel', color: 'bg-purple-500' };
      case 'link':
        return { icon: LinkIcon, label: 'Link', color: 'bg-green-500' };
      case 'image':
        return { icon: ImageIcon, label: 'Image', color: 'bg-orange-500' };
      default:
        return { icon: ImageIcon, label: 'Other', color: 'bg-gray-500' };
    }
  };

  const typeInfo = getCreativeTypeInfo();
  const CreativeIcon = typeInfo.icon;

  // Get media URL
  const getMediaUrl = () => {
    if (!creative) return null;
    
    if (creative.creativeType === 'image' && creative.imageUrl) {
      return creative.imageUrl;
    }
    
    return creative.thumbnailUrl || creative.videos?.[0]?.thumbnailUrl || null;
  };

  const mediaUrl = getMediaUrl();

  // Get video URL for video ads
  const getVideoUrl = () => {
    if (!creative || creative.creativeType !== 'video') return null;
    if (!creative.videos || creative.videos.length === 0) return null;
    return creative.videos[0]?.url || creative.videoId || null;
  };

  const videoUrl = getVideoUrl();
  const isVideo = creative?.creativeType === 'video';

  // Format helpers
  const formatCurrency = (value?: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (value?: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toLocaleString();
  };

  const formatPercent = (value?: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  const calculatedConversionRate = leadsConversionRate ??
    (displayAd.numberOfLeads && displayAd.fb_total_leads
      ? ((displayAd.numberOfLeads / displayAd.fb_total_leads) * 100)
      : 0);

  // Calculate Superads Scores from ad data

  // 1. Click Score: Based on CTR (Click-Through Rate)
  // Formula: (CTR / benchmark) * 100, where benchmark CTR = 2% (industry average)
  const calculateClickScore = () => {
    const ctr = displayAd.fb_ctr || 0;
    const benchmark = 2; // 2% benchmark
    const score = (ctr / benchmark) * 100;
    return Math.min(100, Math.max(0, Math.round(score)));
  };

  // 2. Conversion Score: Based on conversion rate (Link Clicks to Leads)
  // Formula: (Leads / Link Clicks) * 100 * multiplier, where good conversion = 10%
  const calculateConversionScore = () => {
    const leads = displayAd.fb_total_leads || 0;
    const linkClicks = displayAd.fb_link_clicks || 0;
    if (linkClicks === 0) return 0;
    const conversionRate = (leads / linkClicks) * 100;
    const benchmark = 10; // 10% benchmark
    const score = (conversionRate / benchmark) * 100;
    return Math.min(100, Math.max(0, Math.round(score)));
  };

  // 3. Engagement Score: Based on engagement rate (reactions, comments, shares)
  // Formula: ((Reactions + Comments + Shares) / Impressions) * 100 * multiplier
  const calculateEngagementScore = () => {
    const reactions = displayAd.fb_post_reactions || 0;
    const comments = displayAd.fb_post_comments || 0;
    const shares = displayAd.fb_post_shares || 0;
    const impressions = displayAd.fb_impressions || 0;
    if (impressions === 0) return 0;
    const engagementRate = ((reactions + comments + shares) / impressions) * 100;
    const benchmark = 0.5; // 0.5% benchmark
    const score = (engagementRate / benchmark) * 100;
    return Math.min(100, Math.max(0, Math.round(score)));
  };

  // 4. Hold Score: Based on video views / impressions (Thumbstop Rate)
  // Formula: (Video Views / Impressions) * 100, where good thumbstop = 30%
  const calculateHoldScore = () => {
    const videoViews = displayAd.fb_video_views || 0;
    const impressions = displayAd.fb_impressions || 0;
    if (impressions === 0) return 0;
    const thumbstopRate = (videoViews / impressions) * 100;
    const benchmark = 30; // 30% benchmark
    const score = (thumbstopRate / benchmark) * 100;
    return Math.min(100, Math.max(0, Math.round(score)));
  };

  // 5. Hook Score: Based on early engagement (3-second video views or initial clicks)
  // Formula: Similar to Hold Score but focusing on initial engagement
  const calculateHookScore = () => {
    // Using video views as a proxy for hook effectiveness
    const videoViews = displayAd.fb_video_views || 0;
    const impressions = displayAd.fb_impressions || 0;
    if (impressions === 0) return 0;
    const hookRate = (videoViews / impressions) * 100;
    const benchmark = 25; // 25% benchmark (slightly lower than hold)
    const score = (hookRate / benchmark) * 100;
    return Math.min(100, Math.max(0, Math.round(score)));
  };

  const clickScore = calculateClickScore();
  const conversionScoreCalculated = calculateConversionScore();
  const engagementScore = calculateEngagementScore();
  const holdScore = calculateHoldScore();
  const hookScoreCalculated = calculateHookScore();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden p-0">
        {/* Header */}
        <div className="border-b border-slate-200 p-4 space-y-3">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">
              {displayAd.adName || 'Ad Details'}
            </DialogTitle>
            <p className="text-sm text-slate-500">Ad name</p>
          </DialogHeader>

          {/* Independent Date Filter */}
          <div>
            <Popover open={openPicker} onOpenChange={setOpenPicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-normal border-slate-300 hover:bg-slate-100 hover:border-slate-400 text-slate-700"
                >
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-slate-600" />
                  <span className="text-slate-700">
                    {formatCustomRangeLabel(customStart, customEnd)}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="grid grid-cols-2">
                  <div className="relative">
                    <p className="absolute top-6 left-6 text-sm font-medium text-slate-600 mb-2 text-center">Start</p>
                    <Calendar
                      mode="single"
                      selected={customStart}
                      onSelect={handleStartDateChange}
                      showOutsideDays
                      month={startMonth}
                      onMonthChange={(m) => m && setStartMonth(m)}
                      classNames={{
                        day_today:
                          "relative text-muted-foreground after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-muted-foreground",
                        caption:
                          "flex pl-10 justify-center pt-1 relative items-center",
                        caption_label: "hidden",
                        caption_dropdowns:
                          "flex items-center gap-2 justify-center",
                        dropdown_month:
                          "h-9 text-sm bg-background border border-input rounded-md flex items-center leading-none text-foreground focus:outline-none focus:ring-0",
                        dropdown_year:
                          "h-9 text-sm bg-background border border-input rounded-md flex items-center leading-none text-foreground focus:outline-none focus:ring-0",
                      }}
                      captionLayout="dropdown"
                      fromYear={1990}
                      toYear={currentYear + 10}
                      pagedNavigation
                    />
                  </div>
                  <div className="relative">
                    <p className="absolute top-6 left-10 text-sm font-medium text-slate-600 mb-2 text-center">End</p>
                    <Calendar
                      mode="single"
                      selected={customEnd}
                      onSelect={handleEndDateChange}
                      showOutsideDays
                      month={endMonth}
                      disabled={{ after: new Date() }}
                      onMonthChange={(m) => m && setEndMonth(m)}
                      classNames={{
                        day_today:
                          "relative text-muted-foreground after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-muted-foreground",
                        caption:
                          "flex pl-10 justify-center pt-1 relative items-center",
                        caption_label: "hidden",
                        caption_dropdowns:
                          "flex items-center gap-2 justify-center",
                        dropdown_month:
                          "h-9 text-sm bg-background border border-input rounded-md flex items-center leading-none text-foreground focus:outline-none focus:ring-0",
                        dropdown_year:
                          "h-9 text-sm bg-background border border-input rounded-md flex items-center leading-none text-foreground focus:outline-none focus:ring-0",
                      }}
                      captionLayout="dropdown"
                      fromYear={1990}
                      toYear={currentYear + 10}
                      pagedNavigation
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 px-3 pb-3">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      // revert temporary picks to currently applied modal dates
                      setCustomStart(modalStartDate ? new Date(modalStartDate) : new Date());
                      setStartMonth(modalStartDate ? new Date(modalStartDate) : new Date());
                      setCustomEnd(modalEndDate ? new Date(modalEndDate) : new Date());
                      setEndMonth(modalEndDate ? new Date(modalEndDate) : new Date());
                      setOpenPicker(false);
                    }}
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      // apply temporary picks to modal filters
                      setModalStartDate(format(customStart, 'yyyy-MM-dd'));
                      setModalEndDate(format(customEnd, 'yyyy-MM-dd'));
                      setOpenPicker(false);
                    }}
                    size="sm"
                  >
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Loader Overlay */}
        {isLoadingModalData && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-slate-600">Loading ad data...</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,400px] overflow-hidden" style={{ maxHeight: 'calc(80vh - 120px)' }}>
          {/* Left Column - Creative Preview */}
          <div className="p-4 border-r border-slate-200 flex flex-col">
            <div className="flex-1 flex flex-col">
              <div className="relative bg-white rounded-lg overflow-hidden mb-3 flex items-center justify-center">
                {isVideo && videoUrl ? (
                  <video
                    src={videoUrl}
                    className="w-auto max-h-[50vh] object-contain"
                    controls
                    playsInline
                    muted
                    crossOrigin="anonymous"
                  />
                ) : mediaUrl ? (
                  <img
                    src={mediaUrl}
                    alt={displayAd.adName || 'Ad creative'}
                    className="w-auto max-h-[50vh] object-contain"
                    loading="eager"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-full aspect-video flex items-center justify-center bg-slate-100 text-slate-400">
                    <span className="text-sm font-medium">No content</span>
                  </div>
                )}
              </div>

              {/* Ad Copy */}
              {creative?.primaryText && (
                <div className="bg-slate-50 rounded-lg p-3 flex-1">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{creative.primaryText}</p>
                </div>
              )}

              {/* Footer: show Creative ID title and value, centered */}
              <div className="mt-3 text-sm text-slate-600 text-center">
                {creative?.id ? (
                  <>
                    <p className="text-sm font-medium text-slate-400 mt-1"><span ></span>Creative ID - {creative.id} | Meta</p>
                  </>
                ) : (
                  <p className="text-sm font-medium text-slate-900">Meta</p>
                )}
              </div>
            </div>
            
          </div>

          {/* Right Column - Details */}
          <div className="p-4 space-y-3 bg-slate-50 overflow-y-auto pb-16 pr-4" style={{ maxHeight: 'calc(80vh - 120px)' }}>
           
             

            {/* Dimensions Section */}
            <Collapsible open={isDimensionsOpen} onOpenChange={setIsDimensionsOpen}>
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      h
                      <span className="text-sm font-medium text-slate-700">Meta</span>
                    </div>
                    {isDimensionsOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-100">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-slate-600">Ad status</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
                        Active
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-slate-600">Optimization goal</span>
                      <span className="text-sm font-medium text-slate-900">lead_generation</span>
                    </div>
                    
                    <div className="flex flex-col gap-1 py-2">
                      <span className="text-sm text-slate-600">Ad</span>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{displayAd.adName || 'N/A'}</p>
                        {creative?.id && (
                          <p className="text-xs text-slate-500">ID {creative.id}</p>
                        )}
                      </div>
                    </div>

                    {displayAd.adSetName && (
                      <div className="flex flex-col gap-1 py-2">
                        <span className="text-sm text-slate-600">Adset</span>
                        <p className="text-sm font-medium text-slate-900">{displayAd.adSetName}</p>
                      </div>
                    )}

                    {displayAd.campaignName && (
                      <div className="flex flex-col gap-1 py-2">
                        <span className="text-sm text-slate-600">Campaign</span>
                        <p className="text-sm font-medium text-slate-900">{displayAd.campaignName}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-slate-600">Landing page</span>
                      <span className="text-sm font-medium text-blue-600">fb.me</span>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-slate-600">Ad type</span>
                      <div className="flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-slate-600" />
                        <span className="text-sm font-medium text-slate-900">{typeInfo.label}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-slate-600">Call to action</span>
                      <span className="text-sm font-medium text-slate-900">
                        {creative?.callToAction?.type || creative?.callToAction?.value || 'Get quote'}
                      </span>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Performance Section */}
            <Collapsible open={isPerformanceOpen} onOpenChange={setIsPerformanceOpen}>
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <span className="text-sm font-medium text-slate-700">Performance</span>
                    {isPerformanceOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-4 py-2">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Spend</p>
                        <p className="text-base font-semibold text-slate-900">{formatCurrency(displayAd.fb_spend)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Cost per Lead</p>
                        <p className="text-base font-semibold text-slate-900">{formatCurrency(displayAd.fb_cost_per_lead)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Impressions</p>
                        <p className="text-base font-semibold text-slate-900">{formatNumber(displayAd.fb_impressions)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Clicks</p>
                        <p className="text-base font-semibold text-slate-900">{formatNumber(displayAd.fb_clicks)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">CTR</p>
                        <p className="text-base font-semibold text-slate-900">{formatPercent(displayAd.fb_ctr)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">CPC</p>
                        <p className="text-base font-semibold text-slate-900">{formatCurrency(displayAd.fb_cpc)}</p>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Video Section */}
            <Collapsible open={isVideoOpen} onOpenChange={setIsVideoOpen}>
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <span className="text-sm font-medium text-slate-700">Video</span>
                    {isVideoOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-4 py-2">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Video Views</p>
                        <p className="text-base font-semibold text-slate-900">{formatNumber(displayAd.fb_impressions)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">3-sec Views</p>
                        <p className="text-base font-semibold text-slate-900">N/A</p>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Engagement Section */}
            <Collapsible open={isEngagementOpen} onOpenChange={setIsEngagementOpen}>
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <span className="text-sm font-medium text-slate-700">Engagement</span>
                    {isEngagementOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-4 py-2">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Reactions</p>
                        <p className="text-base font-semibold text-slate-900">N/A</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Comments</p>
                        <p className="text-base font-semibold text-slate-900">N/A</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Shares</p>
                        <p className="text-base font-semibold text-slate-900">N/A</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Engagement Rate</p>
                        <p className="text-base font-semibold text-slate-900">N/A</p>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Conversion Section */}
            <Collapsible open={isConversionOpen} onOpenChange={setIsConversionOpen}>
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <span className="text-sm font-medium text-slate-700">Conversion</span>
                    {isConversionOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-4 py-2">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">On-Facebook Leads</p>
                        <p className="text-base font-semibold text-slate-900">{formatNumber(displayAd.fb_total_leads)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Actual Leads</p>
                        <p className="text-base font-semibold text-slate-900">{formatNumber(displayAd.numberOfLeads)}</p>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Score bar component with color-coded progress
const ScoreBar = ({ label, score }: { label: string; score: number }) => {
  const getColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const color = getColor(score);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-600 w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-slate-200 rounded-full h-1.5">
        <div
          className={`${color} h-1.5 rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-900 w-8 text-right">{score}</span>
    </div>
  );
};
