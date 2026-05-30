"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTemplates } from "@/hooks/use-presets";
import { useSources } from "@/hooks/use-presets";
import { useJobTypes } from "@/hooks/use-presets";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { PipelineTemplate } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SettingsPage() {
  const { templates, mutate: mutateTemplates } = useTemplates();
  const { raw: sources, mutate: mutateSources } = useSources();
  const { raw: jobTypes, mutate: mutateJobTypes } = useJobTypes();

  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateStages, setNewTemplateStages] = useState("");
  const [newSource, setNewSource] = useState("");
  const [newJobType, setNewJobType] = useState("");

  async function handleAddTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTemplateName || !newTemplateStages) return;
    const stages = newTemplateStages.split(",").map((s) => s.trim()).filter(Boolean);
    await fetch("/api/presets/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTemplateName, stages }),
    });
    mutateTemplates();
    setNewTemplateName("");
    setNewTemplateStages("");
  }

  async function handleAddSource(e: React.FormEvent) {
    e.preventDefault();
    if (!newSource) return;
    await fetch("/api/presets/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSource }),
    });
    mutateSources();
    setNewSource("");
  }

  async function handleAddJobType(e: React.FormEvent) {
    e.preventDefault();
    if (!newJobType) return;
    await fetch("/api/presets/job-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newJobType }),
    });
    mutateJobTypes();
    setNewJobType("");
  }

  async function handleExport() {
    const res = await fetch("/api/applications?limit=1000");
    const json = await res.json();
    const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interntracker-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Settings" />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 max-w-2xl">

        {/* Pipeline templates */}
        <Section title="Pipeline templates" description="Reusable stage sets for new applications">
          <div className="flex flex-col gap-2 mb-3">
            {templates.map((t: PipelineTemplate) => (
              <div key={t.id} className="bg-surface-elevated border border-border rounded-card p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-text-primary">{t.name}</span>
                  {t.isDefault && (
                    <span className="text-xs text-text-muted bg-surface px-2 py-0.5 rounded-full border border-border">Default</span>
                  )}
                </div>
                <p className="text-xs text-text-muted">{(t.stages as string[]).join(" → ")}</p>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddTemplate} className="flex flex-col gap-2">
            <Input
              label="Template name"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="My template"
            />
            <Input
              label="Stages (comma-separated)"
              value={newTemplateStages}
              onChange={(e) => setNewTemplateStages(e.target.value)}
              placeholder="OA, Phone Screen, Technical, Offer"
            />
            <Button type="submit" variant="outline" size="sm" className="self-start">
              <HugeiconsIcon icon={Add01Icon} size={13} strokeWidth={1.5} /> Add template
            </Button>
          </form>
        </Section>

        {/* Sources */}
        <Section title="Job sources" description="Where you find job listings">
          <div className="flex flex-wrap gap-2 mb-3">
            {sources.map((s) => (
              <span key={s.id} className="flex items-center gap-1.5 px-3 py-1 bg-surface-elevated border border-border rounded-full text-xs text-text-secondary">
                {s.name}
                <span className="text-text-muted">({s.usageCount})</span>
              </span>
            ))}
          </div>
          <form onSubmit={handleAddSource} className="flex gap-2">
            <Input
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              placeholder="New source name"
              className="flex-1"
            />
            <Button type="submit" variant="outline" size="sm">
              <HugeiconsIcon icon={Add01Icon} size={13} strokeWidth={1.5} /> Add
            </Button>
          </form>
        </Section>

        {/* Job types */}
        <Section title="Job types" description="Types of positions you apply for">
          <div className="flex flex-wrap gap-2 mb-3">
            {jobTypes.map((t) => (
              <span key={t.id} className="px-3 py-1 bg-surface-elevated border border-border rounded-full text-xs text-text-secondary">
                {t.name}
              </span>
            ))}
          </div>
          <form onSubmit={handleAddJobType} className="flex gap-2">
            <Input
              value={newJobType}
              onChange={(e) => setNewJobType(e.target.value)}
              placeholder="New job type"
              className="flex-1"
            />
            <Button type="submit" variant="outline" size="sm">
              <HugeiconsIcon icon={Add01Icon} size={13} strokeWidth={1.5} /> Add
            </Button>
          </form>
        </Section>

        {/* Data export */}
        <Section title="Data" description="Export your data as JSON backup">
          <Button variant="outline" size="sm" onClick={handleExport}>
            Export all data as JSON
          </Button>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3">
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        {description && <p className="text-sm text-text-muted mt-0.5">{description}</p>}
      </div>
      <div className="bg-surface border border-border rounded-card p-4">{children}</div>
    </div>
  );
}
