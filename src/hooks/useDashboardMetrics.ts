import { useReportingDataStore } from "@/stores/reportingDataStore";
import { FieldValue } from "@/types";
import { calculateManagementCost } from "@/utils/page-utils/commonUtils";
import {
  dualMetricConfigs,
  getXAxisLabels,
  metricTypes,
} from "@/utils/page-utils/dashboardUtils";
import {
  calculateFields,
  processTargetData,
} from "@/utils/page-utils/targetUtils";
import { useMemo, useState, useCallback } from "react";
import { getWeeksInMonth } from "date-fns";

export const useDashboardMetrics = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<"weekly" | "monthly" | "yearly" | "ytd">(
    "monthly"
  );
  const { reportingData, targetData, comparisonData } = useReportingDataStore();

  // Shared function to process data based on period
  const processDataByPeriod = useCallback((
    data: any[] | null,
    processFunction: (item: any, index: number) => any,
    fallbackFunction: () => any
  ) => {
    if (!data || data.length === 0) {
      return undefined;
    }

    if (period === "monthly") {
      return Array.from({ length: data.length }, (_, i) => {
        return data[i] ? processFunction(data[i], i) : fallbackFunction();
      });
    }

    if (period === "yearly" || period === "ytd") {
      return data.map((item, index) => {
        return processFunction(item, index);
      });
    }

    // For weekly period, return a single data point
    return fallbackFunction();
  }, [period, selectedDate]);

  const processDataPoint = (dataPoint: any, index: number) => {
    const metrics: FieldValue = {};

    metrics.revenue = dataPoint.revenue || 0;
    metrics.sales = dataPoint.sales || 0;
    metrics.estimatesRan = dataPoint.estimatesRan || 0;
    metrics.estimatesSet = dataPoint.estimatesSet || 0;
    metrics.leads = dataPoint.leads || 0;
    metrics.budgetSpent = dataPoint.awarenessBrandingBudgetSpent + dataPoint.leadGenerationBudgetSpent + dataPoint.testingBudgetSpent;

    if (metrics.leads > 0 && metrics.estimatesSet > 0) {
      metrics.appointmentRate = (metrics.estimatesSet / metrics.leads) * 100;
    }

    if (metrics.estimatesSet > 0 && metrics.estimatesRan > 0) {
      metrics.showRate = (metrics.estimatesRan / metrics.estimatesSet) * 100;
    }

    if (metrics.estimatesRan > 0 && metrics.sales > 0) {
      metrics.closeRate = (metrics.sales / metrics.estimatesRan) * 100;
    }

    if (metrics.appointmentRate && metrics.showRate && metrics.closeRate) {
      metrics.leadToSale =
        (metrics.appointmentRate * metrics.showRate * metrics.closeRate) /
        10000;
    }

    if (metrics.revenue > 0 && metrics.sales > 0) {
      metrics.avgJobSize = metrics.revenue / metrics.sales;
    }

    if (metrics.leads > 0) {
      metrics.cpl = metrics.budgetSpent / metrics.leads;
    }
    if (metrics.estimatesSet > 0) {
      metrics.cpEstimateSet = metrics.budgetSpent / metrics.estimatesSet;
    }
    if (metrics.estimatesRan > 0) {
      metrics.cpEstimate = metrics.budgetSpent / metrics.estimatesRan;
    }
    if (metrics.sales > 0) {
      metrics.cpJobBooked = metrics.budgetSpent / metrics.sales;
    }

    metrics.budget = metrics.budgetSpent || 0;

    // Calculate totalCom if we have target data
    if (metrics.revenue > 0 && processedTargetData) {
      const managementCost = calculateManagementCost(metrics.budget);

      metrics.totalCom =
        ((managementCost + metrics.budget) / metrics.revenue) * 100;
    }

    return metrics;
  };

  const processedTargetData = useMemo(() => {
    return processDataByPeriod(
      targetData,
      (item) => {
        const targetData = processTargetData([item]);
        return calculateFields(targetData, period === "monthly" ? "weekly" : "monthly", period === "monthly" ? 7 : 30);
      },
      () => {
        const baseTargetData = processTargetData(
          Array.isArray(targetData) ? targetData : [targetData]
        );
        return calculateFields(baseTargetData, period, period === "weekly" ? 7 : 30);
      }
    );
  }, [targetData, period, processDataByPeriod]);

  const processedActualData = useMemo(() => {
    return processDataByPeriod(
      reportingData,
      (item, index) => processDataPoint(item, index),
      () => processDataPoint(reportingData[0], 0)
    );
  }, [reportingData, period, processDataByPeriod]);

  const preProcessedComparisonData = useMemo(() => {
    return processDataByPeriod(
      comparisonData,
      (item, index) => processDataPoint(item, index),
      () => processDataPoint(comparisonData[0], 0)
    );
  }, [comparisonData, period, processDataByPeriod]);

  // Shared function to get value from processed data
  const getValueFromProcessedData = useCallback((
    processedData: any,
    index: number,
    metricType: string
  ): number => {
    if (!processedData) return 0;
    
    if (Array.isArray(processedData)) {
      const dataPoint = processedData[index] || processedData[0];
      return dataPoint?.[metricType] || 0;
    } else {
      // For weekly period, use the single data point
      return processedData[metricType] || 0;
    }
  }, []);

  const comprehensiveChartData = useMemo(() => {
    if (!reportingData || reportingData.length === 0) {
      return {};
    }

    const xLabels = getXAxisLabels(period, selectedDate, period === "monthly" ? reportingData.length : undefined);
    const chartData: any = {};

    metricTypes.forEach((metricType) => {
      chartData[metricType] = xLabels.map((label, index) => {
        const actualValue = getValueFromProcessedData(processedActualData, index, metricType);
        const targetValue = getValueFromProcessedData(processedTargetData, index, metricType);

        // Show message for Total CoM% when period is monthly
        if (metricType === "totalCom" && period === "monthly") {
          return {
            week: label || `Period ${index + 1}`,
            actual: null,
            target: null,
            message: "Total CoM% is not available for the selected period",
            format: "percent",
          };
        }

        return {
          week: label || `Period ${index + 1}`,
          actual: actualValue,
          target: targetValue,
          format:
            metricType.includes("Rate") || metricType === "totalCom"
              ? "percent"
              : metricType === "revenue" ||
                metricType === "avgJobSize" ||
                metricType.includes("cp")
              ? "currency"
              : "number",
        };
      });
    });

    return chartData;
  }, [reportingData, processedTargetData, processedActualData, period, selectedDate, getValueFromProcessedData]);

  const createDualMetricData = useCallback(
    (metric1Key: string, metric2Key: string) => {
      if (!reportingData || reportingData.length === 0) {
        return [];
      }

      const xLabels = getXAxisLabels(period, selectedDate, period === "monthly" ? reportingData.length : undefined);

      return xLabels.map((label, index) => {
        const metric1Actual = getValueFromProcessedData(processedActualData, index, metric1Key);
        const metric2Actual = getValueFromProcessedData(processedActualData, index, metric2Key);

        return {
          week: label || `Period ${index + 1}`,
          metric1Actual,
          metric2Actual,
        };
      });
    },
    [reportingData, processedActualData, period, selectedDate, getValueFromProcessedData]
  );

  const dualMetricChartsData = useMemo(() => {
    return dualMetricConfigs.reduce((acc, config) => {
      acc[config.key] = createDualMetricData(
        config.metric1Key,
        config.metric2Key
      );
      return acc;
    }, {} as Record<string, any[]>);
  }, [dualMetricConfigs, createDualMetricData]);

  // Process comparison data similar to comprehensiveChartData
  const processedComparisonData = useMemo(() => {
    if (!comparisonData || comparisonData.length === 0) {
      return {};
    }

    const xLabels = getXAxisLabels(period, selectedDate, period === "monthly" ? comparisonData.length : undefined);
    const chartData: any = {};

    metricTypes.forEach((metricType) => {
      chartData[metricType] = xLabels.map((label, index) => {
        const actualValue = getValueFromProcessedData(preProcessedComparisonData, index, metricType);

        return {
          week: label || `Period ${index + 1}`,
          actual: actualValue,
          target: null, // No target for comparison data
          format:
            metricType.includes("Rate") || metricType === "totalCom"
              ? "percent"
              : metricType === "revenue" ||
                metricType === "avgJobSize" ||
                metricType.includes("cp")
              ? "currency"
              : "number",
        };
      });
    });

    return chartData;
  }, [comparisonData, period, selectedDate, getValueFromProcessedData]);

  return {
    comprehensiveChartData,
    period,
    selectedDate,
    setSelectedDate,
    setPeriod,
    processedTargetData,
    dualMetricConfigs,
    dualMetricChartsData,
    createDualMetricData,
    getValueFromProcessedData,
    getXAxisLabels,
    processedComparisonData,
  };
};
