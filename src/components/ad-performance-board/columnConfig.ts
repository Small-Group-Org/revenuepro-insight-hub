import { ColumnConfig, PerformanceRow } from "@/types/adPerformanceBoard";

export const AVAILABLE_COLUMNS: ColumnConfig[] = [
  {
    id: "campaignName",
    label: "Campaign",
    category: "Dimensions",
    apiField: "campaignName",
    type: "text",
    sortable: true,
    isDefault: true,
  },
  {
    id: "adSetName",
    label: "Ad Set",
    category: "Dimensions",
    apiField: "adSetName",
    type: "text",
    sortable: true,
  },
  {
    id: "adName",
    label: "Ad Name",
    category: "Dimensions",
    apiField: "adName",
    type: "text",
    sortable: true,
  },
  {
    id: "spend",
    label: "Spend",
    category: "Cost",
    apiField: "spend",
    type: "currency",
    decimals: 2,
    sortable: true,
    aggregate: "sum",
    isDefault: true,
  },
  {
    id: "impressions",
    label: "Impressions",
    category: "Delivery",
    apiField: "impressions",
    type: "number",
    sortable: true,
    aggregate: "sum",
    isDefault: true,
  },
  {
    id: "reach",
    label: "Reach",
    category: "Delivery",
    apiField: "reach",
    type: "number",
    sortable: true,
    aggregate: "sum",
  },
  {
    id: "frequency",
    label: "Frequency",
    category: "Delivery",
    apiField: "frequency",
    type: "number",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
  },
  {
    id: "clicks",
    label: "Clicks",
    category: "Performance",
    apiField: "clicks",
    type: "number",
    sortable: true,
    aggregate: "sum",
    isDefault: true,
  },
  {
    id: "unique_clicks",
    label: "Unique Clicks",
    category: "Performance",
    apiField: "unique_clicks",
    type: "number",
    sortable: true,
    aggregate: "sum",
  },
  {
    id: "ctr",
    label: "CTR",
    category: "Performance",
    apiField: "ctr",
    type: "percentage",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
    isDefault: true,
  },
  {
    id: "unique_ctr",
    label: "Unique CTR",
    category: "Performance",
    apiField: "unique_ctr",
    type: "percentage",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
  },
  {
    id: "cpc",
    label: "CPC",
    category: "Cost",
    apiField: "cpc",
    type: "currency",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
  },
  {
    id: "cpm",
    label: "CPM",
    category: "Cost",
    apiField: "cpm",
    type: "currency",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
  },
  {
    id: "cpr",
    label: "CPR",
    category: "Cost",
    apiField: "cpr",
    type: "currency",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
  },
  {
    id: "post_engagements",
    label: "Post Engagements",
    category: "Engagement",
    apiField: "post_engagements",
    type: "number",
    sortable: true,
    aggregate: "sum",
  },
  {
    id: "post_reactions",
    label: "Post Reactions",
    category: "Engagement",
    apiField: "post_reactions",
    type: "number",
    sortable: true,
    aggregate: "sum",
  },
  {
    id: "post_comments",
    label: "Post Comments",
    category: "Engagement",
    apiField: "post_comments",
    type: "number",
    sortable: true,
    aggregate: "sum",
  },
  {
    id: "post_shares",
    label: "Post Shares",
    category: "Engagement",
    apiField: "post_shares",
    type: "number",
    sortable: true,
    aggregate: "sum",
  },
  {
    id: "post_saves",
    label: "Post Saves",
    category: "Engagement",
    apiField: "post_saves",
    type: "number",
    sortable: true,
    aggregate: "sum",
  },
  {
    id: "page_engagements",
    label: "Page Engagements",
    category: "Engagement",
    apiField: "page_engagements",
    type: "number",
    sortable: true,
    aggregate: "sum",
  },
  {
    id: "link_clicks",
    label: "Link Clicks",
    category: "Engagement",
    apiField: "link_clicks",
    type: "number",
    sortable: true,
    aggregate: "sum",
  },
  {
    id: "video_views",
    label: "Video Views",
    category: "Video",
    apiField: "video_views",
    type: "number",
    sortable: true,
    aggregate: "sum",
  },
  {
    id: "video_views_25pct",
    label: "Video Views 25%",
    category: "Video",
    apiField: "video_views_25pct",
    type: "number",
    sortable: true,
    aggregate: "sum",
  },
  {
    id: "video_views_50pct",
    label: "Video Views 50%",
    category: "Video",
    apiField: "video_views_50pct",
    type: "number",
    sortable: true,
    aggregate: "sum",
  },
  {
    id: "video_views_75pct",
    label: "Video Views 75%",
    category: "Video",
    apiField: "video_views_75pct",
    type: "number",
    sortable: true,
    aggregate: "sum",
  },
  {
    id: "video_views_100pct",
    label: "Video Views 100%",
    category: "Video",
    apiField: "video_views_100pct",
    type: "number",
    sortable: true,
    aggregate: "sum",
  },
  {
    id: "video_avg_watch_time",
    label: "Avg Watch Time",
    category: "Video",
    apiField: "video_avg_watch_time",
    type: "number",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
  },
  {
    id: "video_play_actions",
    label: "Video Play Actions",
    category: "Video",
    apiField: "video_play_actions",
    type: "number",
    sortable: true,
    aggregate: "sum",
  },
  {
    id: "total_conversions",
    label: "Total Conversions",
    category: "Conversions",
    apiField: "total_conversions",
    type: "number",
    sortable: true,
    aggregate: "sum",
  },
  {
    id: "conversion_value",
    label: "Conversion Value",
    category: "Conversions",
    apiField: "conversion_value",
    type: "currency",
    decimals: 2,
    sortable: true,
    aggregate: "sum",
  },
  {
    id: "cost_per_conversion",
    label: "Cost / Conversion",
    category: "Conversions",
    apiField: "cost_per_conversion",
    type: "currency",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
  },
  {
    id: "total_leads",
    label: "FB Leads",
    category: "Conversions",
    apiField: "total_leads",
    type: "number",
    sortable: true,
    aggregate: "sum",
    isDefault: true,
  },
  {
    id: "cost_per_lead",
    label: "FB CPL",
    category: "Conversions",
    apiField: "cost_per_lead",
    type: "currency",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
    isDefault: true,
  },
  {
    id: "numberOfLeads",
    label: "CRM Leads",
    category: "Leads",
    apiField: "numberOfLeads",
    type: "number",
    sortable: true,
    aggregate: "sum",
  },
  {
    id: "numberOfEstimateSets",
    label: "Estimate Sets",
    category: "Leads",
    apiField: "numberOfEstimateSets",
    type: "number",
    sortable: true,
    aggregate: "sum",
  },
  {
    id: "numberOfJobsBooked",
    label: "Jobs Booked",
    category: "Leads",
    apiField: "numberOfJobsBooked",
    type: "number",
    sortable: true,
    aggregate: "sum",
  },
  {
    id: "numberOfUnqualifiedLeads",
    label: "Unqualified Leads",
    category: "Leads",
    apiField: "numberOfUnqualifiedLeads",
    type: "number",
    sortable: true,
    aggregate: "sum",
  },
  {
    id: "costPerLead",
    label: "CRM CPL",
    category: "Lead KPIs",
    apiField: "costPerLead",
    type: "currency",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
  },
  {
    id: "costPerEstimateSet",
    label: "Cost / Estimate Set",
    category: "Lead KPIs",
    apiField: "costPerEstimateSet",
    type: "currency",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
  },
  {
    id: "costPerJobBooked",
    label: "Cost / Job Booked",
    category: "Lead KPIs",
    apiField: "costPerJobBooked",
    type: "currency",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
  },
  {
    id: "costOfMarketingPercent",
    label: "Cost of Marketing %",
    category: "Lead KPIs",
    apiField: "costOfMarketingPercent",
    type: "percentage",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
  },
  {
    id: "service",
    label: "Service",
    category: "Leads",
    apiField: "service",
    type: "text",
    sortable: true,
  },
  {
    id: "zipCode",
    label: "Zip Code",
    category: "Leads",
    apiField: "zipCode",
    type: "text",
    sortable: true,
  },
];

