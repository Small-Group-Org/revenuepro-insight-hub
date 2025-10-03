import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

// Radix-powered Dropdown to replace DayPicker's native <select>
function RdxDropdown(props: any): JSX.Element {
  const { value, onChange, children, className, style, caption } = props;
  const options = React.Children.toArray(children)
    .map((child) => {
      if (!React.isValidElement(child as any)) return null;
      const el = child as React.ReactElement<any>;
      const optionValue = (el.props as any)?.value ?? (el.props as any)?.children;
      const label = (el.props as any)?.children ?? String(optionValue);
      return { value: String(optionValue), label: String(label) };
    })
    .filter(Boolean) as { value: string; label: string }[];

  return (
    <div className={className  } style={style}>
      <Select
        value={String(value ?? "")}
        onValueChange={(v) => onChange?.({ target: { value: v } } as any)}
      >
        <SelectTrigger className="h-8 px-2 text-sm w-auto border-0 bg-transparent shadow-none">
          <SelectValue placeholder={caption} />
        </SelectTrigger>
        <SelectContent className="max-h-64 overflow-y-auto">
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-0 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border border-border rounded-md",
        head_row: "flex border-b border-border",
        head_cell:
          "text-muted-foreground w-9 font-medium text-[0.75rem] py-1 text-center",
        row: "flex w-full",
        cell: "h-9 w-9 text-center text-sm p-0 relative",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-muted"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
        Dropdown: RdxDropdown,
        ...props.components,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
