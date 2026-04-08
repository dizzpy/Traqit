"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, options, placeholder, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            className={cn(
              "h-10 w-full appearance-none rounded-input bg-surface-elevated border border-border px-3 pr-8 text-sm text-text-primary transition-colors duration-150",
              "focus:outline-none focus:border-border-hover",
              error && "border-danger",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
            <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={1.5} />
          </div>
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
