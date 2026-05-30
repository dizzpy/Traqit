"use client";

import { useState } from "react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PillToggle } from "@/components/ui/pill-toggle";
import { CURRENCIES, DEFAULT_JOB_TYPES, DEFAULT_SOURCES } from "@/lib/constants";
import { MOCK_PIPELINE_TEMPLATES } from "@/lib/mock-data";
import type { WorkMode } from "@/types";
import { cn } from "@/lib/utils";

interface AddApplicationPanelProps {
  onClose: () => void;
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-medium text-text-secondary">
      {children}
      {required && <span className="text-[var(--status-rejected-fg)] ml-0.5">*</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[11px] text-[var(--status-rejected-fg)]">{message}</p>;
}

export function AddApplicationPanel({ onClose }: AddApplicationPanelProps) {
  const today = new Date().toISOString().split("T")[0];

  const [companyName, setCompanyName] = useState("");
  const [position, setPosition] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [jobPostUrl, setJobPostUrl] = useState("");
  const [jobType, setJobType] = useState("");
  const [workMode, setWorkMode] = useState<WorkMode>("no-data");
  const [appliedVia, setAppliedVia] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [currency, setCurrency] = useState("LKR");
  const [location, setLocation] = useState("");
  const [appliedDate, setAppliedDate] = useState(today);
  const [templateId, setTemplateId] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!companyName.trim()) e.companyName = "Company name is required";
    if (!position.trim()) e.position = "Position is required";
    if (!jobType.trim()) e.jobType = "Job type is required";
    if (!appliedVia.trim()) e.appliedVia = "Applied via is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    // Static — no API call in Sprint 1
    onClose();
  }

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:max-w-3xl bg-surface border-l border-border p-0 flex flex-col gap-0 overflow-hidden"
      >
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center justify-between gap-4">
            <SheetTitle
              className="text-base font-semibold text-text-primary"
              style={{ fontFamily: "var(--font-family-display)" }}
            >
              Add application
            </SheetTitle>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary transition-colors duration-150"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.5} />
            </button>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 flex flex-col gap-4">
            {/* Company + position */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label required>Company name</Label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Sysco LABS"
                  className={cn(
                    "h-9 w-full rounded-input bg-surface-elevated border border-border px-3 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 focus:outline-none focus:border-border-hover",
                    errors.companyName && "border-[var(--status-rejected-fg)]"
                  )}
                />
                <FieldError message={errors.companyName} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label required>Position</Label>
                <input
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. SE Intern"
                  className={cn(
                    "h-9 w-full rounded-input bg-surface-elevated border border-border px-3 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 focus:outline-none focus:border-border-hover",
                    errors.position && "border-[var(--status-rejected-fg)]"
                  )}
                />
                <FieldError message={errors.position} />
              </div>
            </div>

            {/* URLs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Company URL</Label>
                <input
                  type="url"
                  value={companyUrl}
                  onChange={(e) => setCompanyUrl(e.target.value)}
                  placeholder="https://company.com"
                  className="h-9 w-full rounded-input bg-surface-elevated border border-border px-3 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 focus:outline-none focus:border-border-hover"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Job post URL</Label>
                <input
                  type="url"
                  value={jobPostUrl}
                  onChange={(e) => setJobPostUrl(e.target.value)}
                  placeholder="https://jobs.company.com/…"
                  className="h-9 w-full rounded-input bg-surface-elevated border border-border px-3 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 focus:outline-none focus:border-border-hover"
                />
              </div>
            </div>

            {/* Job type + Applied via */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label required>Job type</Label>
                <input
                  list="job-types-list"
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  placeholder="Select or type…"
                  className={cn(
                    "h-9 w-full rounded-input bg-surface-elevated border border-border px-3 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 focus:outline-none focus:border-border-hover",
                    errors.jobType && "border-[var(--status-rejected-fg)]"
                  )}
                />
                <datalist id="job-types-list">
                  {DEFAULT_JOB_TYPES.map((t) => <option key={t} value={t} />)}
                </datalist>
                <FieldError message={errors.jobType} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label required>Applied via</Label>
                <input
                  list="sources-list"
                  value={appliedVia}
                  onChange={(e) => setAppliedVia(e.target.value)}
                  placeholder="Select or type…"
                  className={cn(
                    "h-9 w-full rounded-input bg-surface-elevated border border-border px-3 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 focus:outline-none focus:border-border-hover",
                    errors.appliedVia && "border-[var(--status-rejected-fg)]"
                  )}
                />
                <datalist id="sources-list">
                  {DEFAULT_SOURCES.map((s) => <option key={s} value={s} />)}
                </datalist>
                <FieldError message={errors.appliedVia} />
              </div>
            </div>

            {/* Work mode */}
            <div className="flex flex-col gap-1.5">
              <Label>Work mode</Label>
              <PillToggle value={workMode} onChange={setWorkMode} />
            </div>

            {/* Salary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Salary min</Label>
                <input
                  type="number"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  placeholder="35000"
                  className="h-9 w-full rounded-input bg-surface-elevated border border-border px-3 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 focus:outline-none focus:border-border-hover"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Salary max</Label>
                <input
                  type="number"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  placeholder="55000"
                  className="h-9 w-full rounded-input bg-surface-elevated border border-border px-3 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 focus:outline-none focus:border-border-hover"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Currency</Label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="h-9 w-full rounded-input bg-surface-elevated border border-border px-3 text-sm text-text-primary transition-colors duration-150 focus:outline-none focus:border-border-hover"
                >
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Location + applied date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Location</Label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Colombo 03"
                  className="h-9 w-full rounded-input bg-surface-elevated border border-border px-3 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 focus:outline-none focus:border-border-hover"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Applied date</Label>
                <input
                  type="date"
                  value={appliedDate}
                  onChange={(e) => setAppliedDate(e.target.value)}
                  className="h-9 w-full rounded-input bg-surface-elevated border border-border px-3 text-sm text-text-primary transition-colors duration-150 focus:outline-none focus:border-border-hover"
                />
              </div>
            </div>

            {/* Pipeline template */}
            <div className="flex flex-col gap-1.5">
              <Label>Pipeline template</Label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="h-9 w-full rounded-input bg-surface-elevated border border-border px-3 text-sm text-text-primary transition-colors duration-150 focus:outline-none focus:border-border-hover"
              >
                <option value="">No template — build from scratch</option>
                {MOCK_PIPELINE_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.stages.join(" → ")})</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <Label>Notes</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes about this application…"
                rows={2}
                className="w-full rounded-card bg-surface-elevated border border-border px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 focus:outline-none focus:border-border-hover resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Add application
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
