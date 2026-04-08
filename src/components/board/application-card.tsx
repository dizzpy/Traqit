"use client";

import { Share01Icon, Clock01Icon, ZapIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { WorkModeBadge } from "@/components/ui/badge";
import { formatRelativeDate, daysUntil } from "@/lib/utils";
import type { Application } from "@/types";
import { differenceInHours } from "date-fns";

interface ApplicationCardProps {
  application: Application;
  onClick: (app: Application) => void;
}

export function ApplicationCard({ application: app, onClick }: ApplicationCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: app.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const activeStage = app.stages.find((s) => s.status === "UPCOMING" || s.status === "COMPLETED");
  const upcomingInterview = app.stages.find(
    (s) =>
      s.scheduledDate &&
      differenceInHours(new Date(s.scheduledDate), new Date()) <= 48 &&
      differenceInHours(new Date(s.scheduledDate), new Date()) > 0
  );

  const deadlineDays = app.deadline ? daysUntil(app.deadline) : null;
  const isExpired = deadlineDays !== null && deadlineDays < 0;
  const isUrgent = deadlineDays !== null && deadlineDays >= 0 && deadlineDays <= 2;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(app)}
      className={cn(
        "group bg-surface border border-border rounded-card p-3 cursor-pointer transition-colors duration-150 select-none",
        "hover:border-border-hover hover:bg-surface-hover",
        isDragging && "opacity-50 shadow-lg",
        app.status === "GHOSTED" && "opacity-60",
        app.status === "SAVED" && "border-dashed",
        upcomingInterview && "border-l-2 border-l-info"
      )}
    >
      {/* Company + position */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-text-primary truncate">{app.companyName}</span>
            {app.companyUrl && (
              <a
                href={app.companyUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-text-muted hover:text-text-secondary shrink-0"
              >
                <HugeiconsIcon icon={Share01Icon} size={11} strokeWidth={1.5} />
              </a>
            )}
          </div>
          <p className="text-xs text-text-secondary truncate">{app.position}</p>
        </div>
        <WorkModeBadge mode={app.workMode as import("@/types").WorkMode} />
      </div>

      {/* Active stage */}
      {activeStage && (
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-info shrink-0" />
          <span className="text-xs text-text-muted truncate">{activeStage.name}</span>
        </div>
      )}

      {/* Upcoming interview */}
      {upcomingInterview && (
        <div className="flex items-center gap-1.5 mb-2">
          <HugeiconsIcon icon={ZapIcon} size={11} strokeWidth={1.5} className="text-warning animate-pulse" />
          <span className="text-xs text-warning">Interview soon</span>
        </div>
      )}

      {/* Deadline for saved */}
      {app.status === "SAVED" && deadlineDays !== null && (
        <div className={cn("text-xs mb-2 font-medium", isExpired ? "text-danger" : isUrgent ? "text-warning" : "text-text-muted")}>
          {isExpired ? "Expired" : `${deadlineDays}d left`}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-1 text-xs text-text-muted">
        <HugeiconsIcon icon={Clock01Icon} size={10} strokeWidth={1.5} />
        <span>{formatRelativeDate(app.updatedAt)}</span>
      </div>
    </div>
  );
}
