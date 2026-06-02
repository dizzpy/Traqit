"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
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
  PreferenceHorizontalIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { StatusBadge, WorkModeBadge } from "@/components/ui/badge";
import { toast } from "sonner";
import { EditableCell } from "@/components/application/editable-cell";
import { OptionPicker } from "@/components/application/option-picker";
import { tagBadgeClass } from "@/lib/tag-colors";
import { ApplicationDetail } from "@/components/application/application-detail";
import dynamic from "next/dynamic";
// Board view is opt-in — defer its component code until the user switches to it.
const KanbanBoard = dynamic(
  () => import("@/components/board/kanban-board").then((m) => m.KanbanBoard),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center text-text-muted text-sm">Loading board…</div>
    ),
  }
);
import { AddApplicationPanel } from "@/components/application/add-application-modal";
import { SaveJobModal } from "@/components/application/save-job-modal";
import {
  useApplications,
  createApplication,
  updateApplication,
  deleteApplication,
} from "@/hooks/use-applications";
import { useJobTypes, useSources, addJobType, addSource } from "@/hooks/use-presets";
import {
  STATUS_LABELS,
  STATUS_BG,
  WORK_MODE_LABELS,
  WORK_MODE_COLORS,
} from "@/lib/constants";
import type { Application, ApplicationStatus, WorkMode } from "@/types";
import { cn, daysUntil } from "@/lib/utils";
import { consumePendingAction } from "@/lib/pending-action";
import { useShortcutHints } from "@/hooks/use-shortcut-hints";
import { Kbd } from "@/components/ui/kbd";
import { useProfile } from "@/hooks/use-profile";
import { AppTour } from "@/components/tour/app-tour";

type SortKey = "companyName" | "appliedDate" | "status" | "position";
type SortDir = "asc" | "desc";

const HIDDEN_COLS_KEY = "it-hidden-cols";

