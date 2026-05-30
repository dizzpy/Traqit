"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from "@dnd-kit/core";
import { KanbanColumn } from "./kanban-column";
import { ApplicationCard } from "./application-card";
import { KANBAN_COLUMNS } from "@/lib/constants";
import { updateApplication } from "@/hooks/use-applications";
import type { Application, ApplicationStatus } from "@/types";
import { mutate } from "swr";

interface KanbanBoardProps {
  applications: Application[];
  onCardClick: (app: Application) => void;
}

export function KanbanBoard({ applications, onCardClick }: KanbanBoardProps) {
  const [activeApp, setActiveApp] = useState<Application | null>(null);
  const [localApps, setLocalApps] = useState<Application[]>(applications);

  // Sync when parent updates
  if (applications !== localApps && !activeApp) {
    setLocalApps(applications);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function getColumnApps(status: ApplicationStatus) {
    return localApps.filter((a) => a.status === status);
  }

  function handleDragStart(event: DragStartEvent) {
    const app = localApps.find((a) => a.id === event.active.id);
    setActiveApp(app ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeApp = localApps.find((a) => a.id === activeId);
    if (!activeApp) return;

    // Over a column
    if (KANBAN_COLUMNS.includes(overId as ApplicationStatus)) {
      const newStatus = overId as ApplicationStatus;
      if (activeApp.status !== newStatus) {
        setLocalApps((apps) =>
          apps.map((a) => (a.id === activeId ? { ...a, status: newStatus } : a))
        );
      }
      return;
    }

    // Over another card
    const overApp = localApps.find((a) => a.id === overId);
    if (!overApp) return;

    if (activeApp.status !== overApp.status) {
      setLocalApps((apps) =>
        apps.map((a) => (a.id === activeId ? { ...a, status: overApp.status } : a))
      );
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveApp(null);
    if (!over) return;

    const activeId = active.id as string;
    const moved = localApps.find((a) => a.id === activeId);
    const original = applications.find((a) => a.id === activeId);
    if (!moved || !original || moved.status === original.status) return;

    const newStatus = moved.status;

    // UI first: optimistically patch the shared SWR cache so the page + board
    // agree instantly (no refetch flicker / snap-back). Guard non-list keys.
    mutate(
      (key) => typeof key === "string" && key.startsWith("/api/applications"),
      (cur: { data?: unknown } | undefined) => {
        if (!cur || !Array.isArray(cur.data)) return cur;
        return {
          ...cur,
          data: (cur.data as Application[]).map((a) =>
            a.id === activeId ? { ...a, status: newStatus } : a
          ),
        };
      },
      { revalidate: false }
    );

    // DB later: persist, and only revalidate (rollback) if it fails.
    try {
      await updateApplication(activeId, { status: newStatus });
    } catch {
      mutate((key) => typeof key === "string" && key.startsWith("/api/applications"));
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-6 px-6 pt-6 min-h-full">
        {KANBAN_COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            applications={getColumnApps(status)}
            onCardClick={onCardClick}
          />
        ))}
      </div>
      <DragOverlay>
        {activeApp ? (
          <ApplicationCard application={activeApp} onClick={() => {}} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
