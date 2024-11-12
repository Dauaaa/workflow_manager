import * as React from "react";
import { add } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TimePickerDemo } from "./time-picker-demo";
import dayjs, { Dayjs } from "dayjs";

export function DateTimePicker({
  value,
  onChange,
  disabled,
  classNames,
}: {
  value?: Dayjs;
  onChange?: (arg?: Dayjs) => void;
  disabled?: boolean;
  classNames?: {
    inputBox?: string;
  };
}) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value.toISOString()) : undefined,
  );

  React.useEffect(() => {
    setDate(value ? new Date(value.toISOString()) : undefined);
  }, [value, setDate]);

  /**
   * carry over the current time when a user clicks a new day
   * instead of resetting to 00:00
   */
  const handleSelect = (newDay: Date | undefined) => {
    if (!newDay) return;
    if (!date) {
      setDate(newDay);
      onChange?.(dayjs(newDay));
      return;
    }
    const diff = newDay.getTime() - date.getTime();
    const diffInDays = diff / (1000 * 60 * 60 * 24);
    const newDateFull = add(date, { days: Math.ceil(diffInDays) });
    onChange?.(dayjs(newDateFull));
    setDate(newDateFull);
  };

  return (
    <Popover>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant={"outline"}
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !date && "text-muted-foreground",
            classNames?.inputBox,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? dayjs(date).format("lll") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => handleSelect(d)}
          initialFocus
          disabled={disabled}
        />
        <div className="p-3 border-t border-border">
          <TimePickerDemo
            setDate={(date) => {
              setDate(date);
              onChange?.(dayjs(date));
            }}
            date={date}
            disabled={disabled}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
