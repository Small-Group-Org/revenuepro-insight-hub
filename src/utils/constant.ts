import { TargetFieldsConfig, ReportingFieldsConfig } from "@/types";
import { Plus, Users, Target, TrendingUp } from "lucide-react";
import { BarChart3 } from "lucide-react";

export const API_METHODS = {
  GET: "GET",
  POST: "POST",
  DELETE: "DELETE",
  PUT: "PUT",
  PATCH: "PATCH",
};

export const tabs = ["basic", "templates", "target"];
// temp cmnt
export const API_URL = import.meta.env.VITE_API_URL || "https://revenue-pro-backend-1057029383450.asia-south2.run.app/api/v1";

// Centralized API endpoints to avoid hardcoded strings across the app
export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: "/auth/login",
  AUTH_VERIFY_TOKEN: "/auth/verify-token",

  // Admin
  ADMIN_USER_UPSERT: "/admin/users/upsert",
  ADMIN_USERS_LIST: "/admin/users/list/all",
  ADMIN_USER: "/admin/users", // append /:id when needed

  // Users
  USER_UPDATE_PASSWORD: "/users/update-password",

  // Leads
  LEADS_BASE: "/leads",
  LEADS_PAGINATED: "/leads/paginated",
  LEADS_FILTERS_COUNTS: "/leads/filters-and-counts",
  LEADS_BULK_DELETE: "/leads/bulk-delete",
  LEADS_ANALYTICS_SUMMARY: "/leads/analytics/summary",
  LEADS_ANALYTICS_AD_TABLE: "/leads/analytics/ad-table",
  LEADS_PROCESS_SHEET: "/process-lead-sheet",

  // Targets
  TARGETS_UPSERT: "/targets/upsert",
  TARGETS_BULK_UPSERT: "/targets/bulk-upsert",
  TARGETS_GET: "/targets/get",

  // Actual
  ACTUAL_GET: "/actual/get",
  ACTUAL_UPSERT: "/actual/upsert",

  // IP Tracking
  IP_TRACK: "/ip-tracking/track",
} as const;

export const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/' },
  { id: 'settargets', label: 'Set Targets', icon: Target, path: '/targets' },
  { id: 'actuals', label: 'Weekly Reporting', icon: Plus, path: '/actuals' },
  { id: 'compare', label: 'Target Vs Actual', icon: TrendingUp, path: '/compare' },
  { id: 'leads', label: 'Lead Sheet', icon: Users, path: '/leads' },
  { id: 'analytics', label: 'Lead Analytics', icon: BarChart3, path: '/lead-analytics' },
];

