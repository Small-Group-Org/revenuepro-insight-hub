import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Video, Image as ImageIcon, LayoutGrid, Link as LinkIcon, ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
    fb_frequency?: number;
    fb_reach?: number;
  };
  conversionScore?: number;
  hookScore?: number;
  leadsConversionRate?: number;
  startDate?: string;
  endDate?: string;
}

export function AdDetailModal({ open, onClose, ad, conversionScore, hookScore, leadsConversionRate, startDate, endDate }: AdDetailModalProps) {
  const creative = ad.creative;
  const [isDimensionsOpen, setIsDimensionsOpen] = useState(true);
  const [isPerformanceOpen, setIsPerformanceOpen] = useState(false);
  const [isConversionOpen, setIsConversionOpen] = useState(false);

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
    (ad.numberOfLeads && ad.fb_total_leads 
      ? ((ad.numberOfLeads / ad.fb_total_leads) * 100) 
      : 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        {/* Header */}
        <div className="border-b border-slate-200 p-4 space-y-2">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">
              {ad.adName || 'Ad Details'}
            </DialogTitle>
            <p className="text-sm text-slate-500">Ad name</p>
          </DialogHeader>
          <div className="pt-2">
            <p className="text-sm text-slate-600">{formatDateRange()}</p>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,400px] overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {/* Left Column - Creative Preview */}
          <div className="p-6 border-r border-slate-200">
            <div className="max-w-md mx-auto space-y-3">
              <div className="relative bg-white rounded-lg border border-slate-200 overflow-hidden">
                {mediaUrl ? (
                  <img 
                    src={mediaUrl}
                    alt={ad.adName || 'Ad creative'}
                    className="w-full h-auto"
                    loading="eager"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-full aspect-video flex items-center justify-center bg-slate-100 text-slate-400">
                    <CreativeIcon className="w-16 h-16" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="p-6 space-y-4 bg-slate-50">
            {/* Dimensions Section */}
            <Collapsible open={isDimensionsOpen} onOpenChange={setIsDimensionsOpen}>
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
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
                        <p className="text-sm font-medium text-slate-900">{ad.adName || 'N/A'}</p>
                        {creative?.id && (
                          <p className="text-xs text-slate-500">ID {creative.id}</p>
                        )}
                      </div>
                    </div>

                    {ad.adSetName && (
                      <div className="flex flex-col gap-1 py-2">
                        <span className="text-sm text-slate-600">Adset</span>
                        <p className="text-sm font-medium text-slate-900">{ad.adSetName}</p>
                      </div>
                    )}

                    {ad.campaignName && (
                      <div className="flex flex-col gap-1 py-2">
                        <span className="text-sm text-slate-600">Campaign</span>
                        <p className="text-sm font-medium text-slate-900">{ad.campaignName}</p>
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
                        <p className="text-base font-semibold text-slate-900">{formatCurrency(ad.fb_spend)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Cost per Lead</p>
                        <p className="text-base font-semibold text-slate-900">{formatCurrency(ad.fb_cost_per_lead)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Impressions</p>
                        <p className="text-base font-semibold text-slate-900">{formatNumber(ad.fb_impressions)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Clicks</p>
                        <p className="text-base font-semibold text-slate-900">{formatNumber(ad.fb_clicks)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">CTR</p>
                        <p className="text-base font-semibold text-slate-900">{formatPercent(ad.fb_ctr)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">CPC</p>
                        <p className="text-base font-semibold text-slate-900">{formatCurrency(ad.fb_cpc)}</p>
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
                        <p className="text-base font-semibold text-slate-900">{formatNumber(ad.fb_total_leads)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Actual Leads</p>
                        <p className="text-base font-semibold text-slate-900">{formatNumber(ad.numberOfLeads)}</p>
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
