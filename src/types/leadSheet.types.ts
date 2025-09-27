import { PeriodType } from './index';

// Lead status types
export type LeadStatus = 'new' | 'in_progress' | 'estimate_set' | 'unqualified';

// Lead update data interface
export interface LeadUpdateData {
  status: LeadStatus;
  unqualifiedLeadReason?: string;
}

// Lead processing result interface
export interface ProcessedLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  zip: string;
  leadDate: string;
  adSetName: string;
  adName: string;
  status: LeadStatus;
  unqualifiedLeadReason?: string;
  leadScore?: number;
  conversionRates?: {
    service?: number;
    adSetName?: number;
    adName?: number;
    leadDate?: number;
    zip?: number;
  };
  score: number;
  tooltipData: {
    serviceRate: string;
    adSetRate: string;
    adNameRate: string;
    dateRate: string;
    zipRate: string;
  };
}

// Export data interface
export interface ExportLeadData {
  'Lead Name': string;
  'Email': string;
  'Phone': string;
  'Service': string;
  'ZIP Code': string;
  'Lead Date': string;
  'Ad Set Name': string;
  'Ad Name': string;
  'Lead Status': string;
  'Lead Score': number;
  'Unqualified Reason': string;
}

// Date range interface
export interface DateRange {
  startDate: string;
  endDate: string;
}

// Lead operation result interface
export interface LeadOperationResult {
  error?: boolean;
  message?: string;
  data?: any;
}

// Bulk operation interface
export interface BulkDeleteData {
  leadIds: string[];
}

// Refresh operation interface
export interface RefreshLeadsData {
  sheetUrl: string;
  clientId: string;
  uniquenessByPhoneEmail: boolean;
}

// Filter and sort interfaces
export interface LeadFilters {
  adSetName?: string;
  adName?: string;
  status?: string;
  unqualifiedLeadReason?: string;
}

export interface LeadSorting {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Pagination interface
export interface LeadPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// Status counts interface
export interface StatusCounts {
  new: number;
  in_progress: number;
  estimate_set: number;
  unqualified: number;
  total: number;
}

// Filter options interface
export interface FilterOptions {
  adSetNames: string[];
  adNames: string[];
  statuses: string[];
  unqualifiedReasons: string[];
}

