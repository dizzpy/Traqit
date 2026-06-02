import { MarketingShell } from "@/components/marketing/marketing-shell";

/**
 * Layout for the public marketing site, served on `traqit.*`. No sidebar, no
 * auth — just the marketing nav wrapped around the page content.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarketingShell>{children}</MarketingShell>;
}
