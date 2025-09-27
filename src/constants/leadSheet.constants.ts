// Unqualified Lead Reason options
export const ULR_OPTIONS = [
  'Bad Phone Number',
  'Out of Area',
  'Job Too Small',
  'Said Didn\'t Fill Out Form',
  'No Longer Interested',
  'Service we don\'t offer',
  'Never responded',
  'In contact, estimate not yet set',
] as const;

// Default pagination settings
export const DEFAULT_PAGE_SIZE = 25;
export const DEFAULT_CURRENT_PAGE = 1;

// Refresh rate limiting (in milliseconds)
export const REFRESH_RATE_LIMIT = 3000;

// Toast messages
export const TOAST_MESSAGES = {
  ERROR: {
    TITLE: "❌ Error",
    LEAD_UPDATE: "Error Updating Lead",
    LEAD_LOADING: "Error Loading Leads",
    EXPORT_FAILED: "Export Failed",
    REFRESH_FAILED: "Failed to refresh leads. Please contact Revenue Pro Support.",
    BULK_DELETE_FAILED: "Failed to delete leads. Please try again.",
    CUSTOM_ULR_REQUIRED: "Please enter a custom reason.",
    NO_USER_SELECTED: "No user selected for export.",
  },
  SUCCESS: {
    TITLE: "✅ Success",
    LEAD_UPDATED: "Lead Updated",
    LEADS_REFRESHED: "Leads refreshed successfully!",
    EXPORT_SUCCESSFUL: "Export Successful",
    BULK_DELETE_SUCCESS: "leads deleted successfully.",
  },
  INFO: {
    TITLE: "ℹ️ Info",
    SELECT_ULR: "Select Unqualified Reason",
    SELECT_ULR_DESCRIPTION: "Please select a reason from the dropdown to complete this action.",
  }
} as const;

// Status labels and info
export const STATUS_INFO = {
  new: { label: 'New', color: 'blue' },
  in_progress: { label: 'In Progress', color: 'yellow' },
  estimate_set: { label: 'Estimate Set', color: 'green' },
  unqualified: { label: 'Unqualified', color: 'red' }
} as const;

// Score info configuration
export const SCORE_INFO = {
  high: { label: 'High', color: 'green', threshold: 80 },
  medium: { label: 'Medium', color: 'yellow', threshold: 50 },
  low: { label: 'Low', color: 'red', threshold: 0 }
} as const;

// Field weights for lead scoring
export const FIELD_WEIGHTS = {
  service: 0.3,
  adSetName: 0.25,
  adName: 0.2,
  leadDate: 0.15,
  zip: 0.1
} as const;

// Export file naming patterns
export const EXPORT_FILE_PATTERNS = {
  CURRENT_PAGE: 'leads_current_page_',
  ALL_FILTERED: 'leads_all_filtered_',
  EXTENSION: '.csv'
} as const;

// CSV formatting
export const CSV_CONFIG = {
  HEADERS: [
    'Lead Name',
    'Email', 
    'Phone',
    'Service',
    'ZIP Code',
    'Lead Date',
    'Ad Set Name',
    'Ad Name',
    'Lead Status',
    'Lead Score',
    'Unqualified Reason'
  ],
  MIME_TYPE: 'text/csv;charset=utf-8;',
  ESCAPE_CHARS: [',', '"']
} as const;

// Date formatting
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  EXPORT: 'yyyyMMdd_HHmmss',
  API: 'yyyy-MM-dd'
} as const;

// UI Configuration
export const UI_CONFIG = {
  MAX_LEADS_PER_PAGE: 100,
  MIN_LEADS_PER_PAGE: 10,
  PAGINATION_OPTIONS: [10, 25, 50, 100],
  MODAL_MAX_HEIGHT: 'max-h-60',
  TABLE_MAX_WIDTH: 'max-w-32'
} as const;

// Error messages for validation
export const VALIDATION_MESSAGES = {
  CUSTOM_ULR_REQUIRED: "Please enter a custom reason.",
  NO_LEADS_SELECTED: "No leads selected for deletion.",
  INVALID_EXPORT_TYPE: "Invalid export type specified.",
  MISSING_USER_DATA: "User data is missing or invalid."
} as const;
