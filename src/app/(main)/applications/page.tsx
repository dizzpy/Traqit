"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { formatDistanceToNow, differenceInHours } from "date-fns";
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
  Search01Icon,
  Delete02Icon,
  DragDropVerticalIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

interface RowProps {
  app: Application;
  selected: boolean;
  typeOptions: { value: string; label: string; className?: string }[];
  sourceOptions: { value: string; label: string; className?: string }[];
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onPreview: (id: string, tab?: string) => void;
  onUpdate: (id: string, patch: Partial<Application>) => void;
}

function ApplicationRow({
  app,
  selected,
  typeOptions,
  sourceOptions,
  onToggleSelect,
  onDelete,
  onPreview,
  onUpdate,
}: RowProps) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id });

  const upcoming = hasUpcomingInterview(app);
  const ghosted = app.status === "GHOSTED";

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group/row border-b border-border transition-colors duration-150 relative",
        ghosted ? "opacity-60" : "hover:bg-surface-hover/40",
        isDragging && "z-20 bg-surface-elevated shadow-lg opacity-90"
      )}
    >
      {/* Row controls — accent bar + drag handle + checkbox.
          The accent bar lives INSIDE this cell (as an absolute span) so it
          doesn't add an extra <td> column and shift the whole row. */}
      <td className="relative pl-3 pr-1 w-[54px] whitespace-nowrap">
        {upcoming && <span className="absolute left-0 top-0 h-full w-0.5 bg-accent" />}
        <div className="flex items-center gap-0.5">
          <button
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
            className="flex items-center justify-center w-4 text-text-muted hover:text-text-secondary cursor-grab active:cursor-grabbing opacity-0 group-hover/row:opacity-100 transition-opacity duration-150 touch-none"
          >
            <HugeiconsIcon icon={DragDropVerticalIcon} size={15} strokeWidth={1.5} />
          </button>
          <Checkbox
            checked={selected}
            onChange={() => onToggleSelect(app.id)}
            aria-label={`Select ${app.companyName}`}
            className={cn(
              "transition-opacity duration-150",
              selected ? "opacity-100" : "opacity-0 group-hover/row:opacity-100"
            )}
          />
        </div>
      </td>

      {/* Company — click name to preview */}
      <td className="px-4 py-1.5 whitespace-nowrap">
        <button
          onClick={() => onPreview(app.id)}
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
          onCommit={(v) => onUpdate(app.id, { position: v })}
        />
      </td>

      {/* Type */}
      <td className="px-4 py-1.5 whitespace-nowrap text-xs text-text-muted">
        <OptionPicker
          value={app.jobType}
          options={typeOptions}
          allowCreate
          onOptionsChange={setTypeOptions}
          onSelect={(v) => onUpdate(app.id, { jobType: v })}
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
          onSelect={(v) => onUpdate(app.id, { workMode: v as WorkMode })}
        >
          <WorkModeBadge mode={app.workMode} />
        </OptionPicker>
      </td>

      {/* Current stage — opens pipeline preview */}
      <td className="px-4 py-1.5 whitespace-nowrap">
        <button
          onClick={() => onPreview(app.id, "pipeline")}
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
          onSelect={(v) => onUpdate(app.id, { status: v as ApplicationStatus })}
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
          onSelect={(v) => onUpdate(app.id, { appliedVia: v })}
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
          onCommit={(v) => onUpdate(app.id, { appliedDate: v || null })}
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
            onUpdate(app.id, { salaryMax: n, salaryMin: app.salaryMin ?? n });
          }}
        />
      </td>

      {/* Location */}
      <td className="px-4 py-1.5 whitespace-nowrap text-xs text-text-muted">
        <EditableCell
          value={app.location ?? ""}
          placeholder="Add location"
          onCommit={(v) => onUpdate(app.id, { location: v || null })}
        />
      </td>

      {/* Delete */}
      <td className="pr-3 pl-1 w-[44px] whitespace-nowrap text-right">
        <button
          onClick={() => onDelete(app.id)}
          aria-label={`Delete ${app.companyName}`}
          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-text-muted hover:text-danger hover:bg-surface-hover opacity-0 group-hover/row:opacity-100 transition-all duration-150"
        >
          <HugeiconsIcon icon={Delete02Icon} size={15} strokeWidth={1.5} />
        </button>
      </td>
    </tr>
  );
}

