"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { ApplicationCard } from "./application-card";
import { STATUS_LABELS } from "@/lib/constants";
import type { Application, ApplicationStatus } from "@/types";

interface KanbanColumnProps {
  status: ApplicationStatus;
  applications: Application[];
  onCardClick: (app: Application) => void;
}

export function KanbanColumn({ status, applications, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col w-[260px] shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-3">
        <h3 className="text-sm font-medium text-text-secondary">
          {STATUS_LABELS[status]}
        </h3>
        <span className="text-xs text-text-muted bg-surface-elevated rounded-full px-2 py-0.5">
          {applications.length}
        </span>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-col gap-2 min-h-[200px] rounded-card p-2 transition-colors duration-150",
          isOver ? "bg-surface-elevated" : "bg-transparent"
        )}
      >
        <SortableContext items={applications.map((a) => a.id)} strategy={verticalListSortingStrategy}>
          {applications.map((app) => (
            <ApplicationCard key={app.id} application={app} onClick={onCardClick} />
          ))}
        </SortableContext>
        {applications.length === 0 && (
          <div className="flex-1 flex items-center justify-center min-h-[80px]">
            <p className="text-xs text-text-muted">Drop here</p>
          </div>
        )}
      </div>
    </div>
  );
}
