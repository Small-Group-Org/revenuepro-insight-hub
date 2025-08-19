import { PeriodType } from "@/types";
import { getWeeksInMonth } from "date-fns";

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
        actualColor: "#3B82F6",
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
      description: 'Number of appointments set vs cost per appointment',
      metric1Config: {
        key: "estimatesSet",
        title: "Appointments Set",
        actualColor: "#3B82F6",
        format: "number"
      },
      metric2Config: {
        key: "cpEstimateSet",
        title: "Cost per Appointment",
        actualColor: "#649cf7",
        format: "currency"
      }
    },
    {
      key: 'appointments',
      metric1Key: 'estimatesRan',
      metric2Key: 'cpEstimate',
      title: 'Appointments & Cost',
      description: 'Number of appointments completed vs cost per appointment',
      metric1Config: {
        key: "estimatesRan",
        title: "Appointments",
        actualColor: "#3B82F6",
        format: "number"
      },
      metric2Config: {
        key: "cpEstimate",
        title: "Cost per Appointment",
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
        actualColor: "#3B82F6",
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
  ];