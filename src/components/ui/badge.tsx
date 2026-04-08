import { cn } from "@/lib/utils";
import type { ApplicationStatus, WorkMode } from "@/types";
import { STATUS_BG, WORK_MODE_COLORS, WORK_MODE_LABELS, STATUS_LABELS } from "@/lib/constants";

interface BadgeProps {
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "status" | "work-mode";
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <Badge className={STATUS_BG[status]}>{STATUS_LABELS[status]}</Badge>
  );
}

export function WorkModeBadge({ mode }: { mode: WorkMode }) {
  return (
    <Badge className={WORK_MODE_COLORS[mode]}>{WORK_MODE_LABELS[mode]}</Badge>
  );
}
