'use client';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { cn } from '@/lib/utils';

export interface CalendarProps {
  className?: string;
  selected?: Date;
  onChange?: (date: Date | null) => void;
  showOutsideDays?: boolean;
  minDate?: Date;
}

function Calendar({ className, selected, onChange, minDate, ...props }: CalendarProps) {
  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      minDate={minDate}
      className={cn(
        'h-9 bg-act-base-dark w-full hover:border-act-purple border border-act-surface rounded-md transition-all px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-act-purple ',
        className,
      )}
      wrapperClassName="w-full"
      calendarClassName="bg-act-base-dark bg-white border rounded-md shadow-md p-3"
      dayClassName={() => cn('rounded-md hover:bg-act-surface hover:text-act-turquoise')}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
