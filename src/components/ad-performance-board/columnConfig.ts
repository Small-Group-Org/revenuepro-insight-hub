import { ColumnConfig, PerformanceRow, PerformanceBoardAverages } from "@/types/adPerformanceBoard";

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
    apiField: "fb_spend",
    type: "currency",
    decimals: 2,
    sortable: true,
    aggregate: "sum",
    isDefault: true,
    description: "Total ad spend from Facebook Analytics",
  },
  {
    id: "impressions",
    label: "Impressions",
    category: "Delivery",
    apiField: "fb_impressions",
    type: "number",
    sortable: true,
    aggregate: "sum",
    isDefault: true,
    description: "Total number of times ads were shown (impressions)",
  },
  {
    id: "reach",
    label: "Reach",
    category: "Delivery",
    apiField: "fb_reach",
    type: "number",
    sortable: true,
    aggregate: "sum",
    description: "Total unique users who saw the ads (reach)",
  },
  {
    id: "frequency",
    label: "Frequency",
    category: "Delivery",
    apiField: "fb_frequency",
    type: "number",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
    aggregateFormula: "fb_impressions / fb_reach",
    description: "Average number of times each person saw the ads",
  },
  {
    id: "clicks",
    label: "Clicks",
    category: "Performance",
    apiField: "fb_clicks",
    type: "number",
    sortable: true,
    aggregate: "sum",
    isDefault: true,
    description: "Total number of clicks on ads",
  },
  {
    id: "unique_clicks",
    label: "Unique Clicks",
    category: "Performance",
    apiField: "fb_unique_clicks",
    type: "number",
    sortable: true,
    aggregate: "sum",
    description: "Total unique users who clicked on ads",
  },
  {
    id: "ctr",
    label: "CTR",
    category: "Performance",
    apiField: "fb_ctr",
    type: "percentage",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
    aggregateFormula: "(fb_clicks / fb_impressions) * 100",
    isDefault: true,
    description: "Average click-through rate across weeks",
  },
  {
    id: "unique_ctr",
    label: "Unique CTR",
    category: "Performance",
    apiField: "fb_unique_ctr",
    type: "percentage",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
    aggregateFormula: "(fb_unique_clicks / fb_impressions) * 100",
    description: "Average unique click-through rate across weeks",
  },
  {
    id: "cpc",
    label: "CPC",
    category: "Cost",
    apiField: "fb_cpc",
    type: "currency",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
    aggregateFormula: "fb_spend / fb_clicks",
    description: "Average cost per click",
  },
  {
    id: "cpm",
    label: "CPM",
    category: "Cost",
    apiField: "fb_cpm",
    type: "currency",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
    aggregateFormula: "(fb_spend / fb_impressions) * 1000",
    description: "Average cost per 1,000 impressions",
  },
  {
    id: "cpr",
    label: "CPR",
    category: "Cost",
    apiField: "fb_cpr",
    type: "currency",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
    aggregateFormula: "(fb_spend / fb_reach) * 1000",
    description: "Average cost per 1,000 reach",
  },
  {
    id: "post_engagements",
    label: "Post Engagements",
    category: "Engagement",
    apiField: "fb_post_engagements",
    type: "number",
    sortable: true,
    aggregate: "sum",
    description: "Total post engagements (all reactions, comments, shares, etc.)",
  },
  {
    id: "post_reactions",
    label: "Post Reactions",
    category: "Engagement",
    apiField: "fb_post_reactions",
    type: "number",
    sortable: true,
    aggregate: "sum",
    description: "Total reactions on posts (like, love, etc.)",
  },
  {
    id: "post_comments",
    label: "Post Comments",
    category: "Engagement",
    apiField: "fb_post_comments",
    type: "number",
    sortable: true,
    aggregate: "sum",
    description: "Total comments on ads or posts",
  },
  {
    id: "post_shares",
    label: "Post Shares",
    category: "Engagement",
    apiField: "fb_post_shares",
    type: "number",
    sortable: true,
    aggregate: "sum",
    description: "Total number of times posts were shared",
  },
  {
    id: "post_saves",
    label: "Post Saves",
    category: "Engagement",
    apiField: "fb_post_saves",
    type: "number",
    sortable: true,
    aggregate: "sum",
    description: "Total number of times posts were saved",
  },
  {
    id: "page_engagements",
    label: "Page Engagements",
    category: "Engagement",
    apiField: "fb_page_engagements",
    type: "number",
    sortable: true,
    aggregate: "sum",
    description: "Total engagements with the page",
  },
  {
    id: "link_clicks",
    label: "Link Clicks",
    category: "Engagement",
    apiField: "fb_link_clicks",
    type: "number",
    sortable: true,
    aggregate: "sum",
    description: "Total link clicks from the ads",
  },
  {
    id: "video_views",
    label: "Video Views",
    category: "Video",
    apiField: "fb_video_views",
    type: "number",
    sortable: true,
    aggregate: "sum",
    description: "Total video views",
  },
  {
    id: "video_views_25pct",
    label: "Video Views 25%",
    category: "Video",
    apiField: "fb_video_views_25pct",
    type: "number",
    sortable: true,
    aggregate: "sum",
    description: "Videos watched to at least 25% of their length",
  },
  {
    id: "video_views_50pct",
    label: "Video Views 50%",
    category: "Video",
    apiField: "fb_video_views_50pct",
    type: "number",
    sortable: true,
    aggregate: "sum",
    description: "Videos watched to at least 50% of their length",
  },
  {
    id: "video_views_75pct",
    label: "Video Views 75%",
    category: "Video",
    apiField: "fb_video_views_75pct",
    type: "number",
    sortable: true,
    aggregate: "sum",
    description: "Videos watched to at least 75% of their length",
  },
  {
    id: "video_views_100pct",
    label: "Video Views 100%",
    category: "Video",
    apiField: "fb_video_views_100pct",
    type: "number",
    sortable: true,
    aggregate: "sum",
    description: "Videos watched to 100% of their length (completed views)",
  },
  {
    id: "video_avg_watch_time",
    label: "Avg Watch Time",
    category: "Video",
    apiField: "fb_video_avg_watch_time",
    type: "number",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
    description: "Average video watch time (seconds)",
  },
  {
    id: "video_play_actions",
    label: "Video Play Actions",
    category: "Video",
    apiField: "fb_video_play_actions",
    type: "number",
    sortable: true,
    aggregate: "sum",
    description: "Total video play actions",
  },
  {
    id: "total_conversions",
    label: "Total Conversions",
    category: "Conversions",
    apiField: "fb_total_conversions",
    type: "number",
    sortable: true,
    aggregate: "sum",
    description: "Total conversions tracked by Facebook",
  },
  {
    id: "conversion_value",
    label: "Conversion Value",
    category: "Conversions",
    apiField: "fb_conversion_value",
    type: "currency",
    decimals: 2,
    sortable: true,
    aggregate: "sum",
    description: "Total conversion value tracked by Facebook",
  },
  {
    id: "cost_per_conversion",
    label: "Cost Per Conversion",
    category: "Conversions",
    apiField: "fb_cost_per_conversion",
    type: "currency",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
    aggregateFormula: "fb_spend / fb_total_conversions",
    description: "Average cost per conversion",
  },
  {
    id: "total_leads",
    label: "FB Leads",
    category: "Conversions",
    apiField: "fb_total_leads",
    type: "number",
    sortable: true,
    aggregate: "sum",
    isDefault: true,
    description: "Total leads tracked by Facebook",
  },
  {
    id: "cost_per_lead",
    label: "FB CPL",
    category: "Conversions",
    apiField: "fb_cost_per_lead",
    type: "currency",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
    aggregateFormula: "fb_spend / fb_total_leads",
    isDefault: true,
    description: "Average cost per lead reported by Facebook",
    formula: "FB Spend / FB Leads",
  },
  {
    id: "numberOfLeads",
    label: "Leads",
    category: "Leads",
    apiField: "numberOfLeads",
    type: "number",
    sortable: true,
    aggregate: "sum",
    description: "Total number of leads in the selected date range",
    formula: "COUNT(all leads)",
  },
  {
    id: "numberOfEstimateSets",
    label: "Estimate Sets",
    category: "Leads",
    apiField: "numberOfEstimateSets",
    type: "number",
    sortable: true,
    aggregate: "sum",
    description: "Total number of leads that reached the Estimate Set stage",
    formula: "COUNT(leads WHERE status = 'estimate_set')",
  },
  {
    id: "numberOfJobsBooked",
    label: "Jobs Booked",
    category: "Leads",
    apiField: "numberOfJobsBooked",
    type: "number",
    sortable: true,
    aggregate: "sum",
    description: "Total number of leads that resulted in booked jobs",
    formula: "COUNT(leads WHERE status = job_booked_amt')",
  },
  {
    id: "numberOfUnqualifiedLeads",
    label: "Unqualified Leads",
    category: "Leads",
    apiField: "numberOfUnqualifiedLeads",
    type: "number",
    sortable: true,
    aggregate: "sum",
    description: "Total number of leads marked as unqualified",
    formula: "COUNT(leads WHERE status = 'unqualified')",
  },
  {
    id: "numberOfVirtualQuotes",
    label: "Virtual Quotes",
    category: "Leads",
    apiField: "numberOfVirtualQuotes",
    type: "number",
    sortable: true,
    aggregate: "sum",
    description: "Total number of leads with virtual quotes",
    formula: "COUNT(leads WHERE status = 'virtual_quote')",
  },
  {
    id: "numberOfEstimateCanceled",
    label: "Estimate Canceled",
    category: "Leads",
    apiField: "numberOfEstimateCanceled",
    type: "number",
    sortable: true,
    aggregate: "sum",
    description: "Total number of leads with canceled estimates",
    formula: "COUNT(leads WHERE status = 'estimate_canceled')",
  },
  {
    id: "numberOfProposalPresented",
    label: "Proposal Presented",
    category: "Leads",
    apiField: "numberOfProposalPresented",
    type: "number",
    sortable: true,
    aggregate: "sum",
    description: "Total number of leads with proposals presented",
    formula: "COUNT(leads WHERE status = 'proposal_presented')",
  },
  {
    id: "numberOfJobLost",
    label: "Job Lost",
    category: "Leads",
    apiField: "numberOfJobLost",
    type: "number",
    sortable: true,
    aggregate: "sum",
    description: "Total number of leads that resulted in lost jobs",
    formula: "COUNT(leads WHERE status = 'job_lost')",
  },
  {
    id: "costPerLead",
    label:"Cost Per Lead",
    category: "Lead KPIs",
    apiField: "costPerLead",
    type: "currency",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
    aggregateFormula: "fb_spend / numberOfLeads",
    description: "Average marketing cost to acquire each CRM lead",
    formula: "FB Spend / Number Of Leads",
  },
  {
    id: "costPerEstimateSet",
    label: "Cost Per Estimate Set",
    category: "Lead KPIs",
    apiField: "costPerEstimateSet",
    type: "currency",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
    aggregateFormula: "fb_spend / numberOfEstimateSets",
    description: "Average marketing cost to generate each Estimate Set",
    formula: "FB Spend / Number Of Estimate Sets",
  },
  {
    id: "costPerJobBooked",
    label: "Cost Per Job Booked",
    category: "Lead KPIs",
    apiField: "costPerJobBooked",
    type: "currency",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
    aggregateFormula: "fb_spend / numberOfJobsBooked",
    description: "Average marketing cost to book each job",
    formula: "FB Spend / Number Of Jobs Booked",
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
    aggregateFormula: "(fb_spend / revenue) * 100",
    description: "Marketing cost expressed as a percentage of total revenue",
    formula: "(FB Spend / Revenue) × 100",
  },
  {
    id: "estimateSetRate",
    label: "Estimate Set Rate",
    category: "Lead KPIs",
    apiField: "estimateSetRate",
    type: "percentage",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
    aggregateFormula: "((numberOfEstimateSets + numberOfVirtualQuotes + numberOfProposalPresented + numberOfJobsBooked) / (numberOfEstimateSets + numberOfVirtualQuotes + numberOfProposalPresented + numberOfJobsBooked + numberOfUnqualifiedLeads + numberOfEstimateCanceled + numberOfJobLost)) * 100",
    description: "Success rate showing the percentage of qualified outcomes (Estimate Set, Virtual Quote, Proposal Presented, Job Booked, Estimate Canceled, Job Lost and Estimate Rescheduled) versus unqualified outcomes (Unqualified)",
    formula:
      "(Estimate Set + Virtual Quote + Proposal Presented + Job Booked) / (Estimate Set + Virtual Quote + Proposal Presented + Job Booked + Unqualified + Estimate Canceled + Job Lost) × 100",
  },
  {
    id: "revenue",
    label: "Revenue",
    category: "Lead KPIs",
    apiField: "revenue",
    type: "currency",
    decimals: 2,
    sortable: true,
    aggregate: "sum",
    description: "Total job booked amount from leads",
    formula: "SUM(Job Booked Amount) across all booked jobs",
  },
  {
    id: "thumbstop_rate",
    label: "Thumbstop Rate",
    category: "Engagement Rates",
    apiField: "thumbstop_rate",
    type: "percentage",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
    aggregateFormula: "(fb_video_play_actions / fb_impressions) * 100",
    description: "Percentage of impressions that resulted in video play actions (3-second views)",
    formula: "(Video Play Actions / Impressions) × 100",
  },
  {
    id: "conversion_rate",
    label: "Conversion Rate",
    category: "Engagement Rates",
    apiField: "conversion_rate",
    type: "percentage",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
    aggregateFormula: "(fb_total_leads / fb_link_clicks) * 100",
    description: "Percentage of link clicks that converted to Facebook leads",
    formula: "(FB Leads / Link Clicks) × 100",
  },
  {
    id: "see_more_rate",
    label: "See More Rate",
    category: "Engagement Rates",
    apiField: "see_more_rate",
    type: "percentage",
    decimals: 2,
    sortable: true,
    aggregate: "avg",
    aggregateFormula: "((fb_clicks - fb_link_clicks - fb_post_reactions - fb_post_comments - fb_post_shares) / fb_impressions) * 100",
    description: "Percentage of impressions where users clicked 'See More' to expand ad text",
    formula: "(All Clicks - Link Clicks - Reactions - Comments - Shares) / Impressions × 100",
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
  data: PerformanceRow[],
  apiAverages?: PerformanceBoardAverages | null
) => {
  if (!column.aggregate || column.aggregate === "none") return null;

  // If API averages are provided, use them directly
  if (apiAverages && column.apiField in apiAverages) {
    const apiValue = apiAverages[column.apiField];

    // Handle null or undefined values from API
    if (apiValue === null || apiValue === undefined) {
      return null;
    }

    return formatCellValue(column, apiValue);
  }

  // Fallback to client-side calculation if API averages are not available
  // If there's an aggregateFormula, calculate from sums
  if (column.aggregateFormula && column.aggregate === "avg") {
    // Parse the formula and calculate sums for each field
    const formula = column.aggregateFormula;

    // Extract field names from the formula (e.g., "fb_spend", "numberOfLeads")
    const fieldMatches = formula.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];

    // Calculate sums for each field
    const sums: Record<string, number> = {};
    fieldMatches.forEach(field => {
      const values = data
        .map((row) => row[field])
        .filter((v): v is number => typeof v === "number");
      sums[field] = values.reduce((acc, curr) => acc + curr, 0);
    });

    // Replace field names in formula with their sums and evaluate
    let evaluableFormula = formula;
    Object.keys(sums).forEach(field => {
      const regex = new RegExp(`\\b${field}\\b`, 'g');
      evaluableFormula = evaluableFormula.replace(regex, String(sums[field]));
    });

    try {
      // Evaluate the formula safely
      const aggregateValue = eval(evaluableFormula);

      // Handle division by zero or invalid results
      if (!isFinite(aggregateValue) || isNaN(aggregateValue)) {
        return null;
      }

      return formatCellValue(column, aggregateValue);
    } catch (error) {
      console.error('Error evaluating formula:', formula, error);
      return null;
    }
  }

  // Original logic for non-formula aggregates
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

