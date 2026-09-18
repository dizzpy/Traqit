"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Add01Icon,
  Delete02Icon,
  Edit02Icon,
  Moon01Icon,
  Sun01Icon,
  Download01Icon,
  StarIcon,
  Mail01Icon,
  GithubIcon,
  Logout01Icon,
  Database01Icon,
  AlertDiamondIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useProfile, updateProfile } from "@/hooks/use-profile";
import { useTheme } from "@/hooks/use-theme";
import { useShortcutHints } from "@/hooks/use-shortcut-hints";
import { ShortcutsDialog } from "@/components/layout/shortcuts-dialog";
import {
  useTemplates,
  useSources,
  useJobTypes,
  addSource,
  addJobType,
  deleteSource,
  deleteJobType,
  saveTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/hooks/use-presets";
import { CURRENCIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { setPendingAction } from "@/lib/pending-action";
import { appPath } from "@/lib/urls";
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

export default function SettingsPage() {
  const { profile, mutate: mutateProfile } = useProfile();
  const { templates, mutate: mutateTemplates } = useTemplates();
  const { raw: sources, mutate: mutateSources } = useSources();
  const { raw: jobTypes, mutate: mutateJobTypes } = useJobTypes();

  // Preset add inputs
  const [newSource, setNewSource] = useState("");
  const [newJobType, setNewJobType] = useState("");

  // Template editor + delete confirm
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<PipelineTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PipelineTemplate | null>(
    null,
  );

  // Account danger zone
  const [confirm, setConfirm] = useState<null | "logout" | "delete">(null);
  const [busy, setBusy] = useState(false);
  const [wipeOpen, setWipeOpen] = useState(false);

  async function handleLogout() {
    await fetch("/auth/signout", { method: "POST" });
    window.location.href = appPath("/login");
  }

  async function handleDeleteAccount() {
    setBusy(true);
    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      if (!res.ok) throw new Error();
      window.location.href = appPath("/login");
    } catch {
      toast.error("Couldn't delete account. Try again.");
      setBusy(false);
    }
  }

  async function savePref(
    patch: Parameters<typeof updateProfile>[0],
    successMsg = "Preference saved",
  ) {
    try {
      await updateProfile(patch);
      mutateProfile();
      toast.success(successMsg);
    } catch {
      toast.error("Couldn't save preference");
    }
  }

  async function handleAddSource(e: React.FormEvent) {
    e.preventDefault();
    if (!newSource.trim()) return;
    try {
      await addSource(newSource.trim());
      mutateSources();
      setNewSource("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add source");
    }
  }

  async function handleAddJobType(e: React.FormEvent) {
    e.preventDefault();
    if (!newJobType.trim()) return;
    try {
      await addJobType(newJobType.trim());
      mutateJobTypes();
      setNewJobType("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add job type");
    }
  }

  async function removeSource(id: string) {
    try {
      await deleteSource(id);
      mutateSources();
    } catch {
      toast.error("Couldn't remove source");
    }
  }

  async function removeJobType(id: string) {
    try {
      await deleteJobType(id);
      mutateJobTypes();
    } catch {
      toast.error("Couldn't remove job type");
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

  const providerLabel =
    profile?.provider === "github"
      ? "GitHub"
      : profile?.provider === "email"
        ? "Magic link"
        : "—";
  const ProviderIcon = profile?.provider === "github" ? GithubIcon : Mail01Icon;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Settings" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          {/* Account — full width, above the masonry grid */}
          <div className="bg-surface border border-border rounded-card p-5">
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
                <h2 className="text-base font-semibold text-text-primary truncate">
                  Your account
                </h2>
                <p className="text-xs text-text-muted truncate">
                  {profile?.email ?? ""}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-4">
              <NameField
                value={profile?.name ?? ""}
                onSave={(v) => savePref({ name: v }, "Name saved")}
              />

              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 text-xs text-text-muted">
                  <HugeiconsIcon
                    icon={ProviderIcon}
                    size={14}
                    strokeWidth={1.5}
                  />
                  Signed in via {providerLabel}
                  {profile?.createdAt &&
                    ` · joined ${format(new Date(profile.createdAt), "MMM yyyy")}`}
                </span>
              </div>
            </div>
          </div>

          <div className="columns-1 lg:columns-2 gap-6 [&>*]:mb-6 [&>*]:break-inside-avoid">
            {/* Appearance */}
            <Section
              title="Appearance"
              description="Pick the look that feels calm to you."
            >
              <ThemeSelector />
            </Section>

            {/* Keyboard shortcuts */}
            <Section
              title="Keyboard shortcuts"
              description="Move around faster with single-key shortcuts."
            >
              <ShortcutsSettings />
            </Section>

            {/* Guided tour */}
            <Section
              title="Guided tour"
              description="See the walkthrough of the Applications page again."
            >
              <GuidedTourSettings />
            </Section>

            {/* Preferences */}
            <Section
              title="Preferences"
              description="Smart defaults for new applications."
            >
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Default currency"
                    value={profile?.defaultCurrency ?? "LKR"}
                    onChange={(e) =>
                      savePref({ defaultCurrency: e.target.value })
                    }
                    options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                  />
                  <Select
                    label="Default pipeline template"
                    value={profile?.defaultPipelineTemplateId ?? ""}
                    onChange={(e) =>
                      savePref({
                        defaultPipelineTemplateId: e.target.value || null,
                      })
                    }
                    options={[
                      { value: "", label: "None — build from scratch" },
                      ...templates.map((t) => ({ value: t.id, label: t.name })),
                    ]}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary">
                    Ghost threshold (days)
                  </label>
                  <p className="text-[11px] text-text-muted mt-0.5 mb-1.5">
                    Applications with no reply after this many days are flagged
                    as ghosting.
                  </p>
                  <input
                    key={profile?.ghostThresholdDays ?? "loading"}
                    type="number"
                    min={1}
                    max={365}
                    defaultValue={profile?.ghostThresholdDays ?? 14}
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (
                        v >= 1 &&
                        v <= 365 &&
                        v !== profile?.ghostThresholdDays
                      )
                        savePref({ ghostThresholdDays: v });
                    }}
                    className="h-9 w-28 rounded-input bg-surface-elevated border border-border px-3 text-sm text-text-primary outline-none focus:border-border-hover transition-colors"
                  />
                </div>
              </div>
            </Section>

            {/* Email and reminders */}
            <Section
              title="Email and reminders"
              description="How Traqit represents you and nudges you."
            >
              <div className="flex flex-col gap-4">
                <BlurField
                  label="Your name in email templates ({myName} placeholder)"
                  placeholder="Anuja Rathnayaka"
                  value={profile?.emailName ?? ""}
                  onSave={(v) =>
                    savePref(
                      { emailName: v.trim() || null },
                      "Email name saved",
                    )
                  }
                />

                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary">
                      Email me before scheduled interviews
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      A heads-up lands before each scheduled stage.
                    </p>
                  </div>
                  <Switch
                    checked={profile?.remindersEnabled ?? false}
                    aria-label="Email me before scheduled interviews"
                    onChange={(checked) =>
                      savePref({ remindersEnabled: checked })
                    }
                  />
                </div>

                {profile?.remindersEnabled && (
                  <Select
                    label="Reminder lead time"
                    value={String(profile?.reminderLeadTime ?? 24)}
                    onChange={(e) =>
                      savePref({ reminderLeadTime: Number(e.target.value) })
                    }
                    options={REMINDER_LEAD_OPTIONS}
                  />
                )}
              </div>
            </Section>

            {/* Pipeline templates */}
            <Section
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
                  <HugeiconsIcon icon={Add01Icon} size={13} strokeWidth={1.5} />{" "}
                  New
                </Button>
              }
            >
              {templates.length === 0 ? (
                <p className="text-sm text-text-muted">No templates yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {templates.map((t: PipelineTemplate) => (
                    <div
                      key={t.id}
                      className="group bg-surface-elevated border border-border rounded-card p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium text-text-primary truncate">
                            {t.name}
                          </span>
                          {t.isDefault && (
                            <span className="flex items-center gap-1 text-[10px] text-accent-soft-fg bg-accent-soft px-1.5 py-0.5 rounded-full shrink-0">
                              <HugeiconsIcon
                                icon={StarIcon}
                                size={9}
                                strokeWidth={2}
                              />{" "}
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!t.isDefault && (
                            <button
                              onClick={() => setDefaultTemplate(t)}
                              title="Set as default"
                              className="text-text-muted hover:text-accent transition-colors p-1"
                            >
                              <HugeiconsIcon
                                icon={StarIcon}
                                size={14}
                                strokeWidth={1.5}
                              />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingTemplate(t);
                              setEditorOpen(true);
                            }}
                            title="Edit"
                            className="text-text-muted hover:text-text-primary transition-colors p-1"
                          >
                            <HugeiconsIcon
                              icon={Edit02Icon}
                              size={14}
                              strokeWidth={1.5}
                            />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(t)}
                            title="Delete"
                            className="text-text-muted hover:text-[var(--status-rejected-fg)] transition-colors p-1"
                          >
                            <HugeiconsIcon
                              icon={Delete02Icon}
                              size={14}
                              strokeWidth={1.5}
                            />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-text-muted mt-1">
                        {(t.stages as string[]).join(" → ")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Job sources */}
            <Section title="Job sources" description="Where you find listings.">
              <div className="flex flex-wrap gap-2 mb-3">
                {sources.map((s) => (
                  <Chip
                    key={s.id}
                    label={s.name}
                    meta={s.usageCount}
                    onRemove={() => removeSource(s.id)}
                  />
                ))}
                {sources.length === 0 && (
                  <p className="text-sm text-text-muted">
                    No custom sources yet.
                  </p>
                )}
              </div>
              <form onSubmit={handleAddSource} className="flex gap-2">
                <Input
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  placeholder="New source name"
                  className="flex-1"
                />
                <Button type="submit" variant="outline" size="sm">
                  <HugeiconsIcon icon={Add01Icon} size={13} strokeWidth={1.5} />{" "}
                  Add
                </Button>
              </form>
            </Section>

            {/* Job types */}
            <Section
              title="Job types"
              description="Types of positions you apply for."
            >
              <div className="flex flex-wrap gap-2 mb-3">
                {jobTypes.map((t) => (
                  <Chip
                    key={t.id}
                    label={t.name}
                    onRemove={() => removeJobType(t.id)}
                  />
                ))}
                {jobTypes.length === 0 && (
                  <p className="text-sm text-text-muted">
                    No custom job types yet.
                  </p>
                )}
              </div>
              <form onSubmit={handleAddJobType} className="flex gap-2">
                <Input
                  value={newJobType}
                  onChange={(e) => setNewJobType(e.target.value)}
                  placeholder="New job type"
                  className="flex-1"
                />
                <Button type="submit" variant="outline" size="sm">
                  <HugeiconsIcon icon={Add01Icon} size={13} strokeWidth={1.5} />{" "}
                  Add
                </Button>
              </form>
            </Section>

            {/* Data */}
            <Section
              title="Data"
              description="Export everything as a JSON backup."
            >
              <Button variant="outline" size="sm" onClick={handleExport}>
                <HugeiconsIcon
                  icon={Download01Icon}
                  size={14}
                  strokeWidth={1.5}
                />{" "}
                Export all data as JSON
              </Button>
            </Section>
          </div>

          {/* Danger zone — full width, below the masonry grid */}
          <div className="rounded-card border border-[var(--status-rejected-fg)]/20 bg-[var(--status-rejected-bg)]/40 p-4">
            <h2 className="text-sm font-semibold text-[var(--status-rejected-fg)]">
              Danger zone
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              These actions can&apos;t be undone.
            </p>
            <div className="mt-3 flex flex-col gap-3">
              <DangerRow
                icon={Logout01Icon}
                title="Sign out"
                description="Sign out of this device. Your data stays safe and you can sign back in anytime."
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirm("logout")}
                    disabled={busy}
                  >
                    Sign out
                  </Button>
                }
              />
              <DangerRow
                icon={Database01Icon}
                title="Delete all applications"
                description="Removes every application and its stages, contacts, documents and activity. Your account, templates and presets stay."
                action={
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setWipeOpen(true)}
                    disabled={busy}
                  >
                    Delete all
                  </Button>
                }
              />
              <DangerRow
                icon={AlertDiamondIcon}
                title="Delete account"
                description="Permanently remove your account and everything in it."
                action={
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirm("delete")}
                    disabled={busy}
                  >
                    Delete account
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </div>

      {editorOpen && (
        <TemplateModal
          key={editingTemplate?.id ?? "new"}
          template={editingTemplate}
          onClose={() => setEditorOpen(false)}
          onSaved={mutateTemplates}
        />
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && confirmDeleteTemplate(deleteTarget)}
        title="Delete this template?"
        message={
          deleteTarget
            ? `"${deleteTarget.name}" will be removed. Existing applications keep their stages.`
            : ""
        }
        confirmLabel="Delete"
        tone="danger"
        icon={Delete02Icon}
      />
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
      <WipeApplicationsDialog
        open={wipeOpen}
        onClose={() => setWipeOpen(false)}
        onWiped={() => {
          setWipeOpen(false);
          window.location.href = appPath("/app/applications");
        }}
      />
    </div>
  );
}

function ThemeSelector() {
  const [theme, setTheme] = useTheme();

  return (
    <div className="flex gap-2">
      {(["dark", "light"] as const).map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          className={cn(
            "flex items-center gap-2 px-4 h-10 rounded-input border text-sm capitalize transition-colors duration-150",
            theme === t
              ? "border-accent bg-accent-soft text-accent-soft-fg"
              : "border-border bg-surface-elevated text-text-secondary hover:text-text-primary",
          )}
        >
          <HugeiconsIcon
            icon={t === "dark" ? Moon01Icon : Sun01Icon}
            size={15}
            strokeWidth={1.5}
          />
          {t}
        </button>
      ))}
    </div>
  );
}

