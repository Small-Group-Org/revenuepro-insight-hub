import { DisableMetadata, PeriodType } from "@/types";
import { format } from "date-fns";
import { 
  isTimeFrameEditable, 
  getUniqueQueryTypes 
} from "./targetUtils";
import { 
  isTimeFrameInPast 
  } from "./actualDataUtils";
import { IReportingData } from '@/service/reportingServices';
import { IWeeklyTarget } from '@/service/targetService';

// ============================================================================
// COMPARISON CALCULATION UTILITIES
// ============================================================================

/**
 * Calculates variance between target and actual values
 */
export function calculateVariance(target: number, actual: number): {
  variance: number;
  variancePercentage: number;
  isPositive: boolean;
} {
  const variance = actual - target;
  const variancePercentage = target > 0 ? (variance / target) * 100 : 0;
  const isPositive = variance >= 0;

  return {
    variance,
    variancePercentage,
    isPositive,
  };
}

/**
 * Compares target vs actual data and returns comparison metrics
 */
export function compareTargetVsActual(
  targetData: any,
  actualData: any
): {
  revenueComparison: any;
  leadsComparison: any;
  estimatesSetComparison: any;
  estimatesRanComparison: any;
  salesComparison: any;
  budgetComparison: any;
} {
  const compare = (targetValue: number, actualValue: number) => {
    const variance = calculateVariance(targetValue, actualValue);
    return {
      target: targetValue,
      actual: actualValue,
      ...variance,
    };
  };

  return {
    revenueComparison: compare(targetData.revenue || 0, actualData.revenue || 0),
    leadsComparison: compare(targetData.leads || 0, actualData.leads || 0),
    estimatesSetComparison: compare(targetData.estimatesSet || 0, actualData.estimatesSet || 0),
    estimatesRanComparison: compare(targetData.estimatesRan || 0, actualData.estimatesRan || 0),
    salesComparison: compare(targetData.sales || 0, actualData.sales || 0),
    budgetComparison: compare(targetData.budget || 0, actualData.budgetSpent || 0),
  };
}

/**
 * Calculates efficiency comparison between target and actual rates
 */
export function compareEfficiencyRates(
  targetData: any,
  actualData: any
): {
  appointmentRateComparison: any;
  showRateComparison: any;
  closeRateComparison: any;
  leadToSaleComparison: any;
} {
  const compareRate = (targetRate: number, actualRate: number) => {
    const variance = calculateVariance(targetRate, actualRate);
    return {
      target: targetRate,
      actual: actualRate,
      ...variance,
    };
  };

  return {
    appointmentRateComparison: compareRate(
      targetData.appointmentRate || 0,
      actualData.actualAppointmentRate || 0
    ),
    showRateComparison: compareRate(
      targetData.showRate || 0,
      actualData.actualShowRate || 0
    ),
    closeRateComparison: compareRate(
      targetData.closeRate || 0,
      actualData.actualCloseRate || 0
    ),
    leadToSaleComparison: compareRate(
      targetData.leadToSale || 0,
      actualData.actualLeadToSale || 0
    ),
  };
}

// ============================================================================
// INPUT DISABLE LOGIC UTILITIES
// ============================================================================

/**
 * Unified disable logic that combines past date validation and target status logic
 * This function handles all disable scenarios for both SetTargets and AddActualData pages
 */
export const handleInputDisable = (
  period: PeriodType,
  selectedDate: Date,
  currentTarget: any[] | null = null,
  pageType: "setTargets" | "addActualData" | "leadSheet" = "setTargets",
  userRole?: string
): DisableMetadata => {
  let isDisabled = false;
  let disabledMessage: string | null = null;
  let noteMessage: string | null = null;
  const shouldDisableNonRevenueFields = false;
  let isButtonDisabled = false;

  if (pageType === "leadSheet" && userRole !== 'ADMIN') {
    isDisabled = true;
    isButtonDisabled = true;
    disabledMessage = "Only Revenue PRO team members can modify lead sheet data";
    noteMessage = "Access restricted to Revenue PRO team members";
    return {
      isDisabled,
      disabledMessage,
      noteMessage,
      shouldDisableNonRevenueFields,
      isButtonDisabled,
    };
  }

  if (pageType === "addActualData") {
    const isInPast = isTimeFrameInPast(period, selectedDate);
    if (!isInPast) {
      isDisabled = true;
      isButtonDisabled = true;
      disabledMessage = "Actual data can only be entered for past dates";
      return {
        isDisabled,
        disabledMessage,
        noteMessage,
        shouldDisableNonRevenueFields,
        isButtonDisabled,
      };
    }
  } else {
    // For SetTargets page, check if the time frame is editable (not in the past)
    if(userRole === 'ADMIN'){
      return {
        isDisabled,
        disabledMessage,
        noteMessage,
        shouldDisableNonRevenueFields,
        isButtonDisabled,
      }
    }
    const isEditable = isTimeFrameEditable(period, selectedDate);
    if (!isEditable) {
      // Past date logic - disable everything
      isDisabled = true;
      isButtonDisabled = true;
      disabledMessage = "Past Targets cannot be updated";
      return {
        isDisabled,
        disabledMessage,
        noteMessage,
        shouldDisableNonRevenueFields,
        isButtonDisabled,
      };
    }
  }

  // Check period restrictions for actual data
  if (pageType === "addActualData" && period !== "weekly") {
    isDisabled = true;
    isButtonDisabled = true;
    noteMessage = "Reporting data can only be added in week view";
    return {
      isDisabled,
      disabledMessage,
      noteMessage,
      shouldDisableNonRevenueFields,
      isButtonDisabled,
    };
  }

  // Target status logic (only for SetTargets page and when time frame is editable)
  // if (pageType === "setTargets" && currentTarget) {
  //   const queryTypes = getUniqueQueryTypes(currentTarget);
  //   const hasTargets = queryTypes.length > 0;

  //   // Generate note messages based on target status
  //   if (period === "yearly") {
  //     if (
  //       hasTargets &&
  //       queryTypes.includes("monthly") &&
  //       queryTypes.length === 1
  //     ) {
  //       noteMessage =
  //         "You have not set target for this year. These are values are calculated using months previous target";
  //     }
  //   } else if (period === "monthly") {
  //     if (queryTypes.includes("yearly")) {
  //       const monthName = format(selectedDate, "MMMM");
  //       noteMessage = `The target for ${monthName} is already set on yearly basis. You can only update the revenue of ${monthName}`;
  //       shouldDisableNonRevenueFields = true;
  //       disabledMessage = noteMessage;
  //     }
  //   }
  //   // Removed weekly restrictions - users can now set weekly targets for any upcoming week
  // }

  return {
    isDisabled,
    disabledMessage,
    noteMessage,
    shouldDisableNonRevenueFields,
    isButtonDisabled,
  };
};

