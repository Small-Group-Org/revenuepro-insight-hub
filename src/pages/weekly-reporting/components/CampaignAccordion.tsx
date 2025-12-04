'use client';

import { ProcessedCampaignData } from '@/types';
import SingleCampaignAccordion from './SingleCampaignAccordion.tsx';

interface CampaignAccordionProps {
  data: ProcessedCampaignData;
}

export default function CampaignAccordion({ data }: CampaignAccordionProps) {
  return (
    <div>
      {data.campaigns.map((campaign) => (
        <SingleCampaignAccordion key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}

