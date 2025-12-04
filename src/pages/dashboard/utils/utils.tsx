import React from "react";
import {
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Target,
} from "lucide-react";
import { AggregatedMetricsType } from "../dashboard.types";

type DashboardCard = {
  title: string;
  icon: React.ReactNode;
  description: string;
  metrics: Array<{
    label: string;
    value: number;
    format: "currency" | "percent" | "number";
  }>;
};

export const getDashboardCards = (isAdminView: boolean, aggregatedMetrics: AggregatedMetricsType): DashboardCard[] => {
    const {estimateSetCount, unqualifiedCount, totalAppointmentsSet, costPerEstimateSet, costPerAppointmentSet, estimateSetRate, totalRevenue, avgJobSize, totalCom, totalLeads, costPerLead, } = aggregatedMetrics;
    const cards: DashboardCard[] = [
        {
          title: "Revenue",
          icon: <DollarSign className="h-5 w-5 opacity-50 text-success" />,
          metrics: [
            {
              label: "Total Revenue",
              value: totalRevenue,
              format: "currency" as const,
            },
            {
              label: "Avg. Job Size",
              value: avgJobSize,
              format: "currency" as const,
            },
          ],
          description: "Total revenue generated from all jobs.",
        },
        {
          title: "Total CoM %",
          icon: <Target className="h-5 w-5 opacity-50 text-primary" />,
          metrics: [
            {
              label: "Total CoM %",
              value: totalCom,
              format: "percent" as const,
            },
          ],
          description: "Total cost of marketing as a percentage of total revenue.",
        },
        {
          title: "Lead Performance",
          icon: <Users className="h-5 w-5 opacity-50 text-accent" />,
          metrics: [
            {
              label: "Total Leads",
              value: totalLeads,
              format: "number" as const,
            },
            {
              label: "Cost Per Lead",
              value: costPerLead,
              format: "currency" as const,
            },
          ],
          description: "Total number of leads generated.",
        },
        {
          title: "Appt. Set Metrics",
          icon: <Calendar className="h-5 w-5 opacity-50 text-primary-light" />,
          metrics: [
            {
              label: "Appointments Set",
              value: totalAppointmentsSet,
              format: "number" as const,
            },
            {
              label: "Cost per Appt. Set",
              value: costPerAppointmentSet,
              format: "currency" as const,
            },
          ],
          description: "Total number of appointments scheduled.",
        },
        {
          title: "Appointment Rate %",
          icon: <TrendingUp className="h-5 w-5 opacity-50 text-warning" />,
          metrics: [
            {
              label: "Estimate Set Rate %",
              value: estimateSetRate,
              format: "percent" as const,
            },
          ],
          description:
            "Percentage of Appointment Sets out of (Estimate Sets + Unqualified).",
        },
      ];


    if(isAdminView) {
        cards.push({
            title: "Estimate Set%",
            icon: <Calendar className="h-5 w-5 opacity-50 text-primary-light" />,
            metrics: [
              {
                label: "Estimate Set%",
                value: parseFloat(((estimateSetCount/(estimateSetCount + unqualifiedCount))*100).toFixed(2)),
                format: "percent" as const,
              },
              {
                label: "Cost per Estimate Set",
                value: costPerEstimateSet,
                format: "currency" as const,
              },
            ],
            description: "Total number of estimate sets and percentage of estimate sets that are qualified.",
          });
    }
    return cards;
}