function ShortcutsSettings() {
  const [show, setShow] = useShortcutHints();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-text-primary">Show shortcut hints</p>
          <p className="text-xs text-text-muted mt-0.5">
            Show keycap labels (a, n, /, …) next to navigation and actions.
          </p>
        </div>
        <Switch
          checked={show}
          aria-label="Show keyboard shortcut hints"
          onChange={setShow}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-text-primary">All shortcuts</p>
          <p className="text-xs text-text-muted mt-0.5">
            See every keyboard shortcut available in the app.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
          View shortcuts
        </Button>
      </div>

      <ShortcutsDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}

function GuidedTourSettings() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-text-primary">Replay tour</p>
        <p className="text-xs text-text-muted mt-0.5">
          Re-run the spotlight tour that highlights the pipeline, saved jobs and
          board view.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setPendingAction("replay-tour");
          router.push("/app/applications");
        }}
      >
        Replay tour
      </Button>
    </div>
  );
}

/** Inline name editor: saves on blur or Enter, shows a "Saved" badge for 2s. */
function NameField({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => void;
}) {
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
          <span className="text-[11px] font-medium text-[var(--success)]">
            Saved
          </span>
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
      toast.success(
        `Moved ${data.deleted} application${data.deleted === 1 ? "" : "s"} to Trash — restorable for 30 days`,
      );
      onWiped();
    } catch {
      toast.error("Couldn't delete your applications. Try again.");
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete all applications?"
      size="sm"
    >
      <div className="p-6 flex flex-col gap-4">
        <p className="text-sm text-text-secondary leading-relaxed">
          Every application will be moved to Trash, along with its stages,
          contacts, documents and activity. Your account, templates and presets
          stay. You can restore them within 30 days from Trash.
        </p>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">
            Type <span className="text-text-primary font-semibold">DELETE</span>{" "}
            to confirm
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
          <Button
            variant="danger"
            size="sm"
            onClick={wipe}
            disabled={!armed || busy}
          >
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
        <label className="text-xs font-medium text-text-secondary">
          {label}
        </label>
        {labelExtra}
      </div>
      {hint && (
        <p className="text-[11px] text-text-muted -mt-1 mb-0.5">{hint}</p>
      )}
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
        <HugeiconsIcon
          icon={icon}
          size={16}
          strokeWidth={1.5}
          className="text-text-muted mt-0.5 shrink-0"
        />
        <div className="min-w-0">
          <div className="text-sm font-medium text-text-primary">{title}</div>
          <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

function Chip({
  label,
  meta,
  onRemove,
}: {
  label: string;
  meta?: number;
  onRemove: () => void;
}) {
  return (
    <span className="group/chip flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-surface-elevated border border-border rounded-full text-xs text-text-secondary">
      {label}
      {meta !== undefined && <span className="text-text-muted">({meta})</span>}
      <button
        onClick={onRemove}
        title="Remove"
        className="text-text-muted hover:text-[var(--status-rejected-fg)] transition-colors"
      >
        <HugeiconsIcon icon={Delete02Icon} size={12} strokeWidth={1.5} />
      </button>
    </span>
  );
}

function TemplateModal({
  template,
  onClose,
  onSaved,
}: {
  template: PipelineTemplate | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(template?.name ?? "");
  const [stagesText, setStagesText] = useState(
    template ? (template.stages as string[]).join(", ") : "",
  );
  const [isDefault, setIsDefault] = useState(template?.isDefault ?? false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const stages = stagesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!name.trim() || stages.length === 0) {
      toast.error("Name and at least one stage are required");
      return;
    }
    setSaving(true);
    try {
      if (template)
        await updateTemplate(template.id, {
          name: name.trim(),
          stages,
          isDefault,
        });
      else await saveTemplate({ name: name.trim(), stages, isDefault });
      toast.success(template ? "Template updated" : "Template created");
      onSaved();
      onClose();
    } catch {
      toast.error("Couldn't save template");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={template ? "Edit template" : "New pipeline template"}
      size="md"
    >
      <div className="p-6 flex flex-col gap-4">
        <Input
          label="Template name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Standard tech"
        />
        <Input
          label="Stages (comma-separated)"
          value={stagesText}
          onChange={(e) => setStagesText(e.target.value)}
          placeholder="OA, Phone Screen, Technical, Offer"
        />
        {stagesText.trim() && (
          <p className="text-xs text-text-muted -mt-1">
            {stagesText
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
              .join(" → ")}
          </p>
        )}
        <div
          onClick={() => setIsDefault(!isDefault)}
          className="flex items-center gap-2 self-start cursor-pointer"
        >
          <Checkbox
            checked={isDefault}
            onChange={() => setIsDefault(!isDefault)}
          />
          <span className="text-sm text-text-secondary">
            Use as default for new applications
          </span>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            Save template
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-text-primary">{title}</h2>
          {description && (
            <p className="text-sm text-text-muted mt-0.5">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="bg-surface border border-border rounded-card p-4">
        {children}
      </div>
    </div>
  );
}
