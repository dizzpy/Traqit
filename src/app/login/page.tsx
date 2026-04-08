"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
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
      router.push("/board");
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
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-surface-elevated border border-border-hover text-text-primary text-sm px-4 py-2 rounded-card shadow-lg">
          {popup}
        </div>
      )}

      {/* Subtle background glow */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-120 h-120 rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
        />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Brand mark */}


        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-text-primary mb-1.5 font-display">
            Sign in
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            Sign in with your name and password.
          </p>
        </div>


        {/* Card */}
        <div>
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
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
              <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-input px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="cta"
              disabled={loading}
              className="w-full mt-3"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <>
                  Continue
                  <HugeiconsIcon icon={ArrowRight02Icon} size={16} strokeWidth={1.5} />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}