'use client';

import { Ad } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface AdItemProps {
  ad: Ad;
}

export default function AdItem({ ad }: AdItemProps) {
  return (
    <div className="flex items-start justify-between py-3 px-5 border-b border-gray-100 last:border-b-0">
      <span className="text-sm text-gray-600 break-words flex-1 max-w-[700px]">{ad.name}</span>
      <span className="font-medium text-blue-600 text-sm flex-shrink-0 ml-2">
        {formatCurrency(ad.spend)}
      </span>
    </div>
  );
}