export const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const targetFields: TargetFieldsConfig = {
  funnelRate: [
    {
      name: "Appointment Rate",
      value: "appointmentRate",
      type: "number",
      min: 0,
      max: 100,
      defaultValue: 0,
      fieldType: "input",
      step: 0.01,
      unit: "%",
    },
    {
      name: "Show Rate",
      value: "showRate",
      type: "number",
      min: 0,
      max: 100,
      defaultValue: 0,
      fieldType: "input",
      step: 0.01,
      unit: "%",
    },
    {
      name: "Close Rate",
      value: "closeRate",
      type: "number",
      min: 0,
      max: 100,
      defaultValue: 0,
      fieldType: "input",
      step: 0.01,
      unit: "%",
    },
    {
      name: "Lead to Sale",
      value: "leadToSale",
      fieldType: "calculated",
      formula: "appointmentRate * showRate * closeRate / 10000",
      description: "Appointment × Show × Close",
      unit: "%",
    },
  ],
  budget: [
    {
      name: "Revenue",
      value: "revenue",
      type: "number",
      min: 0,
      defaultValue: 0,
      fieldType: "input",
      unit: "$",
    },
    {
      name: "Avg Job Size",
      value: "avgJobSize",
      type: "number",
      min: 0,
      defaultValue: 0,
      fieldType: "input",
      unit: "$",
    },
    {
      name: "Leads",
      value: "leads",
      fieldType: "calculated",
      formula: "estimatesSet / (appointmentRate / 100)",
      description: "Estimates Set ÷ Appointment Rate",
    },
    {
      name: "Estimates Set",
      value: "estimatesSet",
      fieldType: "calculated",
      formula: "estimatesRan / (showRate / 100)",
      description: "Estimates Ran ÷ Show Rate",
    },
    {
      name: "Estimates Ran",
      value: "estimatesRan",
      fieldType: "calculated",
      formula: "sales / (closeRate / 100)",
      description: "Sales ÷ Close Rate",
    },
    {
      name: "Sales",
      value: "sales",
      fieldType: "calculated",
      formula: "revenue / avgJobSize",
      description: "Revenue ÷ Avg Job Size",
    },
  ],
  budgetTarget: [
    {
      name: "CoM%",
      value: "com",
      type: "number",
      min: 0,
      max: 100,
      defaultValue: 0,
      fieldType: "input",
      step: 0.01,
      unit: "%",
    },
    {
      name: "Management Cost",
      value: "managementCost",
      type: "number",
      min: 0,
      defaultValue: 0,
      fieldType: "input",
      unit: "$",
      applicable: ["monthly", "yearly"],
    },
    {
      name: "Annual Budget",
      value: "annualBudget",
      fieldType: "calculated",
      formula: "revenue * (com / 100)",
      description: "Revenue × CoM%",
      unit: "$",
      applicable: ["yearly"],
    },
    {
      name: "Budget",
      value: "budget",
      fieldType: "calculated",
      formula: "period === 'yearly' ? annualBudget : calculatedMonthlyBudget",
      description: "Budget based on period",
      unit: "$",
      isHidden: true,
    },
    {
      name: "Monthly Budget",
      value: "calculatedMonthlyBudget",
      fieldType: "calculated",
      formula: "revenue * (com / 100)",
      description: "Revenue × CoM%",
      unit: "$",
      applicable: ["yearly", "monthly"],
    },
    {
      name: "Weekly Budget",
      value: "weeklyBudget",
      fieldType: "calculated",
      formula: "revenue * (com / 100)",
      description: "Revenue × CoM%",
      unit: "$",
      applicable: ["weekly"],
    },
    {
      name: "Daily Budget",
      value: "dailyBudget",
      fieldType: "calculated",
      formula: "budget / daysInMonth",
      description: "Budget ÷ Days in Month",
      unit: "$",
      applicable: ["weekly", "monthly"],
    },
    {
      name: "Cost Per Lead",
      value: "cpl",
      fieldType: "calculated",
      formula: "budget / leads",
      description: "Budget ÷ Leads",
      unit: "$",
    },
    {
      name: "CP Estimate Set",
      value: "cpEstimateSet",
      fieldType: "calculated",
      formula: "budget / estimatesSet",
      description: "Budget ÷ Estimates Set",
      unit: "$",
    },
    {
      name: "CP Estimate",
      value: "cpEstimate",
      fieldType: "calculated",
      formula: "budget / estimatesRan",
      description: "Budget ÷ Estimates Ran",
      unit: "$",
    },
    {
      name: "CP Job Booked",
      value: "cpJobBooked",
      fieldType: "calculated",
      formula: "budget / sales",
      description: "Budget ÷ Sales",
      unit: "$",
    },
    {
      name: "Total CoM%",
      value: "totalCom",
      fieldType: "calculated",
      formula: "((calculatedMonthlyBudget + managementCost) / revenue) * 100",
      description: "(Monthly Budget + Management Cost) ÷ Revenue",
      unit: "%",
      applicable: ["monthly", "yearly"],
    },
  ],
};

export const reportingFields: ReportingFieldsConfig = {
  targets: [
    {
      name: "Over/Under Budget",
      value: "overUnderBudget",
      fieldType: "calculated",
      formula: "budget - budgetSpent",
      description: "Budget - Budget Spent",
      unit: "$",
    },
    {
      name: "Weekly Budget",
      value: "weeklyBudget",
      fieldType: "calculated",
      formula: "targetRevenue * (com / 100)",
      description: "Target Revenue × CoM%",
      unit: "$",
    },
    {
      name: "Budget Spent",
      value: "budgetSpent",
      fieldType: "calculated",
      formula:
        "testingBudgetSpent + awarenessBrandingBudgetSpent + leadGenerationBudgetSpent",
      unit: "$",
    },
  ],
  budgetReport: [
    {
      name: "Testing Budget Spent",
      value: "testingBudgetSpent",
      type: "number",
      min: 0,
      defaultValue: 0,
      fieldType: "input",
      unit: "$",
    },
    {
      name: "Awareness/Branding Budget Spent",
      value: "awarenessBrandingBudgetSpent",
      type: "number",
      min: 0,
      defaultValue: 0,
      fieldType: "input",
      unit: "$",
    },
    {
      name: "Lead Generation Budget Spent",
      value: "leadGenerationBudgetSpent",
      type: "number",
      min: 0,
      defaultValue: 0,
      fieldType: "input",
      unit: "$",
    },
  ],

  targetReport: [
    {
      name: "Revenue",
      value: "revenue",
      type: "number",
      min: 0,
      defaultValue: 0,
      fieldType: "input",
      unit: "$",
    },
    {
      name: "Jobs Booked",
      value: "sales",
      type: "number",
      min: 0,
      defaultValue: 0,
      fieldType: "input",
    },
    {
      name: "Estimates Ran",
      value: "estimatesRan",
      type: "number",
      min: 0,
      defaultValue: 0,
      fieldType: "input",
    },
    {
      name: "Estimates Set",
      value: "estimatesSet",
      type: "number",
      min: 0,
      defaultValue: 0,
      fieldType: "input",
    },
    {
      name: "Leads",
      value: "leads",
      type: "number",
      min: 0,
      defaultValue: 0,
      fieldType: "input",
    },
  ],
};

