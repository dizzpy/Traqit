"use client";

import { useState } from "react";
import {
  Tick01Icon,
  Cancel01Icon,
  Remove02Icon,
  CircleIcon,
  Add01Icon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { STAGE_PRESETS, STAGE_STATUS_LABELS } from "@/lib/constants";
import type { PipelineStage, StageStatus } from "@/types";

interface PipelineStagesProps {
  applicationId: string;
  stages: PipelineStage[];
  onUpdate: () => void;
}

const STATUS_ICONS: Record<StageStatus, React.ReactNode> = {
  UPCOMING:  <HugeiconsIcon icon={CircleIcon}    size={14} strokeWidth={1.5} className="text-text-muted" />,
  COMPLETED: <HugeiconsIcon icon={Tick01Icon}    size={14} strokeWidth={1.5} className="text-info" />,
  PASSED:    <HugeiconsIcon icon={Tick01Icon}    size={14} strokeWidth={1.5} className="text-success" />,
  FAILED:    <HugeiconsIcon icon={Cancel01Icon}  size={14} strokeWidth={1.5} className="text-danger" />,
  SKIPPED:   <HugeiconsIcon icon={Remove02Icon}  size={14} strokeWidth={1.5} className="text-text-muted" />,
};

export function PipelineStages({ applicationId, stages, onUpdate }: PipelineStagesProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingAfter, setAddingAfter] = useState<number | null>(null);
  const [newStageName, setNewStageName] = useState("");
  const [loading, setLoading] = useState(false);

  async function updateStage(stageId: string, data: Record<string, unknown>) {
    setLoading(true);
    try {
      await fetch(`/api/applications/${applicationId}/stages/${stageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      onUpdate();
    } finally {
      setLoading(false);
    }
  }

  async function addStage(name: string, afterOrder: number) {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await fetch(`/api/applications/${applicationId}/stages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), order: afterOrder + 1 }),
      });
      onUpdate();
      setAddingAfter(null);
      setNewStageName("");
    } finally {
      setLoading(false);
    }
  }

  async function deleteStage(stageId: string) {
    setLoading(true);
    try {
      await fetch(`/api/applications/${applicationId}/stages/${stageId}`, { method: "DELETE" });
      onUpdate();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start flex-wrap gap-2">
        {/* Add before first */}
        <AddButton onClick={() => setAddingAfter(0)} />

        {stages.map((stage, i) => (
          <div key={stage.id} className="flex items-center gap-2">
            {/* Stage pill */}
            <div className="relative">
              <button
                onClick={() => setEditingId(editingId === stage.id ? null : stage.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors duration-150",
                  editingId === stage.id
                    ? "bg-surface-elevated border-border-hover text-text-primary"
                    : "bg-surface border-border text-text-secondary hover:border-border-hover hover:text-text-primary"
                )}
              >
                {STATUS_ICONS[stage.status]}
                {stage.name}
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={10}
                  strokeWidth={1.5}
                  className={cn("transition-transform", editingId === stage.id && "rotate-180")}
                />
              </button>

              {/* Inline editor */}
              {editingId === stage.id && (
                <div className="absolute top-full mt-2 z-10 bg-surface-elevated border border-border rounded-card p-3 w-52 shadow-lg flex flex-col gap-2">
                  <select
                    value={stage.status}
                    onChange={(e) => updateStage(stage.id, { status: e.target.value })}
                    disabled={loading}
                    className="w-full text-xs rounded-input bg-surface border border-border px-2 py-1.5 text-text-primary focus:outline-none"
                  >
                    {(Object.keys(STAGE_STATUS_LABELS) as StageStatus[]).map((s) => (
                      <option key={s} value={s}>{STAGE_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    defaultValue={stage.scheduledDate?.slice(0, 10) ?? ""}
                    onBlur={(e) => e.target.value && updateStage(stage.id, { scheduledDate: e.target.value })}
                    className="w-full text-xs rounded-input bg-surface border border-border px-2 py-1.5 text-text-primary focus:outline-none"
                  />
                  <textarea
                    defaultValue={stage.notes ?? ""}
                    onBlur={(e) => updateStage(stage.id, { notes: e.target.value || null })}
                    placeholder="Notes..."
                    rows={2}
                    className="w-full text-xs rounded-input bg-surface border border-border px-2 py-1.5 text-text-primary focus:outline-none resize-none"
                  />
                  <Button size="sm" variant="danger" onClick={() => deleteStage(stage.id)} disabled={loading}>
                    Remove stage
                  </Button>
                </div>
              )}
            </div>

            {/* Connector + add button */}
            {i < stages.length - 1 && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-px bg-border" />
                <AddButton onClick={() => setAddingAfter(stage.order)} />
                <div className="w-3 h-px bg-border" />
              </div>
            )}
          </div>
        ))}

        {/* Add after last */}
        <AddButton onClick={() => setAddingAfter(stages.length > 0 ? stages[stages.length - 1].order : 0)} />
      </div>

      {/* Add stage popover */}
      {addingAfter !== null && (
        <div className="bg-surface-elevated border border-border rounded-card p-3 flex flex-col gap-2 w-full max-w-sm">
          <p className="text-xs font-medium text-text-secondary">Add stage</p>
          <div className="flex flex-wrap gap-1">
            {STAGE_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => addStage(preset, addingAfter)}
                className="px-2 py-1 text-xs rounded-full bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addStage(newStageName, addingAfter)}
              placeholder="Custom name..."
              autoFocus
              className="flex-1 h-8 text-xs rounded-input bg-surface border border-border px-2 text-text-primary placeholder:text-text-muted focus:outline-none"
            />
            <Button size="sm" variant="cta" onClick={() => addStage(newStageName, addingAfter)} disabled={loading || !newStageName.trim()}>
              Add
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAddingAfter(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-5 h-5 rounded-full border border-border bg-surface flex items-center justify-center text-text-muted hover:text-text-primary hover:border-border-hover transition-colors"
    >
      <HugeiconsIcon icon={Add01Icon} size={10} strokeWidth={2} />
    </button>
  );
}
