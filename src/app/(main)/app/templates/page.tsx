"use client";

import { useRef, useState } from "react";
import {
  Edit02Icon,
  Delete02Icon,
  Mail01Icon,
  Mailbox01Icon,
  DragDropVerticalIcon,
  Search01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";
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

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmailPreview } from "@/components/application/email-preview";
import {
  useEmailTemplates,
  useProfileName,
  saveEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  restoreEmailTemplates,
  reorderEmailTemplates,
} from "@/hooks/use-email-templates";
import { toastUndo, tempId } from "@/lib/optimistic";
import { useComposeApplications, type ComposeApplication } from "@/hooks/use-applications";
import {
  EMAIL_PLACEHOLDERS,
  EMAIL_TEMPLATE_CATEGORIES,
  buildGmailDraftUrl,
  placeholderValuesFromApp,
  substitutePlaceholders,
  type PlaceholderValues,
} from "@/lib/email";
import { tagBadgeClass } from "@/lib/tag-colors";
import { cn } from "@/lib/utils";
import type { EmailTemplate } from "@/types";

function insertAtCursor(
  el: HTMLInputElement | HTMLTextAreaElement,
  token: string,
  setValue: (v: string) => void
) {
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  setValue(el.value.slice(0, start) + token + el.value.slice(end));
  requestAnimationFrame(() => {
    el.focus();
    const caret = start + token.length;
    el.setSelectionRange(caret, caret);
  });
}

