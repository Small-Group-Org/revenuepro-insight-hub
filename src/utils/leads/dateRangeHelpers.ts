import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subMonths, subYears, startOfQuarter, endOfQuarter, subQuarters } from 'date-fns';
import { TimeFilter } from '@/types/timeFilter';

export interface DateRangeResult {
  startDate: string;
  endDate: string;  
}

// Convert a date to UTC ISO string at start of day in user's local timezone
const toUTCISOStart = (date: Date): string => {
  if (!date) return '';
  const localStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  return localStart.toISOString();
};

// Convert a date to UTC ISO string at end of day in user's local timezone
const toUTCISOEnd = (date: Date): string => {
  if (!date) return '';
  const localEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return localEnd.toISOString();
};

// Create date ranges based on time filter(used in analytics summary)
export const createDateRangeFromTimeFilter = (timeFilter: TimeFilter): DateRangeResult => {
  const now = new Date();
  let start: Date;
  let end: Date;

  switch (timeFilter) {
    case 'this_month':
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;

    case 'last_month':
      const lastMonth = subMonths(now, 1);
      start = startOfMonth(lastMonth);
      end = endOfMonth(lastMonth);
      break;

    case 'this_quarter':
      start = startOfQuarter(now);
      end = endOfQuarter(now);
      break;

    case 'last_quarter':
      const lastQuarter = subQuarters(now, 1);
      start = startOfQuarter(lastQuarter);
      end = endOfQuarter(lastQuarter);
      break;

    case 'this_year':
      start = startOfYear(now);
      end = endOfYear(now);
      break;

    case 'last_year':
      const lastYear = subYears(now, 1);
      start = startOfYear(lastYear);
      end = endOfYear(lastYear);
      break;

    case 'all':
    default:
      start = null;
      end = null;
      break;
  }

  return {
    startDate: toUTCISOStart(start),
    endDate: toUTCISOEnd(end)
  };
};

// Create date ranges for specific numeric day filters (used in analytics tables)
export const createNumericDayRanges = (days: '7' | '14' | '30' | '60' | 'all'): DateRangeResult => {
  const now = new Date();
  let start: Date;
  let end: Date = endOfDay(now);

  switch (days) {
    case '7':
      start = startOfDay(subDays(now, 6));
      break;
    case '14':
      start = startOfDay(subDays(now, 13));
      break;
    case '30':
      start = startOfDay(subDays(now, 29));
      break;
    case '60':
      start = startOfDay(subDays(now, 59));
      break;
    case 'all':
    default:
      start = null;
      end = null;
      break;
  }

  return {
    startDate: toUTCISOStart(start),
    endDate: toUTCISOEnd(end)
  };
};

//Create date ranges from explicit date and period (used in LeadSheet)
export const createDateRangeFromPeriod = (date: Date, period: 'weekly' | 'monthly' | 'yearly' | 'ytd'): DateRangeResult => {
  let start: Date;
  let end: Date;

  switch (period) {
    case 'weekly':
      start = startOfWeek(date, { weekStartsOn: 1 });
      end = endOfWeek(date, { weekStartsOn: 1 });
      break;
    case 'monthly':
      start = startOfMonth(date);
      end = endOfMonth(date);
      break;
    case 'yearly':
      start = startOfYear(date);
      end = endOfYear(date);
      break;
    case 'ytd':
      start = startOfYear(new Date());
      end = endOfDay(new Date()); // YTD ends at current date
      break;
    default:
      start = null;
      end = null;
      break;
  }

  return {
    startDate: toUTCISOStart(start),
    endDate: toUTCISOEnd(end)
  };
};