const formatNumber = (
  value: number,
  options?: { decimals?: number; prefix?: string; suffix?: string }
) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const { decimals = 0, prefix = "", suffix = "" } = options || {};
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
  return `${prefix}${formatted}${suffix}`;
};

export const formatCellValue = (column: ColumnConfig, value: any) => {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value !== "number" && column.type !== "text") {
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) value = numeric;
  }

  switch (column.type) {
    case "currency":
      return formatNumber(value as number, {
        decimals: column.decimals ?? 2,
        prefix: column.prefix ?? "$",
      });
    case "percentage":
      return formatNumber(value as number, {
        decimals: column.decimals ?? 2,
        suffix: column.suffix ?? "%",
      });
    case "number":
      return formatNumber(value as number, { decimals: column.decimals ?? 0 });
    default:
      return value as string;
  }
};

export const getAggregateValue = (
  column: ColumnConfig,
  data: PerformanceRow[]
) => {
  if (!column.aggregate || column.aggregate === "none") return null;
  const values = data
    .map((row) => row[column.apiField])
    .filter((v): v is number => typeof v === "number");

  if (!values.length) return null;

  const sum = values.reduce((acc, curr) => acc + curr, 0);

  const aggregateValue = (() => {
    switch (column.aggregate) {
      case "avg":
        return sum / values.length;
      case "min":
        return Math.min(...values);
      case "max":
        return Math.max(...values);
      default:
        return sum;
    }
  })();

  return formatCellValue(column, aggregateValue);
};

export const DEFAULT_COLUMN_ORDER = AVAILABLE_COLUMNS.filter(
  (c) => c.isDefault
).map((c) => c.id);

