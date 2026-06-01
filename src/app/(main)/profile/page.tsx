"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Mail01Icon,
  Logout01Icon,
  Delete02Icon,
  Database01Icon,
  AlertDiamondIcon,
  GithubIcon,
  Add01Icon,
  Edit02Icon,
  StarIcon,
  Download01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { PipelineTemplateModal } from "@/components/templates/pipeline-template-modal";
import { useProfile, updateProfile, type ProfileUpdate } from "@/hooks/use-profile";
import { useTemplates, updateTemplate, deleteTemplate } from "@/hooks/use-presets";
import { CURRENCIES } from "@/lib/constants";
import type { PipelineTemplate } from "@/types";

const REMINDER_LEAD_OPTIONS = [
  { value: "1", label: "1 hour before" },
  { value: "3", label: "3 hours before" },
  { value: "24", label: "24 hours before" },
  { value: "48", label: "48 hours before" },
];

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ProfilePage() {
  const { profile, mutate } = useProfile();
  const { templates, mutate: mutateTemplates } = useTemplates();

  const [confirm, setConfirm] = useState<null | "logout" | "delete">(null);
  const [busy, setBusy] = useState(false);

  // Template editor + delete
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PipelineTemplate | null>(null);
  const [deleteTemplateTarget, setDeleteTemplateTarget] = useState<PipelineTemplate | null>(null);

  // Typed "delete all applications" confirmation
  const [wipeOpen, setWipeOpen] = useState(false);

  /** Optimistically persist a profile preference; revert via revalidate on failure. */
  async function savePref(patch: ProfileUpdate, successMsg = "Saved") {
    try {
      await updateProfile(patch);
      mutate();
      toast.success(successMsg);
    } catch {
      mutate();
      toast.error("Couldn't save. Try again.");
    }
  }

  async function handleLogout() {
    await fetch("/auth/signout", { method: "POST" });
    window.location.href = "/login";
  }

  async function handleDeleteAccount() {
    setBusy(true);
    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      if (!res.ok) throw new Error();
      window.location.href = "/login";
    } catch {
      toast.error("Couldn't delete account. Try again.");
      setBusy(false);
    }
  }

  async function handleExport() {
    try {
      const res = await fetch("/api/export");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `traqit-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch {
      toast.error("Couldn't export your data. Try again.");
    }
  }

  async function confirmDeleteTemplate(t: PipelineTemplate) {
    try {
      await deleteTemplate(t.id);
      mutateTemplates();
      toast.success("Template deleted");
    } catch {
      toast.error("Couldn't delete template");
    }
  }

  async function setDefaultTemplate(t: PipelineTemplate) {
    try {
      await updateTemplate(t.id, { isDefault: true });
      mutateTemplates();
      toast.success(`"${t.name}" is now the default`);
    } catch {
      toast.error("Couldn't set default");
    }
  }

  const providerLabel =
    profile?.provider === "github" ? "GitHub" : profile?.provider === "email" ? "Magic link" : "—";
  const ProviderIcon = profile?.provider === "github" ? GithubIcon : Mail01Icon;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Profile" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[640px] mx-auto flex flex-col gap-4">
          {/* Section 1 — Your account */}
          <Card>
            <div className="flex items-center gap-3">
              {profile?.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={profile.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover border border-border shrink-0"
                  unoptimized
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <span className="text-base font-semibold text-white">
                    {profile ? initials(profile.name) : ""}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-text-primary truncate">Your account</h2>
                <p className="text-xs text-text-muted truncate">{profile?.email ?? ""}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-4">
              <NameField
                value={profile?.name ?? ""}
                onSave={(v) => savePref({ name: v }, "Name saved")}
              />

              <Field label="Email" hint="From your sign-in — can't be changed here.">
                <div className="flex items-center gap-2 h-9 px-3 rounded-input bg-surface-elevated border border-border text-sm text-text-muted">
                  <HugeiconsIcon icon={Mail01Icon} size={14} strokeWidth={1.5} className="shrink-0" />
                  <span className="truncate">{profile?.email ?? "—"}</span>
                </div>
              </Field>

              <div className="flex items-center gap-3 pt-1">
                <span className="flex items-center gap-2 text-xs text-text-muted">
                  <HugeiconsIcon icon={ProviderIcon} size={14} strokeWidth={1.5} />
                  Signed in via {providerLabel}
                  {profile?.createdAt && ` · joined ${format(new Date(profile.createdAt), "MMM yyyy")}`}
                </span>
              </div>
            </div>
          </Card>

          {/* Section 2 — Preferences */}
          <Card title="Preferences" description="Smart defaults for new applications.">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Default currency"
                  value={profile?.defaultCurrency ?? "LKR"}
                  onChange={(e) => savePref({ defaultCurrency: e.target.value })}
                  options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                />
                <Select
                  label="Default pipeline template"
                  value={profile?.defaultPipelineTemplateId ?? ""}
                  onChange={(e) => savePref({ defaultPipelineTemplateId: e.target.value || null })}
                  options={[
                    { value: "", label: "None — build from scratch" },
                    ...templates.map((t) => ({ value: t.id, label: t.name })),
                  ]}
                />
              </div>

              <Field
                label="Mark as ghosted after X days with no response"
                hint="Applications with no reply after this many days are flagged as ghosting."
              >
                <input
                  key={profile?.ghostThresholdDays ?? "loading"}
                  type="number"
                  min={1}
                  max={365}
                  aria-label="Ghost threshold in days"
                  defaultValue={profile?.ghostThresholdDays ?? 14}
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (v >= 1 && v <= 365 && v !== profile?.ghostThresholdDays) {
                      savePref({ ghostThresholdDays: v });
                    }
                  }}
                  className="h-9 w-28 rounded-input bg-surface-elevated border border-border px-3 text-sm text-text-primary outline-none focus:border-border-hover transition-colors duration-150"
                />
              </Field>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-text-primary">Theme</p>
                  <p className="text-xs text-text-muted mt-0.5">Switch between the dark and light haze.</p>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </Card>

          {/* Section 3 — Email and reminders */}
          <Card title="Email and reminders" description="How Traqit represents you and nudges you.">
            <div className="flex flex-col gap-4">
              <BlurField
                label="Your name in email templates ({myName} placeholder)"
                placeholder="Anuja Rathnayaka"
                value={profile?.emailName ?? ""}
                onSave={(v) => savePref({ emailName: v.trim() || null }, "Email name saved")}
              />

              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-text-primary">Email me before scheduled interviews</p>
                  <p className="text-xs text-text-muted mt-0.5">A heads-up lands before each scheduled stage.</p>
                </div>
                <Switch
                  checked={profile?.remindersEnabled ?? false}
                  aria-label="Email me before scheduled interviews"
                  onChange={(checked) => savePref({ remindersEnabled: checked })}
                />
              </div>

              {profile?.remindersEnabled && (
                <Select
                  label="Reminder lead time"
                  value={String(profile?.reminderLeadTime ?? 24)}
                  onChange={(e) => savePref({ reminderLeadTime: Number(e.target.value) })}
                  options={REMINDER_LEAD_OPTIONS}
                />
              )}
            </div>
          </Card>

          {/* Section 4 — Pipeline templates */}
          <Card
            title="Pipeline templates"
            description="Reusable stage sets you can apply to new applications."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingTemplate(null);
                  setEditorOpen(true);
                }}
              >
                <HugeiconsIcon icon={Add01Icon} size={13} strokeWidth={1.5} /> New template
              </Button>
            }
          >
            {templates.length === 0 ? (
              <p className="text-sm text-text-muted">
                No templates yet — create one to speed up adding applications.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {templates.map((t) => (
                  <div key={t.id} className="group bg-surface-elevated border border-border rounded-card p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-text-primary truncate">{t.name}</span>
                        <span className="text-[10px] text-text-muted bg-surface px-1.5 py-0.5 rounded-full shrink-0">
                          {(t.stages as string[]).length} stage{(t.stages as string[]).length === 1 ? "" : "s"}
                        </span>
                        {t.isDefault && (
                          <span className="flex items-center gap-1 text-[10px] text-accent-soft-fg bg-accent-soft px-1.5 py-0.5 rounded-full shrink-0">
                            <HugeiconsIcon icon={StarIcon} size={9} strokeWidth={2} /> Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        {!t.isDefault && (
                          <button
                            onClick={() => setDefaultTemplate(t)}
                            title="Set as default"
                            className="text-text-muted hover:text-accent transition-colors duration-150 p-1"
                          >
                            <HugeiconsIcon icon={StarIcon} size={14} strokeWidth={1.5} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingTemplate(t);
                            setEditorOpen(true);
                          }}
                          title="Edit"
                          className="text-text-muted hover:text-text-primary transition-colors duration-150 p-1"
                        >
                          <HugeiconsIcon icon={Edit02Icon} size={14} strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => setDeleteTemplateTarget(t)}
                          title="Delete"
                          className="text-text-muted hover:text-[var(--status-rejected-fg)] transition-colors duration-150 p-1"
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-text-muted mt-1">{(t.stages as string[]).join(" → ")}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Section 5 — Data */}
          <Card title="Data" description="Back up everything, or start fresh.">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <HugeiconsIcon icon={Download01Icon} size={14} strokeWidth={1.5} /> Export all data as JSON
            </Button>
          </Card>

          {/* Danger zone */}
          <div className="rounded-card border border-[var(--status-rejected-fg)]/20 bg-[var(--status-rejected-bg)]/40 p-4">
            <h2 className="text-sm font-semibold text-[var(--status-rejected-fg)]">Danger zone</h2>
            <p className="text-xs text-text-muted mt-0.5">These actions can&apos;t be undone.</p>
            <div className="mt-3 flex flex-col gap-3">
              <DangerRow
                icon={Logout01Icon}
                title="Sign out"
                description="Sign out of this device. Your data stays safe and you can sign back in anytime."
                action={
                  <Button variant="outline" size="sm" onClick={() => setConfirm("logout")} disabled={busy}>
                    Sign out
                  </Button>
                }
              />
              <DangerRow
                icon={Database01Icon}
                title="Delete all applications"
                description="Removes every application and its stages, contacts, documents and activity. Your account, templates and presets stay."
                action={
                  <Button variant="danger" size="sm" onClick={() => setWipeOpen(true)} disabled={busy}>
                    Delete all
                  </Button>
                }
              />
              <DangerRow
                icon={AlertDiamondIcon}
                title="Delete account"
                description="Permanently remove your account and everything in it."
                action={
                  <Button variant="danger" size="sm" onClick={() => setConfirm("delete")} disabled={busy}>
                    Delete account
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </div>

      {editorOpen && (
        <PipelineTemplateModal
          key={editingTemplate?.id ?? "new"}
          template={editingTemplate}
          onClose={() => setEditorOpen(false)}
          onSaved={mutateTemplates}
        />
      )}

      <ConfirmDialog
        open={confirm === "logout"}
        onClose={() => setConfirm(null)}
        onConfirm={handleLogout}
        title="Sign out of Traqit?"
        message="You'll be signed out of this device. Your data stays safe and you can sign back in anytime."
        confirmLabel="Sign out"
        icon={Logout01Icon}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onClose={() => setConfirm(null)}
        onConfirm={handleDeleteAccount}
        title="Delete your account?"
        message="Your account and all of its data will be permanently removed and you'll be signed out. This cannot be undone."
        confirmLabel="Delete account"
        tone="danger"
        icon={AlertDiamondIcon}
      />
      <ConfirmDialog
        open={!!deleteTemplateTarget}
        onClose={() => setDeleteTemplateTarget(null)}
        onConfirm={() => deleteTemplateTarget && confirmDeleteTemplate(deleteTemplateTarget)}
        title="Delete this template?"
        message={deleteTemplateTarget ? `"${deleteTemplateTarget.name}" will be removed. Existing applications keep their stages.` : ""}
        confirmLabel="Delete"
        tone="danger"
        icon={Delete02Icon}
      />
      <WipeApplicationsDialog
        open={wipeOpen}
        onClose={() => setWipeOpen(false)}
        onWiped={() => {
          setWipeOpen(false);
          window.location.href = "/applications";
        }}
      />
    </div>
  );
}

/** Inline name editor: saves on blur or Enter, shows a "Saved" badge for 2s. */
function NameField({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const current = draft ?? value;

  function commit() {
    const next = current.trim();
    setDraft(null);
    if (!next || next === value) return;
    onSave(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Field
      label="Display name"
      labelExtra={
        saved ? (
          <span className="text-[11px] font-medium text-[var(--success)]">Saved</span>
        ) : undefined
      }
    >
      <Input
        value={current}
        placeholder="Your name"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
      />
    </Field>
  );
}

/** Text field that persists on blur (no badge) — used for the email name. */
function BlurField({
  label,
  value,
  placeholder,
  onSave,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onSave: (v: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const current = draft ?? value;
  return (
    <Field label={label}>
      <Input
        value={current}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setDraft(null);
          if (current.trim() !== value.trim()) onSave(current);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
      />
    </Field>
  );
}

function WipeApplicationsDialog({
  open,
  onClose,
  onWiped,
}: {
  open: boolean;
  onClose: () => void;
  onWiped: () => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const armed = text.trim() === "DELETE";

  async function wipe() {
    if (!armed || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/profile/data", { method: "DELETE" });
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      toast.success(`Deleted ${data.deleted} application${data.deleted === 1 ? "" : "s"}`);
      onWiped();
    } catch {
      toast.error("Couldn't delete your applications. Try again.");
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Delete all applications?" size="sm">
      <div className="p-6 flex flex-col gap-4">
        <p className="text-sm text-text-secondary leading-relaxed">
          Every application and its stages, contacts, documents and activity will be permanently deleted.
          Your account, templates and presets stay. This can&apos;t be undone.
        </p>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">
            Type <span className="text-text-primary font-semibold">DELETE</span> to confirm
          </label>
          <Input
            value={text}
            autoFocus
            placeholder="DELETE"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") wipe();
            }}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={wipe} disabled={!armed || busy}>
            {busy ? "Deleting…" : "Delete all"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Field({
  label,
  hint,
  labelExtra,
  children,
}: {
  label: string;
  hint?: string;
  labelExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-text-secondary">{label}</label>
        {labelExtra}
      </div>
      {hint && <p className="text-[11px] text-text-muted -mt-1 mb-0.5">{hint}</p>}
      {children}
    </div>
  );
}

function DangerRow({
  icon,
  title,
  description,
  action,
}: {
  icon: typeof Mail01Icon;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <HugeiconsIcon icon={icon} size={16} strokeWidth={1.5} className="text-text-muted mt-0.5 shrink-0" />
        <div className="min-w-0">
          <div className="text-sm font-medium text-text-primary">{title}</div>
          <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

function Card({
  title,
  description,
  action,
  children,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-card p-5">
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-base font-semibold text-text-primary">{title}</h2>}
            {description && <p className="text-sm text-text-muted mt-0.5">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
