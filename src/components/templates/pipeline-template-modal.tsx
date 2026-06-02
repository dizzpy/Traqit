"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { saveTemplate, updateTemplate } from "@/hooks/use-presets";
import type { PipelineTemplate } from "@/types";

/**
 * Create / edit a pipeline template. Stages are entered comma-separated. Shared
 * by the Profile and Settings pages so the editor behaves identically in both.
 */
export function PipelineTemplateModal({
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

  const preview = stagesText.split(",").map((s) => s.trim()).filter(Boolean);

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
        {preview.length > 0 && <p className="text-xs text-text-muted -mt-1">{preview.join(" → ")}</p>}
        <div onClick={() => setIsDefault(!isDefault)} className="flex items-center gap-2 self-start cursor-pointer">
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
