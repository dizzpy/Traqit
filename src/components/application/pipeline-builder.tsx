"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Add01Icon,
  Notification01Icon,
  NotificationOff01Icon,
  DragDropVerticalIcon,
  FlowSquareIcon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { STAGE_PRESETS, STAGE_STATUS_LABELS } from "@/lib/constants";
import { MOCK_PIPELINE_TEMPLATES } from "@/lib/mock-data";
import type { Application, PipelineStage, StageStatus } from "@/types";
import { cn } from "@/lib/utils";

interface PipelineBuilderProps {
  application: Application;
}

type StageWithNotify = PipelineStage & { notify?: boolean };

const STATUS_DOT: Record<StageStatus, React.ReactNode> = {
  UPCOMING: (
    <span className="w-3 h-3 rounded-full border-2 border-border bg-transparent inline-block" />
  ),
  COMPLETED: (
    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} className="text-[var(--status-offer-fg)]" strokeWidth={1.5} />
  ),
  PASSED: (
    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} className="text-accent-soft-fg" strokeWidth={1.5} />
  ),
  FAILED: (
    <HugeiconsIcon icon={Cancel01Icon} size={14} className="text-[var(--status-rejected-fg)]" strokeWidth={1.5} />
  ),
  SKIPPED: (
    <HugeiconsIcon icon={AlertCircleIcon} size={14} className="text-text-muted" strokeWidth={1.5} />
  ),
};

const STATUS_LABEL_COLORS: Record<StageStatus, string> = {
  UPCOMING: "text-text-muted",
  COMPLETED: "text-[var(--status-offer-fg)]",
  PASSED: "text-accent-soft-fg",
  FAILED: "text-[var(--status-rejected-fg)]",
  SKIPPED: "text-text-muted",
};

