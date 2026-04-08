"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "cta" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "outline", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap",
          // Sizes
          size === "sm" && "h-7 px-3 text-xs rounded-btn",
          size === "md" && "h-9 px-4 text-sm rounded-btn",
          size === "lg" && "h-10 px-5 text-sm rounded-btn",
          // Variants
          variant === "primary" &&
          "bg-white text-black hover:bg-white/90",
          variant === "outline" &&
          "bg-surface border border-border text-text-primary hover:bg-surface-hover hover:border-border-hover",
          variant === "ghost" &&
          "text-text-secondary hover:text-text-primary hover:bg-surface-hover",
          variant === "cta" &&
          "bg-accent text-accent-foreground hover:bg-accent-hover",
          variant === "danger" &&
          "bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
