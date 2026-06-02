"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  /** ISO date string "yyyy-MM-dd" (or empty). */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Date display format. */
  displayFormat?: string;
  /** Override the trigger entirely (rendered inside PopoverTrigger). */
  children?: React.ReactNode;
  className?: string;
  /** Hide the calendar icon on the default trigger. */
  hideIcon?: boolean;
  /** Controlled open state (optional). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "start" | "center" | "end";
}

function toDate(value: string): Date | undefined {
  if (!value) return undefined;
  const d = parse(value, "yyyy-MM-dd", new Date());
  return isValid(d) ? d : undefined;
}

/**
 * Custom, fully-themed date picker (Violet Haze). Wraps the shadcn Calendar in a
 * Popover so it replaces the native browser date picker everywhere. Value is an
 * ISO "yyyy-MM-dd" string for easy drop-in over `<input type="date">`.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "yyyy-mm-dd",
  displayFormat = "MMM d, yyyy",
  children,
  className,
  hideIcon = false,
  open: openProp,
  onOpenChange,
  align = "start",
}: DatePickerProps) {
  const [openState, setOpenState] = React.useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;

  const selected = toDate(value);
  const [month, setMonth] = React.useState<Date>(selected ?? new Date());

  // Jump the calendar to the selected month when the value changes externally
  // (React's "adjust state during render" pattern — no effect needed).
  const [prevValue, setPrevValue] = React.useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (selected) setMonth(selected);
  }

  function pick(date: Date | undefined) {
    onChange(date ? format(date, "yyyy-MM-dd") : "");
    if (date) setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          children ? (
            (children as React.ReactElement)
          ) : (
            <button
              type="button"
              className={cn(
                "flex h-9 w-full items-center justify-between gap-2 rounded-input border border-border bg-surface-elevated px-3 text-sm transition-colors duration-150 focus:outline-none focus:border-border-hover data-[popup-open]:border-accent",
                selected ? "text-text-primary" : "text-text-muted",
                className
              )}
            >
              <span className="truncate">
                {selected ? format(selected, displayFormat) : placeholder}
              </span>
              {!hideIcon && (
                <HugeiconsIcon
                  icon={Calendar03Icon}
                  size={15}
                  strokeWidth={1.5}
                  className="shrink-0 text-text-muted"
                />
              )}
            </button>
          )
        }
      />
      <PopoverContent align={align} className="w-auto p-2">
        <Calendar
          mode="single"
          selected={selected}
          month={month}
          onMonthChange={setMonth}
          onSelect={pick}
          autoFocus
        />
        <div className="flex items-center justify-between border-t border-border px-1 pt-2">
          <button
            type="button"
            onClick={() => pick(undefined)}
            className="rounded-md px-2 py-1 text-xs font-medium text-text-muted transition-colors duration-150 hover:text-text-secondary"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => {
              const today = new Date();
              setMonth(today);
              pick(today);
            }}
            className="rounded-md px-2 py-1 text-xs font-medium text-accent-soft-fg transition-colors duration-150 hover:text-accent"
          >
            Today
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
