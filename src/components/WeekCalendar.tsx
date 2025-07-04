import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getWeekInfo, getWeeksInMonth, getMonthsInYear, WeekInfo } from '@/utils/weekLogic';
import { format } from 'date-fns';

interface WeekCalendarProps {
  selectedWeek: WeekInfo;
  onWeekSelect: (week: WeekInfo) => void;
  currentYear: number;
  currentMonth: number;
  onViewChange: (year: number, month?: number) => void;
  view: 'week' | 'month' | 'year';
  onViewModeChange: (view: 'week' | 'month' | 'year') => void;
}

export const WeekCalendar = ({
  selectedWeek,
  onWeekSelect,
  currentYear,
  currentMonth,
  onViewChange,
  view,
  onViewModeChange
}: WeekCalendarProps) => {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const weekInfo = getWeekInfo(date);
      onWeekSelect(weekInfo);
      onViewChange(weekInfo.belongsToYear, weekInfo.belongsToMonth);
      setCalendarOpen(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        onViewChange(currentYear - 1, 11);
      } else {
        onViewChange(currentYear, currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        onViewChange(currentYear + 1, 0);
      } else {
        onViewChange(currentYear, currentMonth + 1);
      }
    }
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    onViewChange(currentYear + (direction === 'next' ? 1 : -1));
  };

  const currentWeeks = getWeeksInMonth(currentYear, currentMonth);
  const currentMonths = getMonthsInYear(currentYear);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header with View Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Calendar Navigation</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={view} onValueChange={(value: 'week' | 'month' | 'year') => onViewModeChange(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week View</SelectItem>
                <SelectItem value="month">Month View</SelectItem>
                <SelectItem value="year">Year View</SelectItem>
              </SelectContent>
            </Select>

            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Jump to Date
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedWeek.weekStart}
                  onSelect={handleDateSelect}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Current Selection Display */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Selected Week</div>
          <div className="text-lg font-semibold">{selectedWeek.weekLabel}</div>
          <div className="text-sm text-muted-foreground">
            Belongs to: {selectedWeek.monthLabel}
          </div>
        </div>

        {/* View-specific Navigation */}
        {view === 'year' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateYear('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
                {currentYear - 1}
              </Button>
              
              <h4 className="text-xl font-bold">{currentYear}</h4>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateYear('next')}
              >
                {currentYear + 1}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {currentMonths.map(({ month, label, weekCount }) => (
                <Button
                  key={month}
                  variant={month === currentMonth ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    onViewChange(currentYear, month);
                    onViewModeChange('month');
                  }}
                  className="flex flex-col h-auto p-3"
                >
                  <span className="font-medium">{label}</span>
                  <span className="text-xs opacity-70">{weekCount} weeks</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {view === 'month' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev Month
              </Button>
              
              <h4 className="text-xl font-bold">
                {format(new Date(currentYear, currentMonth), 'MMMM yyyy')}
              </h4>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                Next Month
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                Weeks in {format(new Date(currentYear, currentMonth), 'MMMM')} ({currentWeeks.length} weeks)
              </div>
              {currentWeeks.map((week) => (
                <Button
                  key={week.weekId}
                  variant={week.weekId === selectedWeek.weekId ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    onWeekSelect(week);
                    onViewModeChange('week');
                  }}
                  className="w-full justify-start"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{week.weekLabel}</span>
                    <span className="text-xs opacity-70">Week of {format(week.weekStart, 'MMM dd')}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {view === 'week' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentIndex = currentWeeks.findIndex(w => w.weekId === selectedWeek.weekId);
                  if (currentIndex > 0) {
                    onWeekSelect(currentWeeks[currentIndex - 1]);
                  } else {
                    // Go to previous month
                    navigateMonth('prev');
                  }
                }}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev Week
              </Button>
              
              <div className="text-center">
                <div className="text-lg font-bold">{selectedWeek.weekLabel}</div>
                <div className="text-sm text-muted-foreground">{selectedWeek.monthLabel}</div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentIndex = currentWeeks.findIndex(w => w.weekId === selectedWeek.weekId);
                  if (currentIndex < currentWeeks.length - 1) {
                    onWeekSelect(currentWeeks[currentIndex + 1]);
                  } else {
                    // Go to next month
                    navigateMonth('next');
                  }
                }}
              >
                Next Week
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="bg-accent-light p-4 rounded-lg">
              <div className="text-sm font-medium text-accent-foreground mb-2">Week Details</div>
              <div className="space-y-1 text-sm">
                <div>Start: {format(selectedWeek.weekStart, 'EEEE, MMM dd, yyyy')}</div>
                <div>End: {format(selectedWeek.weekEnd, 'EEEE, MMM dd, yyyy')}</div>
                <div>Belongs to: {selectedWeek.monthLabel}</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Navigation */}
        <div className="pt-4 border-t">
          <div className="text-sm font-medium text-muted-foreground mb-2">Quick Navigation</div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewModeChange('year')}
            >
              Year View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewModeChange('month')}
            >
              Month View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewModeChange('week')}
            >
              Week View
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};