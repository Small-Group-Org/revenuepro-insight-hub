import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Video, Image as ImageIcon, LayoutGrid, Link as LinkIcon } from 'lucide-react';

interface AdCardProps {
  ad: {
    adName?: string;
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
    };
  };
  // Optional: Pass in conversion score and hook score if available
  conversionScore?: number;
  hookScore?: number;
  leadsConversionRate?: number;
  onClick?: () => void;
}

export function AdCard({ ad, conversionScore = 50, hookScore, leadsConversionRate, onClick }: AdCardProps) {
  const creative = ad.creative;
  
  // Determine creative type icon and badge
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
    if (value === null || value === undefined) return 'N/A';
    return `$${value.toFixed(2)}`;
  };

  // Calculate conversion rate if not provided
  const calculatedConversionRate = leadsConversionRate ?? 
    (ad.numberOfLeads && ad.fb_total_leads 
      ? ((ad.numberOfLeads / ad.fb_total_leads) * 100) 
      : 0);

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* Creative Media */}
      <div className="relative aspect-video bg-gray-100">
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
            <CreativeIcon className="w-12 h-12" />
          </div>
        )}
        
        {/* Creative Type Badge */}
        <div className="absolute top-2 left-2">
          <Badge className={`${typeInfo.color} text-white flex items-center gap-1`}>
            <CreativeIcon className="w-3 h-3" />
            {typeInfo.label}
          </Badge>
        </div>

        {/* Video Duration Badge */}
        {creative?.creativeType === 'video' && creative.videos?.[0]?.duration && (
          <div className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="bg-black/70 text-white">
              {creative.videos[0].duration}s
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Ad Name */}
        <h3 className="font-semibold text-sm line-clamp-2 min-h-[40px]">
          {ad.adName || 'Untitled Ad'}
        </h3>

        {/* Metrics Grid */}
        <div className="space-y-2">
          <div>
            <p className="text-xs text-muted-foreground">Cost Per On-Facebook Lead</p>
            <p className="font-semibold text-lg">{formatCurrency(ad.fb_cost_per_lead)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">On-Facebook Leads</p>
            <p className="font-semibold text-lg">{ad.fb_total_leads || 0}</p>
          </div>
        </div>

        {/* Hook Score */}
        {hookScore !== undefined && hookScore !== null && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-muted-foreground">Hook Score</span>
              <span className="text-xs font-semibold">{hookScore}</span>
            </div>
            <Progress value={hookScore} className="h-2" />
          </div>
        )}

        {/* Amount Spent */}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Amount spent</span>
            <span className="font-semibold">{formatCurrency(ad.fb_spend)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
