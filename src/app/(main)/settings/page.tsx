"use client";

import { useState } from "react";
import {
  Add01Icon,
  Delete02Icon,
  Edit02Icon,
  Moon01Icon,
  Sun01Icon,
  Download01Icon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useProfile, updateProfile } from "@/hooks/use-profile";
import {
  useTemplates,
  useSources,
  useJobTypes,
  addSource,
  addJobType,
  deleteSource,
  deleteJobType,
  saveTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/hooks/use-presets";
import { CURRENCIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { PipelineTemplate } from "@/types";

export default function SettingsPage() {
  const { profile, mutate: mutateProfile } = useProfile();
  const { templates, mutate: mutateTemplates } = useTemplates();
  const { raw: sources, mutate: mutateSources } = useSources();
  const { raw: jobTypes, mutate: mutateJobTypes } = useJobTypes();

  // Preset add inputs
  const [newSource, setNewSource] = useState("");
  const [newJobType, setNewJobType] = useState("");

  // Template editor + delete confirm
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PipelineTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PipelineTemplate | null>(null);

  async function savePref(patch: Parameters<typeof updateProfile>[0]) {
    try {
      await updateProfile(patch);
      mutateProfile();
      toast.success("Preference saved");
    } catch {
      toast.error("Couldn't save preference");
    }
  }

  async function handleAddSource(e: React.FormEvent) {
    e.preventDefault();
    if (!newSource.trim()) return;
    await addSource(newSource.trim());
    mutateSources();
    setNewSource("");
  }

  async function handleAddJobType(e: React.FormEvent) {
    e.preventDefault();
    if (!newJobType.trim()) return;
    await addJobType(newJobType.trim());
    mutateJobTypes();
    setNewJobType("");
  }

  async function removeSource(id: string) {
    try {
      await deleteSource(id);
      mutateSources();
    } catch {
      toast.error("Couldn't remove source");
    }
  }

  async function removeJobType(id: string) {
    try {
      await deleteJobType(id);
      mutateJobTypes();
    } catch {
      toast.error("Couldn't remove job type");
    }
  }

  async function confirmDeleteTemplate(t: PipelineTemplate) {
    try {
      await deleteTemplate(t.id);
      mutateTemplates();
      toast.success("Template deleted");
    } catch {
      toast.error("Couldn't delete template");
    }
  }

  async function setDefaultTemplate(t: PipelineTemplate) {
    try {
      await updateTemplate(t.id, { isDefault: true });
      mutateTemplates();
      toast.success(`"${t.name}" is now the default`);
    } catch {
      toast.error("Couldn't set default");
    }
  }

  async function handleExport() {
    const res = await fetch("/api/applications?limit=1000&status=SAVED,APPLIED,IN_PROGRESS,OFFER,ACCEPTED,REJECTED,GHOSTED,WITHDRAWN");
    const json = await res.json();
    const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interntracker-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export downloaded");
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Settings" />
      <div className="flex-1 overflow-y-auto p-6">
       <div className="max-w-5xl mx-auto columns-1 lg:columns-2 gap-6 [&>*]:mb-6 [&>*]:break-inside-avoid">

        {/* Appearance */}
        <Section title="Appearance" description="Pick the look that feels calm to you.">
          <ThemeSelector />
        </Section>

        {/* Preferences */}
        <Section title="Preferences" description="Smart defaults for new applications.">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Default currency"
                value={profile?.defaultCurrency ?? "LKR"}
                onChange={(e) => savePref({ defaultCurrency: e.target.value })}
                options={CURRENCIES.map((c) => ({ value: c, label: c }))}
              />
              <Select
                label="Default pipeline template"
                value={profile?.defaultPipelineTemplateId ?? ""}
                onChange={(e) => savePref({ defaultPipelineTemplateId: e.target.value || null })}
                options={[
                  { value: "", label: "None — build from scratch" },
                  ...templates.map((t) => ({ value: t.id, label: t.name })),
                ]}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">Ghost threshold (days)</label>
              <p className="text-[11px] text-text-muted mt-0.5 mb-1.5">Applications with no reply after this many days are flagged as ghosting.</p>
              <input
                key={profile?.ghostThresholdDays ?? "loading"}
                type="number"
                min={1}
                max={365}
                defaultValue={profile?.ghostThresholdDays ?? 14}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (v >= 1 && v <= 365 && v !== profile?.ghostThresholdDays) savePref({ ghostThresholdDays: v });
                }}
                className="h-9 w-28 rounded-input bg-surface-elevated border border-border px-3 text-sm text-text-primary outline-none focus:border-border-hover transition-colors"
              />
            </div>
          </div>
        </Section>

        {/* Pipeline templates */}
        <Section
          title="Pipeline templates"
          description="Reusable stage sets you can apply to new applications."
          action={
            <Button variant="outline" size="sm" onClick={() => { setEditingTemplate(null); setEditorOpen(true); }}>
              <HugeiconsIcon icon={Add01Icon} size={13} strokeWidth={1.5} /> New
            </Button>
          }
        >
          {templates.length === 0 ? (
            <p className="text-sm text-text-muted">No templates yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {templates.map((t: PipelineTemplate) => (
                <div key={t.id} className="group bg-surface-elevated border border-border rounded-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-text-primary truncate">{t.name}</span>
                      {t.isDefault && (
                        <span className="flex items-center gap-1 text-[10px] text-accent-soft-fg bg-accent-soft px-1.5 py-0.5 rounded-full shrink-0">
                          <HugeiconsIcon icon={StarIcon} size={9} strokeWidth={2} /> Default
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!t.isDefault && (
                        <button onClick={() => setDefaultTemplate(t)} title="Set as default" className="text-text-muted hover:text-accent transition-colors p-1">
                          <HugeiconsIcon icon={StarIcon} size={14} strokeWidth={1.5} />
                        </button>
                      )}
                      <button onClick={() => { setEditingTemplate(t); setEditorOpen(true); }} title="Edit" className="text-text-muted hover:text-text-primary transition-colors p-1">
                        <HugeiconsIcon icon={Edit02Icon} size={14} strokeWidth={1.5} />
                      </button>
                      <button onClick={() => setDeleteTarget(t)} title="Delete" className="text-text-muted hover:text-[var(--status-rejected-fg)] transition-colors p-1">
                        <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-text-muted mt-1">{(t.stages as string[]).join(" → ")}</p>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Job sources */}
        <Section title="Job sources" description="Where you find listings.">
          <div className="flex flex-wrap gap-2 mb-3">
            {sources.map((s) => (
              <Chip key={s.id} label={s.name} meta={s.usageCount} onRemove={() => removeSource(s.id)} />
            ))}
            {sources.length === 0 && <p className="text-sm text-text-muted">No custom sources yet.</p>}
          </div>
          <form onSubmit={handleAddSource} className="flex gap-2">
            <Input value={newSource} onChange={(e) => setNewSource(e.target.value)} placeholder="New source name" className="flex-1" />
            <Button type="submit" variant="outline" size="sm">
              <HugeiconsIcon icon={Add01Icon} size={13} strokeWidth={1.5} /> Add
            </Button>
          </form>
        </Section>

        {/* Job types */}
        <Section title="Job types" description="Types of positions you apply for.">
          <div className="flex flex-wrap gap-2 mb-3">
            {jobTypes.map((t) => (
              <Chip key={t.id} label={t.name} onRemove={() => removeJobType(t.id)} />
            ))}
            {jobTypes.length === 0 && <p className="text-sm text-text-muted">No custom job types yet.</p>}
          </div>
          <form onSubmit={handleAddJobType} className="flex gap-2">
            <Input value={newJobType} onChange={(e) => setNewJobType(e.target.value)} placeholder="New job type" className="flex-1" />
            <Button type="submit" variant="outline" size="sm">
              <HugeiconsIcon icon={Add01Icon} size={13} strokeWidth={1.5} /> Add
            </Button>
          </form>
        </Section>

        {/* Data */}
        <Section title="Data" description="Export everything as a JSON backup.">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <HugeiconsIcon icon={Download01Icon} size={14} strokeWidth={1.5} /> Export all data as JSON
          </Button>
        </Section>

       </div>
      </div>

      {editorOpen && (
        <TemplateModal
          key={editingTemplate?.id ?? "new"}
          template={editingTemplate}
          onClose={() => setEditorOpen(false)}
          onSaved={mutateTemplates}
        />
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && confirmDeleteTemplate(deleteTarget)}
        title="Delete this template?"
        message={deleteTarget ? `"${deleteTarget.name}" will be removed. Existing applications keep their stages.` : ""}
        confirmLabel="Delete"
        tone="danger"
        icon={Delete02Icon}
      />
    </div>
  );
}

function ThemeSelector() {
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    typeof window !== "undefined" && localStorage.getItem("theme") === "light" ? "light" : "dark"
  );

  function apply(next: "dark" | "light") {
    setTheme(next);
    localStorage.setItem("theme", next);
    if (next === "light") document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
  }

  return (
    <div className="flex gap-2">
      {(["dark", "light"] as const).map((t) => (
        <button
          key={t}
          onClick={() => apply(t)}
          className={cn(
            "flex items-center gap-2 px-4 h-10 rounded-input border text-sm capitalize transition-colors duration-150",
            theme === t
              ? "border-accent bg-accent-soft text-accent-soft-fg"
              : "border-border bg-surface-elevated text-text-secondary hover:text-text-primary"
          )}
        >
          <HugeiconsIcon icon={t === "dark" ? Moon01Icon : Sun01Icon} size={15} strokeWidth={1.5} />
          {t}
        </button>
      ))}
    </div>
  );
}

function Chip({ label, meta, onRemove }: { label: string; meta?: number; onRemove: () => void }) {
  return (
    <span className="group/chip flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-surface-elevated border border-border rounded-full text-xs text-text-secondary">
      {label}
      {meta !== undefined && <span className="text-text-muted">({meta})</span>}
      <button onClick={onRemove} title="Remove" className="text-text-muted hover:text-[var(--status-rejected-fg)] transition-colors">
        <HugeiconsIcon icon={Delete02Icon} size={12} strokeWidth={1.5} />
      </button>
    </span>
  );
}

function TemplateModal({
  template,
  onClose,
  onSaved,
}: {
  template: PipelineTemplate | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(template?.name ?? "");
  const [stagesText, setStagesText] = useState(template ? (template.stages as string[]).join(", ") : "");
  const [isDefault, setIsDefault] = useState(template?.isDefault ?? false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const stages = stagesText.split(",").map((s) => s.trim()).filter(Boolean);
    if (!name.trim() || stages.length === 0) {
      toast.error("Name and at least one stage are required");
      return;
    }
    setSaving(true);
    try {
      if (template) await updateTemplate(template.id, { name: name.trim(), stages, isDefault });
      else await saveTemplate({ name: name.trim(), stages, isDefault });
      toast.success(template ? "Template updated" : "Template created");
      onSaved();
      onClose();
    } catch {
      toast.error("Couldn't save template");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={template ? "Edit template" : "New pipeline template"} size="md">
      <div className="p-6 flex flex-col gap-4">
        <Input label="Template name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Standard tech" />
        <Input
          label="Stages (comma-separated)"
          value={stagesText}
          onChange={(e) => setStagesText(e.target.value)}
          placeholder="OA, Phone Screen, Technical, Offer"
        />
        {stagesText.trim() && (
          <p className="text-xs text-text-muted -mt-1">
            {stagesText.split(",").map((s) => s.trim()).filter(Boolean).join(" → ")}
          </p>
        )}
        <div
          onClick={() => setIsDefault(!isDefault)}
          className="flex items-center gap-2 self-start cursor-pointer"
        >
          <Checkbox checked={isDefault} onChange={() => setIsDefault(!isDefault)} />
          <span className="text-sm text-text-secondary">Use as default for new applications</span>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>Save template</Button>
        </div>
      </div>
    </Modal>
  );
}

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-text-primary">{title}</h2>
          {description && <p className="text-sm text-text-muted mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      <div className="bg-surface border border-border rounded-card p-4">{children}</div>
    </div>
  );
}
