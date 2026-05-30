"use client";

import { useState, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { formatDistanceToNow, differenceInHours } from "date-fns";
import {
  Add01Icon,
  BookmarkIcon,
  GridViewIcon,
  LeftToRightListBulletIcon,
  Building06Icon,
  Briefcase01Icon,
  Tag01Icon,
  Home01Icon,
  FlowSquareIcon,
  Loading03Icon,
  Link01Icon,
  Calendar03Icon,
  Coins01Icon,
  Location01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { StatusBadge, WorkModeBadge } from "@/components/ui/badge";
import { toast } from "sonner";
import { EditableCell } from "@/components/application/editable-cell";
import { OptionPicker } from "@/components/application/option-picker";
import { tagBadgeClass } from "@/lib/tag-colors";
import { ApplicationDetail } from "@/components/application/application-detail";
import { AddApplicationPanel } from "@/components/application/add-application-modal";
import { SaveJobModal } from "@/components/application/save-job-modal";
import { MOCK_APPLICATIONS } from "@/lib/mock-data";
import { useTypeOptions, setTypeOptions, useSourceOptions, setSourceOptions } from "@/lib/tag-options-store";
import {
  STATUS_LABELS,
  STATUS_BG,
  WORK_MODE_LABELS,
  WORK_MODE_COLORS,
} from "@/lib/constants";
import type { Application, ApplicationStatus, WorkMode } from "@/types";
import { cn } from "@/lib/utils";

type SortKey = "companyName" | "appliedDate" | "status" | "position";
type SortDir = "asc" | "desc";

const FILTER_STATUSES: { value: ApplicationStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "SAVED", label: "Saved" },
  { value: "APPLIED", label: "Applied" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "OFFER", label: "Offer" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "REJECTED", label: "Rejected" },
  { value: "GHOSTED", label: "Ghosted" },
];

const STATUS_OPTIONS = (Object.keys(STATUS_LABELS) as ApplicationStatus[]).map((s) => ({
  value: s,
  label: STATUS_LABELS[s],
  className: STATUS_BG[s],
}));
const WORKMODE_OPTIONS = (Object.keys(WORK_MODE_LABELS) as WorkMode[]).map((m) => ({
  value: m,
  label: WORK_MODE_LABELS[m],
  className: WORK_MODE_COLORS[m],
}));

const COLUMNS: { key: string; label: string; icon: typeof Add01Icon; sortKey?: SortKey }[] = [
  { key: "company", label: "Company", icon: Building06Icon, sortKey: "companyName" },
  { key: "position", label: "Position", icon: Briefcase01Icon, sortKey: "position" },
  { key: "type", label: "Type", icon: Tag01Icon },
  { key: "workMode", label: "Work mode", icon: Home01Icon },
  { key: "stage", label: "Current stage", icon: FlowSquareIcon },
  { key: "status", label: "Status", icon: Loading03Icon, sortKey: "status" },
  { key: "via", label: "Via", icon: Link01Icon },
  { key: "applied", label: "Applied", icon: Calendar03Icon, sortKey: "appliedDate" },
  { key: "salary", label: "Salary", icon: Coins01Icon },
  { key: "location", label: "Location", icon: Location01Icon },
];

function hasUpcomingInterview(app: Application): boolean {
  const now = new Date();
  return app.stages.some((s) => {
    if (!s.scheduledDate || s.status === "COMPLETED" || s.status === "PASSED" || s.status === "FAILED") return false;
    const hrs = differenceInHours(new Date(s.scheduledDate), now);
    return hrs >= 0 && hrs <= 48;
  });
}

function currentStageLabel(app: Application): string {
  if (!app.stages.length) return "—";
  const active = app.stages.filter((s) => s.status === "UPCOMING").sort((a, b) => a.order - b.order)[0];
  return active?.name ?? app.stages[app.stages.length - 1]?.name ?? "—";
}

function relativeLabel(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

function formatSalary(app: Application): string {
  if (!app.salaryMin && !app.salaryMax) return "";
  const fmt = (n: number) => (app.currency === "LKR" ? `${(n / 1000).toFixed(0)}k` : n.toLocaleString());
  if (app.salaryMin && app.salaryMax && app.salaryMin !== app.salaryMax)
    return `${fmt(app.salaryMin)}–${fmt(app.salaryMax)} ${app.currency}`;
  return `${fmt(app.salaryMin ?? app.salaryMax ?? 0)} ${app.currency}`;
}

let mockSeq = 100;

export default function ApplicationsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "list";

  const typeOptions = useTypeOptions();
  const sourceOptions = useSourceOptions();

  const [apps, setApps] = useState<Application[]>(MOCK_APPLICATIONS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("pipeline");
  const [showAdd, setShowAdd] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | "ALL">("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("appliedDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // inline add-row state
  const [addingInline, setAddingInline] = useState(false);
  const [newCompany, setNewCompany] = useState("");

  const selectedApp = apps.find((a) => a.id === selectedId) ?? null;

  function updateApp(id: string, patch: Partial<Application>) {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  function commitInlineAdd() {
    const name = newCompany.trim();
    if (!name) { setAddingInline(false); return; }
    const id = `app-new-${mockSeq++}`;
    const now = new Date().toISOString();
    const fresh: Application = {
      id, profileId: "mock-profile-001",
      companyName: name, companyUrl: null,
      position: "", jobPostUrl: null,
      jobType: "", workMode: "no-data", appliedVia: "",
      salaryMin: null, salaryMax: null, currency: "LKR", location: null,
      status: "APPLIED", appliedDate: now.split("T")[0], firstResponseDate: null,
      deadline: null, notes: null,
      stages: [], contacts: [], documents: [], activityLog: [],
      createdAt: now, updatedAt: now,
    };
    setApps((prev) => [...prev, fresh]);
    setNewCompany("");
    setAddingInline(false);
  }

  const filtered = useMemo(() => {
    let list = apps;
    if (filterStatus !== "ALL") list = list.filter((a) => a.status === filterStatus);
    return [...list].sort((a, b) => {
      let av: string, bv: string;
      if (sortKey === "appliedDate") { av = a.appliedDate ?? a.createdAt; bv = b.appliedDate ?? b.createdAt; }
      else { av = String(a[sortKey] ?? ""); bv = String(b[sortKey] ?? ""); }
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [apps, filterStatus, sortKey, sortDir]);

  function toggleSort(key?: SortKey) {
    if (!key) return;
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  function setView(v: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", v);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function openPreview(id: string, tab = "pipeline") {
    setSelectedTab(tab);
    setSelectedId(id);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-text-primary" style={{ fontFamily: "var(--font-family-display)" }}>
            Applications
          </h1>
          <span className="text-xs text-text-muted bg-surface-elevated border border-border px-2 py-0.5 rounded-full">
            {filtered.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSave(true)}>
            <HugeiconsIcon icon={BookmarkIcon} size={14} strokeWidth={1.5} />
            Save job
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
            Add
          </Button>
        </div>
      </div>

      {/* View chips + filters */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0 gap-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTER_STATUSES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilterStatus(value)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors duration-150",
                filterStatus === value
                  ? "bg-accent text-white"
                  : "bg-surface-elevated text-text-secondary hover:bg-surface-hover hover:text-text-primary border border-border"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-surface-elevated border border-border rounded-lg p-0.5 shrink-0">
          <button
            onClick={() => setView("list")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-150",
              view === "list" ? "bg-surface text-text-primary" : "text-text-muted hover:text-text-secondary"
            )}
          >
            <HugeiconsIcon icon={LeftToRightListBulletIcon} size={13} strokeWidth={1.5} />
            List
          </button>
          <button
            onClick={() => setView("board")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-150",
              view === "board" ? "bg-surface text-text-primary" : "text-text-muted hover:text-text-secondary"
            )}
          >
            <HugeiconsIcon icon={GridViewIcon} size={13} strokeWidth={1.5} />
            Board
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse" style={{ minWidth: 960 }}>
          <thead>
            <tr className="border-b border-border bg-bg sticky top-0 z-10">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.sortKey)}
                  className={cn(
                    "px-4 py-2.5 text-xs font-medium text-text-muted whitespace-nowrap select-none",
                    col.sortKey && "cursor-pointer hover:text-text-secondary"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <HugeiconsIcon icon={col.icon} size={13} strokeWidth={1.5} className="text-text-muted" />
                    {col.label}
                    {col.sortKey && sortKey === col.sortKey && (
                      <span className="text-accent text-[10px]">{sortDir === "asc" ? "↑" : "↓"}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((app) => {
              const upcoming = hasUpcomingInterview(app);
              const ghosted = app.status === "GHOSTED";
              return (
                <tr
                  key={app.id}
                  className={cn(
                    "border-b border-border transition-colors duration-150 relative",
                    ghosted ? "opacity-60" : "hover:bg-surface-hover/40"
                  )}
                >
                  {upcoming && <td className="absolute left-0 top-0 h-full w-0.5 bg-accent" />}

                  {/* Company — click name to preview */}
                  <td className="px-4 py-1.5 whitespace-nowrap">
                    <button
                      onClick={() => openPreview(app.id)}
                      className="text-sm font-medium text-text-primary hover:text-accent transition-colors duration-150 rounded-md px-2 py-1 -mx-2 hover:bg-surface-hover"
                    >
                      {app.companyName}
                    </button>
                  </td>

                  {/* Position */}
                  <td className="px-4 py-1.5 text-sm text-text-secondary max-w-[220px]">
                    <EditableCell
                      value={app.position}
                      placeholder="Add position"
                      onCommit={(v) => updateApp(app.id, { position: v })}
                    />
                  </td>

                  {/* Type */}
                  <td className="px-4 py-1.5 whitespace-nowrap text-xs text-text-muted">
                    <OptionPicker
                      value={app.jobType}
                      options={typeOptions}
                      allowCreate
                      onOptionsChange={setTypeOptions}
                      onSelect={(v) => updateApp(app.id, { jobType: v })}
                    >
                      {app.jobType ? (
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", tagBadgeClass(app.jobType))}>
                          {app.jobType}
                        </span>
                      ) : (
                        <span className="text-text-muted">Add type</span>
                      )}
                    </OptionPicker>
                  </td>

                  {/* Work mode */}
                  <td className="px-4 py-1.5 whitespace-nowrap">
                    <OptionPicker
                      value={app.workMode}
                      options={WORKMODE_OPTIONS}
                      onSelect={(v) => updateApp(app.id, { workMode: v as WorkMode })}
                    >
                      <WorkModeBadge mode={app.workMode} />
                    </OptionPicker>
                  </td>

                  {/* Current stage — opens pipeline preview */}
                  <td className="px-4 py-1.5 whitespace-nowrap">
                    <button
                      onClick={() => openPreview(app.id, "pipeline")}
                      className="text-xs text-text-secondary bg-surface-elevated border border-border px-2 py-0.5 rounded-md hover:border-accent hover:text-accent transition-colors duration-150"
                    >
                      {currentStageLabel(app)}
                    </button>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-1.5 whitespace-nowrap">
                    <OptionPicker
                      value={app.status}
                      options={STATUS_OPTIONS}
                      onSelect={(v) => updateApp(app.id, { status: v as ApplicationStatus })}
                    >
                      <StatusBadge status={app.status} />
                    </OptionPicker>
                  </td>

                  {/* Via */}
                  <td className="px-4 py-1.5 whitespace-nowrap text-xs text-text-muted">
                    <OptionPicker
                      value={app.appliedVia}
                      options={sourceOptions}
                      allowCreate
                      onOptionsChange={setSourceOptions}
                      onSelect={(v) => updateApp(app.id, { appliedVia: v })}
                    >
                      {app.appliedVia ? (
                        <span className="text-xs text-text-secondary">{app.appliedVia}</span>
                      ) : (
                        <span className="text-text-muted">Add source</span>
                      )}
                    </OptionPicker>
                  </td>

                  {/* Applied date */}
                  <td className="px-4 py-1.5 whitespace-nowrap">
                    <EditableCell
                      value={app.appliedDate ?? ""}
                      type="date"
                      placeholder="Set date"
                      display={
                        app.appliedDate ? (
                          <span className="text-xs text-text-muted" title={new Date(app.appliedDate).toLocaleDateString()}>
                            {relativeLabel(app.appliedDate)}
                          </span>
                        ) : undefined
                      }
                      onCommit={(v) => updateApp(app.id, { appliedDate: v || null })}
                    />
                  </td>

                  {/* Salary (edits max) */}
                  <td className="px-4 py-1.5 whitespace-nowrap text-xs text-text-muted">
                    <EditableCell
                      value={app.salaryMax != null ? String(app.salaryMax) : ""}
                      type="number"
                      placeholder="Add salary"
                      display={formatSalary(app) ? <span className="text-xs text-text-muted">{formatSalary(app)}</span> : undefined}
                      onCommit={(v) => {
                        const n = v ? Number(v) : null;
                        updateApp(app.id, { salaryMax: n, salaryMin: app.salaryMin ?? n });
                      }}
                    />
                  </td>

                  {/* Location */}
                  <td className="px-4 py-1.5 whitespace-nowrap text-xs text-text-muted">
                    <EditableCell
                      value={app.location ?? ""}
                      placeholder="Add location"
                      onCommit={(v) => updateApp(app.id, { location: v || null })}
                    />
                  </td>
                </tr>
              );
            })}

            {/* Notion-style inline add row */}
            <tr className="border-b border-border">
              <td colSpan={COLUMNS.length} className="px-4 py-1.5">
                {addingInline ? (
                  <input
                    autoFocus
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    onBlur={commitInlineAdd}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitInlineAdd();
                      if (e.key === "Escape") { setNewCompany(""); setAddingInline(false); }
                    }}
                    placeholder="Company name, then Enter…"
                    className="w-72 bg-surface-elevated border border-accent rounded-md px-2 py-1 text-sm text-text-primary focus:outline-none"
                  />
                ) : (
                  <button
                    onClick={() => setAddingInline(true)}
                    className="flex items-center gap-2 text-xs text-text-muted hover:text-accent transition-colors duration-150 px-2 py-1 -mx-2 rounded-md hover:bg-surface-hover"
                  >
                    <HugeiconsIcon icon={Add01Icon} size={13} strokeWidth={1.5} />
                    New application
                  </button>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {filtered.length === 0 && !addingInline && (
          <div className="flex flex-col items-center justify-center gap-3 text-center px-6 py-16">
            <p className="text-sm font-medium text-text-primary">No applications here</p>
            <p className="text-xs text-text-muted">Add your first one to start tracking your journey</p>
          </div>
        )}
      </div>

      {/* Panels */}
      {selectedApp && (
        <ApplicationDetail
          application={selectedApp}
          initialTab={selectedTab}
          onUpdate={(patch) => updateApp(selectedApp.id, patch)}
          onDelete={() => {
            const name = selectedApp.companyName;
            setApps((prev) => prev.filter((a) => a.id !== selectedApp.id));
            setSelectedId(null);
            toast(`Deleted ${name || "application"}`);
          }}
          onClose={() => setSelectedId(null)}
        />
      )}
      {showAdd && <AddApplicationPanel onClose={() => setShowAdd(false)} />}
      {showSave && <SaveJobModal onClose={() => setShowSave(false)} />}
    </div>
  );
}
