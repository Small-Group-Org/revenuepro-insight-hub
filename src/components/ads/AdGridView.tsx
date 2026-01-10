import { AdCard } from './AdCard';
import { AdDetailModal } from './AdDetailModal';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AdGridAd } from '@/service/adGridService';

type Ad = AdGridAd;

interface AdGridViewProps {
  ads: Ad[];
  conversionScoreMap?: Record<string, number>;
  hookScoreMap?: Record<string, number>;
  startDate?: string;
  endDate?: string;
  clientId?: string;
}

export function AdGridView({ ads, conversionScoreMap = {}, hookScoreMap = {}, startDate, endDate, clientId }: AdGridViewProps) {
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const handleAdClick = (ad: Ad) => {
    setSelectedAd(ad);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAd(null);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Calculate pagination
  const totalPages = Math.ceil((ads?.length || 0) / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedAds = useMemo(() => {
    return ads.slice(startIndex, endIndex);
  }, [ads, startIndex, endIndex]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  if (!ads || ads.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No ads found
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg">
      {/* Pagination Controls - Top */}
      <div className="flex items-center justify-between mb-3 px-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>
            Showing {startIndex + 1}-{Math.min(endIndex, ads.length)} of {ads.length} ads
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show:</span>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-[80px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 px-3">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 p-4">
        {paginatedAds.map((ad, index) => (
          <AdCard
            key={ad.creative?.id || index}
            ad={ad}
            conversionScore={conversionScoreMap[ad.adName || ''] || 50}
            hookScore={hookScoreMap[ad.adName || '']}
            onClick={() => handleAdClick(ad)}
          />
        ))}
      </div>

      {/* Pagination Controls - Bottom */}
      <div className="flex items-center justify-center mt-3 pb-4">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="h-8 px-3"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-gray-600 px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="h-8 px-3"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
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
          clientId={clientId}
        />
      )}
    </div>
  );
}
