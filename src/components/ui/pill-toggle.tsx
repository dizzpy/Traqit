"use client";

import { cn } from "@/lib/utils";
import type { WorkMode } from "@/types";
import { WORK_MODE_LABELS } from "@/lib/constants";

const MODES: WorkMode[] = ["on-site", "remote", "hybrid", "no-data"];

interface PillToggleProps {
  value: WorkMode;
  onChange: (value: WorkMode) => void;
}

export function PillToggle({ value, onChange }: PillToggleProps) {
  return (
    <div className="flex gap-1 p-1 bg-surface-elevated rounded-input border border-border w-full">
      {MODES.map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium rounded transition-colors duration-150",
            value === mode
              ? "bg-surface text-text-primary border border-border"
              : "text-text-muted hover:text-text-secondary"
          )}
        >
          {WORK_MODE_LABELS[mode]}
        </button>
      ))}
    </div>
  );
}
