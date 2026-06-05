import { APP_URL } from "@/lib/urls";
import { Logo } from "@/components/common/logo";

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQs", href: "#faqs" },
];

export function MarketingNav() {
  return (
    <header className="animate-fade-in opacity-0 [--animation-delay:0ms] w-full sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Wordmark */}
        <div className="flex items-center gap-2">
          <Logo size={17} className="text-white" />
          <span
            className="text-sm font-semibold text-text-primary"
            style={{ fontFamily: "var(--font-family-display)" }}
          >
            Traqit
          </span>
        </div>

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

        {/* Sign in */}
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
