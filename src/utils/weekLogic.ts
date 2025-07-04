import { startOfWeek, endOfWeek, format, parse, isAfter, isBefore, startOfMonth, endOfMonth, differenceInDays, addDays, subDays, startOfYear, endOfYear } from 'date-fns';

export interface WeekInfo {
  weekStart: Date;
  weekEnd: Date;
  weekId: string;
  belongsToMonth: number;
  belongsToYear: number;
  monthLabel: string;
  weekLabel: string;
}

/**
 * Advanced week logic: Week belongs to the month that contains the majority of its days
 * Week is Monday to Sunday
 */
export const getWeekInfo = (date: Date): WeekInfo => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 }); // Sunday
  
  // Count days in each month
  const weekStartMonth = weekStart.getMonth();
  const weekStartYear = weekStart.getFullYear();
  const weekEndMonth = weekEnd.getMonth();
  const weekEndYear = weekEnd.getFullYear();
  
  let belongsToMonth: number;
  let belongsToYear: number;
  
  if (weekStartMonth === weekEndMonth && weekStartYear === weekEndYear) {
    // Week is entirely within one month
    belongsToMonth = weekStartMonth;
    belongsToYear = weekStartYear;
  } else {
    // Week spans two months - count days in each
    const monthBoundary = startOfMonth(weekEnd);
    const daysInFirstMonth = differenceInDays(monthBoundary, weekStart);
    const daysInSecondMonth = differenceInDays(addDays(weekEnd, 1), monthBoundary);
    
    if (daysInFirstMonth >= daysInSecondMonth) {
      // Majority in first month
      belongsToMonth = weekStartMonth;
      belongsToYear = weekStartYear;
    } else {
      // Majority in second month
      belongsToMonth = weekEndMonth;
      belongsToYear = weekEndYear;
    }
  }
  
  const weekId = format(weekStart, 'yyyy-MM-dd');
  const monthLabel = format(new Date(belongsToYear, belongsToMonth), 'MMMM yyyy');
  const weekLabel = `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd, yyyy')}`;
  
  return {
    weekStart,
    weekEnd,
    weekId,
    belongsToMonth,
    belongsToYear,
    monthLabel,
    weekLabel
  };
};

/**
 * Get all weeks that belong to a specific month using advanced week logic
 */
export const getWeeksInMonth = (year: number, month: number): WeekInfo[] => {
  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(new Date(year, month));
  
  // Start from the Monday of the week containing the first day of the month
  let currentWeekStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const weeks: WeekInfo[] = [];
  
  // Continue until we've covered all weeks that could belong to this month
  while (isBefore(currentWeekStart, addDays(monthEnd, 7))) {
    const weekInfo = getWeekInfo(currentWeekStart);
    
    // Only include weeks that belong to this month according to our logic
    if (weekInfo.belongsToMonth === month && weekInfo.belongsToYear === year) {
      weeks.push(weekInfo);
    }
    
    currentWeekStart = addDays(currentWeekStart, 7);
  }
  
  return weeks;
};

/**
 * Get all months in a year that have weeks
 */
export const getMonthsInYear = (year: number): Array<{ month: number; label: string; weekCount: number }> => {
  const months = [];
  
  for (let month = 0; month < 12; month++) {
    const weeks = getWeeksInMonth(year, month);
    if (weeks.length > 0) {
      months.push({
        month,
        label: format(new Date(year, month), 'MMMM'),
        weekCount: weeks.length
      });
    }
  }
  
  return months;
};

/**
 * Calculate proportional splits for targets
 */
export const calculateProportionalSplit = (
  totalAmount: number,
  periods: number,
  precision: number = 2
): number[] => {
  const baseAmount = totalAmount / periods;
  const splits = Array(periods).fill(Number(baseAmount.toFixed(precision)));
  
  // Adjust for rounding differences
  const currentTotal = splits.reduce((sum, amount) => sum + amount, 0);
  const difference = Number((totalAmount - currentTotal).toFixed(precision));
  
  if (Math.abs(difference) > 0.01) {
    splits[0] += difference;
  }
  
  return splits;
};

/**
 * Auto-select week when clicking any date
 */
export const getWeekFromDate = (date: Date): WeekInfo => {
  return getWeekInfo(date);
};

/**
 * Get current week info
 */
export const getCurrentWeek = (): WeekInfo => {
  return getWeekInfo(new Date());
};

/**
 * Format week for display
 */
export const formatWeekRange = (weekStart: Date, weekEnd: Date): string => {
  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'dd, yyyy')}`;
  } else {
    return `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd, yyyy')}`;
  }
};

/**
 * Check if a date is in the current week
 */
export const isDateInCurrentWeek = (date: Date): boolean => {
  const currentWeek = getCurrentWeek();
  return !isBefore(date, currentWeek.weekStart) && !isAfter(date, currentWeek.weekEnd);
};