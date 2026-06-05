import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  FlowSquareIcon,
  BookmarkIcon,
  Mail01Icon,
  Clock01Icon,
  BarChartIcon,
} from "@hugeicons/core-free-icons";
import { APP_URL } from "@/lib/urls";
import { HeroPreview } from "@/components/marketing/hero-preview";
import { Particles } from "@/components/ui/particles";

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
      {/* Hero wrapper — isolates the particle layer so it sits behind the hero
          content but above the page background, and fades at the edges via a
          mask so there's no visible canvas box. */}
      <div className="relative isolate pt-32">
        {/* Particles spanning the full hero area */}
        <Particles
          className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_42%,black_45%,transparent_92%)]"
          quantity={180}
          staticity={60}
          ease={70}
          size={0.5}
          color="#c4b5fd"
        />

        {/* Section 1 — Hero */}
        <section className="relative mx-auto max-w-7xl px-6 text-center md:px-8">
          {/* Radial glow behind the text */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 -bottom-32 inset-x-0 -z-10"
            style={{
              background:
                "radial-gradient(circle at 50% 38%, color-mix(in oklab, var(--accent) 10%, transparent), transparent 65%)",
            }}
          />

          {/* Pill banner */}
        <div className="relative z-10 -translate-y-4 animate-fade-in opacity-0 [--animation-delay:0ms] flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-text-secondary backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Built for SE students in Sri Lanka
          </span>
        </div>

        {/* Heading */}
        <h1
          className="relative z-10 -translate-y-4 animate-fade-in opacity-0 [--animation-delay:150ms] mt-6 text-balance bg-gradient-to-br from-[#f6f5fa] from-30% to-[#c4b5fd]/60 bg-clip-text py-2 text-5xl font-semibold leading-none tracking-tighter text-transparent sm:text-6xl md:text-7xl"
          style={{ fontFamily: "var(--font-family-display)" }}
        >
          Track every application.
          <br className="hidden md:block" />
          Nail every interview.
        </h1>

        {/* CTA */}
        <div className="relative z-10 mt-10 mb-12 -translate-y-4 animate-fade-in opacity-0 [--animation-delay:300ms] flex justify-center">
          <a
            href={`${APP_URL}/login`}
            className="inline-flex items-center justify-center gap-2 h-11 px-7 rounded-[11px] bg-white text-[#0b0a0e] text-sm font-semibold hover:-translate-y-0.5 hover:bg-white/90 transition-all duration-150"
          >
            Start for Free →
          </a>
        </div>

        {/* Dashboard preview */}
        <HeroPreview />
        </section>
      </div>

      {/* Section 2 — The problem */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-20 md:py-28 scroll-mt-20">
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
