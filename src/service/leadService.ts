import { doGET, doPATCH } from "@/utils/HttpUtils";
import { Lead } from "@/types";

export interface GetLeadsPayload {
  clientId?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateLeadPayload {
  _id: string;
  status: 'new' | 'in_progress' | 'estimate_set' | 'unqualified';
  unqualifiedLeadReason?: string;
}

// New interfaces for paginated API
export interface GetPaginatedLeadsPayload {
  clientId: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'score';
  sortOrder?: 'asc' | 'desc';
  adSetName?: string;
  adName?: string;
  status?: string;
  unqualifiedLeadReason?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ConversionRates {
  service: Array<{ name: string; conversionRate: number }>;
  adSetName: Array<{ name: string; conversionRate: number }>;
  adName: Array<{ name: string; conversionRate: number }>;
  dates: Array<{ date: string; conversionRate: number }>;
}

export interface GetPaginatedLeadsResponse {
  success: boolean;
  data: Lead[];
  pagination: PaginationInfo;
  conversionRates?: ConversionRates;
}

// Filter options interfaces
export interface GetFilterOptionsPayload {
  clientId: string;
  startDate?: string;
  endDate?: string;
}

export interface FilterOptions {
  services: string[];
  adSetNames: string[];
  adNames: string[];
  statuses: string[];
  unqualifiedLeadReasons: string[];
}

export interface StatusCounts {
  new: number;
  inProgress: number;
  estimateSet: number;
  unqualified: number;
}

export interface GetFilterOptionsResponse {
  success: boolean;
  data: {
    filterOptions: FilterOptions;
    statusCounts: StatusCounts;
  };
}

export interface GetLeadsResponse {
  success: boolean;
  data: Lead[];
}

export interface UpdateLeadResponse {
  success: boolean;
  data: Lead;
}

export const getLeads = async (payload?: GetLeadsPayload) => {
  let url = '/leads';
  const params = new URLSearchParams();
  
  if (payload?.clientId) {
    params.append('clientId', payload.clientId);
  }
  if (payload?.startDate) {
    params.append('startDate', payload.startDate);
  }
  if (payload?.endDate) {
    params.append('endDate', payload.endDate);
  }
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  const response = await doGET(url);
  return response;
};

// New function for paginated leads
export const getPaginatedLeads = async (payload: GetPaginatedLeadsPayload) => {
  const params = new URLSearchParams();
  
  // Required parameters
  params.append('clientId', payload.clientId);
  
  // Optional parameters
  if (payload.startDate) params.append('startDate', payload.startDate);
  if (payload.endDate) params.append('endDate', payload.endDate);
  if (payload.page) params.append('page', payload.page.toString());
  if (payload.limit) params.append('limit', payload.limit.toString());
  if (payload.sortBy) params.append('sortBy', payload.sortBy);
  if (payload.sortOrder) params.append('sortOrder', payload.sortOrder);
  if (payload.adSetName) params.append('adSetName', payload.adSetName);
  if (payload.adName) params.append('adName', payload.adName);
  if (payload.status) params.append('status', payload.status);
  if (payload.unqualifiedLeadReason) params.append('unqualifiedLeadReason', payload.unqualifiedLeadReason);
  
  const url = `/leads/paginated?${params.toString()}`;
  const response = await doGET(url);
  return response;
};

// New function for filter options
export const getFilterOptions = async (payload: GetFilterOptionsPayload) => {
  const params = new URLSearchParams();
  
  // Required parameters
  params.append('clientId', payload.clientId);
  
  // Optional parameters
  if (payload.startDate) params.append('startDate', payload.startDate);
  if (payload.endDate) params.append('endDate', payload.endDate);
  
  const url = `/leads/filters-and-counts?${params.toString()}`;
  const response = await doGET(url);
  return response;
};

// New function for exporting all filtered data
export const exportAllFilteredLeads = async (payload: GetPaginatedLeadsPayload) => {
  // For export, we want all data, so set a very high limit
  const exportPayload = {
    ...payload,
    page: 1,
    limit: 10000 // Set a very high limit to get all data
  };
  
  const params = new URLSearchParams();
  
  // Required parameters
  params.append('clientId', exportPayload.clientId);
  
  // Optional parameters
  if (exportPayload.startDate) params.append('startDate', exportPayload.startDate);
  if (exportPayload.endDate) params.append('endDate', exportPayload.endDate);
  if (exportPayload.page) params.append('page', exportPayload.page.toString());
  if (exportPayload.limit) params.append('limit', exportPayload.limit.toString());
  if (exportPayload.sortBy) params.append('sortBy', exportPayload.sortBy);
  if (exportPayload.sortOrder) params.append('sortOrder', exportPayload.sortOrder);
  if (exportPayload.adSetName) params.append('adSetName', exportPayload.adSetName);
  if (exportPayload.adName) params.append('adName', exportPayload.adName);
  if (exportPayload.status) params.append('status', exportPayload.status);
  if (exportPayload.unqualifiedLeadReason) params.append('unqualifiedLeadReason', exportPayload.unqualifiedLeadReason);
  
  const url = `/leads/paginated?${params.toString()}`;
  const response = await doGET(url);
  return response;
};

export const updateLead = async (payload: UpdateLeadPayload) => {
  const response = await doPATCH("/leads", payload);
  return response;
};