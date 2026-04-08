"use client";

import { useState } from "react";
import {
  Cancel01Icon,
  Share01Icon,
  Delete01Icon,
  Mail01Icon,
  CallIcon,
  Linkedin01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { StatusBadge, WorkModeBadge } from "@/components/ui/badge";
import { PipelineStages } from "./pipeline-stages";
import { formatDate, formatRelativeDate } from "@/lib/utils";
import { updateApplication, deleteApplication, useApplication } from "@/hooks/use-applications";
import type { ApplicationStatus } from "@/types";
import { STATUS_LABELS, CONTACT_ROLES, DOCUMENT_TYPES } from "@/lib/constants";
import { mutate } from "swr";

interface ApplicationDetailProps {
  applicationId: string | null;
  onClose: () => void;
}

type Tab = "overview" | "pipeline" | "contacts" | "documents" | "activity";

export function ApplicationDetail({ applicationId, onClose }: ApplicationDetailProps) {
  const { application: app, mutate: mutateApp } = useApplication(applicationId);
  const [tab, setTab] = useState<Tab>("overview");
  const [addingContact, setAddingContact] = useState(false);
  const [addingDocument, setAddingDocument] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "", role: "Recruiter", email: "", phone: "", linkedinUrl: "", stageName: "", notes: "",
  });
  const [docForm, setDocForm] = useState({ name: "", url: "", type: "cv" });

  async function handleStatusChange(status: ApplicationStatus) {
    if (!app) return;
    await updateApplication(app.id, { status });
    mutateApp();
    await mutate((k: string) => typeof k === "string" && k.startsWith("/api/applications"));
  }

  async function handleDelete() {
    if (!app || !confirm("Delete this application?")) return;
    await deleteApplication(app.id);
    await mutate((k: string) => typeof k === "string" && k.startsWith("/api/applications"));
    onClose();
  }

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    if (!app) return;
    await fetch(`/api/applications/${app.id}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contactForm),
    });
    mutateApp();
    setAddingContact(false);
    setContactForm({ name: "", role: "Recruiter", email: "", phone: "", linkedinUrl: "", stageName: "", notes: "" });
  }

  async function handleAddDocument(e: React.FormEvent) {
    e.preventDefault();
    if (!app) return;
    await fetch(`/api/applications/${app.id}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(docForm),
    });
    mutateApp();
    setAddingDocument(false);
    setDocForm({ name: "", url: "", type: "cv" });
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview",  label: "Overview" },
    { key: "pipeline",  label: `Pipeline (${app?.stages.length ?? 0})` },
    { key: "contacts",  label: `Contacts (${app?.contacts.length ?? 0})` },
    { key: "documents", label: `Docs (${app?.documents.length ?? 0})` },
    { key: "activity",  label: "Activity" },
  ];

  return (
    <Modal open={!!applicationId} onClose={onClose} size="xl">
      {!app ? (
        <div className="p-8 text-center text-text-muted">Loading...</div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-border">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-semibold text-text-primary">{app.companyName}</h2>
                {app.companyUrl && (
                  <a href={app.companyUrl} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text-secondary">
                    <HugeiconsIcon icon={Share01Icon} size={13} strokeWidth={1.5} />
                  </a>
                )}
              </div>
              <p className="text-sm text-text-secondary">{app.position}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={app.status}
                onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
                className="text-xs rounded-input bg-surface-elevated border border-border px-2 py-1.5 text-text-primary focus:outline-none"
              >
                {(Object.keys(STATUS_LABELS) as ApplicationStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              <Button variant="danger" size="sm" onClick={handleDelete}>
                <HugeiconsIcon icon={Delete01Icon} size={13} strokeWidth={1.5} />
              </Button>
              <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
                <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border px-6">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-150 ${
                  tab === key
                    ? "border-accent text-text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-6">
            {tab === "overview" && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Status"><StatusBadge status={app.status} /></InfoRow>
                  <InfoRow label="Work mode"><WorkModeBadge mode={app.workMode as import("@/types").WorkMode} /></InfoRow>
                  <InfoRow label="Job type"><span className="text-sm text-text-primary">{app.jobType}</span></InfoRow>
                  <InfoRow label="Applied via"><span className="text-sm text-text-primary">{app.appliedVia}</span></InfoRow>
                  <InfoRow label="Applied date"><span className="text-sm text-text-primary">{formatDate(app.appliedDate)}</span></InfoRow>
                  <InfoRow label="Location"><span className="text-sm text-text-primary">{app.location || "—"}</span></InfoRow>
                  {(app.salaryMin || app.salaryMax) && (
                    <InfoRow label="Salary">
                      <span className="text-sm text-text-primary">
                        {app.currency} {app.salaryMin?.toLocaleString() ?? "?"} — {app.salaryMax?.toLocaleString() ?? "?"}/mo
                      </span>
                    </InfoRow>
                  )}
                  {app.jobPostUrl && (
                    <InfoRow label="Job post">
                      <a href={app.jobPostUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline flex items-center gap-1">
                        View listing <HugeiconsIcon icon={Share01Icon} size={11} strokeWidth={1.5} />
                      </a>
                    </InfoRow>
                  )}
                </div>
                {app.notes && (
                  <div className="bg-surface-elevated border border-border rounded-card p-3">
                    <p className="text-xs font-medium text-text-muted mb-1">Notes</p>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{app.notes}</p>
                  </div>
                )}
              </div>
            )}

            {tab === "pipeline" && (
              <PipelineStages
                applicationId={app.id}
                stages={app.stages}
                onUpdate={mutateApp}
              />
            )}

            {tab === "contacts" && (
              <div className="flex flex-col gap-3">
                {app.contacts.map((c) => (
                  <div key={c.id} className="bg-surface-elevated border border-border rounded-card p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-text-primary">{c.name}</span>
                      <span className="text-xs text-text-muted">{c.role}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary">
                          <HugeiconsIcon icon={Mail01Icon} size={11} strokeWidth={1.5} />{c.email}
                        </a>
                      )}
                      {c.phone && (
                        <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary">
                          <HugeiconsIcon icon={CallIcon} size={11} strokeWidth={1.5} />{c.phone}
                        </a>
                      )}
                      {c.linkedinUrl && (
                        <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-accent">
                          <HugeiconsIcon icon={Linkedin01Icon} size={11} strokeWidth={1.5} />LinkedIn
                        </a>
                      )}
                    </div>
                    {c.notes && <p className="text-xs text-text-muted mt-1">{c.notes}</p>}
                  </div>
                ))}
                {!addingContact ? (
                  <Button variant="outline" size="sm" onClick={() => setAddingContact(true)}>
                    + Add contact
                  </Button>
                ) : (
                  <form onSubmit={handleAddContact} className="bg-surface-elevated border border-border rounded-card p-3 flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input required value={contactForm.name} onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name *" className="h-8 rounded-input bg-surface border border-border px-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none" />
                      <select value={contactForm.role} onChange={(e) => setContactForm((f) => ({ ...f, role: e.target.value }))} className="h-8 rounded-input bg-surface border border-border px-2 text-sm text-text-primary focus:outline-none">
                        {CONTACT_ROLES.map((r) => <option key={r}>{r}</option>)}
                      </select>
                      <input type="email" value={contactForm.email} onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email" className="h-8 rounded-input bg-surface border border-border px-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none" />
                      <input value={contactForm.phone} onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="h-8 rounded-input bg-surface border border-border px-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none" />
                      <input type="url" value={contactForm.linkedinUrl} onChange={(e) => setContactForm((f) => ({ ...f, linkedinUrl: e.target.value }))} placeholder="LinkedIn URL" className="h-8 rounded-input bg-surface border border-border px-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none col-span-2" />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" variant="cta" size="sm">Add</Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setAddingContact(false)}>Cancel</Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {tab === "documents" && (
              <div className="flex flex-col gap-3">
                {app.documents.map((d) => (
                  <a key={d.id} href={d.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-surface-elevated border border-border rounded-card p-3 hover:border-border-hover transition-colors">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{d.name}</p>
                      <p className="text-xs text-text-muted capitalize">{d.type.replace("-", " ")}</p>
                    </div>
                    <HugeiconsIcon icon={Share01Icon} size={13} strokeWidth={1.5} className="text-text-muted" />
                  </a>
                ))}
                {!addingDocument ? (
                  <Button variant="outline" size="sm" onClick={() => setAddingDocument(true)}>
                    + Add document
                  </Button>
                ) : (
                  <form onSubmit={handleAddDocument} className="bg-surface-elevated border border-border rounded-card p-3 flex flex-col gap-2">
                    <input required value={docForm.name} onChange={(e) => setDocForm((f) => ({ ...f, name: e.target.value }))} placeholder="Document name *" className="h-8 rounded-input bg-surface border border-border px-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none" />
                    <input required type="url" value={docForm.url} onChange={(e) => setDocForm((f) => ({ ...f, url: e.target.value }))} placeholder="URL (Google Drive, GitHub...) *" className="h-8 rounded-input bg-surface border border-border px-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none" />
                    <select value={docForm.type} onChange={(e) => setDocForm((f) => ({ ...f, type: e.target.value }))} className="h-8 rounded-input bg-surface border border-border px-2 text-sm text-text-primary focus:outline-none">
                      {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t.replace("-", " ")}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <Button type="submit" variant="cta" size="sm">Add</Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setAddingDocument(false)}>Cancel</Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {tab === "activity" && (
              <div className="flex flex-col gap-0">
                {app.activityLog.length === 0 && (
                  <p className="text-sm text-text-muted">No activity yet.</p>
                )}
                {app.activityLog.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-border mt-2 shrink-0" />
                    <div>
                      <p className="text-sm text-text-secondary">{a.description}</p>
                      <p className="text-xs text-text-muted mt-0.5">{formatRelativeDate(a.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-text-muted">{label}</p>
      {children}
    </div>
  );
}
