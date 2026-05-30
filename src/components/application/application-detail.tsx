"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Cancel01Icon,
  ArrowUpRight01Icon,
  UserIcon,
  Mail01Icon,
  Call02Icon,
  Linkedin01Icon,
  FileAttachmentIcon,
  Clock01Icon,
  Briefcase01Icon,
  Tag01Icon,
  Home01Icon,
  Loading03Icon,
  Link01Icon,
  Calendar03Icon,
  Coins01Icon,
  Location01Icon,
  Delete02Icon,
  Edit02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge, WorkModeBadge } from "@/components/ui/badge";
import { EditableCell } from "./editable-cell";
import { OptionPicker } from "./option-picker";
import { tagBadgeClass } from "@/lib/tag-colors";
import { PipelineBuilder } from "./pipeline-builder";
import { useJobTypes, useSources, addJobType, addSource } from "@/hooks/use-presets";
import { STATUS_LABELS, STATUS_BG, WORK_MODE_LABELS, WORK_MODE_COLORS } from "@/lib/constants";
import type { Application, ApplicationStatus, WorkMode } from "@/types";
import { cn } from "@/lib/utils";

interface ApplicationDetailProps {
  application: Application;
  initialTab?: string;
  onUpdate?: (patch: Partial<Application>) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const STATUS_OPTIONS = (Object.keys(STATUS_LABELS) as ApplicationStatus[]).map((s) => ({
  value: s, label: STATUS_LABELS[s], className: STATUS_BG[s],
}));
const WORKMODE_OPTIONS = (Object.keys(WORK_MODE_LABELS) as WorkMode[]).map((m) => ({
  value: m, label: WORK_MODE_LABELS[m], className: WORK_MODE_COLORS[m],
}));

function formatSalary(app: Application): string {
  if (!app.salaryMin && !app.salaryMax) return "";
  const fmt = (n: number) => (app.currency === "LKR" ? `${(n / 1000).toFixed(0)}k` : n.toLocaleString());
  if (app.salaryMin && app.salaryMax && app.salaryMin !== app.salaryMax)
    return `${fmt(app.salaryMin)}–${fmt(app.salaryMax)} ${app.currency}`;
  return `${fmt(app.salaryMin ?? app.salaryMax ?? 0)} ${app.currency}`;
}

function PropertyRow({ icon, label, children }: { icon: typeof UserIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 min-h-8">
      <div className="flex items-center gap-2 w-32 shrink-0 text-text-muted text-xs pt-1.5">
        <HugeiconsIcon icon={icon} size={14} strokeWidth={1.5} />
        {label}
      </div>
      <div className="flex-1 min-w-0 text-sm py-1">{children}</div>
    </div>
  );
}

export function ApplicationDetail({ application: app, initialTab = "pipeline", onUpdate, onDelete, onClose }: ApplicationDetailProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [editingLinks, setEditingLinks] = useState(false);
  const { jobTypes, mutate: mutateTypes } = useJobTypes();
  const { sources, mutate: mutateSources } = useSources();
  const typeOptions = jobTypes.map((n) => ({ value: n, label: n, className: tagBadgeClass(n) }));
  const sourceOptions = sources.map((n) => ({ value: n, label: n, className: tagBadgeClass(n) }));
  const update = (patch: Partial<Application>) => onUpdate?.(patch);

  async function selectType(value: string) {
    update({ jobType: value });
    if (value && !jobTypes.includes(value)) { await addJobType(value); mutateTypes(); }
  }
  async function selectSource(value: string) {
    update({ appliedVia: value });
    if (value && !sources.includes(value)) { await addSource(value); mutateSources(); }
  }

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:max-w-[48rem] bg-surface border-l border-border p-0 flex flex-col gap-0 overflow-hidden"
      >
        {/* Header — editable title */}
        <SheetHeader className="px-6 pt-5 pb-3 border-b border-border shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <SheetTitle
                render={
                  <div
                    className="text-lg font-semibold text-text-primary leading-tight -ml-2"
                    style={{ fontFamily: "var(--font-family-display)" }}
                  />
                }
              >
                <EditableCell
                  value={app.companyName}
                  placeholder="Company name"
                  onCommit={(v) => update({ companyName: v })}
                />
              </SheetTitle>
              {/* Links — view mode */}
              {!editingLinks && (
                <div className="flex items-center gap-3 mt-1">
                  {app.companyUrl && (
                    <a
                      href={app.companyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-accent transition-colors duration-150"
                    >
                      Visit site <HugeiconsIcon icon={ArrowUpRight01Icon} size={11} strokeWidth={1.5} />
                    </a>
                  )}
                  {app.jobPostUrl && (
                    <a
                      href={app.jobPostUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-accent transition-colors duration-150"
                    >
                      <HugeiconsIcon icon={Link01Icon} size={11} strokeWidth={1.5} /> Job post
                    </a>
                  )}
                  {!app.companyUrl && !app.jobPostUrl && (
                    <button
                      onClick={() => setEditingLinks(true)}
                      className="text-xs text-text-muted hover:text-accent transition-colors duration-150"
                    >
                      + Add links
                    </button>
                  )}
                </div>
              )}

              {/* Links — edit mode */}
              {editingLinks && (
                <div className="flex flex-col gap-2 mt-2">
                  <input
                    value={app.companyUrl ?? ""}
                    onChange={(e) => update({ companyUrl: e.target.value || null })}
                    placeholder="Company URL — https://company.com"
                    className="h-8 w-full rounded-input bg-surface-elevated border border-border px-2.5 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-border-hover"
                  />
                  <input
                    value={app.jobPostUrl ?? ""}
                    onChange={(e) => update({ jobPostUrl: e.target.value || null })}
                    placeholder="Job posting link — https://jobs.company.com/…"
                    className="h-8 w-full rounded-input bg-surface-elevated border border-border px-2.5 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-border-hover"
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0 mt-1">
              <button
                onClick={() => setEditingLinks((v) => !v)}
                title={editingLinks ? "Done editing links" : "Edit links"}
                className={cn(
                  "transition-colors duration-150 rounded-md p-1.5 hover:bg-surface-hover",
                  editingLinks ? "text-accent bg-surface-hover" : "text-text-muted hover:text-text-primary"
                )}
              >
                <HugeiconsIcon icon={Edit02Icon} size={17} strokeWidth={1.5} />
              </button>
              {onDelete && (
                <button
                  onClick={onDelete}
                  title="Delete application"
                  className="text-text-muted hover:text-[var(--status-rejected-fg)] transition-colors duration-150 rounded-md p-1.5 hover:bg-surface-hover"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={17} strokeWidth={1.5} />
                </button>
              )}
              <button onClick={onClose} title="Close" className="text-text-muted hover:text-text-primary transition-colors duration-150 rounded-md p-1.5 hover:bg-surface-hover">
                <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </SheetHeader>

        {/* Editable properties (Notion-style peek) */}
        <div className="px-6 py-4 border-b border-border shrink-0 flex flex-col gap-0.5">
          <PropertyRow icon={Briefcase01Icon} label="Position">
            <EditableCell value={app.position} placeholder="Add position" onCommit={(v) => update({ position: v })} />
          </PropertyRow>

          <PropertyRow icon={Loading03Icon} label="Status">
            <OptionPicker value={app.status} options={STATUS_OPTIONS} onSelect={(v) => update({ status: v as ApplicationStatus })}>
              <StatusBadge status={app.status} />
            </OptionPicker>
          </PropertyRow>

          <PropertyRow icon={Tag01Icon} label="Type">
            <OptionPicker value={app.jobType} options={typeOptions} allowCreate onSelect={selectType}>
              {app.jobType ? (
                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", tagBadgeClass(app.jobType))}>{app.jobType}</span>
              ) : <span className="text-text-muted">Add type</span>}
            </OptionPicker>
          </PropertyRow>

          <PropertyRow icon={Home01Icon} label="Work mode">
            <OptionPicker value={app.workMode} options={WORKMODE_OPTIONS} onSelect={(v) => update({ workMode: v as WorkMode })}>
              <WorkModeBadge mode={app.workMode} />
            </OptionPicker>
          </PropertyRow>

          <PropertyRow icon={Link01Icon} label="Applied via">
            <OptionPicker value={app.appliedVia} options={sourceOptions} allowCreate onSelect={selectSource}>
              {app.appliedVia ? <span className="text-text-secondary">{app.appliedVia}</span> : <span className="text-text-muted">Add source</span>}
            </OptionPicker>
          </PropertyRow>

          <PropertyRow icon={Coins01Icon} label="Salary">
            <EditableCell
              value={app.salaryMax != null ? String(app.salaryMax) : ""}
              type="number"
              placeholder="Add salary"
              display={formatSalary(app) ? <span className="text-text-secondary">{formatSalary(app)}</span> : undefined}
              onCommit={(v) => { const n = v ? Number(v) : null; update({ salaryMax: n, salaryMin: app.salaryMin ?? n }); }}
            />
          </PropertyRow>

          <PropertyRow icon={Calendar03Icon} label="Applied date">
            <EditableCell
              value={app.appliedDate ?? ""}
              type="date"
              placeholder="Set date"
              display={app.appliedDate ? <span className="text-text-secondary">{format(new Date(app.appliedDate), "MMM d, yyyy")}</span> : undefined}
              onCommit={(v) => update({ appliedDate: v || null })}
            />
          </PropertyRow>

          <PropertyRow icon={Location01Icon} label="Location">
            <EditableCell value={app.location ?? ""} placeholder="Add location" onCommit={(v) => update({ location: v || null })} />
          </PropertyRow>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
          <TabsList className="shrink-0 px-6 pt-0 pb-0 h-auto bg-transparent border-b border-border rounded-none justify-start gap-0">
            {["pipeline", "contacts", "documents", "activity"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className={cn(
                  "px-4 py-3 text-xs font-medium capitalize rounded-none border-b-2 -mb-px transition-colors duration-150 bg-transparent",
                  "data-[state=active]:border-accent data-[state=active]:text-text-primary data-[state=active]:bg-transparent",
                  "data-[state=inactive]:border-transparent data-[state=inactive]:text-text-muted hover:text-text-secondary"
                )}
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="pipeline" className="flex-1 overflow-y-auto p-6 mt-0">
            <PipelineBuilder application={app} />
          </TabsContent>

          <TabsContent value="contacts" className="flex-1 overflow-y-auto p-6 mt-0">
            {app.contacts.length === 0 ? (
              <EmptyState message="No contacts yet" hint="Add the recruiter or hiring manager to keep track of who you're talking to." />
            ) : (
              <div className="flex flex-col gap-3">
                {app.contacts.map((c) => (
                  <div key={c.id} className="bg-surface-elevated border border-border rounded-card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{c.name}</p>
                        <p className="text-xs text-text-muted mt-0.5">{c.role}{c.stageName ? ` · ${c.stageName}` : ""}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-accent-soft flex items-center justify-center shrink-0">
                        <HugeiconsIcon icon={UserIcon} size={14} className="text-accent-soft-fg" strokeWidth={1.5} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent transition-colors">
                          <HugeiconsIcon icon={Mail01Icon} size={12} strokeWidth={1.5} />{c.email}
                        </a>
                      )}
                      {c.phone && (
                        <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent transition-colors">
                          <HugeiconsIcon icon={Call02Icon} size={12} strokeWidth={1.5} />{c.phone}
                        </a>
                      )}
                      {c.linkedinUrl && (
                        <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent transition-colors">
                          <HugeiconsIcon icon={Linkedin01Icon} size={12} strokeWidth={1.5} />LinkedIn
                        </a>
                      )}
                    </div>
                    {c.notes && <p className="text-xs text-text-muted mt-2 border-t border-border pt-2">{c.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="flex-1 overflow-y-auto p-6 mt-0">
            {app.documents.length === 0 ? (
              <EmptyState message="No documents yet" hint="Link the CV or cover letter you sent to this company." />
            ) : (
              <div className="flex flex-col gap-2">
                {app.documents.map((d) => (
                  <a key={d.id} href={d.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-surface-elevated border border-border rounded-card p-3 hover:border-accent transition-colors duration-150">
                    <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center shrink-0">
                      <HugeiconsIcon icon={FileAttachmentIcon} size={14} className="text-accent-soft-fg" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{d.name}</p>
                      <p className="text-xs text-text-muted capitalize">{d.type.replace("-", " ")}</p>
                    </div>
                    <HugeiconsIcon icon={ArrowUpRight01Icon} size={13} className="text-text-muted ml-auto shrink-0" strokeWidth={1.5} />
                  </a>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="flex-1 overflow-y-auto p-6 mt-0">
            {app.activityLog.length === 0 ? (
              <EmptyState message="No activity yet" hint="Activity is recorded automatically as you update this application." />
            ) : (
              <div className="flex flex-col gap-0">
                {[...app.activityLog].reverse().map((entry, i) => (
                  <div key={entry.id} className="flex gap-3 relative">
                    {i < app.activityLog.length - 1 && <div className="absolute left-[14px] top-6 bottom-0 w-px bg-border" />}
                    <div className="w-7 h-7 rounded-full bg-surface-elevated border border-border flex items-center justify-center shrink-0 mt-0.5 z-10">
                      <HugeiconsIcon icon={Clock01Icon} size={12} className="text-text-muted" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-xs text-text-secondary">{entry.description}</p>
                      <p className="text-[11px] text-text-muted mt-0.5">{format(new Date(entry.createdAt), "MMM d, yyyy · h:mm a")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function EmptyState({ message, hint }: { message: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-40 text-center gap-2">
      <p className="text-sm font-medium text-text-primary">{message}</p>
      <p className="text-xs text-text-muted max-w-xs">{hint}</p>
    </div>
  );
}
