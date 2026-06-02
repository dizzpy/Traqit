import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  FlowSquareIcon,
  BookmarkIcon,
  Mail01Icon,
  Clock01Icon,
  BarChartIcon,
} from "@hugeicons/core-free-icons";
import { APP_URL } from "@/lib/urls";
import { SeeHowItWorksButton } from "@/components/marketing/see-how-it-works-button";

const PROBLEMS: { icon: IconSvgElement; text: string }[] = [
  {
    icon: FlowSquareIcon,
    text: "Every company has a different interview process — Notion doesn't know that",
  },
  {
    icon: Clock01Icon,
    text: "Ghosted after 14 days? You'll know automatically",
  },
  {
    icon: BarChartIcon,
    text: "Which source actually gets you replies? Now you can see",
  },
];

const FEATURES: { icon: IconSvgElement; title: string; body: string }[] = [
  {
    icon: FlowSquareIcon,
    title: "Custom pipelines, per company",
    body: "Build the exact interview flow for each job — OA → Technical → HR → CEO, or just Apply → Call → Offer.",
  },
  {
    icon: BookmarkIcon,
    title: "Save jobs before you apply",
    body: "Spot a role but not ready? Save it with a deadline. One click to promote it when you are.",
  },
  {
    icon: Mail01Icon,
    title: "Draft outreach in one click",
    body: "Reusable templates with {company} and {position} placeholders. Opens a pre-filled Gmail draft — you just hit send.",
  },
];

export function Landing() {
  return (
    <div className="w-full">
      {/* Section 1 — Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 min-h-[calc(100vh-68px)] overflow-hidden">
        {/* Single allowed glow: --accent at 8% behind the hero text. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(circle at 50% 38%, color-mix(in oklab, var(--accent) 8%, transparent), transparent 60%)",
          }}
        />

        <h1
          className="text-[32px] sm:text-4xl lg:text-5xl font-semibold text-text-primary leading-[1.1] tracking-[-0.02em] max-w-2xl text-balance"
          style={{ fontFamily: "var(--font-family-display)" }}
        >
          Track every application. Nail every interview.
        </h1>

        <p className="mt-5 text-lg text-text-secondary max-w-125 leading-relaxed">
          Traqit is a job tracker built for SE students — with custom interview
          pipelines for every company, not a one-size-fits-all status column.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row items-center gap-3">
          <a
            href={`${APP_URL}/login`}
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-[11px] bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent-hover hover:-translate-y-0.5 transition-all duration-150"
          >
            Start for free →
          </a>
          <SeeHowItWorksButton />
        </div>
      </section>

      {/* Section 2 — The problem */}
      <section className="max-w-5xl mx-auto px-6 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
          <h2
            className="text-2xl sm:text-3xl font-semibold text-text-primary leading-[1.15] tracking-[-0.01em]"
            style={{ fontFamily: "var(--font-family-display)" }}
          >
            Notion tracks rows. Traqit tracks careers.
          </h2>

          <ul className="flex flex-col gap-5">
            {PROBLEMS.map((p) => (
              <li key={p.text} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-accent-soft-fg">
                  <HugeiconsIcon icon={p.icon} size={17} strokeWidth={1.5} />
                </span>
                <span className="text-sm text-text-secondary leading-relaxed pt-1.5">
                  {p.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Section 3 — Features */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-20 md:py-24 scroll-mt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-card border border-border bg-surface p-5 hover:border-border-hover hover:-translate-y-0.5 transition-all duration-150"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent-soft text-accent-soft-fg">
                <HugeiconsIcon icon={f.icon} size={18} strokeWidth={1.5} />
              </span>
              <h3
                className="mt-4 text-base font-semibold text-text-primary"
                style={{ fontFamily: "var(--font-family-display)" }}
              >
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4 — CTA banner */}
      <section className="max-w-5xl mx-auto px-6 pb-28 pt-4">
        <div className="rounded-card border border-border bg-surface px-6 py-12 flex flex-col items-center text-center gap-5">
          <h2
            className="text-xl sm:text-2xl font-semibold text-text-primary tracking-[-0.01em]"
            style={{ fontFamily: "var(--font-family-display)" }}
          >
            Built for your job hunt. Free to start.
          </h2>
          <a
            href={`${APP_URL}/login`}
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-[11px] bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent-hover hover:-translate-y-0.5 transition-all duration-150"
          >
            Create your account →
          </a>
        </div>
      </section>
    </div>
  );
}
