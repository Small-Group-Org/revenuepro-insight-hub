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
  /**
   * Optional formula/explanation to show in tooltips, e.g.
   * "costPerLead = fb_spend / numberOfLeads"
   */
  formula?: string;
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
  // Facebook analytics metrics (prefixed with fb_)
  fb_impressions?: number;
  fb_unique_clicks?: number;
  fb_reach?: number;
  fb_frequency?: number;
  fb_clicks?: number;
  fb_ctr?: number;
  fb_unique_ctr?: number;
  fb_spend?: number;
  fb_cpc?: number;
  fb_cpm?: number;
  fb_cpr?: number;
  fb_post_engagements?: number;
  fb_post_reactions?: number;
  fb_post_comments?: number;
  fb_post_shares?: number;
  fb_post_saves?: number;
  fb_page_engagements?: number;
  fb_link_clicks?: number;
  fb_video_views?: number;
  fb_video_views_25pct?: number;
  fb_video_views_50pct?: number;
  fb_video_views_75pct?: number;
  fb_video_views_100pct?: number;
  fb_video_avg_watch_time?: number;
  fb_video_play_actions?: number;
  fb_total_conversions?: number;
  fb_conversion_value?: number;
  fb_cost_per_conversion?: number;
  fb_total_leads?: number;
  fb_cost_per_lead?: number;
  numberOfLeads?: number;
  numberOfEstimateSets?: number;
  numberOfJobsBooked?: number;
  numberOfUnqualifiedLeads?: number;
  costPerLead?: number;
  costPerEstimateSet?: number;
  costPerJobBooked?: number;
  costOfMarketingPercent?: number;
  estimateSetRate?: number;
  revenue?: number;
  [key: string]: string | number | undefined;
}

