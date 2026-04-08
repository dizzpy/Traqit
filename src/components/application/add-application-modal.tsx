"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { PillToggle } from "@/components/ui/pill-toggle";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useSources, useJobTypes, useTemplates, addSource, addJobType } from "@/hooks/use-presets";
import { createApplication } from "@/hooks/use-applications";
import { CURRENCIES } from "@/lib/constants";
import type { WorkMode } from "@/types";
import { mutate } from "swr";

interface AddApplicationModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddApplicationModal({ open, onClose }: AddApplicationModalProps) {
  const { sources, mutate: mutateSources } = useSources();
  const { jobTypes, mutate: mutateJobTypes } = useJobTypes();
  const { templates } = useTemplates();

  const [saveForLater, setSaveForLater] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    companyName: "",
    companyUrl: "",
    position: "",
    jobPostUrl: "",
    jobType: "",
    workMode: "no-data" as WorkMode,
    appliedVia: "",
    salaryMin: "",
    salaryMax: "",
    currency: "LKR",
    location: "",
    appliedDate: new Date().toISOString().slice(0, 10),
    deadline: "",
    notes: "",
    templateId: "",
  });

  function set(key: string, value: string | WorkMode) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.companyName.trim()) errs.companyName = "Required";
    if (!form.position.trim()) errs.position = "Required";
    if (!saveForLater) {
      if (!form.appliedVia) errs.appliedVia = "Required";
      if (!form.jobType) errs.jobType = "Required";
    }
    if (form.salaryMin && form.salaryMax && Number(form.salaryMin) > Number(form.salaryMax)) {
      errs.salaryMin = "Min must be ≤ max";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await createApplication({
        companyName: form.companyName,
        companyUrl: form.companyUrl || null,
        position: form.position,
        jobPostUrl: form.jobPostUrl || null,
        jobType: form.jobType || "Intern",
        workMode: form.workMode,
        appliedVia: form.appliedVia || "Direct Mail",
        salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
        currency: form.currency,
        location: form.location || null,
        status: saveForLater ? "SAVED" : "APPLIED",
        appliedDate: saveForLater ? null : form.appliedDate,
        deadline: form.deadline || null,
        notes: form.notes || null,
        templateId: form.templateId || null,
      });
      await mutate((key: string) => typeof key === "string" && key.startsWith("/api/applications"));
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSource(name: string) {
    await addSource(name);
    mutateSources();
  }

  async function handleAddJobType(name: string) {
    await addJobType(name);
    mutateJobTypes();
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Application" size="lg">
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
        {/* Save for later toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setSaveForLater(!saveForLater)}
            className={`w-9 h-5 rounded-full transition-colors duration-150 relative cursor-pointer ${saveForLater ? "bg-accent" : "bg-surface-elevated border border-border"}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-150 ${saveForLater ? "translate-x-4" : "translate-x-0.5"}`} />
          </div>
          <span className="text-sm text-text-secondary">Save for later (wishlist)</span>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Company name *"
            value={form.companyName}
            onChange={(e) => set("companyName", e.target.value)}
            placeholder="Acme Corp"
            error={errors.companyName}
          />
          <Input
            label="Position *"
            value={form.position}
            onChange={(e) => set("position", e.target.value)}
            placeholder="Flutter Developer Intern"
            error={errors.position}
          />
          <Input
            label="Company URL"
            type="url"
            value={form.companyUrl}
            onChange={(e) => set("companyUrl", e.target.value)}
            placeholder="https://..."
          />
          <Input
            label="Job post URL"
            type="url"
            value={form.jobPostUrl}
            onChange={(e) => set("jobPostUrl", e.target.value)}
            placeholder="https://..."
          />
        </div>

        {!saveForLater && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <SearchableSelect
                label="Job type *"
                value={form.jobType}
                onChange={(v) => set("jobType", v)}
                options={jobTypes}
                onCreateNew={handleAddJobType}
                error={errors.jobType}
              />
              <SearchableSelect
                label="Applied via *"
                value={form.appliedVia}
                onChange={(v) => set("appliedVia", v)}
                options={sources}
                onCreateNew={handleAddSource}
                error={errors.appliedVia}
              />
            </div>
          </>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">Work mode</label>
          <PillToggle value={form.workMode} onChange={(v) => set("workMode", v)} />
        </div>

        {!saveForLater ? (
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Pipeline template"
              value={form.templateId}
              onChange={(e) => set("templateId", e.target.value)}
              options={[
                { value: "", label: "No template" },
                ...templates.map((t) => ({ value: t.id, label: t.name })),
              ]}
            />
            <Input
              label="Applied date"
              type="date"
              value={form.appliedDate}
              onChange={(e) => set("appliedDate", e.target.value)}
            />
          </div>
        ) : (
          <Input
            label="Deadline (when posting expires)"
            type="date"
            value={form.deadline}
            onChange={(e) => set("deadline", e.target.value)}
          />
        )}

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Salary min"
            type="number"
            value={form.salaryMin}
            onChange={(e) => set("salaryMin", e.target.value)}
            placeholder="40000"
            error={errors.salaryMin}
          />
          <Input
            label="Salary max"
            type="number"
            value={form.salaryMax}
            onChange={(e) => set("salaryMax", e.target.value)}
            placeholder="60000"
          />
          <Select
            label="Currency"
            value={form.currency}
            onChange={(e) => set("currency", e.target.value)}
            options={CURRENCIES.map((c) => ({ value: c, label: c }))}
          />
        </div>

        <Input
          label="Location"
          value={form.location}
          onChange={(e) => set("location", e.target.value)}
          placeholder="Colombo, Sri Lanka"
        />

        <Textarea
          label="Notes"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Any notes about this application..."
        />

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="cta" disabled={loading}>
            {loading ? "Saving..." : saveForLater ? "Save for later" : "Add Application"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