const FILTER_STATUSES: { value: ApplicationStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
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

interface RowProps {
  app: Application;
  selected: boolean;
  typeOptions: { value: string; label: string; className?: string }[];
  sourceOptions: { value: string; label: string; className?: string }[];
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onPreview: (id: string, tab?: string) => void;
  onUpdate: (id: string, patch: Partial<Application>) => void;
  onSelectType: (id: string, value: string) => void;
  onSelectSource: (id: string, value: string) => void;
  /** Column keys the user has hidden. */
  hidden: Set<string>;
  /** Profile's ghost threshold in days — used to flag silent applications. */
  ghostThreshold: number;
  /** First visible row — anchors the product tour's pipeline tip. */
  isFirst: boolean;
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
  onSelectType,
  onSelectSource,
  hidden,
  ghostThreshold,
  isFirst,
}: RowProps) {
  const show = (key: string) => !hidden.has(key);
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
  // Silent for longer than the profile's ghost threshold → flag it gently.
  const daysSinceApplied = app.appliedDate ? -(daysUntil(app.appliedDate) ?? 0) : 0;
  const atRisk =
    app.status === "APPLIED" && !app.firstResponseDate && daysSinceApplied >= ghostThreshold;

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group/row transition-colors duration-150 relative",
        // Inset row divider: only the content cells (not the control/delete
        // columns) carry the bottom border, so the line starts at Company and
        // ends at Location instead of spanning the whole screen.
        "[&>td:not(:first-child):not(:last-child)]:border-b [&>td:not(:first-child):not(:last-child)]:border-border",
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
      <td className="px-4 py-1.5 whitespace-nowrap max-w-[200px]">
        <button
          onClick={() => onPreview(app.id)}
          title={app.companyName}
          className="block max-w-full truncate text-left text-sm font-medium text-text-primary hover:text-accent transition-colors duration-150 rounded-md px-2 py-1 -mx-2 hover:bg-surface-hover"
        >
          {app.companyName}
        </button>
      </td>

      {/* Position */}
      {show("position") && (
        <td className="px-4 py-1.5 text-sm text-text-secondary max-w-[220px]">
          <EditableCell
            value={app.position}
            placeholder="Add position"
            onCommit={(v) => onUpdate(app.id, { position: v })}
          />
        </td>
      )}

      {/* Type */}
      {show("type") && (
        <td className="px-4 py-1.5 whitespace-nowrap text-xs text-text-muted">
          <OptionPicker
            value={app.jobType}
            options={typeOptions}
            allowCreate
            onSelect={(v) => onSelectType(app.id, v)}
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
      )}

      {/* Work mode */}
      {show("workMode") && (
        <td className="px-4 py-1.5 whitespace-nowrap">
          <OptionPicker
            value={app.workMode}
            options={WORKMODE_OPTIONS}
            onSelect={(v) => onUpdate(app.id, { workMode: v as WorkMode })}
          >
            <WorkModeBadge mode={app.workMode} />
          </OptionPicker>
        </td>
      )}

      {/* Current stage — opens pipeline preview */}
      {show("stage") && (
        <td
          className="px-4 py-1.5 whitespace-nowrap max-w-[160px]"
          {...(isFirst ? { "data-tour": "current-stage-cell" } : {})}
        >
          <button
            onClick={() => onPreview(app.id, "pipeline")}
            title={currentStageLabel(app)}
            className="block max-w-full truncate text-xs text-text-secondary bg-surface-elevated border border-border px-2 py-0.5 rounded-md hover:border-accent hover:text-accent transition-colors duration-150"
          >
            {currentStageLabel(app)}
          </button>
        </td>
      )}

      {/* Status */}
      {show("status") && (
        <td className="px-4 py-1.5 whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <OptionPicker
              value={app.status}
              options={STATUS_OPTIONS}
              onSelect={(v) => onUpdate(app.id, { status: v as ApplicationStatus })}
            >
              <StatusBadge status={app.status} />
            </OptionPicker>
            {atRisk && (
              <span
                title={`No reply in ${daysSinceApplied} days — possible ghosting`}
                className="text-[10px] text-[#f59e0b] bg-[#2d1f08] px-1.5 py-0.5 rounded-full whitespace-nowrap"
              >
                {daysSinceApplied}d silent
              </span>
            )}
          </div>
        </td>
      )}

      {/* Via */}
      {show("via") && (
        <td className="px-4 py-1.5 whitespace-nowrap text-xs text-text-muted max-w-[150px]">
          <OptionPicker
            value={app.appliedVia}
            options={sourceOptions}
            allowCreate
            onSelect={(v) => onSelectSource(app.id, v)}
          >
            {app.appliedVia ? (
              <span className="block max-w-[130px] truncate text-xs text-text-secondary" title={app.appliedVia}>{app.appliedVia}</span>
            ) : (
              <span className="text-text-muted">Add source</span>
            )}
          </OptionPicker>
        </td>
      )}

      {/* Applied date */}
      {show("applied") && (
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
      )}

      {/* Salary (edits max) */}
      {show("salary") && (
        <td className="px-4 py-1.5 whitespace-nowrap text-xs text-text-muted max-w-[130px]">
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
      )}

      {/* Location */}
      {show("location") && (
        <td className="px-4 py-1.5 whitespace-nowrap text-xs text-text-muted max-w-[150px]">
          <EditableCell
            value={app.location ?? ""}
            placeholder="Add location"
            onCommit={(v) => onUpdate(app.id, { location: v || null })}
          />
        </td>
      )}

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

  const { jobTypes, mutate: mutateTypes } = useJobTypes();
  const { sources, mutate: mutateSources } = useSources();
  const typeOptions = useMemo(
    () => jobTypes.map((n) => ({ value: n, label: n, className: tagBadgeClass(n) })),
    [jobTypes]
  );
  const sourceOptions = useMemo(
    () => sources.map((n) => ({ value: n, label: n, className: tagBadgeClass(n) })),
    [sources]
  );

  const { applications: apps, isLoading, mutate } = useApplications();
  const { profile } = useProfile();
  const ghostThreshold = profile?.ghostThresholdDays ?? 14;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("pipeline");
  const [showHints] = useShortcutHints();
  const [showAdd, setShowAdd] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("appliedDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  // Manual drag order is a view-only overlay of ids (no server "order" column).
  const [orderedIds, setOrderedIds] = useState<string[] | null>(null);
  const manualOrder = orderedIds !== null;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Per-user hidden columns (Company is the locked anchor), persisted locally.
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HIDDEN_COLS_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setHidden(new Set(JSON.parse(saved)));
    } catch { /* ignore */ }
  }, []);

  // "n" shortcut → open the New application panel (from here or after navigating in).
  useEffect(() => {
    const open = () => setShowAdd(true);
    window.addEventListener("app:new-application", open);
    if (consumePendingAction("new-application")) open();
    return () => window.removeEventListener("app:new-application", open);
  }, []);
  function toggleColumn(key: string) {
    if (key === "company") return; // Company is the locked anchor column
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      localStorage.setItem(HIDDEN_COLS_KEY, JSON.stringify([...next]));
      return next;
    });
  }
  const visibleColumns = COLUMNS.filter((c) => !hidden.has(c.key));

  // inline add-row state
  const [addingInline, setAddingInline] = useState(false);
  const [newCompany, setNewCompany] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const selectedApp = apps.find((a) => a.id === selectedId) ?? null;

  // Optimistically transform the cached applications list without revalidating.
  function patchCache(updater: (list: Application[]) => Application[]) {
    mutate(
      (cur) => (cur ? { ...cur, data: updater(cur.data) } : cur),
      { revalidate: false }
    );
  }

  async function updateApp(id: string, patch: Partial<Application>) {
    patchCache((list) => list.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    try {
      await updateApplication(id, patch as Record<string, unknown>);
    } catch {
      toast.error("Couldn't save changes");
      mutate(); // revalidate → rolls back to server truth
    }
  }

  // Persist the app field AND save the value as a reusable preset if it's new.
  async function selectType(id: string, value: string) {
    updateApp(id, { jobType: value });
    if (value && !jobTypes.includes(value)) { await addJobType(value); mutateTypes(); }
  }
  async function selectSource(id: string, value: string) {
    updateApp(id, { appliedVia: value });
    if (value && !sources.includes(value)) { await addSource(value); mutateSources(); }
  }

  async function commitInlineAdd() {
    const name = newCompany.trim();
    if (!name) { setAddingInline(false); return; }
    setNewCompany("");
    setAddingInline(false);

    const now = new Date().toISOString();
    const temp: Application = {
      id: `temp-${now}`, profileId: "",
      companyName: name, companyUrl: null,
      position: "", jobPostUrl: null,
      jobType: "", workMode: "no-data", appliedVia: "",
      salaryMin: null, salaryMax: null, currency: "LKR", location: null,
      status: "APPLIED", appliedDate: now.split("T")[0], firstResponseDate: null,
      deadline: null, notes: null,
      stages: [], contacts: [], documents: [], activityLog: [],
      createdAt: now, updatedAt: now,
    };
    patchCache((list) => [...list, temp]); // optimistic row
    try {
      await createApplication({ companyName: name, status: "APPLIED", appliedDate: temp.appliedDate });
    } catch {
      toast.error("Couldn't add application");
    } finally {
      mutate(); // replace temp with the real record
    }
  }

  const filtered = useMemo(() => {
    // Saved postings live on their own /saved page — keep them out of Applications.
    let list = apps.filter((a) => a.status !== "SAVED");
    if (filterStatus !== "ALL") list = list.filter((a) => a.status === filterStatus);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((a) => a.companyName.toLowerCase().includes(q));
    if (orderedIds) {
      // Manual (drag) order overlay — sort by the saved id sequence.
      const rank = new Map(orderedIds.map((id, i) => [id, i]));
      return [...list].sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
    }
    return [...list].sort((a, b) => {
      let av: string, bv: string;
      if (sortKey === "appliedDate") { av = a.appliedDate ?? a.createdAt; bv = b.appliedDate ?? b.createdAt; }
      else { av = String(a[sortKey] ?? ""); bv = String(b[sortKey] ?? ""); }
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [apps, filterStatus, query, sortKey, sortDir, orderedIds]);

  const visibleIds = filtered.map((a) => a.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someSelected = visibleIds.some((id) => selectedIds.has(id));

  function toggleSort(key?: SortKey) {
    if (!key) return;
    setOrderedIds(null); // leaving manual order
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    // Reorder is a local view convenience (no server order column): persist the
    // new full id sequence as the manual-order overlay.
    const visible = filtered.map((a) => a.id);
    const oldIndex = visible.indexOf(String(active.id));
    const newIndex = visible.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const reorderedVisible = arrayMove(visible, oldIndex, newIndex);
    const hidden = apps.map((a) => a.id).filter((id) => !visible.includes(id));
    setOrderedIds([...reorderedVisible, ...hidden]);
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

  async function deleteOne(id: string) {
    const name = apps.find((a) => a.id === id)?.companyName;
    patchCache((list) => list.filter((a) => a.id !== id));
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    if (selectedId === id) setSelectedId(null);
    try {
      await deleteApplication(id);
      toast(`Deleted ${name || "application"}`);
    } catch {
      toast.error("Couldn't delete");
      mutate();
    }
  }

  async function deleteSelected() {
    const ids = [...selectedIds];
    const count = ids.length;
    patchCache((list) => list.filter((a) => !selectedIds.has(a.id)));
    if (selectedId && selectedIds.has(selectedId)) setSelectedId(null);
    setSelectedIds(new Set());
    try {
      await Promise.all(ids.map((id) => deleteApplication(id)));
      toast(`Deleted ${count} application${count > 1 ? "s" : ""}`);
    } catch {
      toast.error("Couldn't delete some applications");
      mutate();
    }
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
          <Button variant="outline" size="sm" data-tour="save-job-btn" onClick={() => setShowSave(true)}>
            <HugeiconsIcon icon={BookmarkIcon} size={14} strokeWidth={1.5} />
            Save job
            {showHints && <Kbd className="ml-1">b</Kbd>}
          </Button>
          <Button
            size="sm"
            onClick={() => setShowAdd(true)}
            className="h-9 px-4 text-sm font-semibold shadow-sm shadow-accent/25 hover:shadow-accent/30"
          >
            <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} />
            Add application
            {showHints && <Kbd className="ml-1 border-white/25 bg-white/10 text-white/90">n</Kbd>}
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
              data-search="true"
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
            {!query && showHints && (
              <Kbd className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none">/</Kbd>
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

          {/* Column visibility */}
          {view !== "board" && (
            <Popover>
              <PopoverTrigger
                render={
                  <button className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border bg-surface-elevated text-xs font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors duration-150 outline-none">
                    <HugeiconsIcon icon={PreferenceHorizontalIcon} size={14} strokeWidth={1.5} />
                    Columns
                  </button>
                }
              />
              <PopoverContent align="end" className="w-52 p-1.5">
                <p className="px-2 py-1 text-[11px] text-text-muted">Show columns</p>
                {COLUMNS.map((col) => {
                  const locked = col.key === "company";
                  const visible = locked || !hidden.has(col.key);
                  return (
                    <div
                      key={col.key}
                      onClick={() => toggleColumn(col.key)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors duration-150",
                        locked ? "opacity-60 cursor-default" : "hover:bg-surface-hover cursor-pointer"
                      )}
                    >
                      <Checkbox checked={visible} onChange={() => toggleColumn(col.key)} aria-label={col.label} />
                      <HugeiconsIcon icon={col.icon} size={13} className="text-text-muted shrink-0" strokeWidth={1.5} />
                      <span className="text-xs text-text-secondary flex-1">{col.label}</span>
                      {locked && <span className="text-[10px] text-text-muted">locked</span>}
                    </div>
                  );
                })}
              </PopoverContent>
            </Popover>
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
              data-tour="board-view-chip"
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

      {/* List / Board */}
      <div className="flex-1 overflow-auto">
        {view === "board" ? (
          <KanbanBoard applications={filtered} onCardClick={(a) => openPreview(a.id)} />
        ) : (
        <>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <table className="w-full text-left border-collapse" style={{ minWidth: 960 }}>
            <thead>
              <tr className="group/head bg-bg sticky top-0 z-10 [&>th:not(:first-child):not(:last-child)]:border-b [&>th:not(:first-child):not(:last-child)]:border-border">
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
                {visibleColumns.map((col) => (
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
                {filtered.map((app, index) => (
                  <ApplicationRow
                    key={app.id}
                    app={app}
                    isFirst={index === 0}
                    selected={selectedIds.has(app.id)}
                    typeOptions={typeOptions}
                    sourceOptions={sourceOptions}
                    onToggleSelect={toggleSelect}
                    onDelete={deleteOne}
                    onPreview={openPreview}
                    onUpdate={updateApp}
                    onSelectType={selectType}
                    onSelectSource={selectSource}
                    hidden={hidden}
                    ghostThreshold={ghostThreshold}
                  />
                ))}
              </SortableContext>

              {/* Notion-style inline add row */}
              <tr>
                <td />
                <td colSpan={visibleColumns.length + 1} className="px-4 py-1.5">
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

        {isLoading && apps.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 text-center px-6 py-16">
            <span className="inline-block w-4 h-4 border-2 border-border border-t-accent rounded-full animate-spin" />
            <p className="text-xs text-text-muted">Loading your applications…</p>
          </div>
        )}

        {!isLoading && filtered.length === 0 && !addingInline && (
          <div className="flex flex-col items-center justify-center gap-3 text-center px-6 py-16">
            <p className="text-sm font-medium text-text-primary">
              {query ? "No matching companies" : "No applications here"}
            </p>
            <p className="text-xs text-text-muted">
              {query ? "Try a different search term" : "Add your first one to start tracking your journey"}
            </p>
          </div>
        )}
        </>
        )}
      </div>

      {/* Panels */}
      {selectedApp && (
        <ApplicationDetail
          application={selectedApp}
          initialTab={selectedTab}
          onUpdate={(patch) => updateApp(selectedApp.id, patch)}
          onDelete={() => deleteOne(selectedApp.id)}
          onClose={() => setSelectedId(null)}
        />
      )}
      {showAdd && <AddApplicationPanel onClose={() => setShowAdd(false)} onCreated={() => mutate()} />}
      {showSave && <SaveJobModal onClose={() => setShowSave(false)} onCreated={() => mutate()} />}

      {/* One-time product tour — renders null, fires on first visit with apps */}
      <AppTour />
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
