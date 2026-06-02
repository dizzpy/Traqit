import { APP_URL } from "@/lib/urls";

/**
 * Top nav for the public marketing site. Left: Traqit wordmark. Right: a ghost
 * "Sign in" link that crosses over to the app subdomain's login.
 */
export function MarketingNav() {
  return (
    <header className="w-full">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-5">
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

        <a
          href={`${APP_URL}/login`}
          className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-150"
        >
          Sign in
        </a>
      </div>
    </header>
  );
}
