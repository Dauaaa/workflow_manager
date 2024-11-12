import * as React from "react";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import dayjs, { Dayjs } from "dayjs";

const dayjsToDate = (x?: Dayjs) => (x ? new Date(x.toISOString()) : x);
const dateToDayjs = (x?: Date) => (x ? dayjs(x) : x);

export function DatePicker({
  date,
  onChange,
  disabled,
  classNames,
}: {
  date?: Dayjs;
  onChange?: (arg?: Dayjs) => void;
  disabled?: boolean;
  classNames?: {
    inputBox?: string;
  };
}) {
  const [innerDate, setInnerDate] = React.useState(dayjsToDate(date));

  React.useEffect(() => {
    setInnerDate(dayjsToDate(date));
  }, [date, setInnerDate]);

  const selectCb = React.useCallback(
    (selectedDate?: Date) => {
      setInnerDate(selectedDate);
      onChange?.(dateToDayjs(selectedDate));
    },
    [setInnerDate, onChange],
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[240px] justify-start text-left font-normal",
            !date && "text-muted-foreground",
            classNames?.inputBox,
          )}
          disabled={disabled}
        >
          <CalendarIcon />
          {innerDate ? format(innerDate, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={innerDate}
          onSelect={selectCb}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
