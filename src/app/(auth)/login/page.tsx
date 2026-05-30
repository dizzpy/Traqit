"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight02Icon, Briefcase01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [profileName, setProfileName] = useState("");
  const [error, setError] = useState("");
  const [popup, setPopup] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!popup) return;
    const timeout = window.setTimeout(() => setPopup(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [popup]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const name = profileName.trim();
    const pass = password.trim();

    if (!name || !pass) {
      setPopup("Please fill out your name and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass, profileName: name }),
      });
      const json = await res.json();
      if (!res.ok) {
        const message = json.error?.message ?? "Login failed";
        setError(message);
        setPopup(message);
        return;
      }
      router.push("/applications");
      router.refresh();
    } catch {
      const message = "Something went wrong. Try again.";
      setError(message);
      setPopup(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      {popup && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-surface-elevated border border-border-hover text-text-primary text-xs px-4 py-2 rounded-card shadow-lg">
          {popup}
        </div>
      )}

      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent mb-4">
            <HugeiconsIcon icon={Briefcase01Icon} size={18} className="text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-semibold text-text-primary mb-1.5" style={{ fontFamily: "var(--font-family-display)" }}>
            InternTracker
          </h1>
          <p className="text-sm text-text-secondary">
            Sign in with your name and the shared password.
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-[var(--radius-modal)] p-6">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <Input
              label="Your name"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="e.g. Anuja"
              autoFocus
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Shared access password"
            />

            {error && (
              <p className="text-xs text-[var(--status-rejected-fg)] bg-[var(--status-rejected-bg)] border border-[var(--status-rejected-fg)]/20 rounded-input px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 mt-1"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <>
                  Continue
                  <HugeiconsIcon icon={ArrowRight02Icon} size={15} strokeWidth={1.5} />
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          InternTracker · for SE interns in SL
        </p>
      </div>
    </div>
  );
}
