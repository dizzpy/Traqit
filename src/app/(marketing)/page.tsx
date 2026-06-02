import { Landing } from "@/components/marketing/landing";

export const metadata = {
  title: "Traqit — Track every application. Nail every interview.",
  description:
    "A job tracker built for SE students, with custom interview pipelines for every company.",
};

/** Public landing page served at the marketing root. */
export default function MarketingPage() {
  return <Landing />;
}
