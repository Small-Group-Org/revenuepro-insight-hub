import { TargetFieldsConfig } from "@/types";

export const API_METHODS = {
  GET: "GET",
  POST: "POST",
  DELETE: "DELETE",
  PUT: "PUT",
};

export const tabs = ["basic", "templates", "target"];

// export const API_URL = import.meta.env.VITE_API_URL;
export const API_URL = "https://revenue-pro-backend-1057029383450.asia-south2.run.app/api/v1";
// export const API_URL = " http://localhost:4000/api/v1";

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
    }
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
      name: "Sales",
      value: "sales",
      fieldType: "calculated",
      formula: "revenue / avgJobSize",
      description: "Revenue ÷ Avg Job Size",
    },
    {
      name: "Estimates Ran",
      value: "estimatesRan",
      fieldType: "calculated",
      formula: "sales / (closeRate / 100)",
      description: "Sales ÷ Close Rate",
    },
    {
      name: "Estimates Set",
      value: "estimatesSet",
      fieldType: "calculated",
      formula: "estimatesRan / (showRate / 100)",
      description: "Estimates Ran ÷ Show Rate",
    },
    {
      name: "Leads",
      value: "leads",
      fieldType: "calculated",
      formula: "estimatesSet / (appointmentRate / 100)",
      description: "Estimates Set ÷ Appointment Rate",
    }
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
      name: "Annual Budget",
      value: "annualBudget",
      fieldType: "calculated",
      formula: "revenue * (com / 100)",
      description: "Revenue × CoM%",
      unit: "$",
      applicable: ["yearly"]
    },
    {
      name: "Budget",
      value: "budget",
      fieldType: "calculated",
      formula: "period === 'yearly' ? annualBudget : calculatedMonthlyBudget",
      description: "Budget based on period",
      unit: "$",
      applicable: ["yearly", "monthly"],
      isHidden: true
    },
    {
      name: "Monthly Budget",
      value: "calculatedMonthlyBudget",
      fieldType: "calculated",
      formula: "revenue * (com / 100)",
      description: "Revenue × CoM%",
      unit: "$",
      applicable: ["yearly", "monthly"]
    },
    {
      name: "Daily Budget",
      value: "dailyBudget",
      fieldType: "calculated",
      formula: "budget / daysInMonth",
      description: "Budget ÷ Days in Month",
      unit: "$",
      applicable: ["weekly", "monthly"]
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
      name: "Management Cost",
      value: "managementCost",
      fieldType: "calculated",
      formula: "calculateManagementCost(calculatedMonthlyBudget)",
      description: "Based on Ad Spend Range",
      unit: "$",
      applicable: ["monthly"]
    },
    {
      name: "Total CoM%",
      value: "totalCom",
      fieldType: "calculated",
      formula: "((calculatedMonthlyBudget + managementCost) / revenue) * 100",
      description: "(Monthly Budget + Management Cost) ÷ Revenue",
      unit: "%",
      applicable: ["monthly"]
    }
  ]
};