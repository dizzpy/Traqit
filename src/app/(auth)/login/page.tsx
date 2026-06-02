"use client";

import { useEffect, useState } from "react";
import { GithubIcon, Mail01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

// Our own callback errors (?error=...).
const ERROR_MESSAGES: Record<string, string> = {
  not_allowed: "This email isn't on the access list. Ask Dizzpy to add you.",
  auth: "Sign in failed. Please try again.",
  profile: "Couldn't set up your workspace. Please try again.",
};

// Supabase's own OAuth errors (?error_code=...) get friendlier copy.
const SUPABASE_ERROR_MESSAGES: Record<string, string> = {
  bad_oauth_state:
    "Login session expired. Start again from this tab and finish within a minute.",
};

function resolveError(params: URLSearchParams): string | null {
  const code = params.get("error_code");
  if (code && SUPABASE_ERROR_MESSAGES[code]) return SUPABASE_ERROR_MESSAGES[code];

  const ours = params.get("error");
  if (ours && ERROR_MESSAGES[ours]) return ERROR_MESSAGES[ours];

  // Fall back to Supabase's human-readable description, else a generic line.
  const desc = params.get("error_description");
  if (desc) return desc;
  if (ours || code) return "Something went wrong. Try again.";
  return null;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [popup, setPopup] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  // Surface errors passed back from the auth callback (?error=...).
  // One-time sync from the URL on mount — reading window.location keeps this
  // SSR-safe (vs a lazy useState initializer, which would hydrate-mismatch).
  useEffect(() => {
    const message = resolveError(new URLSearchParams(window.location.search));
    if (message) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(message);
      setPopup(message);
    }
  }, []);

  useEffect(() => {
    if (!popup) return;
    const timeout = window.setTimeout(() => setPopup(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [popup]);

  function siteRedirect() {
    // The /auth/callback handler lives on the app subdomain, and the session
    // cookie is scoped there — send Supabase back to APP_URL, not the marketing
    // SITE_URL. Falls back to the current origin in dev.
    const base = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    return `${base}/auth/callback`;
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const emailTrimmed = email.trim();

    if (!emailTrimmed) {
      setPopup("Please enter your email.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: emailTrimmed,
        options: { emailRedirectTo: siteRedirect(), shouldCreateUser: true },
      });
      if (otpError) throw otpError;
      setSent(true);
      setPopup("Check your email for the magic link!");
    } catch {
      const message = "Something went wrong. Try again.";
      setError(message);
      setPopup(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGithubLogin() {
    setGithubLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo: siteRedirect() },
      });
      if (oauthError) throw oauthError;
      // On success the browser is redirected to GitHub; nothing more to do here.
    } catch {
      setPopup("GitHub login failed. Please try again.");
      setGithubLoading(false);
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
        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-text-primary mb-1.5" style={{ fontFamily: "var(--font-family-display)" }}>
            Sign in
          </h1>
          <p className="text-sm text-text-secondary">
            Choose your preferred sign in method.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Button
            variant="outline"
            onClick={handleGithubLogin}
            disabled={githubLoading || loading}
            className="w-full h-11 flex items-center justify-center gap-3 bg-surface hover:bg-surface-hover border-border transition-all duration-200"
          >
            {githubLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-text-muted/30 border-t-text-muted rounded-full animate-spin" />
            ) : (
              <HugeiconsIcon icon={GithubIcon} size={18} strokeWidth={1.5} />
            )}
            <span className="font-medium">Continue with GitHub</span>
          </Button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
              <span className="bg-bg px-3 text-text-muted font-medium">Or magic link</span>
            </div>
          </div>

          <form onSubmit={handleMagicLink} noValidate className="flex flex-col gap-4">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (sent) setSent(false);
              }}
              placeholder="name@example.com"
              autoFocus
            />

            {error && (
              <p className="text-xs text-[var(--status-rejected-fg)] bg-[var(--status-rejected-bg)] border border-[var(--status-rejected-fg)]/20 rounded-input px-3 py-2">
                {error}
              </p>
            )}

            {sent ? (
              <p className="text-xs text-text-secondary bg-surface border border-border rounded-input px-3 py-2.5 text-center">
                Magic link sent — check <span className="text-text-primary">{email.trim()}</span> and open it on this device.
              </p>
            ) : (
              <Button
                type="submit"
                disabled={loading || githubLoading}
                className="w-full h-10 mt-1"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending link…
                  </span>
                ) : (
                  <>
                    Send Magic Link
                    <HugeiconsIcon icon={Mail01Icon} size={15} strokeWidth={1.5} />
                  </>
                )}
              </Button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
