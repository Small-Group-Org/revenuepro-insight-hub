import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getWeekInfo, getWeeksInMonth, getMonthsInYear, calculateProportionalSplit, getCurrentWeek, WeekInfo } from '@/utils/weekLogic';

// Target structures for multi-level targeting
export interface WeeklyTargets {
  leads: number;
  appointmentsSet: number;
  appointmentsComplete: number;
  jobsBooked: number;
  salesRevenue: number;
  metaBudgetSpent: number;
}

export interface MonthlyTargets extends WeeklyTargets {
  weeklyBreakdown: { [weekId: string]: WeeklyTargets };
}

export interface YearlyTargets extends WeeklyTargets {
  monthlyBreakdown: { [month: number]: MonthlyTargets };
}

export interface ActualData extends WeeklyTargets {
  weekId: string;
  weekInfo: WeekInfo;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Calculated metrics
export interface FunnelMetrics {
  appointmentRate: number; // Appointments Set / Leads
  showRate: number; // Appointments Complete / Appointments Set  
  closeRate: number; // Jobs Booked / Appointments Complete
  leadToSaleRate: number; // Jobs Booked / Leads
}

export interface CostMetrics {
  costPerLead: number;
  costPerAppointmentSet: number;
  costPerAppointmentComplete: number;
  costPerJobBooked: number;
}

export interface ComparisonData {
  target: WeeklyTargets;
  actual: WeeklyTargets;
  variance: WeeklyTargets;
  percentageAchieved: WeeklyTargets;
  funnelMetrics: FunnelMetrics;
  costMetrics: CostMetrics;
}

interface EnhancedDataContextType {
  // Current view state
  currentYear: number;
  currentMonth: number;
  currentWeek: WeekInfo;
  
  // Data
  yearlyTargets: { [year: number]: YearlyTargets };
  actualData: { [weekId: string]: ActualData };
  
  // Actions
  setCurrentView: (year: number, month?: number, week?: WeekInfo) => void;
  
  // Target management
  setYearlyTargets: (year: number, targets: WeeklyTargets) => void;
  setMonthlyTargets: (year: number, month: number, targets: WeeklyTargets) => void;
  setWeeklyTargets: (weekId: string, targets: WeeklyTargets) => void;
  
  // Actual data management
  setActualData: (weekId: string, data: Omit<ActualData, 'weekId' | 'weekInfo' | 'createdAt' | 'updatedAt'>) => void;
  
  // Getters
  getWeeklyTargets: (weekId: string) => WeeklyTargets | null;
  getMonthlyTargets: (year: number, month: number) => MonthlyTargets | null;
  getYearlyTargets: (year: number) => YearlyTargets | null;
  getActualData: (weekId: string) => ActualData | null;
  
  // Calculations
  calculateComparison: (period: 'week' | 'month' | 'year', identifier: string | number) => ComparisonData;
  calculateFunnelMetrics: (data: WeeklyTargets) => FunnelMetrics;
  calculateCostMetrics: (data: WeeklyTargets) => CostMetrics;
  
  // Aggregations
  getMonthlyAggregates: (year: number, month: number) => { targets: WeeklyTargets; actuals: WeeklyTargets };
  getYearlyAggregates: (year: number) => { targets: WeeklyTargets; actuals: WeeklyTargets };
  
