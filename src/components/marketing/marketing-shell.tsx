import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/footer";

/**
 * Structural wrapper for the marketing site: nav + full-width content, no
 * sidebar. Shared by the `(marketing)` layout and the `/preview-landing` dev
 * route so both render an identical front door.
 */
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
