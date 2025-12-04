import { PeriodType } from "@/types";
import { getWeeksInMonth } from "date-fns";
import { IReportingData } from "@/service/reportingServices";
import { IWeeklyTarget } from "@/service/targetService";

export const getXAxisLabels = (period: PeriodType, selectedDate: Date, dataLength?: number) => {
    if (period === 'monthly') {
      const weekCount = dataLength || getWeeksInMonth(selectedDate);
      return Array.from({ length: weekCount }, (_, i) => `Week ${i + 1}`);
    } else if (period === 'yearly') {
      return [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
    } else if (period === 'ytd') {
      const currentMonth = new Date().getMonth();
      const monthLabels = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      return monthLabels.slice(0, currentMonth + 1);
    }
    // fallback - default to 4 weeks
    return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  };

  export const monthLabels = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  export const dualMetricConfigs =[
    {
      key: 'leads',
      metric1Key: 'leads',
      metric2Key: 'cpl',
      title: 'Leads & Cost Per Lead',
      description: 'Number of leads generated vs cost per lead',
      metric1Config: {
        key: "leads",
        title: "Number of Leads",
        actualColor: "#396bbd",
        format: "number"
      },
      metric2Config: {
        key: "cpl",
        title: "Cost Per Lead",
        actualColor: "#649cf7",
        format: "currency"
      }
    },
    {
      key: 'appointmentsSet',
      metric1Key: 'estimatesSet',
      metric2Key: 'cpEstimateSet',
      title: 'Appointments Set & Cost',
      description: 'Number of appointments set vs cost per appointment set',
      metric1Config: {
        key: "estimatesSet",
        title: "Appointments Set",
        actualColor: "#396bbd",
        format: "number"
      },
      metric2Config: {
        key: "cpEstimateSet",
        title: "Cost per Appointment Set",
        actualColor: "#649cf7",
        format: "currency"
      }
    },
    {
      key: 'appointments',
      metric1Key: 'estimatesRan',
      metric2Key: 'cpEstimate',
      title: 'Appointments & Cost',
      description: 'Number of appointments completed vs cost per appointment set',
      metric1Config: {
        key: "estimatesRan",
        title: "Appointments",
        actualColor: "#396bbd",
        format: "number"
      },
      metric2Config: {
        key: "cpEstimate",
        title: "Cost per Appointment Set",
        actualColor: "#649cf7",
        format: "currency"
      }
    },
    {
      key: 'jobsBooked',
      metric1Key: 'sales',
      metric2Key: 'cpJobBooked',
      title: 'Jobs Booked & Cost',
      description: 'Number of jobs booked vs cost per job',
      metric1Config: {
        key: "sales",
        title: "Jobs Booked",
        actualColor: "#396bbd",
        format: "number"
      },
      metric2Config: {
        key: "cpJobBooked",
        title: "Cost per Job",
        actualColor: "#649cf7",
        format: "currency"
      }
    }
  ];

  export const metricTypes = [
    "totalCom",
    "revenue",
    "cpEstimateSet",
    "cpl",
    "appointmentRate",
    "showRate",
    "closeRate",
    "avgJobSize",
    "leads",
    "estimatesSet",
    "estimatesRan",
    "sales",
    "leadToSale",
    "com",
    "budgetSpent",
  ];

export const processYTDData = (
  actualData: IReportingData[],
  targetData: IWeeklyTarget[]
): { success: boolean; data: IReportingData[] | null; message: string } => {
  if (!targetData || targetData.length === 0) {
    console.warn("[YTD] No target data available for YTD calculation");
    return { success: false, data: null, message: "No target data available for YTD calculation" };
  }

  // Edge case: Check if actualData is empty or invalid
  if (!actualData || actualData.length === 0) {
    console.warn("[YTD] No actual data available for YTD calculation");
    return { success: false, data: null, message: "No actual data available for YTD calculation" };
  }

  const ytdActualData: IReportingData[] = [];

  targetData.forEach((data, i) => {
    // Edge case: Validate weekNumber exists and is a valid number
    if (data?.weekNumber === undefined || data?.weekNumber === null || typeof data.weekNumber !== 'number') {
      console.warn(`[YTD] Invalid weekNumber at index ${i}:`, data);
      return; // Skip this iteration
    }

    const weekStart = data.weekNumber;
    
    // Edge case: Check if weekStart is within bounds of actualData
    if (weekStart < 0 || weekStart >= actualData.length) {
      console.warn(`[YTD] weekStart (${weekStart}) out of bounds for actualData length (${actualData.length}) at index ${i}`);
      return; // Skip this iteration
    }

    // Edge case: Handle last element case (no next element)
    let weekEnd: number;
    if (i === targetData.length - 1) {
      // Last element: use actualData length as end boundary
      weekEnd = actualData.length;
    } else {
      const nextData = targetData[i + 1];
      // Edge case: Validate next element's weekNumber
      if (nextData?.weekNumber === undefined || nextData?.weekNumber === null || typeof nextData.weekNumber !== 'number') {
        console.warn(`[YTD] Invalid weekNumber in next element at index ${i + 1}:`, nextData);
        return; // Skip this iteration
      }
      weekEnd = nextData.weekNumber;
    }

    const actualMonthlyData = weekEnd <= weekStart || weekEnd > actualData.length ?  
                              actualData.slice(weekStart-1, actualData.length) : 
                              actualData.slice(weekStart-1, weekEnd-1);
    
    // Edge case: Check if slice returned valid data
    if (actualMonthlyData && actualMonthlyData.length > 0) {
      const aggregatedData = actualMonthlyData.reduce((acc, curr) => {
        Object.keys(curr).forEach((key) => {
          if (key !== 'userId' && key !== 'startDate' && key !== 'endDate' && 
              key !== '_id' && key !== 'createdAt' && key !== 'updatedAt' && key !== '__v') {
            acc[key] = (acc[key] || 0) + (curr[key] || 0);
          }
        });
        return acc;
      }, {});
      ytdActualData.push(aggregatedData as IReportingData);
    } else {
      console.warn(`[YTD] No data found for week range ${weekStart}-${weekEnd} at index ${i}`);
    }
  });

  // Edge case: Check if we successfully collected any YTD data
  if (ytdActualData.length === 0) {
    return { success: false, data: null, message: "No YTD data collected" };
  }

  return { success: true, data: ytdActualData, message: "YTD data processed successfully" };
};