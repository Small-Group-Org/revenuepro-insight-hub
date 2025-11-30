import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCurrencyValue,
} from "@/utils/page-utils/commonUtils";
import { AggregatedMetricsType } from "../dashboard.types";
import { getDashboardCards } from "../utils/utils";

interface TopCardProps {
  title: string;
  icon: React.ReactNode;
  description?: string;
  metrics: Array<{
    label: string;
    value: number;
    format: "currency" | "percent" | "number";
  }>;
  twoRowDesign?: boolean;
}

export const TopCard: React.FC<TopCardProps> = ({
  title,
  icon,
  description,
  metrics,
  twoRowDesign = false,
}) => {
  const formatValue = (val: number, fmt: string) => {
    if (fmt === "currency") {
      return formatCurrencyValue(val);
    }
    if (fmt === "percent") {
      return `${val.toFixed(2)}%`;
    }
    return Math.round(val).toLocaleString();
  };

  return (
    <Card className="bg-gradient-to-br from-background via-muted/15 to-primary/3 shadow-lg border border-border hover:shadow-2xl hover:border-primary/10 transition-all duration-300 group hover:scale-105 backdrop-blur-sm">
      {!twoRowDesign && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium text-card-foreground">
                {title}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className="pt-0 relative">
        <div className="min-h-[80px] flex flex-col gap-4 mt-1 justify-center">
          {twoRowDesign ? (
            // 2-row design: Title + Count on first row, description on second row
            <>
              <div className="flex flex-col justify-center">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold text-card-foreground">
                    {title}
                  </span>
                  <span
                    className={`font-bold text-card-foreground transition-all duration-300 text-[30px]`}
                  >
                    {formatValue(metrics[0].value, metrics[0].format)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-[11px] text-muted-foreground/70 italic">
                  {description}
                </span>
              </div>
            </>
          ) : metrics.length === 1 ? (
            // Original single metric design
            <>
              <div className="flex flex-col justify-center">
                <span
                  className={`font-bold text-card-foreground transition-all duration-300 text-[30px]`}
                >
                  {formatValue(metrics[0].value, metrics[0].format)}
                </span>
              </div>
              <div className="flex flex-col justify-center mt-auto">
                <span className="text-[11px] text-muted-foreground/70 italic">
                  {description}
                </span>
              </div>
            </>
          ) : (
            // Original multiple metrics design
            <>
              <div className="flex flex-col justify-center">
                <span
                  className={`font-bold text-card-foreground transition-all duration-300 text-[30px]`}
                >
                  {formatValue(metrics[0].value, metrics[0].format)}
                </span>
              </div>
              <div className="flex flex-col justify-center mt-auto">
                <span className="text-xs text-muted-foreground">
                  {metrics[1].label}
                </span>
                <span
                  className={`font-bold text-card-foreground transition-all duration-300 text-sm`}
                >
                  {formatValue(metrics[1].value, metrics[1].format)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Bottom right corner icon */}
        <div className="absolute bottom-3 right-3 opacity-40 group-hover:opacity-70 transition-all duration-300">
          <div className="text-2xl">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
};

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
  console.log({aggregatedMetrics, usersBudgetAndRevenue});

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
      {cards.map((card, index) => (
        <TopCard
          key={index}
          title={card.title}
          icon={card.icon}
          metrics={card.metrics}
          description={card.description}
        />
      ))}
    </div>
  );
};