export default function TemplatesPage() {
  const { templates, mutate } = useEmailTemplates();
  const myName = useProfileName();
  const { applications } = useComposeApplications();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmailTemplate | null>(null);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composeAppId, setComposeAppId] = useState("");
  const [composeContactId, setComposeContactId] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const categories = ["All", ...Array.from(new Set(templates.map((t) => t.category)))];
  const isFiltering = activeCategory !== "All" || search.trim() !== "";
  const q = search.trim().toLowerCase();
  const visible = templates.filter(
    (t) =>
      (activeCategory === "All" || t.category === activeCategory) &&
      (q === "" ||
        t.name.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q))
  );

  const selectedTemplate = templates.find((t) => t.id === selectedId) ?? null;
  const composeApp = applications.find((a) => a.id === composeAppId) ?? applications[0];
  const composeContact =
    composeApp?.contacts.find((c) => c.id === composeContactId) ?? composeApp?.contacts[0];
  const composeValues: PlaceholderValues = composeApp
    ? placeholderValuesFromApp(composeApp, composeContact?.name ?? "", myName)
    : { company: "", position: "", contact: "", myName, jobUrl: "" };

  function openNew() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(t: EmailTemplate) {
    setEditing(t);
    setEditorOpen(true);
  }

  // Save (create or edit) optimistically: the list updates instantly, then we
  // reconcile with the server record (or roll back on failure).
  async function saveTemplate(payload: { name: string; subject: string; body: string; category: string }) {
    if (editing) {
      const id = editing.id;
      mutate((cur) => (cur ? { data: cur.data.map((t) => (t.id === id ? { ...t, ...payload } : t)) } : cur), { revalidate: false });
      try {
        await updateEmailTemplate(id, payload);
        toast.success("Template updated");
        mutate();
      } catch {
        toast.error("Couldn't save template");
        mutate();
      }
    } else {
      const temp: EmailTemplate = {
        id: tempId(),
        profileId: "",
        order: templates.length,
        createdAt: new Date().toISOString(),
        ...payload,
      };
      mutate((cur) => (cur ? { data: [...cur.data, temp] } : { data: [temp] }), { revalidate: false });
      try {
        const res = await saveEmailTemplate(payload);
        const created = res.data as EmailTemplate;
        mutate((cur) => (cur ? { data: cur.data.map((t) => (t.id === temp.id ? created : t)) } : cur), { revalidate: false });
        toast.success("Template created");
      } catch {
        mutate((cur) => (cur ? { data: cur.data.filter((t) => t.id !== temp.id) } : cur), { revalidate: false });
        toast.error("Couldn't save template");
      }
    }
  }

  async function confirmDelete(t: EmailTemplate) {
    mutate((cur) => (cur ? { data: cur.data.filter((x) => x.id !== t.id) } : cur), { revalidate: false });
    if (selectedId === t.id) setSelectedId(null);
    try {
      await deleteEmailTemplate(t.id);
      toastUndo("Template deleted", async () => {
        try { await restoreEmailTemplates([t.id]); mutate(); } catch { toast.error("Couldn't restore"); }
      });
    } catch {
      toast.error("Couldn't delete template");
      mutate();
    }
  }

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (isFiltering || !over || active.id === over.id) return;
    const oldIndex = templates.findIndex((t) => t.id === active.id);
    const newIndex = templates.findIndex((t) => t.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(templates, oldIndex, newIndex).map((t, i) => ({ ...t, order: i }));
    mutate({ data: next }, { revalidate: false });
    try {
      await reorderEmailTemplates(next.map((t) => t.id));
      mutate();
    } catch {
      toast.error("Couldn't reorder templates");
      mutate();
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Email templates" onAdd={openNew} addLabel="New template" />

      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        {/* Left — template list */}
        <div className="overflow-y-auto p-6 lg:border-r border-border flex flex-col gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 h-10 px-3 rounded-input bg-surface-elevated border border-border focus-within:border-border-hover transition-colors">
            <HugeiconsIcon icon={Search01Icon} size={15} strokeWidth={1.5} className="text-text-muted shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-text-muted hover:text-text-primary transition-colors">
                <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* Category chips */}
          {templates.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs border transition-colors duration-150",
                    activeCategory === cat
                      ? "bg-accent-soft text-accent-soft-fg border-transparent"
                      : "bg-surface-elevated text-text-secondary border-border hover:text-text-primary"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* List */}
          {templates.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-16">
              <div className="w-12 h-12 rounded-full bg-accent-soft flex items-center justify-center mb-1">
                <HugeiconsIcon icon={Mailbox01Icon} size={20} className="text-accent-soft-fg" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-text-primary">No templates yet</p>
              <p className="text-xs text-text-muted max-w-xs">
                Create a reusable outreach email with placeholders like {"{company}"} and fire it off in one click.
              </p>
              <Button variant="outline" size="sm" className="mt-2" onClick={openNew}>
                New template
              </Button>
            </div>
          ) : visible.length === 0 ? (
            <p className="text-sm text-text-muted px-1 py-8 text-center">No templates match your filters.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={visible.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2">
                  {visible.map((t) => (
                    <SortableTemplateCard
                      key={t.id}
                      template={t}
                      selected={selectedId === t.id}
                      dragDisabled={isFiltering}
                      onSelect={() => setSelectedId(t.id)}
                      onEdit={() => openEdit(t)}
                      onDelete={() => setDeleteTarget(t)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Right — compose */}
        <div className="overflow-y-auto p-6 flex flex-col gap-4 bg-surface/40">
          {!selectedTemplate ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-16">
              <div className="w-12 h-12 rounded-full bg-surface-elevated border border-border flex items-center justify-center mb-1">
                <HugeiconsIcon icon={Mail01Icon} size={20} className="text-text-muted" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-text-primary">Nothing open</p>
              <p className="text-xs text-text-muted max-w-xs">
                Pick a template on the left to load it here, edit it, and open it in Gmail.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-text-primary">{selectedTemplate.name}</h2>
                  <p className="text-sm text-text-muted mt-0.5">Fill in, edit, and open in Gmail.</p>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  title="Close"
                  className="text-text-muted hover:text-text-primary transition-colors p-1 shrink-0"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.5} />
                </button>
              </div>

              {applications.length > 0 && (
                <Select
                  label="Application"
                  value={composeApp?.id ?? ""}
                  onChange={(e) => {
                    setComposeAppId(e.target.value);
                    setComposeContactId("");
                  }}
                  options={applications.map((a) => ({
                    value: a.id,
                    label: `${a.companyName} — ${a.position}`,
                  }))}
                />
              )}
              {composeApp && composeApp.contacts.length > 0 ? (
                <Select
                  label="Contact"
                  value={composeContact?.id ?? ""}
                  onChange={(e) => setComposeContactId(e.target.value)}
                  options={composeApp.contacts.map((c) => ({
                    value: c.id,
                    label: c.email ? `${c.name} · ${c.email}` : c.name,
                  }))}
                />
              ) : (
                <p className="text-xs text-text-muted">
                  {composeApp
                    ? `This application has no contacts — {contact} and the recipient will be empty.`
                    : "Add an application to auto-fill placeholders."}
                </p>
              )}

              <EditableDraft
                key={`${selectedTemplate.id}:${composeApp?.id ?? ""}:${composeContact?.id ?? ""}`}
                defaultTo={composeContact?.email ?? ""}
                defaultSubject={substitutePlaceholders(selectedTemplate.subject, composeValues)}
                defaultBody={substitutePlaceholders(selectedTemplate.body, composeValues)}
              />
            </>
          )}
        </div>
      </div>

      {editorOpen && (
        <TemplateEditorModal
          key={editing?.id ?? "new"}
          onClose={() => setEditorOpen(false)}
          template={editing}
          apps={applications}
          myName={myName}
          onSubmit={saveTemplate}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && confirmDelete(deleteTarget)}
        title="Delete this template?"
        message={deleteTarget ? `"${deleteTarget.name}" will be moved to Trash. You can restore it within 30 days.` : ""}
        confirmLabel="Delete"
        tone="danger"
        icon={Delete02Icon}
      />
    </div>
  );
}

interface SortableCardProps {
  template: EmailTemplate;
  selected: boolean;
  dragDisabled: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableTemplateCard({ template, selected, dragDisabled, onSelect, onEdit, onDelete }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: template.id,
    disabled: dragDisabled,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onSelect}
      className={cn(
        "group relative bg-surface-elevated border rounded-card p-4 cursor-pointer transition-colors duration-150",
        selected ? "border-accent" : "border-border hover:border-border-hover",
        isDragging && "opacity-60 z-10"
      )}
    >
      <div className="flex items-start gap-2">
        {!dragDisabled && (
          <button
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            title="Drag to reorder"
            className="mt-0.5 cursor-grab active:cursor-grabbing text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          >
            <HugeiconsIcon icon={DragDropVerticalIcon} size={14} strokeWidth={1.5} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-text-primary truncate">{template.name}</p>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full shrink-0", tagBadgeClass(template.category))}>
              {template.category}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5 truncate">{template.subject}</p>
          <p className="text-xs text-text-secondary mt-2 line-clamp-2 whitespace-pre-wrap">{template.body}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="Edit template"
            className="text-text-muted hover:text-text-primary transition-colors p-1"
          >
            <HugeiconsIcon icon={Edit02Icon} size={14} strokeWidth={1.5} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete template"
            className="text-text-muted hover:text-[var(--status-rejected-fg)] transition-colors p-1"
          >
            <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

interface EditableDraftProps {
  defaultTo: string;
  defaultSubject: string;
  defaultBody: string;
}

function EditableDraft({ defaultTo, defaultSubject, defaultBody }: EditableDraftProps) {
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function openInGmail() {
    const url = buildGmailDraftUrl({ to: to.trim() || undefined, subject, body });
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-text-muted">Edit any field below before opening Gmail.</p>
      <div className="rounded-card border border-border bg-surface-elevated overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
          <label className="text-xs font-medium text-text-muted w-14 shrink-0">To</label>
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="name@email.com"
            className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted outline-none"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
          <label className="text-xs font-medium text-text-muted w-14 shrink-0">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted outline-none"
          />
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message..."
          className="w-full bg-transparent px-4 py-3 text-[13px] leading-[1.7] text-text-secondary placeholder:text-text-muted outline-none resize-y min-h-[200px]"
        />
      </div>
      <Button
        className="self-start"
        size="sm"
        onClick={() => setConfirmOpen(true)}
        disabled={!subject.trim() && !body.trim()}
      >
        <HugeiconsIcon icon={Mail01Icon} size={13} strokeWidth={1.5} /> Open in Gmail
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={openInGmail}
        title="Open this in Gmail?"
        message="A Gmail compose window will open in a new tab with your message pre-filled. Nothing sends until you hit send there."
        confirmLabel="Open Gmail"
        icon={Mail01Icon}
      />
    </div>
  );
}

interface EditorProps {
  onClose: () => void;
  template: EmailTemplate | null;
  apps: ComposeApplication[];
  myName: string;
  /** Parent persists optimistically; the editor just validates + hands off. */
  onSubmit: (payload: { name: string; subject: string; body: string; category: string }) => void;
}

function TemplateEditorModal({ onClose, template, apps, myName, onSubmit }: EditorProps) {
  const [name, setName] = useState(template?.name ?? "");
  const [category, setCategory] = useState(template?.category ?? "General");
  const [subject, setSubject] = useState(template?.subject ?? "");
  const [body, setBody] = useState(template?.body ?? "");
  const [bodyView, setBodyView] = useState<"edit" | "preview">("edit");
  const [previewAppId, setPreviewAppId] = useState("");

  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const lastFocused = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const previewApp = apps.find((a) => a.id === previewAppId) ?? apps[0];
  const previewContact = previewApp?.contacts[0];
  const values: PlaceholderValues = previewApp
    ? placeholderValuesFromApp(previewApp, previewContact?.name ?? "", myName)
    : { company: "", position: "", contact: "", myName, jobUrl: "" };

  function insertToken(token: string) {
    const el = lastFocused.current ?? bodyRef.current;
    if (!el) return;
    const setValue = el === bodyRef.current ? setBody : setSubject;
    insertAtCursor(el, token, setValue);
  }

  function handleSave() {
    if (!name.trim() || !subject.trim() || !body.trim()) {
      toast.error("Name, subject and body are required");
      return;
    }
    // Hand off to the parent (optimistic persist) and close instantly.
    onSubmit({ name: name.trim(), subject, body, category });
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={template ? "Edit template" : "New template"} size="lg">
      <div className="p-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Template name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => (lastFocused.current = null)}
            placeholder="SE intern outreach"
          />
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={EMAIL_TEMPLATE_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
        </div>
        <Input
          ref={subjectRef}
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          onFocus={() => (lastFocused.current = subjectRef.current)}
          placeholder="Application for {position} at {company}"
        />

        {/* Body with Edit / Preview toggle */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-text-secondary">Body</label>
            <div className="flex rounded-input bg-surface-hover p-0.5">
              {(["edit", "preview"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setBodyView(v)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-[7px] capitalize transition-colors duration-150",
                    bodyView === v
                      ? "bg-surface text-text-primary border border-border"
                      : "text-text-muted hover:text-text-secondary"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {bodyView === "edit" ? (
            <Textarea
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onFocus={() => (lastFocused.current = bodyRef.current)}
              placeholder={"Hi {contact},\n\nI'm reaching out about the {position} role at {company}..."}
              className="min-h-[160px] leading-[1.7]"
            />
          ) : (
            <div className="flex flex-col gap-2">
              {apps.length > 0 && (
                <Select
                  label="Preview with"
                  value={previewApp?.id ?? ""}
                  onChange={(e) => setPreviewAppId(e.target.value)}
                  options={apps.map((a) => ({ value: a.id, label: `${a.companyName} — ${a.position}` }))}
                />
              )}
              <EmailPreview subject={subject} body={body} values={values} />
            </div>
          )}
        </div>

        {/* Variable chips */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-secondary">Variables</span>
          <p className="text-xs text-text-muted">Click to insert into the focused field.</p>
          <div className="flex flex-wrap gap-2">
            {EMAIL_PLACEHOLDERS.map((p) => (
              <button
                key={p}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertToken(`{${p}}`)}
                className="font-mono text-xs px-2.5 py-1 rounded-full bg-surface-hover border border-border text-text-secondary hover:bg-accent-soft hover:text-accent-soft-fg hover:border-transparent transition-colors duration-150"
              >
                {`{${p}}`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save template
          </Button>
        </div>
      </div>
    </Modal>
  );
}
