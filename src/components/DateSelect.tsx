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

// Define the shape of the object our callback will pass
interface DateSelection {
  view: View;
  startDate: string; // Changed to string
  endDate: string;   // Changed to string
}

interface DateSelectProps {
  // Changed to a single callback for all selection changes
  onSelectionChange: (selection: DateSelection) => void;
  initialView?: View;
}

export const DateSelect = ({ onSelectionChange = ()=>{}, initialView = 'monthly' }: DateSelectProps) => {
  const [view, setView] = useState<View>(initialView);
  const [currentDate, setCurrentDate] = useState(new Date());

  // This useEffect is now the single source of truth for notifying the parent.
  // It runs whenever the internal date or view changes.
  useEffect(() => {
    const getRange = () => {
      switch (view) {
        case 'weekly':
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

    const { start, end } = getRange();
    // Call the single callback with a complete selection object
    onSelectionChange({
      view,
      startDate: format(start, 'yyyy-MM-dd'), // Format to string
      endDate: format(end, 'yyyy-MM-dd'),     // Format to string
    });

  }, [currentDate, view, onSelectionChange]); // Dependency array is correct

  const handlePrev = () => {
    const duration = view === 'weekly' ? { weeks: 1 } : view === 'monthly' ? { months: 1 } : { years: 1 };
    setCurrentDate(sub(currentDate, duration));
  };

  const handleNext = () => {
    const duration = view === 'weekly' ? { weeks: 1 } : view === 'monthly' ? { months: 1 } : { years: 1 };
    setCurrentDate(add(currentDate, duration));
  };

  const handleViewChange = (newView: View) => {
    // We only need to update the internal state.
    // The useEffect hook will handle notifying the parent.
    setView(newView);
  };

  const formatDateRange = () => {
    const { start, end } = {
        weekly: {
            start: startOfWeek(currentDate, { weekStartsOn: 1 }),
            end: endOfWeek(currentDate, { weekStartsOn: 1 }),
        },
        monthly: {
            start: startOfMonth(currentDate),
            end: endOfMonth(currentDate),
        },
        yearly: {
            start: startOfYear(currentDate),
            end: endOfYear(currentDate),
        }
    }[view];

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