function ApplicationsPageInner() {
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
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("appliedDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [manualOrder, setManualOrder] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // inline add-row state
  const [addingInline, setAddingInline] = useState(false);
  const [newCompany, setNewCompany] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

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
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((a) => a.companyName.toLowerCase().includes(q));
    if (manualOrder) return [...list]; // preserve manual (drag) order
    return [...list].sort((a, b) => {
      let av: string, bv: string;
      if (sortKey === "appliedDate") { av = a.appliedDate ?? a.createdAt; bv = b.appliedDate ?? b.createdAt; }
      else { av = String(a[sortKey] ?? ""); bv = String(b[sortKey] ?? ""); }
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [apps, filterStatus, query, sortKey, sortDir, manualOrder]);

  const visibleIds = filtered.map((a) => a.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someSelected = visibleIds.some((id) => selectedIds.has(id));

  function toggleSort(key?: SortKey) {
    if (!key) return;
    setManualOrder(false);
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setManualOrder(true);
    setApps((prev) => {
      const visible = filtered.map((a) => a.id);
      const oldIndex = visible.indexOf(String(active.id));
      const newIndex = visible.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return prev;
      const newVisible = arrayMove(visible, oldIndex, newIndex);
      const byId = new Map(prev.map((a) => [a.id, a]));
      const hidden = prev.filter((a) => !visible.includes(a.id));
      return [...newVisible.map((id) => byId.get(id)!), ...hidden];
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function deleteOne(id: string) {
    const name = apps.find((a) => a.id === id)?.companyName;
    setApps((prev) => prev.filter((a) => a.id !== id));
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    if (selectedId === id) setSelectedId(null);
    toast(`Deleted ${name || "application"}`);
  }

  function deleteSelected() {
    const count = selectedIds.size;
    setApps((prev) => prev.filter((a) => !selectedIds.has(a.id)));
    if (selectedId && selectedIds.has(selectedId)) setSelectedId(null);
    setSelectedIds(new Set());
    toast(`Deleted ${count} application${count > 1 ? "s" : ""}`);
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

      {/* Search + filters + view chips */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0 gap-4">
        <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
          {/* Search by company */}
          <div className="relative shrink-0">
            <HugeiconsIcon
              icon={Search01Icon}
              size={14}
              strokeWidth={1.5}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search company…"
              className="h-8 w-56 rounded-input bg-surface-elevated border border-border pl-8 pr-7 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 focus:outline-none focus:border-border-hover"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors duration-150"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={13} strokeWidth={1.5} />
              </button>
            )}
          </div>

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
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Selection cluster — same level as the search bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 pr-3 border-r border-border">
              <span className="text-xs font-medium text-text-secondary whitespace-nowrap">
                {selectedIds.size} selected
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-text-muted hover:text-text-primary transition-colors duration-150"
              >
                Clear
              </button>
              <Button variant="danger" size="sm" onClick={deleteSelected}>
                <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={1.5} />
                Delete
              </Button>
            </div>
          )}

          <div className="flex items-center gap-1 bg-surface-elevated border border-border rounded-lg p-0.5">
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
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <table className="w-full text-left border-collapse" style={{ minWidth: 960 }}>
            <thead>
              <tr className="group/head border-b border-border bg-bg sticky top-0 z-10">
                {/* Select all */}
                <th className="pl-3 pr-1 w-[54px]">
                  <div className="flex items-center gap-0.5">
                    <span className="w-4 shrink-0" />
                    <Checkbox
                      checked={allSelected}
                      indeterminate={!allSelected && someSelected}
                      onChange={toggleSelectAll}
                      aria-label="Select all"
                      className={cn(
                        "transition-opacity duration-150",
                        allSelected || someSelected ? "opacity-100" : "opacity-0 group-hover/head:opacity-100"
                      )}
                    />
                  </div>
                </th>
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
                      {col.sortKey && !manualOrder && sortKey === col.sortKey && (
                        <span className="text-accent text-[10px]">{sortDir === "asc" ? "↑" : "↓"}</span>
                      )}
                    </span>
                  </th>
                ))}
                {/* Delete column */}
                <th className="pr-3 pl-1 w-[44px]" />
              </tr>
            </thead>
            <tbody>
              <SortableContext items={visibleIds} strategy={verticalListSortingStrategy}>
                {filtered.map((app) => (
                  <ApplicationRow
                    key={app.id}
                    app={app}
                    selected={selectedIds.has(app.id)}
                    typeOptions={typeOptions}
                    sourceOptions={sourceOptions}
                    onToggleSelect={toggleSelect}
                    onDelete={deleteOne}
                    onPreview={openPreview}
                    onUpdate={updateApp}
                  />
                ))}
              </SortableContext>

              {/* Notion-style inline add row */}
              <tr className="border-b border-border">
                <td />
                <td colSpan={COLUMNS.length + 1} className="px-4 py-1.5">
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
        </DndContext>

        {filtered.length === 0 && !addingInline && (
          <div className="flex flex-col items-center justify-center gap-3 text-center px-6 py-16">
            <p className="text-sm font-medium text-text-primary">
              {query ? "No matching companies" : "No applications here"}
            </p>
            <p className="text-xs text-text-muted">
              {query ? "Try a different search term" : "Add your first one to start tracking your journey"}
            </p>
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

export default function ApplicationsPage() {
  return (
    <Suspense fallback={null}>
      <ApplicationsPageInner />
    </Suspense>
  );
}
