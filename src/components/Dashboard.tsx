import { useEffect } from 'react';
import { useReportingDataStore } from '@/stores/reportingDataStore';
import { DatePeriodSelector } from '@/components/DatePeriodSelector';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { MetricsLineCharts } from './MetricsLineCharts';
import { DualMetricChart } from './DualMetricChart';
import { DashboardTopCards } from './DashboardTopCards';
import { useUserStore } from '@/stores/userStore';
import { TrendingUp, DollarSign, Filter, Users, Calendar } from 'lucide-react';
import { 
  revenueMetricsChartConfigs, 
  funnelMetricsChartConfigs, 
  performanceMetricsChartConfigs 
} from '@/utils/constant';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';

export const Dashboard = () => {
  const { reportingData, getReportingData } = useReportingDataStore();
  const { selectedUserId } = useUserStore();
  const { 
    comprehensiveChartData, 
    period, 
    selectedDate, 
    setSelectedDate, 
    setPeriod, 
    processedTargetData, 
    dualMetricConfigs,
    dualMetricChartsData
  } = useDashboardMetrics();

  useEffect(() => {
    let startDate: string, endDate: string, queryType: string;
    if (period === "monthly") {
      startDate = format(startOfMonth(selectedDate), "yyyy-MM-dd");
      endDate = format(endOfMonth(selectedDate), "yyyy-MM-dd");
      queryType = "monthly";
    } else if (period === "ytd") {
      startDate = format(startOfYear(selectedDate), "yyyy-MM-dd");
      endDate = format(new Date(), "yyyy-MM-dd");
      queryType = "yearly";
    } else {
      startDate = format(startOfYear(selectedDate), "yyyy-MM-dd");
      endDate = format(endOfYear(selectedDate), "yyyy-MM-dd");
      queryType = "yearly";
    }
    getReportingData(startDate, endDate, queryType);
  }, [selectedDate, period, selectedUserId, getReportingData]);

  const handleDatePeriodChange = (
    date: Date,
    newPeriod: "weekly" | "monthly" | "yearly" | "ytd"
  ) => {
    setSelectedDate(date);
    setPeriod(newPeriod);
  };

  // Icon mapping for dual metric charts
  const getDualMetricIcon = (key: string) => {
    const iconMap = {
      leads: <Users className="h-5 w-5 text-primary" />,
      appointmentsSet: <Calendar className="h-5 w-5 text-accent" />,
      appointments: <Calendar className="h-5 w-5 text-primary-light" />,
      jobsBooked: <DollarSign className="h-5 w-5 text-success" />
    };
    return iconMap[key as keyof typeof iconMap] || <TrendingUp className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative z-10 py-12 px-4">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-4">
              <h1 className="leading-[130%] text-4xl font-bold text-gradient-primary">
                Performance Dashboard
              </h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg mb-10 mt-2">
              Track your key metrics and performance trends with comprehensive analytics
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="max-w-7xl mx-auto mb-8">
          <DatePeriodSelector
            initialDate={selectedDate}
            initialPeriod={period}
            onChange={handleDatePeriodChange}
            allowedPeriods={["monthly", "yearly", "ytd"]}
          />
        </div>

        {/* Top Cards */}
        <div className="max-w-7xl mx-auto">
          <DashboardTopCards 
            reportingData={reportingData || []}
            processedTargetData={processedTargetData}
            period={period}
          />
        </div>

        {/* Revenue Metrics Charts */}
        <div className="max-w-7xl mx-auto mb-8">
          <MetricsLineCharts 
            chartData={comprehensiveChartData} 
            chartConfigs={revenueMetricsChartConfigs}
            title="Revenue Metrics"
            icon={<DollarSign className="h-5 w-5 text-green-600" />}
          />
        </div>

        {/* Funnel Metrics Charts */}
        <div className="max-w-7xl mx-auto mb-8">
          <MetricsLineCharts 
            chartData={comprehensiveChartData} 
            chartConfigs={funnelMetricsChartConfigs}
            title="Funnel Metrics"
            icon={<Filter className="h-5 w-5 text-purple-600" />}
          />
        </div>

        {/* Dual Metric Charts - Optimized */}
        <div className=" mb-6 p-6 bg-gradient-to-br rounded-lg from-background via-muted/15 to-primary/3 shadow-lg border border-border hover:shadow-2xl hover:border-primary/10 transition-all duration-300 group backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <h3 className="text-[20px] font-semibold text-card-foreground">Cost Metrics</h3>
          </div>
            <div className="grid grid-cols-2 lg:grid-cols-2 gap-8">
              {dualMetricConfigs.map((config) => (
                <DualMetricChart
                  key={config.key}
                  chartData={dualMetricChartsData[config.key] || []}
                  title={config.title}
                  metric1Config={config.metric1Config}
                  metric2Config={config.metric2Config}
                  icon={getDualMetricIcon(config.key)}
                />
              ))}
            </div>
        </div>

        {/* Performance Metrics Charts */}
        <div className="max-w-7xl mx-auto mb-8">
          <MetricsLineCharts 
            chartData={comprehensiveChartData} 
            chartConfigs={performanceMetricsChartConfigs}
            title="Performance Metrics"
            icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
            gridCols="grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
          />
        </div>
      </div>
    </div>
  );
};
