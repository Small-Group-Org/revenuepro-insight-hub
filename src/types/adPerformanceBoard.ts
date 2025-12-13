export type GroupBy = "campaign" | "adset" | "ad";

export interface PerformanceBoardFilters {
  startDate: string;
  endDate: string;
  campaignName?: string | string[];
  adSetName?: string | string[];
  adName?: string | string[];
  estimateSetLeads?: boolean;
  jobBookedLeads?: boolean;
  zipCode?: string | string[];
  zipCodeOperator?: "=" | "!=";
  serviceType?: string | string[];
  serviceTypeOperator?: "=" | "!=";
  leadScore?: {
    min?: number;
    max?: number;
  };
}

export interface PerformanceBoardRequest {
  clientId: string;
  groupBy: GroupBy;
  filters: PerformanceBoardFilters;
  columns: Record<string, boolean>;
}

export type ColumnKind = "text" | "number" | "currency" | "percentage";

export interface ColumnConfig {
  id: string;
  label: string;
  category?: string;
  apiField: string;
  type: ColumnKind;
  description?: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: number;
  minWidth?: number;
  aggregate?: "sum" | "avg" | "min" | "max" | "none";
  decimals?: number;
  prefix?: string;
  suffix?: string;
  isDefault?: boolean;
  isPinned?: boolean;
}

export interface PerformanceRow {
  id?: string;
  campaignName?: string;
  adSetName?: string;
  adName?: string;
  service?: string;
  zipCode?: string;
  impressions?: number;
  unique_clicks?: number;
  reach?: number;
  frequency?: number;
  clicks?: number;
  ctr?: number;
  unique_ctr?: number;
  spend?: number;
  cpc?: number;
  cpm?: number;
  cpr?: number;
  post_engagements?: number;
  post_reactions?: number;
  post_comments?: number;
  post_shares?: number;
  post_saves?: number;
  page_engagements?: number;
  link_clicks?: number;
  video_views?: number;
  video_views_25pct?: number;
  video_views_50pct?: number;
  video_views_75pct?: number;
  video_views_100pct?: number;
  video_avg_watch_time?: number;
  video_play_actions?: number;
  total_conversions?: number;
  conversion_value?: number;
  cost_per_conversion?: number;
  total_leads?: number;
  cost_per_lead?: number;
  numberOfLeads?: number;
  numberOfEstimateSets?: number;
  numberOfJobsBooked?: number;
  numberOfUnqualifiedLeads?: number;
  costPerLead?: number;
  costPerEstimateSet?: number;
  costPerJobBooked?: number;
  costOfMarketingPercent?: number;
  [key: string]: string | number | undefined;
}

