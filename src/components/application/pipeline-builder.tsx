"use client";

import { useState } from "react";
import { mutate as globalMutate } from "swr";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Add01Icon,
  DragDropVerticalIcon,
  FlowSquareIcon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import { DatePicker } from "@/components/ui/date-picker";
import { STAGE_PRESETS, STAGE_STATUS_LABELS } from "@/lib/constants";
import { useTemplates } from "@/hooks/use-presets";
import { createStage, updateStage, deleteStage, reorderStages } from "@/hooks/use-stages";
import type { Application, PipelineStage, StageStatus } from "@/types";
import { cn } from "@/lib/utils";

interface PipelineBuilderProps {
  application: Application;
}

const STATUS_CYCLE: StageStatus[] = ["UPCOMING", "COMPLETED", "PASSED", "FAILED", "SKIPPED"];

const STATUS_DOT: Record<StageStatus, React.ReactNode> = {
  UPCOMING: <span className="w-3 h-3 rounded-full border-2 border-border bg-transparent inline-block" />,
  COMPLETED: <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} className="text-[var(--status-offer-fg)]" strokeWidth={1.5} />,
  PASSED: <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} className="text-accent-soft-fg" strokeWidth={1.5} />,
  FAILED: <HugeiconsIcon icon={Cancel01Icon} size={14} className="text-[var(--status-rejected-fg)]" strokeWidth={1.5} />,
  SKIPPED: <HugeiconsIcon icon={AlertCircleIcon} size={14} className="text-text-muted" strokeWidth={1.5} />,
};

const STATUS_LABEL_COLORS: Record<StageStatus, string> = {
  UPCOMING: "text-text-muted",
  COMPLETED: "text-[var(--status-offer-fg)]",
  PASSED: "text-accent-soft-fg",
  FAILED: "text-[var(--status-rejected-fg)]",
  SKIPPED: "text-text-muted",
};

// Revalidate every applications key so the list + detail reflect stage changes.
const revalidateApps = () =>
  globalMutate((key) => typeof key === "string" && key.startsWith("/api/applications"));

