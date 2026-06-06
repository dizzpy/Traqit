import { Logo } from "@/components/common/logo";
import { createClient } from "@/lib/supabase/server";

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQs", href: "#faq" },
];

export async function MarketingNav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="animate-fade-in [--animation-delay:0ms] w-full sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Wordmark */}
        <a href="/" className="flex items-center gap-2">
          <Logo size={17} className="text-white" />
          <span
            className="text-sm font-semibold text-text-primary"
            style={{ fontFamily: "var(--font-family-display)" }}
          >
            Traqit
          </span>
        </a>

        {/* Center nav links */}
        <nav className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors duration-150"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {user ? (
          <a
            href="/app/applications"
            className="flex items-center gap-1.5 rounded-[9px] bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-900 transition-all duration-150 hover:bg-white/90 hover:shadow-sm"
          >
            Dashboard
          </a>
        ) : (
          <a
            href="/login"
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-150"
          >
            Sign in
          </a>
        )}
      </div>
    </header>
  );
}