  // Utility
  getWeeksInCurrentMonth: () => WeekInfo[];
  getAllWeeksWithData: () => WeekInfo[];
}

const defaultTargets: WeeklyTargets = {
  leads: 0,
  appointmentsSet: 0,
  appointmentsComplete: 0,
  jobsBooked: 0,
  salesRevenue: 0,
  metaBudgetSpent: 0,
};

const EnhancedDataContext = createContext<EnhancedDataContextType | undefined>(undefined);

export const EnhancedDataProvider = ({ children }: { children: ReactNode }) => {
  const currentWeekInfo = getCurrentWeek();
  
  const [currentYear, setCurrentYear] = useState(currentWeekInfo.belongsToYear);
  const [currentMonth, setCurrentMonth] = useState(currentWeekInfo.belongsToMonth);
  const [currentWeek, setCurrentWeek] = useState(currentWeekInfo);
  
  const [yearlyTargets, setYearlyTargetsState] = useState<{ [year: number]: YearlyTargets }>({});
  const [actualData, setActualDataState] = useState<{ [weekId: string]: ActualData }>({});

  // Load data from localStorage on mount
  useEffect(() => {
    const savedYearlyTargets = localStorage.getItem('revenuepro-yearly-targets');
    const savedActualData = localStorage.getItem('revenuepro-actual-data');
    
    if (savedYearlyTargets) {
      setYearlyTargetsState(JSON.parse(savedYearlyTargets));
    }
    
    if (savedActualData) {
      const parsed = JSON.parse(savedActualData);
      // Convert date strings back to Date objects
      Object.keys(parsed).forEach(weekId => {
        parsed[weekId].createdAt = new Date(parsed[weekId].createdAt);
        parsed[weekId].updatedAt = new Date(parsed[weekId].updatedAt);
      });
      setActualDataState(parsed);
    }
  }, []);

  // Save to localStorage whenever data changes
  const saveYearlyTargets = (data: { [year: number]: YearlyTargets }) => {
    setYearlyTargetsState(data);
    localStorage.setItem('revenuepro-yearly-targets', JSON.stringify(data));
  };

  const saveActualData = (data: { [weekId: string]: ActualData }) => {
    setActualDataState(data);
    localStorage.setItem('revenuepro-actual-data', JSON.stringify(data));
  };

  const setCurrentView = (year: number, month?: number, week?: WeekInfo) => {
    setCurrentYear(year);
    if (month !== undefined) setCurrentMonth(month);
    if (week) setCurrentWeek(week);
  };

  const setYearlyTargets = (year: number, targets: WeeklyTargets) => {
    const months = getMonthsInYear(year);
    const monthlyBreakdown: { [month: number]: MonthlyTargets } = {};
    
    // Calculate monthly splits (12 months)
    const monthlySplits = {
      leads: calculateProportionalSplit(targets.leads, 12),
      appointmentsSet: calculateProportionalSplit(targets.appointmentsSet, 12),
      appointmentsComplete: calculateProportionalSplit(targets.appointmentsComplete, 12),
      jobsBooked: calculateProportionalSplit(targets.jobsBooked, 12),
      salesRevenue: calculateProportionalSplit(targets.salesRevenue, 12),
      metaBudgetSpent: calculateProportionalSplit(targets.metaBudgetSpent, 12),
    };
    
    months.forEach(({ month, weekCount }) => {
      const monthlyTargets: WeeklyTargets = {
        leads: monthlySplits.leads[month],
        appointmentsSet: monthlySplits.appointmentsSet[month],
        appointmentsComplete: monthlySplits.appointmentsComplete[month],
        jobsBooked: monthlySplits.jobsBooked[month],
        salesRevenue: monthlySplits.salesRevenue[month],
        metaBudgetSpent: monthlySplits.metaBudgetSpent[month],
      };
      
      // Calculate weekly splits for this month
      const weeklySplits = {
        leads: calculateProportionalSplit(monthlyTargets.leads, weekCount),
        appointmentsSet: calculateProportionalSplit(monthlyTargets.appointmentsSet, weekCount),
        appointmentsComplete: calculateProportionalSplit(monthlyTargets.appointmentsComplete, weekCount),
        jobsBooked: calculateProportionalSplit(monthlyTargets.jobsBooked, weekCount),
        salesRevenue: calculateProportionalSplit(monthlyTargets.salesRevenue, weekCount),
        metaBudgetSpent: calculateProportionalSplit(monthlyTargets.metaBudgetSpent, weekCount),
      };
      
      const weeklyBreakdown: { [weekId: string]: WeeklyTargets } = {};
      const weeks = getWeeksInMonth(year, month);
      
      weeks.forEach((week, index) => {
        weeklyBreakdown[week.weekId] = {
          leads: weeklySplits.leads[index],
          appointmentsSet: weeklySplits.appointmentsSet[index],
          appointmentsComplete: weeklySplits.appointmentsComplete[index],
          jobsBooked: weeklySplits.jobsBooked[index],
          salesRevenue: weeklySplits.salesRevenue[index],
          metaBudgetSpent: weeklySplits.metaBudgetSpent[index],
        };
      });
      
      monthlyBreakdown[month] = {
        ...monthlyTargets,
        weeklyBreakdown,
      };
    });
    
    const newYearlyTargets = {
      ...yearlyTargets,
      [year]: {
        ...targets,
        monthlyBreakdown,
      },
    };
    
    saveYearlyTargets(newYearlyTargets);
  };

  const setMonthlyTargets = (year: number, month: number, targets: WeeklyTargets) => {
    const currentYearly = yearlyTargets[year];
    if (!currentYearly) return;
    
    const weeks = getWeeksInMonth(year, month);
    const weeklySplits = {
      leads: calculateProportionalSplit(targets.leads, weeks.length),
      appointmentsSet: calculateProportionalSplit(targets.appointmentsSet, weeks.length),
      appointmentsComplete: calculateProportionalSplit(targets.appointmentsComplete, weeks.length),
      jobsBooked: calculateProportionalSplit(targets.jobsBooked, weeks.length),
      salesRevenue: calculateProportionalSplit(targets.salesRevenue, weeks.length),
      metaBudgetSpent: calculateProportionalSplit(targets.metaBudgetSpent, weeks.length),
    };
    
    const weeklyBreakdown: { [weekId: string]: WeeklyTargets } = {};
    weeks.forEach((week, index) => {
      weeklyBreakdown[week.weekId] = {
        leads: weeklySplits.leads[index],
        appointmentsSet: weeklySplits.appointmentsSet[index],
        appointmentsComplete: weeklySplits.appointmentsComplete[index],
        jobsBooked: weeklySplits.jobsBooked[index],
        salesRevenue: weeklySplits.salesRevenue[index],
        metaBudgetSpent: weeklySplits.metaBudgetSpent[index],
      };
    });
    
    const updatedYearly = {
      ...currentYearly,
      monthlyBreakdown: {
        ...currentYearly.monthlyBreakdown,
        [month]: {
          ...targets,
          weeklyBreakdown,
        },
      },
    };
    
    // Recalculate yearly totals
    const newYearlyTotals = Object.values(updatedYearly.monthlyBreakdown).reduce(
      (acc, monthData) => ({
        leads: acc.leads + monthData.leads,
        appointmentsSet: acc.appointmentsSet + monthData.appointmentsSet,
        appointmentsComplete: acc.appointmentsComplete + monthData.appointmentsComplete,
        jobsBooked: acc.jobsBooked + monthData.jobsBooked,
        salesRevenue: acc.salesRevenue + monthData.salesRevenue,
        metaBudgetSpent: acc.metaBudgetSpent + monthData.metaBudgetSpent,
      }),
      { ...defaultTargets }
    );
    
    const newYearlyTargets = {
      ...yearlyTargets,
      [year]: {
        ...newYearlyTotals,
        monthlyBreakdown: updatedYearly.monthlyBreakdown,
      },
    };
    
    saveYearlyTargets(newYearlyTargets);
  };

  const setWeeklyTargets = (weekId: string, targets: WeeklyTargets) => {
    const weekInfo = getWeekInfo(new Date(weekId));
    const year = weekInfo.belongsToYear;
    const month = weekInfo.belongsToMonth;
    
    const currentYearly = yearlyTargets[year];
    if (!currentYearly?.monthlyBreakdown[month]) return;
    
    const updatedMonthly = {
      ...currentYearly.monthlyBreakdown[month],
      weeklyBreakdown: {
        ...currentYearly.monthlyBreakdown[month].weeklyBreakdown,
        [weekId]: targets,
      },
    };
    
    // Recalculate monthly totals
    const newMonthlyTotals = Object.values(updatedMonthly.weeklyBreakdown).reduce(
      (acc, weekData) => ({
        leads: acc.leads + weekData.leads,
        appointmentsSet: acc.appointmentsSet + weekData.appointmentsSet,
        appointmentsComplete: acc.appointmentsComplete + weekData.appointmentsComplete,
        jobsBooked: acc.jobsBooked + weekData.jobsBooked,
        salesRevenue: acc.salesRevenue + weekData.salesRevenue,
        metaBudgetSpent: acc.metaBudgetSpent + weekData.metaBudgetSpent,
      }),
      { ...defaultTargets }
    );
    
    const updatedYearly = {
      ...currentYearly,
      monthlyBreakdown: {
        ...currentYearly.monthlyBreakdown,
        [month]: {
          ...newMonthlyTotals,
          weeklyBreakdown: updatedMonthly.weeklyBreakdown,
        },
      },
    };
    
    // Recalculate yearly totals
    const newYearlyTotals = Object.values(updatedYearly.monthlyBreakdown).reduce(
      (acc, monthData) => ({
        leads: acc.leads + monthData.leads,
        appointmentsSet: acc.appointmentsSet + monthData.appointmentsSet,
        appointmentsComplete: acc.appointmentsComplete + monthData.appointmentsComplete,
        jobsBooked: acc.jobsBooked + monthData.jobsBooked,
        salesRevenue: acc.salesRevenue + monthData.salesRevenue,
        metaBudgetSpent: acc.metaBudgetSpent + monthData.metaBudgetSpent,
      }),
      { ...defaultTargets }
    );
    
    const newYearlyTargets = {
      ...yearlyTargets,
      [year]: {
        ...newYearlyTotals,
        monthlyBreakdown: updatedYearly.monthlyBreakdown,
      },
    };
    
    saveYearlyTargets(newYearlyTargets);
  };

  const setActualData = (weekId: string, data: Omit<ActualData, 'weekId' | 'weekInfo' | 'createdAt' | 'updatedAt'>) => {
    const weekInfo = getWeekInfo(new Date(weekId));
    const now = new Date();
    const existingData = actualData[weekId];
    
    const newActualData = {
      ...actualData,
      [weekId]: {
        ...data,
        weekId,
        weekInfo,
        createdAt: existingData?.createdAt || now,
        updatedAt: now,
      },
    };
    
    saveActualData(newActualData);
  };

  // Getter functions
  const getWeeklyTargets = (weekId: string): WeeklyTargets | null => {
    const weekInfo = getWeekInfo(new Date(weekId));
    const yearly = yearlyTargets[weekInfo.belongsToYear];
    return yearly?.monthlyBreakdown[weekInfo.belongsToMonth]?.weeklyBreakdown[weekId] || null;
  };

  const getMonthlyTargets = (year: number, month: number): MonthlyTargets | null => {
    return yearlyTargets[year]?.monthlyBreakdown[month] || null;
  };

  const getYearlyTargets = (year: number): YearlyTargets | null => {
    return yearlyTargets[year] || null;
  };

  const getActualData = (weekId: string): ActualData | null => {
    return actualData[weekId] || null;
  };

  // Calculation functions
  const calculateFunnelMetrics = (data: WeeklyTargets): FunnelMetrics => {
    const appointmentRate = data.leads > 0 ? (data.appointmentsSet / data.leads) * 100 : 0;
    const showRate = data.appointmentsSet > 0 ? (data.appointmentsComplete / data.appointmentsSet) * 100 : 0;
    const closeRate = data.appointmentsComplete > 0 ? (data.jobsBooked / data.appointmentsComplete) * 100 : 0;
    const leadToSaleRate = data.leads > 0 ? (data.jobsBooked / data.leads) * 100 : 0;
    
    return {
      appointmentRate,
      showRate,
      closeRate,
      leadToSaleRate,
    };
  };

  const calculateCostMetrics = (data: WeeklyTargets): CostMetrics => {
    return {
      costPerLead: data.leads > 0 ? data.metaBudgetSpent / data.leads : 0,
      costPerAppointmentSet: data.appointmentsSet > 0 ? data.metaBudgetSpent / data.appointmentsSet : 0,
      costPerAppointmentComplete: data.appointmentsComplete > 0 ? data.metaBudgetSpent / data.appointmentsComplete : 0,
      costPerJobBooked: data.jobsBooked > 0 ? data.metaBudgetSpent / data.jobsBooked : 0,
    };
  };

  const calculateComparison = (period: 'week' | 'month' | 'year', identifier: string | number): ComparisonData => {
    let target: WeeklyTargets = { ...defaultTargets };
    let actual: WeeklyTargets = { ...defaultTargets };
    
    if (period === 'week') {
      const weekId = identifier as string;
      target = getWeeklyTargets(weekId) || { ...defaultTargets };
      actual = getActualData(weekId) || { ...defaultTargets };
    } else if (period === 'month') {
      // identifier should be "year-month" format
      const [year, month] = (identifier as string).split('-').map(Number);
      const monthlyAgg = getMonthlyAggregates(year, month);
      target = monthlyAgg.targets;
      actual = monthlyAgg.actuals;
    } else if (period === 'year') {
      const year = identifier as number;
      const yearlyAgg = getYearlyAggregates(year);
      target = yearlyAgg.targets;
      actual = yearlyAgg.actuals;
    }
    
    const variance: WeeklyTargets = {
      leads: actual.leads - target.leads,
      appointmentsSet: actual.appointmentsSet - target.appointmentsSet,
      appointmentsComplete: actual.appointmentsComplete - target.appointmentsComplete,
      jobsBooked: actual.jobsBooked - target.jobsBooked,
      salesRevenue: actual.salesRevenue - target.salesRevenue,
      metaBudgetSpent: actual.metaBudgetSpent - target.metaBudgetSpent,
    };
    
    const percentageAchieved: WeeklyTargets = {
      leads: target.leads > 0 ? (actual.leads / target.leads) * 100 : 0,
      appointmentsSet: target.appointmentsSet > 0 ? (actual.appointmentsSet / target.appointmentsSet) * 100 : 0,
      appointmentsComplete: target.appointmentsComplete > 0 ? (actual.appointmentsComplete / target.appointmentsComplete) * 100 : 0,
      jobsBooked: target.jobsBooked > 0 ? (actual.jobsBooked / target.jobsBooked) * 100 : 0,
      salesRevenue: target.salesRevenue > 0 ? (actual.salesRevenue / target.salesRevenue) * 100 : 0,
      metaBudgetSpent: target.metaBudgetSpent > 0 ? (actual.metaBudgetSpent / target.metaBudgetSpent) * 100 : 0,
    };
    
    return {
      target,
      actual,
      variance,
      percentageAchieved,
      funnelMetrics: calculateFunnelMetrics(actual),
      costMetrics: calculateCostMetrics(actual),
    };
  };

  // Aggregation functions
  const getMonthlyAggregates = (year: number, month: number): { targets: WeeklyTargets; actuals: WeeklyTargets } => {
    const weeks = getWeeksInMonth(year, month);
    
    const targets = weeks.reduce((acc, week) => {
      const weeklyTarget = getWeeklyTargets(week.weekId);
      if (weeklyTarget) {
        return {
          leads: acc.leads + weeklyTarget.leads,
          appointmentsSet: acc.appointmentsSet + weeklyTarget.appointmentsSet,
          appointmentsComplete: acc.appointmentsComplete + weeklyTarget.appointmentsComplete,
          jobsBooked: acc.jobsBooked + weeklyTarget.jobsBooked,
          salesRevenue: acc.salesRevenue + weeklyTarget.salesRevenue,
          metaBudgetSpent: acc.metaBudgetSpent + weeklyTarget.metaBudgetSpent,
        };
      }
      return acc;
    }, { ...defaultTargets });
    
    const actuals = weeks.reduce((acc, week) => {
      const weeklyActual = getActualData(week.weekId);
      if (weeklyActual) {
        return {
          leads: acc.leads + weeklyActual.leads,
          appointmentsSet: acc.appointmentsSet + weeklyActual.appointmentsSet,
          appointmentsComplete: acc.appointmentsComplete + weeklyActual.appointmentsComplete,
          jobsBooked: acc.jobsBooked + weeklyActual.jobsBooked,
          salesRevenue: acc.salesRevenue + weeklyActual.salesRevenue,
          metaBudgetSpent: acc.metaBudgetSpent + weeklyActual.metaBudgetSpent,
        };
      }
      return acc;
    }, { ...defaultTargets });
    
    return { targets, actuals };
  };

  const getYearlyAggregates = (year: number): { targets: WeeklyTargets; actuals: WeeklyTargets } => {
    const months = getMonthsInYear(year);
    
    const targets = months.reduce((acc, { month }) => {
      const monthlyAgg = getMonthlyAggregates(year, month);
      return {
        leads: acc.leads + monthlyAgg.targets.leads,
        appointmentsSet: acc.appointmentsSet + monthlyAgg.targets.appointmentsSet,
        appointmentsComplete: acc.appointmentsComplete + monthlyAgg.targets.appointmentsComplete,
        jobsBooked: acc.jobsBooked + monthlyAgg.targets.jobsBooked,
        salesRevenue: acc.salesRevenue + monthlyAgg.targets.salesRevenue,
        metaBudgetSpent: acc.metaBudgetSpent + monthlyAgg.targets.metaBudgetSpent,
      };
    }, { ...defaultTargets });
    
    const actuals = months.reduce((acc, { month }) => {
      const monthlyAgg = getMonthlyAggregates(year, month);
      return {
        leads: acc.leads + monthlyAgg.actuals.leads,
        appointmentsSet: acc.appointmentsSet + monthlyAgg.actuals.appointmentsSet,
        appointmentsComplete: acc.appointmentsComplete + monthlyAgg.actuals.appointmentsComplete,
        jobsBooked: acc.jobsBooked + monthlyAgg.actuals.jobsBooked,
        salesRevenue: acc.salesRevenue + monthlyAgg.actuals.salesRevenue,
        metaBudgetSpent: acc.metaBudgetSpent + monthlyAgg.actuals.metaBudgetSpent,
      };
    }, { ...defaultTargets });
    
    return { targets, actuals };
  };

  // Utility functions
  const getWeeksInCurrentMonth = (): WeekInfo[] => {
    return getWeeksInMonth(currentYear, currentMonth);
  };

  const getAllWeeksWithData = (): WeekInfo[] => {
    return Object.keys(actualData).map(weekId => getWeekInfo(new Date(weekId)));
  };

  return (
    <EnhancedDataContext.Provider value={{
      currentYear,
      currentMonth,
      currentWeek,
      yearlyTargets,
      actualData,
      setCurrentView,
      setYearlyTargets,
      setMonthlyTargets,
      setWeeklyTargets,
      setActualData,
      getWeeklyTargets,
      getMonthlyTargets,
      getYearlyTargets,
      getActualData,
      calculateComparison,
      calculateFunnelMetrics,
      calculateCostMetrics,
      getMonthlyAggregates,
      getYearlyAggregates,
      getWeeksInCurrentMonth,
      getAllWeeksWithData,
    }}>
      {children}
    </EnhancedDataContext.Provider>
  );
};

export const useEnhancedData = () => {
  const context = useContext(EnhancedDataContext);
  if (context === undefined) {
    throw new Error('useEnhancedData must be used within an EnhancedDataProvider');
  }
  return context;
};