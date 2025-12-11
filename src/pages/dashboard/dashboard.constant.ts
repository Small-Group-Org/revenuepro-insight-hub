export type SortField = 'userName' | 'totalRevenue' | 'totalBudgetSpent' | 'costOfMarketingPercent';

export interface TableHeaderConfig {
  label: string;
  sortField?: SortField;
  align?: 'left' | 'right';
  className?: string;
  isSpecial?: boolean; // For special columns like "#"
}

export const REVENUE_TABLE_HEADERS: TableHeaderConfig[] = [
  {
    label: '#',
    isSpecial: true,
    className: 'w-12',
  },
  {
    label: 'Account Name',
    sortField: 'userName',
    align: 'left',
  },
  {
    label: 'Total Budget Spent',
    sortField: 'totalBudgetSpent',
    align: 'right',
  },
  {
    label: 'Total Revenue',
    sortField: 'totalRevenue',
    align: 'right',
  },
  {
    label: 'CoM %',
    sortField: 'costOfMarketingPercent',
    align: 'right',
  },
  {
    label: 'Estimate Set%',
    align: 'right',
  },
  {
    label: 'Cost Per Lead',
    align: 'right',
  },
];

// Chart colors
export const COLORS = ["#1f1c13", "#9ca3af", "#306BC8", "#2A388F", "#396F9C"];

export const CHART_DIMENSIONS = {
  minWidth: "300px",
  height: "320px",
};

export const chartConfig = {
  count: {
    label: "Count",
  },
  estimateSet: {
    label: "Estimates Set",
  },
};