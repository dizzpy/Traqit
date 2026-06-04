import { APP_URL } from "@/lib/urls";
import { Logo } from "@/components/common/logo";

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
            <Logo size={15} className="text-white" />
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
