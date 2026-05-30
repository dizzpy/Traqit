"use client";

import { CheckIcon, MinusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  className?: string;
  "aria-label"?: string;
}

/**
 * Themed (Violet Haze) checkbox. Native checkboxes can't be fully styled
 * cross-browser, so this is a button that renders the accent fill + check.
 */
export function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  className,
  "aria-label": ariaLabel,
}: CheckboxProps) {
  const on = checked || indeterminate;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={ariaLabel}
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors duration-150 cursor-pointer",
        on
          ? "bg-accent border-accent text-white"
          : "bg-surface-elevated border-border hover:border-accent/60",
        className
      )}
    >
      {indeterminate ? (
        <MinusIcon size={11} strokeWidth={3} />
      ) : checked ? (
        <CheckIcon size={11} strokeWidth={3} />
      ) : null}
    </button>
  );
}
