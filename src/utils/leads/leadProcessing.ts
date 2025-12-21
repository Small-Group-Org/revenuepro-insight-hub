export const FIELD_WEIGHTS = {
  service: 30,
  adSetName: 10, 
  adName: 10,
  leadDate: 0,
  zip: 50
} as const;

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
    case 'virtual_quote':
      return { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Virtual Quote' };
    case 'estimate_canceled':
      return { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Estimate Canceled' };
    case 'proposal_presented':
      return { color: 'bg-teal-100 text-teal-800 border-teal-200', label: 'Proposal Presented' };
    case 'job_booked':
      return { color: 'bg-green-100 text-green-800 border-green-200', label: 'Job Booked' };
    case 'job_lost':
      return { color: 'bg-red-100 text-red-800 border-red-200', label: 'Job Lost' };
    case 'unqualified':
      return { color: 'bg-red-100 text-red-800 border-red-200', label: 'Unqualified' };
    default:
      return { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Unknown' };
  }
};

// Helper function to check if proposal amount is allowed for a status
export const canSetProposalAmount = (status: string): boolean => {
  return ['estimate_set', 'virtual_quote', 'proposal_presented', 'job_lost'].includes(status);
};

// Helper function to check if job booked amount is allowed for a status
export const canSetJobBookedAmount = (status: string): boolean => {
  return status === 'job_booked';
};
