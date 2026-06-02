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
  Add01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StatusBadge, WorkModeBadge } from "@/components/ui/badge";
import { EditableCell } from "./editable-cell";
import { OptionPicker } from "./option-picker";
import { tagBadgeClass } from "@/lib/tag-colors";
import { PipelineBuilder } from "./pipeline-builder";
import { DraftEmailModal } from "./draft-email-modal";
import { useJobTypes, useSources, addJobType, addSource } from "@/hooks/use-presets";
import { useApplication } from "@/hooks/use-applications";
import {
  createContact,
  deleteContact,
  createDocument,
  deleteDocument,
  type ContactInput,
  type DocumentInput,
} from "@/hooks/use-detail";
import { STATUS_LABELS, STATUS_BG, WORK_MODE_LABELS, WORK_MODE_COLORS } from "@/lib/constants";
import type { Application, ApplicationStatus, WorkMode, Contact, Document } from "@/types";
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
  const [addingContact, setAddingContact] = useState(false);
  const [addingDoc, setAddingDoc] = useState(false);
  const [draftContact, setDraftContact] = useState<Contact | null>(null);
  const { jobTypes, mutate: mutateTypes } = useJobTypes();
  const { sources, mutate: mutateSources } = useSources();
  const typeOptions = jobTypes.map((n) => ({ value: n, label: n, className: tagBadgeClass(n) }));
  const sourceOptions = sources.map((n) => ({ value: n, label: n, className: tagBadgeClass(n) }));
  const update = (patch: Partial<Application>) => onUpdate?.(patch);

  // The list payload is trimmed to summary fields + stages for speed, so the
  // panel fetches the full record (contacts/documents/activity) on demand and
  // mutates that cache optimistically for instant adds/deletes.
  const { application: detail, mutate: mutateDetail } = useApplication(app.id);
  const contacts = detail?.contacts ?? [];
  const documents = detail?.documents ?? [];
  const activityLog = detail?.activityLog ?? [];

  /** Optimistically transform the cached detail record without revalidating. */
  function patchDetail(updater: (a: Application) => Application) {
    mutateDetail((cur) => (cur ? { ...cur, data: updater(cur.data) } : cur), { revalidate: false });
  }

  async function selectType(value: string) {
    update({ jobType: value });
    if (value && !jobTypes.includes(value)) { await addJobType(value); mutateTypes(); }
  }
  async function selectSource(value: string) {
    update({ appliedVia: value });
    if (value && !sources.includes(value)) { await addSource(value); mutateSources(); }
  }

  async function addContact(input: ContactInput) {
    const now = new Date().toISOString();
    const temp: Contact = {
      id: `temp-${now}`,
      applicationId: app.id,
      name: input.name,
      role: input.role,
      email: input.email ?? null,
      phone: input.phone ?? null,
      linkedinUrl: input.linkedinUrl ?? null,
      stageName: input.stageName ?? null,
      notes: input.notes ?? null,
      createdAt: now,
    };
    patchDetail((a) => ({ ...a, contacts: [...a.contacts, temp] }));
    try {
      const real = await createContact(app.id, input);
      patchDetail((a) => ({ ...a, contacts: a.contacts.map((c) => (c.id === temp.id ? real : c)) }));
    } catch {
      patchDetail((a) => ({ ...a, contacts: a.contacts.filter((c) => c.id !== temp.id) }));
      toast.error("Couldn't add contact. Changes reverted.");
    }
  }

  async function removeContact(id: string) {
    const snapshot = contacts;
    patchDetail((a) => ({ ...a, contacts: a.contacts.filter((c) => c.id !== id) }));
    try {
      await deleteContact(app.id, id);
    } catch {
      patchDetail((a) => ({ ...a, contacts: snapshot }));
      toast.error("Couldn't delete contact. Changes reverted.");
    }
  }

  async function addDocument(input: DocumentInput) {
    const now = new Date().toISOString();
    const temp: Document = {
      id: `temp-${now}`,
      applicationId: app.id,
      name: input.name,
      url: input.url,
      type: input.type,
      createdAt: now,
    };
    patchDetail((a) => ({ ...a, documents: [...a.documents, temp] }));
    try {
      const real = await createDocument(app.id, input);
      patchDetail((a) => ({ ...a, documents: a.documents.map((d) => (d.id === temp.id ? real : d)) }));
    } catch {
      patchDetail((a) => ({ ...a, documents: a.documents.filter((d) => d.id !== temp.id) }));
      toast.error("Couldn't add document. Changes reverted.");
    }
  }

  async function removeDocument(id: string) {
    const snapshot = documents;
    patchDetail((a) => ({ ...a, documents: a.documents.filter((d) => d.id !== id) }));
    try {
      await deleteDocument(app.id, id);
    } catch {
      patchDetail((a) => ({ ...a, documents: snapshot }));
      toast.error("Couldn't delete document. Changes reverted.");
    }
  }

  return (
    <>
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
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
                {contacts.length} contact{contacts.length === 1 ? "" : "s"}
              </p>
              {!addingContact && (
                <Button variant="outline" size="sm" onClick={() => setAddingContact(true)}>
                  <HugeiconsIcon icon={Add01Icon} size={13} strokeWidth={2} /> Add contact
                </Button>
              )}
            </div>

            {addingContact && (
              <AddContactForm onCreate={addContact} onDone={() => setAddingContact(false)} />
            )}

            {contacts.length === 0 && !addingContact ? (
              <EmptyState message="No contacts yet" hint="Add the recruiter or hiring manager to keep track of who you're talking to." />
            ) : (
              <div className="flex flex-col gap-3">
                {contacts.map((c) => (
                  <div key={c.id} className="group bg-surface-elevated border border-border rounded-card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{c.name}</p>
                        <p className="text-xs text-text-muted mt-0.5">{c.role}{c.stageName ? ` · ${c.stageName}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setDraftContact(c)}
                          title="Draft email"
                          className="text-text-muted hover:text-accent opacity-0 group-hover:opacity-100 transition-all duration-150"
                        >
                          <HugeiconsIcon icon={Mail01Icon} size={14} strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => removeContact(c.id)}
                          title="Delete contact"
                          className="text-text-muted hover:text-[var(--status-rejected-fg)] opacity-0 group-hover:opacity-100 transition-all duration-150"
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={1.5} />
                        </button>
                        <div className="w-8 h-8 rounded-full bg-accent-soft flex items-center justify-center">
                          <HugeiconsIcon icon={UserIcon} size={14} className="text-accent-soft-fg" strokeWidth={1.5} />
                        </div>
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
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
                {documents.length} document{documents.length === 1 ? "" : "s"}
              </p>
              {!addingDoc && (
                <Button variant="outline" size="sm" onClick={() => setAddingDoc(true)}>
                  <HugeiconsIcon icon={Add01Icon} size={13} strokeWidth={2} /> Add document
                </Button>
              )}
            </div>

            {addingDoc && <AddDocumentForm onCreate={addDocument} onDone={() => setAddingDoc(false)} />}

            {documents.length === 0 && !addingDoc ? (
              <EmptyState message="No documents yet" hint="Link the CV or cover letter you sent to this company." />
            ) : (
              <div className="flex flex-col gap-2">
                {documents.map((d) => (
                  <div key={d.id} className="group flex items-center gap-3 bg-surface-elevated border border-border rounded-card p-3 hover:border-accent transition-colors duration-150">
                    <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center shrink-0">
                      <HugeiconsIcon icon={FileAttachmentIcon} size={14} className="text-accent-soft-fg" strokeWidth={1.5} />
                    </div>
                    <a href={d.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary truncate hover:text-accent transition-colors">{d.name}</p>
                      <p className="text-xs text-text-muted capitalize">{d.type.replace("-", " ")}</p>
                    </a>
                    <a href={d.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                      <HugeiconsIcon icon={ArrowUpRight01Icon} size={13} className="text-text-muted" strokeWidth={1.5} />
                    </a>
                    <button
                      onClick={() => removeDocument(d.id)}
                      title="Delete document"
                      className="shrink-0 text-text-muted hover:text-[var(--status-rejected-fg)] opacity-0 group-hover:opacity-100 transition-all duration-150"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="flex-1 overflow-y-auto p-6 mt-0">
            {activityLog.length === 0 ? (
              <EmptyState message="No activity yet" hint="Activity is recorded automatically as you update this application." />
            ) : (
              <div className="flex flex-col gap-0">
                {[...activityLog].reverse().map((entry, i) => (
                  <div key={entry.id} className="flex gap-3 relative">
                    {i < activityLog.length - 1 && <div className="absolute left-[14px] top-6 bottom-0 w-px bg-border" />}
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
    {draftContact && (
      <DraftEmailModal
        open={!!draftContact}
        onClose={() => setDraftContact(null)}
        app={app}
        contact={draftContact}
      />
    )}
    </>
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

const fieldClass =
  "h-8 w-full rounded-input bg-surface border border-border px-2.5 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-border-hover transition-colors duration-150";

function AddContactForm({ onCreate, onDone }: { onCreate: (input: ContactInput) => void; onDone: () => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [notes, setNotes] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;
    // Optimistic — the parent inserts the row immediately and persists in the
    // background, so we close the form right away.
    onCreate({
      name: name.trim(),
      role: role.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      linkedinUrl: linkedinUrl.trim() || null,
      notes: notes.trim() || null,
    });
    onDone();
  }

  return (
    <form onSubmit={submit} className="bg-surface-elevated border border-border rounded-card p-3 mb-3 flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Name *" className={fieldClass} />
        <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role * (e.g. Recruiter)" className={fieldClass} />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={fieldClass} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className={fieldClass} />
      </div>
      <input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="LinkedIn URL" className={fieldClass} />
      <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" className={fieldClass} />
      <div className="flex items-center justify-end gap-2 pt-0.5">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>Cancel</Button>
        <Button type="submit" size="sm" disabled={!name.trim() || !role.trim()}>
          Add contact
        </Button>
      </div>
    </form>
  );
}

const DOC_TYPES = [
  { value: "cv", label: "CV / Resume" },
  { value: "cover-letter", label: "Cover letter" },
  { value: "portfolio", label: "Portfolio" },
  { value: "other", label: "Other" },
] as const;

function AddDocumentForm({ onCreate, onDone }: { onCreate: (input: DocumentInput) => void; onDone: () => void }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<(typeof DOC_TYPES)[number]["value"]>("cv");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    onCreate({ name: name.trim(), url: url.trim(), type });
    onDone();
  }

  return (
    <form onSubmit={submit} className="bg-surface-elevated border border-border rounded-card p-3 mb-3 flex flex-col gap-2">
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Label * (e.g. CV — Sysco)" className={fieldClass} />
      <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Link * — https://drive.google.com/…" className={fieldClass} />
      <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className={cn(fieldClass, "cursor-pointer")}>
        {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      <div className="flex items-center justify-end gap-2 pt-0.5">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>Cancel</Button>
        <Button type="submit" size="sm" disabled={!name.trim() || !url.trim()}>
          Add document
        </Button>
      </div>
    </form>
  );
}
