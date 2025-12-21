export type PeriodType = 'weekly' | 'monthly' | 'yearly' | 'ytd';

export interface InputField {
  name: string;
  value: string;
  type: "number";
  min?: number;
  max?: number;
  defaultValue: number;
  fieldType: "input";
  step?: number;
  unit?: string;
  applicable?: PeriodType[];
  isHidden?: boolean;
}

export interface CalculatedField {
  name: string;
  value: string;
  fieldType: "calculated";
  formula: string;
  description?: string;
  unit?: string;
  applicable?: PeriodType[];
  isHidden?: boolean;
}

export type FieldConfig = InputField | CalculatedField;

export interface TargetFieldsConfig {
  funnelRate: FieldConfig[];
  budget: FieldConfig[];
  budgetTarget: FieldConfig[];
}

export interface ReportingFieldsConfig {
  targets: FieldConfig[];
  budgetReport: FieldConfig[];
  targetReport: FieldConfig[];
}

export interface FieldValue {
    [key: string]: number;
  }
  
  export interface FormulaContext {
    values: FieldValue;
    daysInMonth: number;
    period?: PeriodType;
  }
  
  export interface DisableMetadata {
    isDisabled: boolean;
    disabledMessage: string | null;
    noteMessage: string | null;
    shouldDisableNonRevenueFields: boolean;
    isButtonDisabled: boolean;
  }

export interface Lead {
  id: string;
  leadDate: string;
  name: string;
  email: string;
  phone: string;
  zip: string;
  service: string;
  adSetName: string;
  adName: string;
  status: 'new' | 'in_progress' | 'estimate_set' | 'virtual_quote' | 'estimate_canceled' | 'proposal_presented' | 'job_booked' | 'job_lost' | 'unqualified';
  clientId: string;
  unqualifiedLeadReason?: string;
  updatedAt?: string;
  leadScore?: number;
  jobBookedAmount?: number;
  proposalAmount?: number;
  notes?: string;
  statusHistory?: Array<{
    status: string;
    timestamp: string;
  }>;
  conversionRates?: {
    service: number;
    adSetName: number;
    adName: number;
    leadDate: number;
    zip: number;
  };
}

// Campaign Spend Types
export interface CampaignDataItem {
  impressions: string;
  ad_id: string;
  ad_name: string;
  adset_name: string;
  adset_id: string;
  campaign_name?: string;
  campaign_id?: string;
  spend: string;
  clicks: string;
  cpp: string;
  cpm: string;
  cpc: string;
  ctr: string;
  full_view_impressions: string;
  full_view_reach: string;
  instagram_profile_visits: string;
  reach: string;
  social_spend: string;
  website_ctr: Array<{
    action_type: string;
    value: string;
  }>;
  date_start: string;
  date_stop: string;
}

export interface CampaignDataResponse {
  data: CampaignDataItem[];
  paging: {
    cursors: {
      before: string;
      after: string;
    };
  };
}

export interface Ad {
  id: string;
  name: string;
  spend: number;
}

export interface AdSet {
  id: string;
  name: string;
  totalSpend: number;
  ads: Ad[];
}

export interface Campaign {
  id: string;
  name: string;
  totalSpend: number;
  adsets: AdSet[];
}

export interface ProcessedCampaignData {
  campaignTotal: number;
  campaigns: Campaign[];
}