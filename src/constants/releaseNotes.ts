export interface ReleaseNote {
  date: string;
  items: string[];
}

export const CURRENT_PATCH_VERSION = "2025.12.25"; // Update this with each new release
export const LAST_UPDATED = "DECEMBER 25, 2025";

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    date: "December 25, 2025",
    items: [
      "New status of leads for better tracking: Virtual Quote, Estimate Canceled, Proposal Presented, Job Booked, and Job Lost",
    ],
  },
  {
    date: "December 16, 2025",
    items: [
      "Ad Performance Board is now available! Track and analyze your Facebook ad campaigns with comprehensive performance metrics and lead tracking. <a href='https://www.loom.com/share/2c8a2214bcee452790be70534b0f6404' target='_blank' rel='noopener noreferrer' class='text-blue-600 underline hover:text-blue-800'>Watch Video</a>",
      "Filter ads by service type with new dynamic dropdown options",
      "View service and zip code details for each campaign/ad to see lead distribution",
    ],
  },
  {
    date: "November 22, 2025",
    items: [
      "Profile: Feature Request system is now available. Submit your ideas and suggestions directly to our team. <a href='https://www.loom.com/share/fcc94167a21a43fcb2392f2ef4a6833c' target='_blank' rel='noopener noreferrer' class='text-blue-600 underline hover:text-blue-800'>Watch Video</a>",
    ],
  },
  {
    date: "October 28, 2025",
    items: [
      "Ticket management system with priority levels and status tracking",
      "User last access tracking for better activity monitoring",
      "Enhanced lead search across multiple fields (name, service, ad name, ad set name, zip)",
      "Added notes field to leads for better lead management",
    ],
  },
  {
    date: "October 3, 2025",
    items: [
      "Lead sheet tab and lead analytics tab both have calendar day filtering capabilities. Watch explainer video <a href='#' class='text-blue-600 underline hover:text-blue-800'>here</a> (1 min 4 sec).",
    ],
  },
  {
    date: "September 30, 2025",
    items: [
      "Search functionality by name in lead sheet",
      "Estimate set rate (# of estimates / (# of estimate set leads + # of unqualified leads)) is now live in the lead analytics tab. Watch explainer video <a href='#' class='text-blue-600 underline hover:text-blue-800'>here</a> (1 min 40 sec).",
    ],
  },
  {
    date: "September 15, 2025",
    items: [
      "Enhanced dashboard with real-time metrics updates",
      "Improved performance for large datasets",
      "Bug fixes and stability improvements",
    ],
  },
  {
    date: "August 28, 2025",
    items: [
      "New ticket management system for customer support",
      "Advanced filtering options for lead analytics",
      "Export functionality for reports in multiple formats",
    ],
  },
  {
    date: "August 10, 2025",
    items: [
      "Integration with third-party CRM systems",
      "Automated email notifications for lead updates",
      "Mobile responsive design improvements",
    ],
  },
];

export const FEATURE_REQUEST_URL = "#"; // Update with actual URL
export const COMPANY_NAME = "RevenuePro";
export const PAGE_TITLE = "Revenue Pro Release Notes";