// Revenue Metrics
export const revenueMetricsChartConfigs = [
  {
    key: "revenue",
    title: "Total Revenue",
    description: "Total revenue generated",
    actualColor: "#0b3d8e",
    targetColor: "#649cf7",
    format: "currency",
  },
  {
    key: "totalCom",
    title: "Total CoM%",
    description: "Management fee + ad spend / total revenue",
    actualColor: "#0b3d8e",
    targetColor: "#649cf7",
    format: "percent",
  },
];

// Funnel Metrics
export const funnelMetricsChartConfigs = [
  {
    key: "appointmentRate",
    title: "Appointment Rate",
    description: "Estimates set / leads",
    actualColor: "#0b3d8e",
    targetColor: "#649cf7",
    format: "percent",
  },
  {
    key: "showRate",
    title: "Show Rate",
    description: "Estimates ran / estimates set",
    actualColor: "#0b3d8e",
    targetColor: "#649cf7",
    format: "percent",
  },
  {
    key: "closeRate",
    title: "Close Rate",
    description: "Sales / estimates ran",
    actualColor: "#0b3d8e",
    targetColor: "#649cf7",
    format: "percent",
  },
  {
    key: "leadToSale",
    title: "Lead to Sale Rate",
    description: "Sales / leads",
    actualColor: "#0b3d8e",
    targetColor: "#649cf7",
    format: "percent",
  },
];

// Performance Metrics
export const performanceMetricsChartConfigs = [
  {
    key: "cpl",
    title: "Cost Per Lead",
    description: "Budget spent / leads",
    actualColor: "#0b3d8e",
    targetColor: "#649cf7",
    format: "currency",
  },
  {
    key: "cpEstimateSet",
    title: "Cost per Appointment Set",
    description: "Budget spent / estimates set",
    actualColor: "#0b3d8e",
    targetColor: "#649cf7",
    format: "currency",
  },
  {
    key: "leads",
    title: "Number of Leads",
    description: "Total leads generated",
    actualColor: "#0b3d8e",
    targetColor: "#649cf7",
    format: "number",
  },
  {
    key: "estimatesSet",
    title: "Number of Appointments Set",
    description: "Total appointments scheduled",
    actualColor: "#0b3d8e",
    targetColor: "#649cf7",
    format: "number",
  },
  {
    key: "estimatesRan",
    title: "Number of Appointments",
    description: "Total appointments completed",
    actualColor: "#0b3d8e",
    targetColor: "#649cf7",
    format: "number",
  },
  {
    key: "sales",
    title: "Number of Jobs Booked",
    description: "Total jobs booked",
    actualColor: "#0b3d8e",
    targetColor: "#649cf7",
    format: "number",
  },
  {
    key: "avgJobSize",
    title: "Average Job Size",
    description: "Revenue / sales",
    actualColor: "#0b3d8e",
    targetColor: "#649cf7",
    format: "currency",
  },
];

// Keep the old configs for backward compatibility
export const generalMetricsChartConfigs = [
  {
    key: "totalCom",
    title: "Total CoM%",
    description: "Management fee + ad spend / total revenue",
    actualColor: "#0b3d8e",
    targetColor: "#649cf7",
    format: "percent",
  },
  {
    key: "appointmentRate",
    title: "Appointment Rate",
    description: "Estimates set / leads",
    actualColor: "#0b3d8e",
    targetColor: "#649cf7",
    format: "percent",
  },
  {
    key: "showRate",
    title: "Show Rate",
    description: "Estimates ran / estimates set",
    actualColor: "#0b3d8e",
    targetColor: "#649cf7",
    format: "percent",
  },
  {
    key: "closeRate",
    title: "Close Rate",
    description: "Sales / estimates ran",
    actualColor: "#0b3d8e",
    targetColor: "#649cf7",
    format: "percent",
  },
  {
    key: "avgJobSize",
    title: "Average Job Size",
    description: "Revenue / sales",
    actualColor: "#0b3d8e",
    targetColor: "#649cf7",
    format: "currency",
  },
];

export const oldPerformanceMetricsChartConfigs = [
  {
    key: "revenue",
    title: "Total Revenue",
    description: "Total revenue generated",
    actualColor: "#0b3d8e",
    targetColor: "#649cf7",
    format: "currency",
  },
  {
    key: "cpEstimateSet",
    title: "Cost per Appointment Set",
    description: "Budget spent / estimates set",
    actualColor: "#0b3d8e",
    targetColor: "#649cf7",
    format: "currency",
  },
  {
    key: "cpl",
    title: "Cost Per Lead",
    description: "Budget spent / leads",
    actualColor: "#0b3d8e",
    targetColor: "#649cf7",
    format: "currency",
  },
];
