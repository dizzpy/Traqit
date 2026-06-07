"use client";

import { useState, useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  format,
} from "date-fns";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
  AlarmClockIcon,
  FlowSquareIcon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ApplicationDetail } from "@/components/application/application-detail";
import { useApplications, updateApplication, deleteApplication } from "@/hooks/use-applications";
import { deleteStage } from "@/hooks/use-stages";
import { formatRelativeDate } from "@/lib/utils";
import type { Application, StageStatus } from "@/types";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type CalEvent = {
  id: string;
  date: Date;
  kind: "stage" | "deadline";
  label: string;
  app: Application;
  status?: StageStatus;
  stageId?: string; // present for stage events — used to delete the stage
};

function buildEvents(apps: Application[]): CalEvent[] {
  const events: CalEvent[] = [];
  for (const app of apps) {
    for (const s of app.stages) {
      if (s.scheduledDate) {
        events.push({
          id: `stage-${s.id}`,
          date: new Date(s.scheduledDate),
          kind: "stage",
          label: `${s.name} · ${app.companyName}`,
          app,
          status: s.status,
          stageId: s.id,
        });
      }
    }
    if (app.deadline) {
      events.push({
        id: `deadline-${app.id}`,
        date: new Date(app.deadline),
        kind: "deadline",
        label: `${app.companyName} deadline`,
        app,
      });
    }
  }
  return events;
}

function chipClass(ev: CalEvent): string {
  if (ev.kind === "deadline") return "bg-[#2d1f08] text-[#f59e0b]";
  switch (ev.status) {
    case "COMPLETED":
    case "PASSED":
      return "bg-[var(--status-offer-bg)] text-[var(--status-offer-fg)]";
    case "FAILED":
      return "bg-[var(--status-rejected-bg)] text-[var(--status-rejected-fg)]";
    case "SKIPPED":
      return "bg-surface-hover text-text-muted";
    default:
      return "bg-accent-soft text-accent-soft-fg";
  }
}

