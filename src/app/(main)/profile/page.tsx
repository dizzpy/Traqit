"use client";

import { useState } from "react";
import Image from "next/image";
import {
  GithubIcon,
  Mail01Icon,
  Logout01Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  Database01Icon,
  AlertDiamondIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useProfile, updateProfile } from "@/hooks/use-profile";
import { useAnalytics } from "@/hooks/use-analytics";

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
  const { analytics } = useAnalytics();

  const [nameEdit, setNameEdit] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const nameValue = nameEdit ?? profile?.name ?? "";
  const dirty = nameValue.trim() !== "" && nameValue.trim() !== profile?.name;

  const [confirm, setConfirm] = useState<null | "logout" | "wipe" | "delete">(null);
  const [busy, setBusy] = useState(false);

  async function handleSaveName() {
    if (!dirty) return;
    setSaving(true);
    try {
      await updateProfile({ name: nameValue.trim() });
      mutate();
      setNameEdit(null);
      toast.success("Name updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update name");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/auth/signout", { method: "POST" });
    window.location.href = "/login";
  }

  async function handleWipeData() {
    setBusy(true);
    try {
      const res = await fetch("/api/profile/data", { method: "DELETE" });
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      toast.success(`Wiped ${data.deleted} application${data.deleted === 1 ? "" : "s"}`);
      window.location.href = "/applications";
    } catch {
      toast.error("Couldn't wipe data. Try again.");
      setBusy(false);
    }
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

  const providerLabel =
    profile?.provider === "github" ? "GitHub" : profile?.provider === "email" ? "Magic link" : "—";
  const ProviderIcon = profile?.provider === "github" ? GithubIcon : Mail01Icon;

  const stats = [
    { label: "Applications", value: analytics ? analytics.totalApplications : "—" },
    { label: "Offers", value: analytics ? analytics.statusBreakdown.OFFER + analytics.statusBreakdown.ACCEPTED : "—" },
    {
      label: "Response rate",
      value: analytics ? `${Math.round(analytics.responseRate * 100)}%` : "—",
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Profile" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          {/* Identity card */}
          <div className="bg-surface border border-border rounded-card p-6">
            <div className="flex items-center gap-4">
              {profile?.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={profile.name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover border border-border"
                  unoptimized
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-accent-soft flex items-center justify-center shrink-0">
                  <span className="text-lg font-semibold text-accent-soft-fg">
                    {profile ? initials(profile.name) : ""}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-text-primary truncate">
                  {profile?.name ?? "…"}
                </h2>
                <div className="flex items-center gap-1.5 text-sm text-text-secondary mt-0.5 min-w-0">
                  <HugeiconsIcon icon={Mail01Icon} size={14} strokeWidth={1.5} className="shrink-0" />
                  <span className="truncate">{profile?.email ?? ""}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              {stats.map((s) => (
                <div key={s.label} className="bg-surface-elevated border border-border rounded-card p-3 text-center">
                  <div className="text-xl font-semibold text-text-primary">{s.value}</div>
                  <div className="text-[11px] text-text-muted mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Display name */}
          <Section title="Display name" description="Used across the app and in your email templates ({myName}).">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  value={nameValue}
                  onChange={(e) => setNameEdit(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); }}
                  placeholder="Your name"
                />
              </div>
              <Button size="sm" onClick={handleSaveName} disabled={saving || !dirty}>
                Save
              </Button>
            </div>
          </Section>

          {/* Account */}
          <Section title="Account" description="How you sign in. These come from your login and can't be changed here.">
            <div className="flex flex-col gap-3">
              <Row icon={ProviderIcon} label="Sign-in method" value={providerLabel} />
              <Row
                icon={CheckmarkCircle02Icon}
                label="Email"
                value={profile?.email ?? "—"}
              />
              <Row
                icon={Calendar03Icon}
                label="Joined"
                value={profile?.createdAt ? format(new Date(profile.createdAt), "MMMM d, yyyy") : "—"}
              />
            </div>
          </Section>

          {/* Danger zone */}
          <div>
            <div className="mb-3">
              <h2 className="text-base font-semibold text-[var(--status-rejected-fg)]">Danger zone</h2>
              <p className="text-sm text-text-muted mt-0.5">Sign out, clear your data, or close your account.</p>
            </div>
            <div className="bg-surface border border-[var(--status-rejected-fg)]/25 rounded-card divide-y divide-border">
              <DangerRow
                icon={Logout01Icon}
                title="Log out"
                description="Sign out of this device. Your data stays safe."
                action={
                  <Button variant="outline" size="sm" onClick={() => setConfirm("logout")} disabled={busy}>
                    Log out
                  </Button>
                }
              />
              <DangerRow
                icon={Database01Icon}
                title="Wipe all data"
                description="Delete every application and its stages, contacts, documents and activity. Your account, templates and presets are kept."
                action={
                  <Button variant="danger" size="sm" onClick={() => setConfirm("wipe")} disabled={busy}>
                    Wipe data
                  </Button>
                }
              />
              <DangerRow
                icon={Delete02Icon}
                title="Delete account"
                description="Permanently remove your account and everything in it. This cannot be undone."
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

      <ConfirmDialog
        open={confirm === "logout"}
        onClose={() => setConfirm(null)}
        onConfirm={handleLogout}
        title="Log out?"
        message="You'll be signed out of this device. Your data stays safe and you can sign back in anytime."
        confirmLabel="Log out"
        icon={Logout01Icon}
      />
      <ConfirmDialog
        open={confirm === "wipe"}
        onClose={() => setConfirm(null)}
        onConfirm={handleWipeData}
        title="Wipe all your data?"
        message="Every application and its stages, contacts, documents and activity will be permanently deleted. Your account, templates and presets stay. This can't be undone."
        confirmLabel="Wipe everything"
        tone="danger"
        icon={Database01Icon}
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
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="flex items-start gap-3 min-w-0">
        <HugeiconsIcon icon={icon} size={17} strokeWidth={1.5} className="text-text-muted mt-0.5 shrink-0" />
        <div className="min-w-0">
          <div className="text-sm font-medium text-text-primary">{title}</div>
          <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: typeof Mail01Icon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-sm text-text-secondary">
        <HugeiconsIcon icon={icon} size={15} strokeWidth={1.5} className="text-text-muted" />
        {label}
      </span>
      <span className="text-sm text-text-primary truncate max-w-[60%] text-right">{value}</span>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3">
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        {description && <p className="text-sm text-text-muted mt-0.5">{description}</p>}
      </div>
      <div className="bg-surface border border-border rounded-card p-4">{children}</div>
    </div>
  );
}