// ============================================================================
// PERFORMANCE ANALYSIS UTILITIES
// ============================================================================

/**
 * Analyzes performance trends and provides insights
 */
export function analyzePerformanceTrends(
  comparisons: any[]
): {
  topPerformers: string[];
  underPerformers: string[];
  insights: string[];
} {
  const topPerformers: string[] = [];
  const underPerformers: string[] = [];
  const insights: string[] = [];

  // Analyze revenue performance
  const revenueComparison = comparisons.find(c => c.revenueComparison);
  if (revenueComparison) {
    const { variancePercentage, isPositive } = revenueComparison.revenueComparison;
    if (isPositive && variancePercentage > 10) {
      topPerformers.push('Revenue');
      insights.push(`Revenue exceeded target by ${variancePercentage.toFixed(1)}%`);
    } else if (!isPositive && Math.abs(variancePercentage) > 10) {
      underPerformers.push('Revenue');
      insights.push(`Revenue fell short by ${Math.abs(variancePercentage).toFixed(1)}%`);
    }
  }

  // Analyze lead generation performance
  const leadsComparison = comparisons.find(c => c.leadsComparison);
  if (leadsComparison) {
    const { variancePercentage, isPositive } = leadsComparison.leadsComparison;
    if (isPositive && variancePercentage > 15) {
      topPerformers.push('Lead Generation');
      insights.push(`Lead generation exceeded target by ${variancePercentage.toFixed(1)}%`);
    } else if (!isPositive && Math.abs(variancePercentage) > 15) {
      underPerformers.push('Lead Generation');
      insights.push(`Lead generation fell short by ${Math.abs(variancePercentage).toFixed(1)}%`);
    }
  }

  // Analyze conversion rates
  const efficiencyComparison = comparisons.find(c => c.efficiencyComparison);
  if (efficiencyComparison) {
    const { closeRateComparison } = efficiencyComparison.efficiencyComparison;
    if (closeRateComparison && closeRateComparison.isPositive) {
      insights.push(`Close rate improved by ${closeRateComparison.variancePercentage.toFixed(1)}%`);
    } else if (closeRateComparison && !closeRateComparison.isPositive) {
      insights.push(`Close rate decreased by ${Math.abs(closeRateComparison.variancePercentage).toFixed(1)}%`);
    }
  }

  return {
    topPerformers,
    underPerformers,
    insights,
  };
}

/**
 * Calculates ROI metrics for marketing campaigns
 */
export function calculateROIMetrics(
  targetData: any,
  actualData: any
): {
  targetROI: number;
  actualROI: number;
  roiVariance: number;
  costPerLead: number;
  costPerSale: number;
} {
  const targetROI = targetData.budget > 0 ? (targetData.revenue / targetData.budget) * 100 : 0;
  const actualROI = actualData.budgetSpent > 0 ? (actualData.revenue / actualData.budgetSpent) * 100 : 0;
  const roiVariance = actualROI - targetROI;
  
  const costPerLead = actualData.leads > 0 ? actualData.budgetSpent / actualData.leads : 0;
  const costPerSale = actualData.sales > 0 ? actualData.budgetSpent / actualData.sales : 0;

  return {
    targetROI,
    actualROI,
    roiVariance,
    costPerLead,
    costPerSale,
  };
} 

// Function to prepare chart data with comparison
export const prepareChartDataWithComparison = (
  chartData: Array<{
    week: string;
    actual: number | null;
    target: number | null;
    format: string;
    message?: string;
  }>,
  comparisonData: any,
  configKey: string
) => {
  if (!comparisonData || !comparisonData[configKey]) {
    return chartData;
  }

  const comparisonDataForConfig = comparisonData[configKey];
  
  // Get the maximum length between current and comparison data
  const maxLength = Math.max(chartData?.length || 0, comparisonDataForConfig?.length || 0);
  
  // Create new array with the maximum length
  const data = Array.from({ length: maxLength }, (_, index) => {
    const currentItem = chartData[index];
    const comparisonItem = comparisonDataForConfig[index];
    
    if (currentItem) {
      return {
        ...currentItem,
        comparison: comparisonItem?.actual || 0
      };
    } else {
      // Create placeholder for missing current data
      return {
        week: `Period ${index + 1}`,
        actual: 0,
        target: 0,
        format: "number",
        comparison: comparisonItem?.actual || 0
      };
    }
  });

  return data;
};


