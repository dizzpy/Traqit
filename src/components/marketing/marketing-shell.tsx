import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { ScrollReset } from "@/components/marketing/scroll-reset";

/**
 * Structural wrapper for the marketing site: nav + full-width content, no
 * sidebar. Used by the `(marketing)` layout.
 */
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <MarketingNav />
      <ScrollReset />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