export function PipelineBuilder({ application: app }: PipelineBuilderProps) {
  const { templates } = useTemplates();
  const [stages, setStages] = useState<PipelineStage[]>(app.stages);
  const [customInput, setCustomInput] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function tempStage(name: string, order: number): PipelineStage {
    const now = new Date().toISOString();
    return {
      id: `temp-${now}-${order}`,
      applicationId: app.id,
      name,
      order,
      status: "UPCOMING",
      scheduledDate: null,
      completedDate: null,
      notes: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  async function addStage(name: string) {
    setShowCustom(false);
    setCustomInput("");
    const temp = tempStage(name, stages.length + 1);
    setStages((prev) => [...prev, temp]);
    try {
      const real = await createStage(app.id, { name, order: temp.order });
      setStages((prev) => prev.map((s) => (s.id === temp.id ? real : s)));
      revalidateApps();
    } catch {
      setStages((prev) => prev.filter((s) => s.id !== temp.id));
      toast.error("Couldn't add stage");
    }
  }

  async function removeStage(id: string) {
    // A temp stage is mid-create on the server — deleting it now would 404 and
    // could orphan the row the pending create is about to insert. Ignore until
    // it resolves to a real id (a beat later).
    if (id.startsWith("temp-")) return;
    const snapshot = stages;
    setStages((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteStage(app.id, id);
      revalidateApps();
    } catch {
      setStages(snapshot);
      toast.error("Couldn't remove stage");
    }
  }

  async function cycleStatus(stage: PipelineStage) {
    if (stage.id.startsWith("temp-")) return; // not persisted yet — PATCH would 404
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(stage.status) + 1) % STATUS_CYCLE.length];
    const snapshot = stages;
    setStages((prev) => prev.map((s) => (s.id === stage.id ? { ...s, status: next } : s)));
    try {
      await updateStage(app.id, stage.id, { status: next });
      revalidateApps();
    } catch {
      setStages(snapshot);
      toast.error("Couldn't update stage");
    }
  }

  async function setStageDate(stage: PipelineStage, date: string) {
    if (stage.id.startsWith("temp-")) return; // not persisted yet — PATCH would 404
    const value = date || null;
    const snapshot = stages;
    setStages((prev) => prev.map((s) => (s.id === stage.id ? { ...s, scheduledDate: value } : s)));
    try {
      await updateStage(app.id, stage.id, { scheduledDate: value });
      revalidateApps();
    } catch {
      setStages(snapshot);
      toast.error("Couldn't set date");
    }
  }

  async function applyTemplate(stageNames: string[]) {
    if (!stageNames.length) return;
    const snapshot = stages;
    setStages(stageNames.map((name, i) => tempStage(name, i + 1)));
    try {
      // Replace the existing pipeline with the template's stages.
      await Promise.all(
        snapshot.filter((s) => !s.id.startsWith("temp-")).map((s) => deleteStage(app.id, s.id))
      );
      const created: PipelineStage[] = [];
      for (let i = 0; i < stageNames.length; i++) {
        created.push(await createStage(app.id, { name: stageNames[i], order: i + 1 }));
      }
      setStages(created);
      revalidateApps();
    } catch {
      setStages(snapshot);
      toast.error("Couldn't apply template");
    }
  }

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    if (stages.some((s) => s.id.startsWith("temp-"))) return; // wait for pending creates
    const oldIndex = stages.findIndex((s) => s.id === active.id);
    const newIndex = stages.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const snapshot = stages;
    const next = arrayMove(stages, oldIndex, newIndex).map((s, i) => ({ ...s, order: i + 1 }));
    setStages(next);
    try {
      await reorderStages(app.id, next.map((s) => s.id));
      revalidateApps();
    } catch {
      setStages(snapshot);
      toast.error("Couldn't reorder stages");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Template actions */}
      <div className="flex items-center gap-2">
        <select
          className="flex-1 bg-surface-elevated border border-border rounded-input px-3 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-border-hover transition-colors duration-150"
          defaultValue=""
          onChange={(e) => {
            const tmpl = templates.find((t) => t.id === e.target.value);
            if (tmpl) applyTemplate(tmpl.stages as string[]);
            e.target.value = "";
          }}
        >
          <option value="" disabled>Apply a template…</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col">
              {stages.map((stage, index) => (
                <StageCard
                  key={stage.id}
                  stage={stage}
                  isLast={index === stages.length - 1}
                  pending={stage.id.startsWith("temp-")}
                  onCycleStatus={() => cycleStatus(stage)}
                  onSetDate={(d) => setStageDate(stage, d)}
                  onRemove={() => removeStage(stage.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

interface StageCardProps {
  stage: PipelineStage;
  isLast: boolean;
  /** Stage is mid-create (temp id) — its controls are inert until it persists. */
  pending?: boolean;
  onCycleStatus: () => void;
  onSetDate: (date: string) => void;
  onRemove: () => void;
}

function StageCard({ stage, isLast, pending = false, onCycleStatus, onSetDate, onRemove }: StageCardProps) {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } =
    useSortable({ id: stage.id, disabled: pending });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex gap-3", isDragging && "relative z-10 opacity-90")}
    >
      {/* Rail column */}
      <div className="flex flex-col items-center" style={{ width: 20 }}>
        <button
          onClick={onCycleStatus}
          disabled={pending}
          title={pending ? "Saving…" : `Status: ${STAGE_STATUS_LABELS[stage.status]} (click to change)`}
          className="mt-3.5 flex items-center justify-center transition-transform duration-150 enabled:hover:scale-110 disabled:cursor-not-allowed"
        >
          {STATUS_DOT[stage.status]}
        </button>
        {!isLast && <div className="flex-1 w-px bg-border mt-1 mb-0 min-h-[20px]" />}
      </div>

      {/* Stage card */}
      <div
        className={cn(
          "flex-1 bg-surface-elevated border border-border rounded-card p-3 mb-2 group transition-colors duration-150 hover:border-border-hover",
          stage.status === "COMPLETED" || stage.status === "PASSED" ? "opacity-80" : "",
          pending && "opacity-60"
        )}
        aria-busy={pending}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              aria-label="Drag to reorder"
              disabled={pending}
              className="text-text-muted opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity duration-150 shrink-0 touch-none disabled:cursor-not-allowed"
            >
              <HugeiconsIcon icon={DragDropVerticalIcon} size={14} strokeWidth={1.5} />
            </button>
            <span className="text-sm font-medium text-text-primary truncate">{stage.name}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onCycleStatus}
              disabled={pending}
              className={cn("text-xs font-medium enabled:hover:underline disabled:cursor-not-allowed", STATUS_LABEL_COLORS[stage.status])}
            >
              {pending ? "Saving…" : STAGE_STATUS_LABELS[stage.status]}
            </button>
            <button
              onClick={onRemove}
              disabled={pending}
              className="text-text-muted hover:text-[var(--status-rejected-fg)] transition-colors duration-150 opacity-0 group-hover:opacity-100 disabled:cursor-not-allowed"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={13} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Date row */}
        <div className={cn("mt-2", pending && "pointer-events-none")}>
          <DatePicker
            value={stage.scheduledDate?.slice(0, 10) ?? ""}
            onChange={onSetDate}
            placeholder="Schedule date"
            className="h-7 text-xs"
          />
          {stage.notes && <p className="mt-1 text-[11px] text-text-secondary italic">{stage.notes}</p>}
        </div>
      </div>
    </div>
  );
}
