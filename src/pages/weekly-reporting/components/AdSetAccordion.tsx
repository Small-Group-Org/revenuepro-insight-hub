'use client';

import { useState } from 'react';
import { AdSet } from '@/types';
import { formatCurrency } from '@/lib/utils';
import AdItem from './AdItem';
import { ChevronRight } from 'lucide-react';

interface AdSetAccordionProps {
  adset: AdSet;
}

export default function AdSetAccordion({ adset }: AdSetAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-start justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="flex items-start flex-1 min-w-0">
          <ChevronRight
            className={`w-5 h-5 text-gray-600 mr-3 transition-transform flex-shrink-0 mt-0.5 ${
              isOpen ? 'rotate-90' : ''
            }`}
          />
          <span className="text-base font-medium text-gray-800 break-words">
            {adset.name}
          </span>
        </div>
        <span className="font-semibold text-blue-600 flex-shrink-0 ml-2">
          {formatCurrency(adset.totalSpend)}
        </span>
      </button>
      {isOpen && (
        <div className="bg-gray-50 pl-10">
          {adset.ads.map((ad) => (
            <AdItem key={ad.id} ad={ad} />
          ))}
        </div>
      )}
    </div>
  );
}

