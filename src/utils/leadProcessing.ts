import { Lead } from '@/types';

export interface ConversionRate {
  clientId: string;
  keyName: string;
  keyField: string;
  conversionRate: number;
  pastTotalCount: number;
  pastTotalEst: number;
}

export const FIELD_WEIGHTS = {
  service: 30,
  adSet: 30,
  adName: 20,
  date: 20,
} as const;

export const getConversionRate = (
  conversionRates: ConversionRate[],
  field: string,
  value: string
): number => {
  const rate = conversionRates.find(
    cr => cr.keyField === field && cr.keyName === value
  );
  return rate?.conversionRate || 0;
};

// Helper function to get date-based conversion rate (monthly)
export const getDateConversionRate = (
  conversionRates: ConversionRate[],
  leadDate: string
): number => {
  const date = new Date(leadDate);
  const monthYear = date.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });
  
  return getConversionRate(conversionRates, 'date', monthYear);
};

export const calculateLeadScore = (
  lead: Lead,
  conversionRates: ConversionRate[]
): number => {
  if (!conversionRates || conversionRates.length === 0) {
    return 50; // Default score if no conversion rates available
  }

  let totalScore = 0;
  let totalWeight = 0;

  const serviceRate = getConversionRate(conversionRates, 'service', lead.service);
  totalScore += serviceRate * FIELD_WEIGHTS.service;
  totalWeight += FIELD_WEIGHTS.service;

  const adSetRate = getConversionRate(conversionRates, 'adSet', lead.adSetName);
  totalScore += adSetRate * FIELD_WEIGHTS.adSet;
  totalWeight += FIELD_WEIGHTS.adSet;

  const adNameRate = getConversionRate(conversionRates, 'adName', lead.adName);
  totalScore += adNameRate * FIELD_WEIGHTS.adName;
  totalWeight += FIELD_WEIGHTS.adName;

  const dateRate = getDateConversionRate(conversionRates, lead.leadDate);
  totalScore += dateRate * FIELD_WEIGHTS.date;
  totalWeight += FIELD_WEIGHTS.date;

  const finalScore = totalWeight > 0 ? totalScore / totalWeight : 50;
  
  // Ensure score is between 0 and 100 and round to nearest integer
  return Math.round(Math.max(0, Math.min(100, finalScore * 100)));
};

export const getScoreInfo = (score: number) => {
  if (score >= 80) return { 
    color: 'bg-gradient-to-r from-green-500 to-emerald-600', 
    textColor: 'text-white', 
    label: 'Excellent' 
  };
  if (score >= 60) return { 
    color: 'bg-gradient-to-r from-yellow-500 to-orange-500', 
    textColor: 'text-white', 
    label: 'Good' 
  };
  if (score >= 40) return { 
    color: 'bg-gradient-to-r from-orange-500 to-red-500', 
    textColor: 'text-white', 
    label: 'Fair' 
  };
  return { 
    color: 'bg-gradient-to-r from-red-500 to-pink-600', 
    textColor: 'text-white', 
    label: 'Poor' 
  };
};

export const getStatusInfo = (status: string) => {
  switch (status) {
    case 'new':
      return { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'New' };
    case 'in_progress':
      return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'In Progress' };
    case 'estimate_set':
      return { color: 'bg-green-100 text-green-800 border-green-200', label: 'Estimate Set' };
    case 'unqualified':
      return { color: 'bg-red-100 text-red-800 border-red-200', label: 'Unqualified' };
    default:
      return { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Unknown' };
  }
};
