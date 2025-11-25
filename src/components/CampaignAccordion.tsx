'use client';

import { useState } from 'react';
import { ProcessedCampaignData } from '@/types';
import { formatCurrency } from '@/lib/utils';
import AdSetAccordion from './AdSetAccordion.tsx';
import { ChevronRight } from 'lucide-react';

interface CampaignAccordionProps {
  data: ProcessedCampaignData;
}

export default function CampaignAccordion({ data }: CampaignAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center flex-1">
          <ChevronRight
            className={`w-5 h-5 text-gray-600 mr-3 transition-transform ${
              isOpen ? 'rotate-90' : ''
            }`}
          />
          <span className="text-lg font-semibold text-gray-800">Campaign</span>
        </div>
        <span className="font-semibold text-blue-600">
          {formatCurrency(data.campaignTotal)}
        </span>
      </button>
      {isOpen && (
        <div className="bg-gray-50 pl-5">
          {data.adsets.map((adset) => (
            <AdSetAccordion key={adset.id} adset={adset} />
          ))}
        </div>
      )}
    </div>
  );
}

