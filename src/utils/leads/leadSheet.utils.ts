import { format } from 'date-fns';
import { PeriodType } from '@/types';
import { getStatusInfo } from '@/utils/leads/leadProcessing';
import { createDateRangeFromPeriod } from '@/utils/leads/dateRangeHelpers';
import { 
  DateRange, 
  ProcessedLead, 
  ExportLeadData, 
  LeadStatus,
  StatusCounts 
} from '@/types/leadSheet.types';
import { 
  DATE_FORMATS, 
  CSV_CONFIG, 
  EXPORT_FILE_PATTERNS,
  STATUS_INFO,
  SCORE_INFO 
} from '@/constants/leadSheet.constants';

/**
 * Calculate date range based on selected date and period type
 * Returns UTC ISO format for backend consistency
 */
export const getDateRange = (date: Date, periodType: PeriodType): DateRange => {
  return createDateRangeFromPeriod(date, periodType);
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  return format(new Date(dateString), DATE_FORMATS.DISPLAY);
};

/**
 * Process leads data for display
 */
export const processLeadsData = (leads: any[]): ProcessedLead[] => {
  return leads.map(lead => {
    // Use backend-provided lead score
    const score = lead.leadScore || 0;
    
    // Use backend-provided conversion rates for tooltip
    const tooltipData = {
      serviceRate: lead.conversionRates?.service ? (lead.conversionRates.service * 100).toFixed(1) : '0.0',
      adSetRate: lead.conversionRates?.adSetName ? (lead.conversionRates.adSetName * 100).toFixed(1) : '0.0',
      adNameRate: lead.conversionRates?.adName ? (lead.conversionRates.adName * 100).toFixed(1) : '0.0',
      dateRate: lead.conversionRates?.leadDate ? (lead.conversionRates.leadDate * 100).toFixed(1) : '0.0',
      zipRate: lead.conversionRates?.zip ? (lead.conversionRates.zip * 100).toFixed(1) : '0.0'
    };
    
    return {
      ...lead,
      score,
      tooltipData
    };
  });
};

/**
 * Convert leads to export format
 */
export const convertLeadsToExportFormat = (
  leads: ProcessedLead[], 
  formatDateFn: (date: string) => string
): ExportLeadData[] => {
  return leads.map(lead => ({
    'Lead Name': lead.name,
    'Email': lead.email,
    'Phone': lead.phone,
    'Service': lead.service,
    'ZIP Code': lead.zip,
    'Lead Date': formatDateFn(lead.leadDate),
    'Ad Set Name': lead.adSetName,
    'Ad Name': lead.adName,
    'Lead Status': getStatusInfo(lead.status).label,
    'Lead Score': lead.score,
    'Unqualified Reason': lead.status === 'unqualified' ? (lead.unqualifiedLeadReason || 'Not specified') : '',
  }));
};

/**
 * Generate CSV content from export data
 */
export const generateCSVContent = (exportData: ExportLeadData[]): string => {
  const headers = Object.keys(exportData[0]);
  return [
    headers.join(','),
    ...exportData.map(row => 
      headers.map(header => {
        const value = row[header as keyof ExportLeadData];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && CSV_CONFIG.ESCAPE_CHARS.some(char => value.includes(char))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
};

/**
 * Create and download CSV file
 */
export const downloadCSVFile = (csvContent: string, fileName: string): void => {
  const blob = new Blob([csvContent], { type: CSV_CONFIG.MIME_TYPE });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generate export filename
 */
export const generateExportFileName = (exportType: 'current' | 'all'): string => {
  const timestamp = format(new Date(), DATE_FORMATS.EXPORT);
  const prefix = exportType === 'current' 
    ? EXPORT_FILE_PATTERNS.CURRENT_PAGE 
    : EXPORT_FILE_PATTERNS.ALL_FILTERED;
  
  return `${prefix}${timestamp}${EXPORT_FILE_PATTERNS.EXTENSION}`;
};

/**
 * Check if any filters are active
 */
export const hasActiveFilters = (filters: any): boolean => {
  return Boolean(
    filters.adSetName || 
    filters.adName || 
    filters.status || 
    filters.unqualifiedLeadReason
  );
};

/**
 * Check if user has valid lead sheet URL
 */
export const hasValidLeadSheetUrl = (selectedUserId: string, users: any[]): boolean => {
  if (!selectedUserId) return false;
  const selectedUser = users.find(user => user.id === selectedUserId);
  return Boolean(selectedUser?.leadSheetUrl && selectedUser.leadSheetUrl.trim() !== '');
};

/**
 * Validate custom ULR input
 */
export const validateCustomULR = (customULR: string): { isValid: boolean; message?: string } => {
  if (!customULR.trim()) {
    return { isValid: false, message: "Please enter a custom reason." };
  }
  return { isValid: true };
};

/**
 * Check if refresh rate limit is exceeded
 */
export const isRefreshRateLimited = (lastRefreshTime: number, rateLimit: number = 3000): boolean => {
  const now = Date.now();
  return (now - lastRefreshTime) < rateLimit;
};

/**
 * Get status info for a lead status
 */
export const getLeadStatusInfo = (status: LeadStatus) => {
  return STATUS_INFO[status] || STATUS_INFO.new;
};

/**
 * Get score info for a lead score
 */
export const getLeadScoreInfo = (score: number) => {
  if (score >= SCORE_INFO.high.threshold) return SCORE_INFO.high;
  if (score >= SCORE_INFO.medium.threshold) return SCORE_INFO.medium;
  return SCORE_INFO.low;
};

/**
 * Calculate status counts from leads
 */
export const calculateStatusCounts = (leads: ProcessedLead[]): StatusCounts => {
  const counts = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<LeadStatus, number>);

  return {
    new: counts.new || 0,
    in_progress: counts.in_progress || 0,
    estimate_set: counts.estimate_set || 0,
    unqualified: counts.unqualified || 0,
    total: leads.length
  };
};

/**
 * Find lead by ID
 */
export const findLeadById = (leads: ProcessedLead[], leadId: string): ProcessedLead | undefined => {
  return leads.find(lead => lead.id === leadId);
};

/**
 * Check if lead is custom ULR
 */
export const isCustomULR = (reason: string, ulrOptions: readonly string[]): boolean => {
  return reason && !ulrOptions.includes(reason);
};

/**
 * Generate export description
 */
export const generateExportDescription = (exportType: 'current' | 'all', count: number): string => {
  return exportType === 'current' 
    ? `Exported ${count} leads from current page.`
    : `Exported ${count} leads from all filtered data.`;
};
