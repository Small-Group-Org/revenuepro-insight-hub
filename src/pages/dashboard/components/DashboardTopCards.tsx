import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCurrencyValue,
} from "@/utils/page-utils/commonUtils";
import { AggregatedMetricsType } from "../dashboard.types";
import { getDashboardCards } from "../utils/utils";
import { TopCard } from "@/components/common-ui/TopCards";

interface DashboardTopCardsProps {
  reportingData: any[];
  processedTargetData?: any;
  period: string;
  isAdminView?: boolean;
  usersBudgetAndRevenue: any[];
}

export const DashboardTopCards: React.FC<DashboardTopCardsProps> = ({
  reportingData,
  processedTargetData,
  period,
  isAdminView = false,
  usersBudgetAndRevenue,
}) => {
  const aggregatedMetrics: AggregatedMetricsType = React.useMemo(() => {
    if (!reportingData || reportingData.length === 0) {
      return {
        totalRevenue: 0,
        avgJobSize: 0,
        totalCom: 0,
        totalLeads: 0,
        costPerLead: 0,
        totalAppointmentsSet: 0,
        costPerAppointmentSet: 0,
        estimateSetRate: 0,
        estimateSetCount: 0,
        unqualifiedCount: 0,
        costPerEstimateSet: 0,
      };
    }
    const totals = reportingData.reduce(
      (acc, dataPoint) => {
        acc.revenue += dataPoint.revenue || 0;
        acc.sales += dataPoint.sales || 0;
        acc.leads += dataPoint.leads || 0;
        acc.estimatesSet += dataPoint.estimatesSet || 0;
        acc.estimatesRan += dataPoint.estimatesRan || 0;
        acc.budgetSpent +=
          dataPoint.testingBudgetSpent +
            dataPoint.leadGenerationBudgetSpent +
            dataPoint.awarenessBrandingBudgetSpent || 0;
        acc.managementCost += dataPoint.managementCost || 0;
        return acc;
      },
      {
        revenue: 0,
        sales: 0,
        leads: 0,
        estimatesSet: 0,
        estimatesRan: 0,
        budgetSpent: 0,
        managementCost: 0,
      }
    );

    const {estimateSetCount, unqualifiedCount} = usersBudgetAndRevenue.reduce((acc, dataPoint) => {
      acc.estimateSetCount += dataPoint.estimateSetCount || 0;
      acc.unqualifiedCount += dataPoint.disqualifiedLeadsCount || 0;
      return acc;
    }, {estimateSetCount: 0, unqualifiedCount: 0});

    // Calculate derived metrics
    const avgJobSize = totals.sales > 0 ? totals.revenue / totals.sales : 0;
    const costPerLead =
      totals.leads > 0 ? totals.budgetSpent / totals.leads : 0;
    const costPerAppointmentSet =
      totals.estimatesSet > 0 ? totals.budgetSpent / totals.estimatesSet : 0;
    const estimateSetRate =
      totals.estimatesSet > 0 && totals.leads > 0 ? (totals.estimatesSet / totals.leads) * 100 : 0;
    const totalManagementCost = processedTargetData.reduce((acc, dataPoint) => {
      acc += dataPoint.managementCost || 0;
      return acc;
    }, 0);

    // Calculate totalCoM if we have target data
    let totalCom = 0;
    if (totals.revenue > 0) {
      if (processedTargetData) {
        totalCom =
          ((totalManagementCost + totals.budgetSpent) / totals.revenue) * 100;
      } else {
        // If no target data, just calculate based on budget spent
        totalCom = (totals.budgetSpent / totals.revenue) * 100;
      }
    }

    return {
      totalRevenue: totals.revenue,
      avgJobSize,
      totalCom,
      totalLeads: totals.leads,
      costPerLead,
      totalAppointmentsSet: totals.estimatesSet,
      costPerAppointmentSet,
      estimateSetRate,
      estimateSetCount,
      unqualifiedCount,
      costPerEstimateSet: estimateSetCount > 0 ? totals.budgetSpent / estimateSetCount : 0,
    };
  }, [reportingData, processedTargetData, period, usersBudgetAndRevenue]);

  const cards = getDashboardCards(isAdminView, aggregatedMetrics);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8 ${isAdminView ? 'xl:grid-cols-6 gap-3' : ''}`}>
      {cards.map((card, index) => (
        <TopCard
          key={index}
          title={card.title}
          icon={card.icon}
          metrics={card.metrics}
          isAdminView={isAdminView}
          description={card.description}
          variant={isAdminView ? 'medium' : 'large'}
        />
      ))}
    </div>
  );
};
