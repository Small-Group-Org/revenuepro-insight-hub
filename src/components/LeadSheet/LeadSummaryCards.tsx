import React from 'react';
import { Users } from 'lucide-react';
import { TopCard } from '@/pages/dashboard/components/DashboardTopCards';

interface StatusCounts {
  new: number;
  inProgress: number;
  estimateSet: number;
  unqualified: number;
}

interface LeadSummaryCardsProps {
  statusCounts: StatusCounts | null;
}

// Memoized component for summary cards to prevent unnecessary re-renders
export const LeadSummaryCards = React.memo(({ statusCounts }: LeadSummaryCardsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
    <TopCard
      title="New Leads"
      icon={<Users className="h-5 w-5 opacity-50 text-blue-500" />}
      metrics={[
        {
          label: "New Leads",
          value: statusCounts?.new || 0,
          format: 'number'
        }
      ]}
      description="Leads that are newly received and not yet processed."
      twoRowDesign={true}
    />
    <TopCard
      title="In Progress Leads"
      icon={<Users className="h-5 w-5 opacity-50 text-yellow-500" />}
      metrics={[
        {
          label: "In Progress Leads",
          value: statusCounts?.inProgress || 0,
          format: 'number'
        }
      ]}
      description="Leads currently being worked on by the team."
      twoRowDesign={true}
    />
    <TopCard
      title="Estimate Set Leads"
      icon={<Users className="h-5 w-5 opacity-50 text-green-500" />}
      metrics={[
        {
          label: "Estimate Set Leads",
          value: statusCounts?.estimateSet || 0,
          format: 'number'
        }
      ]}
      description="Leads where estimates have been provided to customers."
      twoRowDesign={true}
    />
    <TopCard
      title="Unqualified Leads"
      icon={<Users className="h-5 w-5 opacity-50 text-red-500" />}
      metrics={[
        {
          label: "Unqualified Leads",
          value: statusCounts?.unqualified || 0,
          format: 'number'
        }
      ]}
      description="Leads that don't meet qualification criteria."
      twoRowDesign={true}
    />
  </div>
));

LeadSummaryCards.displayName = 'LeadSummaryCards';