export default function CalendarPage() {
  const { applications: apps, mutate } = useApplications();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<CalEvent | null>(null);

  function patchCache(updater: (list: Application[]) => Application[]) {
    mutate((cur) => (cur ? { ...cur, data: updater(cur.data) } : cur), { revalidate: false });
  }
  async function updateApp(id: string, patch: Partial<Application>) {
    patchCache((list) => list.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    try {
      await updateApplication(id, patch as Record<string, unknown>);
    } catch {
      toast.error("Couldn't save changes");
      mutate();
    }
  }
  async function deleteApp(id: string) {
    const name = apps.find((a) => a.id === id)?.companyName;
    patchCache((list) => list.filter((a) => a.id !== id));
    setSelectedId(null);
    try {
      await deleteApplication(id);
      toast(`Deleted ${name || "application"}`);
    } catch {
      toast.error("Couldn't delete");
      mutate();
    }
  }

  // Remove a single scheduled item from the agenda (optimistic). Stage events
  // delete the stage; deadline events just clear the application's deadline.
  async function removeEvent(ev: CalEvent) {
    if (ev.kind === "deadline") {
      updateApp(ev.app.id, { deadline: null });
      return;
    }
    if (!ev.stageId) return;
    patchCache((list) =>
      list.map((a) =>
        a.id === ev.app.id ? { ...a, stages: a.stages.filter((s) => s.id !== ev.stageId) } : a
      )
    );
    try {
      await deleteStage(ev.app.id, ev.stageId);
    } catch {
      toast.error("Couldn't delete schedule");
      mutate();
    }
  }

  const events = useMemo(() => buildEvents(apps), [apps]);
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const ev of events) {
      const key = format(ev.date, "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(ev);
      map.set(key, list);
    }
    // Sort each day's events: stages first (by time), deadlines last.
    for (const list of map.values()) {
      list.sort((a, b) => (a.kind === b.kind ? a.date.getTime() - b.date.getTime() : a.kind === "deadline" ? 1 : -1));
    }
    return map;
  }, [events]);

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [month]);

  const monthEventCount = useMemo(
    () => events.filter((e) => isSameMonth(e.date, month)).length,
    [events, month]
  );

  // Agenda: everything scheduled from today onward, soonest first.
  const upcoming = useMemo(() => {
    const today = startOfDay(new Date()).getTime();
    return events
      .filter((e) => e.date.getTime() >= today)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events]);

  const selectedApp = apps.find((a) => a.id === selectedId) ?? null;

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-text-primary" style={{ fontFamily: "var(--font-family-display)" }}>
            Calendar
          </h1>
          <span className="text-xs text-text-muted bg-surface-elevated border border-border px-2 py-0.5 rounded-full">
            {monthEventCount} this month
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden md:flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-accent-soft-fg" /> Interview</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" /> Deadline</span>
          </div>

          {/* Month nav */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMonth((m) => addMonths(m, -1))}
              aria-label="Previous month"
              className="flex items-center justify-center w-8 h-8 rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors duration-150"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={1.5} />
            </button>
            <span className="min-w-[120px] text-center text-sm font-medium text-text-primary" style={{ fontFamily: "var(--font-family-display)" }}>
              {format(month, "MMMM yyyy")}
            </span>
            <button
              onClick={() => setMonth((m) => addMonths(m, 1))}
              aria-label="Next month"
              className="flex items-center justify-center w-8 h-8 rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors duration-150"
            >
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={1.5} />
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setMonth(startOfMonth(new Date()))}>
            <HugeiconsIcon icon={Calendar03Icon} size={14} strokeWidth={1.5} /> Today
          </Button>
        </div>
      </div>

      {/* Body: month grid + agenda panel */}
      <div className="flex-1 flex overflow-hidden">
        <div className="relative flex-1 flex flex-col overflow-hidden">
      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-border shrink-0">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-3 py-2 text-[11px] font-medium text-text-muted uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Month grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-auto">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, month);
          const today = isToday(day);
          const shown = dayEvents.slice(0, 3);
          const extra = dayEvents.length - shown.length;

          return (
            <div
              key={key}
              className={cn(
                "min-h-[112px] border-b border-r border-border p-1.5 flex flex-col gap-1",
                !inMonth && "bg-surface/40"
              )}
            >
              <div className="flex items-center justify-between px-0.5">
                <span
                  className={cn(
                    "inline-flex items-center justify-center text-xs h-6 min-w-6 px-1 rounded-full",
                    today ? "bg-accent text-white font-semibold" : inMonth ? "text-text-secondary" : "text-text-muted"
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                {shown.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedId(ev.app.id)}
                    title={ev.label}
                    className={cn(
                      "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium text-left truncate transition-opacity duration-150 hover:opacity-80",
                      chipClass(ev)
                    )}
                  >
                    <HugeiconsIcon
                      icon={ev.kind === "deadline" ? AlarmClockIcon : FlowSquareIcon}
                      size={10}
                      strokeWidth={1.5}
                      className="shrink-0"
                    />
                    <span className="truncate">{ev.label}</span>
                  </button>
                ))}

                {extra > 0 && (
                  <Popover>
                    <PopoverTrigger
                      render={
                        <button className="px-1.5 py-0.5 rounded-md text-[11px] font-medium text-text-muted hover:text-text-primary hover:bg-surface-hover text-left outline-none transition-colors duration-150">
                          +{extra} more
                        </button>
                      }
                    />
                    <PopoverContent align="start" className="w-60 p-1.5">
                      <p className="px-2 py-1 text-[11px] text-text-muted">{format(day, "EEEE, MMM d")}</p>
                      <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
                        {dayEvents.map((ev) => (
                          <button
                            key={ev.id}
                            onClick={() => setSelectedId(ev.app.id)}
                            className={cn(
                              "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-left truncate hover:opacity-80",
                              chipClass(ev)
                            )}
                          >
                            <HugeiconsIcon
                              icon={ev.kind === "deadline" ? AlarmClockIcon : FlowSquareIcon}
                              size={11}
                              strokeWidth={1.5}
                              className="shrink-0"
                            />
                            <span className="truncate">{ev.label}</span>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          );
        })}
      </div>

          {monthEventCount === 0 && (
            <div className="absolute inset-x-0 bottom-6 flex justify-center pointer-events-none">
              <p className="text-xs text-text-muted bg-surface-elevated border border-border px-3 py-1.5 rounded-full">
                No scheduled stages or deadlines this month
              </p>
            </div>
          )}
        </div>

        {/* Agenda panel */}
        <aside className="hidden lg:flex flex-col w-80 shrink-0 border-l border-border bg-surface/30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <h2 className="text-sm font-semibold text-text-primary">Upcoming</h2>
            <span className="text-xs text-text-muted bg-surface-elevated border border-border px-2 py-0.5 rounded-full">
              {upcoming.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
            {upcoming.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-8">Nothing scheduled ahead.</p>
            ) : (
              upcoming.map((ev) => (
                <div
                  key={ev.id}
                  className="group flex items-start gap-2 rounded-lg border border-border bg-surface-elevated/50 p-2.5 transition-colors duration-150 hover:bg-surface-elevated"
                >
                  <button onClick={() => setSelectedId(ev.app.id)} className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-1.5">
                      <HugeiconsIcon
                        icon={ev.kind === "deadline" ? AlarmClockIcon : FlowSquareIcon}
                        size={12}
                        strokeWidth={1.5}
                        className={cn("shrink-0", ev.kind === "deadline" ? "text-[#f59e0b]" : "text-accent-soft-fg")}
                      />
                      <span className="text-xs font-medium text-text-primary truncate">{ev.label}</span>
                    </div>
                    <span className="text-[11px] text-text-muted mt-0.5 block">
                      {format(ev.date, "EEE, MMM d")} · {formatRelativeDate(ev.date.toISOString())}
                    </span>
                  </button>
                  <button
                    onClick={() => setEventToDelete(ev)}
                    title={ev.kind === "deadline" ? "Remove deadline" : "Delete schedule"}
                    className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-[var(--status-rejected-fg)] transition-colors p-1 shrink-0"
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={13} strokeWidth={1.5} />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      {selectedApp && (
        <ApplicationDetail
          application={selectedApp}
          initialTab="pipeline"
          onUpdate={(patch) => updateApp(selectedApp.id, patch)}
          onDelete={() => deleteApp(selectedApp.id)}
          onClose={() => setSelectedId(null)}
        />
      )}

      <ConfirmDialog
        open={!!eventToDelete}
        onClose={() => setEventToDelete(null)}
        onConfirm={() => eventToDelete && removeEvent(eventToDelete)}
        title={eventToDelete?.kind === "deadline" ? "Remove this deadline?" : "Delete this schedule?"}
        message={
          eventToDelete
            ? eventToDelete.kind === "deadline"
              ? `The deadline for ${eventToDelete.app.companyName} will be cleared.`
              : `"${eventToDelete.label}" will be removed from the pipeline.`
            : ""
        }
        confirmLabel={eventToDelete?.kind === "deadline" ? "Remove" : "Delete"}
        tone="danger"
        icon={Delete02Icon}
      />
    </div>
  );
}
