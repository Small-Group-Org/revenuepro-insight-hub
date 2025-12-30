// Example usage in your Ad Performance Board page

import { useState } from 'react';
import { AdGridView } from '@/components/ads/AdGridView';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Table as TableIcon } from 'lucide-react';

export function AdPerformanceBoard() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [ads, setAds] = useState([]); // Your ads data from API

  // Fetch ads data when groupBy is "ad"
  // const response = await fetch('/api/v1/facebook/ad-performance-board?clientId=xxx&groupBy=ad', {
  //   method: 'POST',
  //   body: JSON.stringify({ filters, columns })
  // });

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-end gap-2">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('grid')}
        >
          <LayoutGrid className="w-4 h-4 mr-2" />
          Grid View
        </Button>
        <Button
          variant={viewMode === 'table' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('table')}
        >
          <TableIcon className="w-4 h-4 mr-2" />
          Table View
        </Button>
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
        <AdGridView 
          ads={ads}
          // Optional: Pass conversion and hook scores if you have them
          // conversionScoreMap={{ 'Ad Name': 50 }}
          // hookScoreMap={{ 'Ad Name': 75 }}
        />
      ) : (
        <div>
          {/* Your existing table component */}
          {/* <AdPerformanceTable ads={ads} /> */}
        </div>
      )}
    </div>
  );
}
