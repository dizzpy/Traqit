import { HeroPreview } from "@/components/marketing/hero-preview";
import { Particles } from "@/components/ui/particles";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Features } from "@/components/marketing/features";
import { Pricing } from "@/components/marketing/pricing";
import { FAQ } from "@/components/marketing/faq";
import { FounderMemo } from "@/components/marketing/founder-memo";

export function Landing() {
  return (
    <div className="w-full">
      <div className="relative isolate pt-32">
        <Particles
          className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_42%,black_45%,transparent_92%)]"
          quantity={180}
          staticity={60}
          ease={70}
          size={0.5}
          color="#c4b5fd"
        />

        {/* Hero */}
        <section className="relative mx-auto max-w-7xl px-6 text-center md:px-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 -bottom-32 inset-x-0 -z-10"
            style={{
              background:
                "radial-gradient(circle at 50% 38%, color-mix(in oklab, var(--accent) 10%, transparent), transparent 65%)",
            }}
          />

          <div className="relative z-10 -translate-y-4 animate-fade-in opacity-0 [--animation-delay:0ms] flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-text-secondary backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Built for SE students in Sri Lanka
            </span>
          </div>

          <h1
            className="relative z-10 -translate-y-4 animate-fade-in opacity-0 [--animation-delay:150ms] mt-6 text-balance bg-gradient-to-br from-[#f6f5fa] from-30% to-[#c4b5fd]/60 bg-clip-text py-2 text-5xl font-semibold leading-none tracking-tighter text-transparent sm:text-6xl md:text-7xl"
            style={{ fontFamily: "var(--font-family-display)" }}
          >
            Track every application.
            <br className="hidden md:block" />
            Nail every interview.
          </h1>

          <div className="relative z-10 mt-10 mb-12 -translate-y-4 animate-fade-in opacity-0 [--animation-delay:300ms] flex justify-center">
            <a
              href="/login"
              className="inline-flex items-center justify-center gap-2 h-11 px-7 rounded-[11px] bg-white text-[#0b0a0e] text-sm font-semibold hover:-translate-y-0.5 hover:bg-white/90 transition-all duration-150"
            >
              Start for Free
            </a>
          </div>

          <HeroPreview />
        </section>
      </div>

      <HowItWorks />
      <Features />
      <Pricing />
      <FAQ />
      <FounderMemo />
    </div>
  );
}