export function PipelineBuilder({ application: app }: PipelineBuilderProps) {
  const [stages, setStages] = useState<StageWithNotify[]>(
    app.stages.map((s) => ({ ...s, notify: false }))
  );
  const [customInput, setCustomInput] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  function addStage(name: string) {
    const newStage: StageWithNotify = {
      id: `mock-${Date.now()}`,
      applicationId: app.id,
      name,
      order: stages.length,
      status: "UPCOMING",
      scheduledDate: null,
      completedDate: null,
      notes: null,
      notify: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setStages((prev) => [...prev, newStage]);
    setShowCustom(false);
    setCustomInput("");
  }

  function toggleNotify(id: string) {
    setStages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, notify: !s.notify } : s))
    );
  }

  function removeStage(id: string) {
    setStages((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Template actions */}
      <div className="flex items-center gap-2">
        <select
          className="flex-1 bg-surface-elevated border border-border rounded-input px-3 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-accent transition-colors duration-150"
          defaultValue=""
          onChange={(e) => {
            const tmpl = MOCK_PIPELINE_TEMPLATES.find((t) => t.id === e.target.value);
            if (tmpl) {
              setStages(
                tmpl.stages.map((name, i) => ({
                  id: `tmpl-${Date.now()}-${i}`,
                  applicationId: app.id,
                  name,
                  order: i,
                  status: "UPCOMING",
                  scheduledDate: null,
                  completedDate: null,
                  notes: null,
                  notify: false,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }))
              );
              e.target.value = "";
            }
          }}
        >
          <option value="" disabled>Apply a template…</option>
          {MOCK_PIPELINE_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <Button variant="ghost" size="sm" className="text-xs text-text-muted whitespace-nowrap">
          Save as template
        </Button>
      </div>

      {/* Stage palette */}
      <div>
        <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">Add stage</p>
        <div className="flex flex-wrap gap-1.5">
          {STAGE_PRESETS.map((name) => (
            <button
              key={name}
              onClick={() => addStage(name)}
              className="flex items-center gap-1 px-2.5 py-1 bg-surface-elevated border border-border rounded-full text-xs text-text-secondary hover:bg-surface-hover hover:border-accent hover:text-accent transition-colors duration-150"
            >
              <HugeiconsIcon icon={Add01Icon} size={10} strokeWidth={2} />
              {name}
            </button>
          ))}
          {showCustom ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customInput.trim()) addStage(customInput.trim());
                  if (e.key === "Escape") { setShowCustom(false); setCustomInput(""); }
                }}
                placeholder="Stage name…"
                className="bg-surface-elevated border border-accent rounded-input px-2.5 py-1 text-xs text-text-primary focus:outline-none w-32"
              />
              <button
                onClick={() => customInput.trim() && addStage(customInput.trim())}
                className="text-accent hover:text-accent-hover transition-colors"
              >
                <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCustom(true)}
              className="px-2.5 py-1 border border-dashed border-border rounded-full text-xs text-text-muted hover:border-accent hover:text-accent transition-colors duration-150"
            >
              Custom…
            </button>
          )}
        </div>
      </div>

      {/* Stage sequence */}
      <div className="flex flex-col">
        {stages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center">
              <HugeiconsIcon icon={FlowSquareIcon} size={18} className="text-text-muted" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-text-primary">No stages yet</p>
            <p className="text-xs text-text-muted max-w-xs">
              Tap a stage above to add it, or apply a template to pre-fill a common sequence.
            </p>
          </div>
        ) : (
          stages.map((stage, index) => (
            <div key={stage.id} className="flex gap-3">
              {/* Rail column */}
              <div className="flex flex-col items-center" style={{ width: 20 }}>
                <div className="mt-3.5 flex items-center justify-center">{STATUS_DOT[stage.status]}</div>
                {index < stages.length - 1 && (
                  <div className="flex-1 w-px bg-border mt-1 mb-0 min-h-[20px]" />
                )}
              </div>

              {/* Stage card */}
              <div
                className={cn(
                  "flex-1 bg-surface-elevated border border-border rounded-card p-3 mb-2 group transition-colors duration-150 hover:border-border-hover",
                  stage.status === "COMPLETED" || stage.status === "PASSED"
                    ? "opacity-80"
                    : ""
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Drag handle (visual only in Sprint 1) */}
                    <HugeiconsIcon
                      icon={DragDropVerticalIcon}
                      size={14}
                      className="text-text-muted opacity-0 group-hover:opacity-100 cursor-grab transition-opacity duration-150 shrink-0"
                      strokeWidth={1.5}
                    />
                    <span className="text-sm font-medium text-text-primary truncate">{stage.name}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn("text-xs font-medium", STATUS_LABEL_COLORS[stage.status])}>
                      {STAGE_STATUS_LABELS[stage.status]}
                    </span>

                    {/* Bell toggle */}
                    <button
                      onClick={() => toggleNotify(stage.id)}
                      title={stage.notify ? "Remove reminder" : "Set reminder"}
                      className={cn(
                        "transition-colors duration-150",
                        stage.notify ? "text-accent" : "text-text-muted hover:text-accent"
                      )}
                    >
                      <HugeiconsIcon
                        icon={stage.notify ? Notification01Icon : NotificationOff01Icon}
                        size={14}
                        strokeWidth={1.5}
                      />
                    </button>

                    {/* Remove */}
                    <button
                      onClick={() => removeStage(stage.id)}
                      className="text-text-muted hover:text-[var(--status-rejected-fg)] transition-colors duration-150 opacity-0 group-hover:opacity-100"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={13} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* Date / notes row */}
                {(stage.scheduledDate || stage.notes) && (
                  <div className="mt-2 flex flex-col gap-1">
                    {stage.scheduledDate && (
                      <p className="text-[11px] text-text-muted">
                        {format(new Date(stage.scheduledDate), "MMM d, yyyy")}
                        {stage.scheduledDate.includes("T") && stage.scheduledDate.split("T")[1] !== "00:00:00Z"
                          ? ` · ${format(new Date(stage.scheduledDate), "h:mm a")}`
                          : ""}
                      </p>
                    )}
                    {stage.notes && (
                      <p className="text-[11px] text-text-secondary italic">{stage.notes}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Drag-here affordance */}
        {stages.length > 0 && (
          <div className="flex gap-3">
            <div className="flex flex-col items-center" style={{ width: 20 }}>
              <span className="w-2 h-2 rounded-full border border-dashed border-border mt-3.5" />
            </div>
            <div className="flex-1 border border-dashed border-border rounded-card px-3 py-2 mb-2 text-xs text-text-muted flex items-center gap-2">
              <HugeiconsIcon icon={Add01Icon} size={12} strokeWidth={1.5} />
              Drag a stage here, or tap one above
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
