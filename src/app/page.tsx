import Link from "next/link";

/**
 * Public marketing landing page at `/`.
 *
 * Kept deliberately simple and calm — Violet-haze tokens only. The app itself
 * lives behind auth at /applications (and will eventually sit on the
 * `app.traqit.com` subdomain). Every CTA routes through /login; middleware
 * sends already-signed-in users straight into the app.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Nav */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent-foreground"
              aria-hidden="true"
            >
              <rect x="3" y="7" width="18" height="13" rx="2" />
              <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M3 12h18" />
            </svg>
          </div>
          <span
            className="text-sm font-semibold text-text-primary"
            style={{ fontFamily: "var(--font-family-display)" }}
          >
            Traqit
          </span>
        </div>

        <Link
          href="/login"
          className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-150"
        >
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pb-24">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-soft-fg bg-accent-soft border border-border rounded-full px-3 py-1 mb-7">
          Built for SE interns in Sri Lanka
        </span>

        <h1
          className="text-4xl sm:text-5xl font-semibold text-text-primary leading-[1.1] max-w-2xl tracking-[-0.02em]"
          style={{ fontFamily: "var(--font-family-display)" }}
        >
          Track every application. Build a pipeline for each.
        </h1>

        <p className="mt-5 text-base text-text-secondary max-w-md leading-relaxed">
          A calm, dense job tracker where every application carries its own
          custom interview flow — not one rigid status dropdown.
        </p>

        <div className="mt-9 flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-[11px] bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent-hover transition-colors duration-150"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-11 px-6 rounded-[11px] border border-border bg-transparent text-text-primary text-sm font-medium hover:bg-surface-elevated hover:border-border-hover transition-colors duration-150"
          >
            Sign in
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-6 border-t border-border">
        <p className="text-xs text-text-muted">© 2026 Traqit</p>
      </footer>
    </div>
  );
}
