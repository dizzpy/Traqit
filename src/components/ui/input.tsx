"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "h-10 w-full rounded-input bg-surface-elevated border border-border px-3 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150",
            "focus:outline-none focus:border-border-hover",
            error && "border-danger focus:border-danger",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
