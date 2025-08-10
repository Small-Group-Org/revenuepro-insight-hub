import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Users, Calendar, Target, BarChart3 } from 'lucide-react';
import { formatCurrencyValue, calculateManagementCost } from '@/utils/page-utils/commonUtils';

interface TopCardProps {
  title: string;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  // For cards with multiple metrics
  metrics: Array<{
    label: string;
    value: number;
    format: 'currency' | 'percent' | 'number';
  }>;
}

const TopCard: React.FC<TopCardProps> = ({ title, icon, description, trend, metrics }) => {
  const formatValue = (val: number, fmt: string) => {
    if (fmt === "currency") {
      return formatCurrencyValue(val);
    }
    if (fmt === "percent") {
      return `${val.toFixed(1)}%`;
    }
    return Math.round(val).toLocaleString();
  };

  return (
    <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <span>{trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}%</span>
              <TrendingUp className={`h-3 w-3 ${trend.isPositive ? 'rotate-0' : 'rotate-180'}`} />
            </div>
          )}
        </div>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="min-h-[60px] flex flex-col gap-3 mt-1">
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-baseline justify-between">
              <span className="text-xs text-gray-600">{metric.label}</span>
              <span className={`font-semibold text-gray-900 ${
                metrics.length === 1 ? 'text-[20px]' : 'text-[16px]'
              }`}>
                {formatValue(metric.value, metric.format)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface DashboardTopCardsProps {
  reportingData: any[];
  processedTargetData?: any;
  period: string;
}

export const DashboardTopCards: React.FC<DashboardTopCardsProps> = ({ 
  reportingData, 
  processedTargetData, 
  period 
}) => {
  // Calculate aggregated metrics from reporting data
  const aggregatedMetrics = React.useMemo(() => {
    if (!reportingData || reportingData.length === 0) {
      return {
        totalRevenue: 0,
        avgJobSize: 0,
        totalCom: 0,
        totalLeads: 0,
        costPerLead: 0,
        totalAppointmentsSet: 0,
        costPerAppointmentSet: 0,
        appointmentRate: 0
      };
    }

    // Sum up all the data points
    const totals = reportingData.reduce((acc, dataPoint) => {
      acc.revenue += dataPoint.revenue || 0;
      acc.sales += dataPoint.sales || 0;
      acc.leads += dataPoint.leads || 0;
      acc.estimatesSet += dataPoint.estimatesSet || 0;
      acc.estimatesRan += dataPoint.estimatesRan || 0;
      acc.budgetSpent += dataPoint.budgetSpent || 0;
      return acc;
    }, {
      revenue: 0,
      sales: 0,
      leads: 0,
      estimatesSet: 0,
      estimatesRan: 0,
      budgetSpent: 0
    });

    // Calculate derived metrics
    const avgJobSize = totals.sales > 0 ? totals.revenue / totals.sales : 0;
    const costPerLead = totals.leads > 0 ? totals.budgetSpent / totals.leads : 0;
    const costPerAppointmentSet = totals.estimatesSet > 0 ? totals.budgetSpent / totals.estimatesSet : 0;
    const appointmentRate = totals.leads > 0 ? (totals.estimatesSet / totals.leads) * 100 : 0;

    // Calculate totalCoM if we have target data
    let totalCom = 0;
    if (totals.revenue > 0) {
      if (processedTargetData) {
        const targetCom = processedTargetData.com || 0;
        const targetBudget = processedTargetData.weeklyBudget || 0;
        
        let managementCost = 0;
        if (period === "monthly") {
          managementCost = calculateManagementCost(targetBudget);
        } else if (period === "yearly") {
          managementCost = calculateManagementCost(targetBudget / 12);
        } else if (period === "ytd") {
          const currentMonth = new Date().getMonth();
          const monthsElapsed = currentMonth + 1;
          managementCost = calculateManagementCost((targetBudget / 12) * monthsElapsed);
        }
        
        totalCom = ((managementCost + totals.budgetSpent) / totals.revenue) * 100;
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
      appointmentRate
    };
  }, [reportingData, processedTargetData, period]);

  const cards = [
    {
      title: "Revenue",
      icon: <DollarSign className="h-4 w-4 text-green-600" />,
      metrics: [
        {
          label: "Total Revenue",
          value: aggregatedMetrics.totalRevenue,
          format: 'currency' as const
        },
        {
          label: "Average Job Size",
          value: aggregatedMetrics.avgJobSize,
          format: 'currency' as const
        }
      ]
    },
    {
      title: "Total CoM %",
      icon: <Target className="h-4 w-4 text-purple-600" />,
      metrics: [
        {
          label: "Total CoM",
          value: aggregatedMetrics.totalCom,
          format: 'percent' as const
        }
      ]
    },
    {
      title: "Lead Performance",
      icon: <Users className="h-4 w-4 text-indigo-600" />,
      metrics: [
        {
          label: "Total Leads",
          value: aggregatedMetrics.totalLeads,
          format: 'number' as const
        },
        {
          label: "Cost Per Lead",
          value: aggregatedMetrics.costPerLead,
          format: 'currency' as const
        }
      ]
    },
    {
      title: "Appointment Metrics",
      icon: <Calendar className="h-4 w-4 text-teal-600" />,
      metrics: [
        {
          label: "Appointments Set",
          value: aggregatedMetrics.totalAppointmentsSet,
          format: 'number' as const
        },
        {
          label: "Cost per Appointment",
          value: aggregatedMetrics.costPerAppointmentSet,
          format: 'currency' as const
        }
      ]
    },
    {
      title: "Appointment Rate %",
      icon: <TrendingUp className="h-4 w-4 text-emerald-600" />,
      metrics: [
        {
          label: "Appointment Rate",
          value: aggregatedMetrics.appointmentRate,
          format: 'percent' as const
        }
      ]
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
      {cards.map((card, index) => (
        <TopCard
          key={index}
          title={card.title}
          icon={card.icon}
          metrics={card.metrics}
        />
      ))}
    </div>
  );
}; 