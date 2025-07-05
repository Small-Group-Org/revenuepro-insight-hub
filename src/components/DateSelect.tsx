import React, { useState, useEffect } from 'react';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  add,
  sub,
  format,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

type View = 'weekly' | 'monthly' | 'yearly';

interface DateSelectProps {
  onDateChange: (startDate: Date, endDate: Date) => void;
  onViewChange?: (view: View) => void;
  initialView?: View;
}

export const DateSelect = ({ onDateChange = ()=>{}, onViewChange= ()=>{}, initialView = 'monthly' }: DateSelectProps) => {
  const [view, setView] = useState<View>(initialView);
  const [currentDate, setCurrentDate] = useState(new Date());

  const getRange = () => {
    switch (view) {
      case 'weekly':
        // Week starts on Monday
        return {
          start: startOfWeek(currentDate, { weekStartsOn: 1 }),
          end: endOfWeek(currentDate, { weekStartsOn: 1 }),
        };
      case 'monthly':
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate),
        };
      case 'yearly':
        return {
          start: startOfYear(currentDate),
          end: endOfYear(currentDate),
        };
    }
  };

  useEffect(() => {
    const { start, end } = getRange();
    onDateChange(start, end);
  }, [currentDate, view]);

  const handlePrev = () => {
    const duration = view === 'weekly' ? { weeks: 1 } : view === 'monthly' ? { months: 1 } : { years: 1 };
    setCurrentDate(sub(currentDate, duration));
  };

  const handleNext = () => {
    const duration = view === 'weekly' ? { weeks: 1 } : view === 'monthly' ? { months: 1 } : { years: 1 };
    setCurrentDate(add(currentDate, duration));
  };

  const handleViewChange = (newView: View) => {
    setView(newView);
    onViewChange?.(newView);
  };

  const formatDateRange = () => {
    const { start, end } = getRange();
    switch (view) {
      case 'weekly':
        if (start.getMonth() === end.getMonth()) {
          return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
        }
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
      case 'monthly':
        return format(currentDate, 'MMMM yyyy');
      case 'yearly':
        return format(currentDate, 'yyyy');
    }
  };

  return (
    <div className="flex items-center gap-4 p-2 border rounded-md bg-white shadow-sm">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <span>{view.charAt(0).toUpperCase() + view.slice(1)}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => handleViewChange('weekly')}>Weekly</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleViewChange('monthly')}>Monthly</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleViewChange('yearly')}>Yearly</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={handlePrev}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="font-semibold text-gray-700 w-48 text-center">{formatDateRange()}</span>
        <Button variant="ghost" size="icon" onClick={handleNext}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}; 