import { AdCard } from './AdCard';
import { AdDetailModal } from './AdDetailModal';
import { useState } from 'react';

interface Ad {
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

interface AdGridViewProps {
  ads: Ad[];
  conversionScoreMap?: Record<string, number>;
  hookScoreMap?: Record<string, number>;
  startDate?: string;
  endDate?: string;
}

export function AdGridView({ ads, conversionScoreMap = {}, hookScoreMap = {}, startDate, endDate }: AdGridViewProps) {
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAdClick = (ad: Ad) => {
    setSelectedAd(ad);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAd(null);
  };

  if (!ads || ads.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No ads found
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {ads.map((ad, index) => (
          <AdCard
            key={ad.creative?.id || index}
            ad={ad}
            conversionScore={conversionScoreMap[ad.adName || ''] || 50}
            hookScore={hookScoreMap[ad.adName || '']}
            onClick={() => handleAdClick(ad)}
          />
        ))}
      </div>

      {selectedAd && (
        <AdDetailModal
          open={isModalOpen}
          onClose={handleCloseModal}
          ad={selectedAd}
          conversionScore={conversionScoreMap[selectedAd.adName || ''] || 50}
          hookScore={hookScoreMap[selectedAd.adName || '']}
          startDate={startDate}
          endDate={endDate}
        />
      )}
    </>
  );
}
