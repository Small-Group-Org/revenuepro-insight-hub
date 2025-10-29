import { useEffect, useState } from 'react';
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
import { TrendingUp, DollarSign, Filter, Users, Calendar, BarChart3 } from 'lucide-react';
import { 
  revenueMetricsChartConfigs, 
  funnelMetricsChartConfigs, 
  performanceMetricsChartConfigs 
} from '@/utils/constant';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { FullScreenLoader } from '@/components/ui/full-screen-loader';
import { useCombinedLoading } from '@/hooks/useCombinedLoading';
import { ReleaseNotesModal } from './ReleaseNotesModal';
import { useUserContext } from '@/utils/UserContext';
import { markUpdateAsSeen } from '@/service/userService';
import { useToast } from '@/hooks/use-toast';


export const Dashboard = () => {
  const { reportingData, getReportingData, getComparisonData, clearComparisonData } = useReportingDataStore();
  const { selectedUserId } = useUserStore();
  const { user, setUser } = useUserContext();
  const { toast } = useToast();
  const { 
    comprehensiveChartData, 
    period, 
    selectedDate, 
    setSelectedDate, 
    setPeriod, 
    processedTargetData, 
    dualMetricConfigs,
    dualMetricChartsData,
    processedComparisonData
  } = useDashboardMetrics();
  
  const { isLoading } = useCombinedLoading();

  // State for comparison data
  const [comparisonPeriod, setComparisonPeriod] = useState<string>('');
  const [isComparisonEnabled, setIsComparisonEnabled] = useState<boolean>(false);
  
  // State for release notes modal
  const [showReleaseNotesModal, setShowReleaseNotesModal] = useState<boolean>(false);

  // Check if user needs to see release notes
  useEffect(() => {
    if (user && user.hasSeenLatestUpdate === false) {
      setShowReleaseNotesModal(true);
    }
  }, [user]);

  // Main data fetching effect - only fetch main data
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
    getReportingData(startDate, endDate, queryType, period);
  }, [selectedDate, period, selectedUserId, getReportingData]);

  // Reset comparison state when period or selectedDate changes
  useEffect(() => {
    setIsComparisonEnabled(false);
    setComparisonPeriod('');
    clearComparisonData();
  }, [period, selectedDate]);

  const handleDatePeriodChange = (
    date: Date,
    newPeriod: "weekly" | "monthly" | "yearly" | "ytd"
  ) => {
    setSelectedDate(date);
    setPeriod(newPeriod);
  };

  const handleComparisonChange = (selectedPeriod: string) => {
    if (selectedPeriod && selectedPeriod !== comparisonPeriod) {
      setComparisonPeriod(selectedPeriod);
      setIsComparisonEnabled(true);
      
      let startDate: string, endDate: string, queryType: string;
      
      if (period === "monthly") {
        const [year, month] = selectedPeriod.split('-');
        const compareDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        
        startDate = format(startOfMonth(compareDate), "yyyy-MM-dd");
        endDate = format(endOfMonth(compareDate), "yyyy-MM-dd");
        queryType = "monthly";
      } else if (period === "yearly" || period === "ytd") {
        const year = parseInt(selectedPeriod);
        const compareDate = new Date(year, 0, 1);
        
        startDate = format(startOfYear(compareDate), "yyyy-MM-dd");
        endDate = format(endOfYear(compareDate), "yyyy-MM-dd");
        queryType = "yearly";
      }
      
      fetchComparisonData(startDate, endDate, queryType);
    } else if (!selectedPeriod) {
      setIsComparisonEnabled(false);
      setComparisonPeriod('');
    }
  };

  const fetchComparisonData = async (startDate: string, endDate: string, queryType: string) => {
    try {
      await getComparisonData(startDate, endDate, queryType);
    } catch (error) {
      console.error('Error fetching comparison data:', error);
    }
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

  const handleMarkUpdateAsSeen = async () => {
    try {
      await markUpdateAsSeen();
      // Update user context to reflect that they've seen the update
      if (user) {
        setUser({ ...user, hasSeenLatestUpdate: true });
      }
      toast({
        title: "Success",
        description: "Release notes marked as seen",
      });
    } catch (error) {
      console.error('Error marking update as seen:', error);
      toast({
        title: "Error",
        description: "Failed to mark release notes as seen",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative z-10 pt-4 pb-12 px-4">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/60 rounded-lg  flex items-center justify-center shadow-lg">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
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
            periodType={period === "ytd" ? "yearly" : period === "weekly" ? "monthly" : period}
            selectedDate={selectedDate}
          />
        </div>

                 {/* Funnel Metrics Charts */}
         <div className="max-w-7xl mx-auto mb-8">
           <MetricsLineCharts 
             chartData={comprehensiveChartData} 
             chartConfigs={funnelMetricsChartConfigs}
             title="Funnel Metrics"
             icon={<Filter className="h-5 w-5 text-purple-600" />}
             periodType={period === "ytd" ? "yearly" : period === "weekly" ? "monthly" : period}
             selectedDate={selectedDate}
             onComparisonChange={handleComparisonChange}
             comparisonData={processedComparisonData}
             isComparisonEnabled={isComparisonEnabled}
             comparisonPeriod={comparisonPeriod}
           />
         </div>

        {/* Dual Metric Charts - Optimized */}
        <div className="max-w-7xl mx-auto mb-6 p-6 bg-gradient-to-br rounded-lg from-background via-muted/15 to-primary/3 shadow-lg border border-border hover:shadow-2xl hover:border-primary/10 transition-all duration-300 group backdrop-blur-sm">
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
            periodType={period === "ytd" ? "yearly" : period === "weekly" ? "monthly" : period}
            selectedDate={selectedDate}
          />
        </div>
      </div>
      
      {/* Release Notes Modal */}
      <ReleaseNotesModal
        isOpen={showReleaseNotesModal}
        onClose={() => setShowReleaseNotesModal(false)}
        onMarkAsSeen={handleMarkUpdateAsSeen}
      />
      
      {/* Full Screen Loader */}
      <FullScreenLoader isLoading={isLoading} message="Loading dashboard data..." />
    </div>
  );
};
