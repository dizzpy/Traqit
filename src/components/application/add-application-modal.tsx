"use client";

import { useState } from "react";
import { Cancel01Icon, Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PillToggle } from "@/components/ui/pill-toggle";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { CURRENCIES, DEFAULT_JOB_TYPES, DEFAULT_SOURCES } from "@/lib/constants";
import { createApplication, updateApplication } from "@/hooks/use-applications";
import { useTemplates } from "@/hooks/use-presets";
import type { Application, WorkMode } from "@/types";
import { cn } from "@/lib/utils";

interface AddApplicationPanelProps {
  onClose: () => void;
  /** Called after a successful create/promote so the list can revalidate. */
  onCreated: () => void;
  /** When set, the panel promotes this saved job to APPLIED (updates it) instead of creating a new one. */
  promote?: Application;
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

export function AddApplicationPanel({ onClose, onCreated, promote }: AddApplicationPanelProps) {
  const today = new Date().toISOString().split("T")[0];
  const isPromote = !!promote;
  const { templates } = useTemplates();
  const [submitting, setSubmitting] = useState(false);

  const [companyName, setCompanyName] = useState(promote?.companyName ?? "");
  const [position, setPosition] = useState(promote?.position ?? "");
  const [companyUrl, setCompanyUrl] = useState(promote?.companyUrl ?? "");
  const [jobPostUrl, setJobPostUrl] = useState(promote?.jobPostUrl ?? "");
  const [jobType, setJobType] = useState(promote?.jobType ?? "");
  const [workMode, setWorkMode] = useState<WorkMode>(promote?.workMode ?? "no-data");
  const [appliedVia, setAppliedVia] = useState(promote?.appliedVia ?? "");
  const [salaryMin, setSalaryMin] = useState(promote?.salaryMin != null ? String(promote.salaryMin) : "");
  const [salaryMax, setSalaryMax] = useState(promote?.salaryMax != null ? String(promote.salaryMax) : "");
  const [currency, setCurrency] = useState(promote?.currency ?? "LKR");
  const [location, setLocation] = useState(promote?.location ?? "");
  const [appliedDate, setAppliedDate] = useState(promote?.appliedDate ?? today);
  const [templateId, setTemplateId] = useState("");
  const [notes, setNotes] = useState(promote?.notes ?? "");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || submitting) return;
    setSubmitting(true);
    const fields = {
      companyName: companyName.trim(),
      position: position.trim(),
      companyUrl: companyUrl.trim() || null,
      jobPostUrl: jobPostUrl.trim() || null,
      jobType: jobType.trim(),
      workMode,
      appliedVia: appliedVia.trim(),
      salaryMin: salaryMin ? Number(salaryMin) : null,
      salaryMax: salaryMax ? Number(salaryMax) : null,
      currency,
      location: location.trim() || null,
      appliedDate: appliedDate || null,
      notes: notes.trim() || null,
    };
    try {
      if (promote) {
        // Promote the existing saved record → APPLIED (no duplicate, no stage seeding).
        await updateApplication(promote.id, { ...fields, status: "APPLIED" });
      } else {
        await createApplication({ ...fields, templateId: templateId || null });
      }
      onCreated();
      onClose();
    } catch {
      toast.error(promote ? "Couldn't mark as applied" : "Couldn't create application");
      setSubmitting(false);
    }
  }

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:max-w-none data-[side=right]:sm:max-w-[40rem] bg-surface border-l border-border p-0 flex flex-col gap-0 overflow-hidden"
      >
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center justify-between gap-4">
            <SheetTitle
              className="text-base font-semibold text-text-primary"
              style={{ fontFamily: "var(--font-family-display)" }}
            >
              {isPromote ? "Mark as applied" : "Add application"}
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

            {/* Salary range — single combined control */}
            <div className="flex flex-col gap-1.5">
              <Label>Salary range</Label>
              <div className="flex items-stretch rounded-input border border-border bg-surface-elevated overflow-hidden transition-colors duration-150 focus-within:border-border-hover">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="h-9 shrink-0 bg-surface-hover/40 border-r border-border pl-3 pr-2 text-sm font-medium text-text-secondary outline-none cursor-pointer"
                >
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                  type="number"
                  inputMode="numeric"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  placeholder="35,000"
                  className="h-9 w-full min-w-0 flex-1 bg-transparent px-3 text-sm text-text-primary placeholder:text-text-muted outline-none"
                />
                <span className="flex items-center px-1 text-text-muted select-none">–</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  placeholder="55,000"
                  className="h-9 w-full min-w-0 flex-1 bg-transparent px-3 text-sm text-text-primary placeholder:text-text-muted outline-none"
                />
                <span className="flex items-center pl-1 pr-3 text-xs text-text-muted select-none">/mo</span>
              </div>
              <p className="text-[11px] text-text-muted">Leave blank if undisclosed</p>
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
                <DatePicker value={appliedDate} onChange={setAppliedDate} />
              </div>
            </div>

            {/* Pipeline template — only when creating; promote keeps existing stages */}
            {!isPromote && (
              <div className="flex flex-col gap-1.5">
                <Label>Pipeline template</Label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="h-9 w-full rounded-input bg-surface-elevated border border-border px-3 text-sm text-text-primary transition-colors duration-150 focus:outline-none focus:border-border-hover"
                >
                  <option value="">No template — build from scratch</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({(t.stages as string[]).join(" → ")})</option>
                  ))}
                </select>
              </div>
            )}

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
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting} className="h-9 px-5 text-sm font-semibold shadow-sm shadow-accent/25">
              {submitting ? (
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} />
              )}
              {submitting ? (isPromote ? "Applying…" : "Adding…") : isPromote ? "Mark as applied" : "Add application"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
