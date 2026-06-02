import { MarketingShell } from "@/components/marketing/marketing-shell";
import { Landing } from "@/components/marketing/landing";

export const metadata = { title: "Landing preview" };

/**
 * Dev-only preview of the marketing page. On localhost the host resolves to the
 * "app" subdomain, so `/` redirects into the app — this non-gated route lets us
 * see the landing page during development. Whitelisted in middleware.
 */
export default function PreviewLandingPage() {
  return (
    <MarketingShell>
      <Landing />
    </MarketingShell>
  );
}
