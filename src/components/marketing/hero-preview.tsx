"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { BorderBeam } from "@/components/magic/border-beam";
import { LaserFlow } from "@/components/marketing/laser-flow";

export function HeroPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "-100px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="relative mx-auto mt-16 w-full max-w-5xl animate-fade-up opacity-0 [--animation-delay:600ms] [perspective:2000px] after:absolute after:inset-0 after:z-50 after:[background:linear-gradient(to_top,var(--bg)_30%,transparent)]"
    >
      {/* Violet laser-flow beam descending into the top edge of the preview.
          Canvas renders on black, so `screen` blend drops the black and keeps
          only the light. Bright base lands just above the dashboard's top. */}
      <div className="pointer-events-none absolute inset-x-0 -top-[346px] -z-10 h-[640px] mix-blend-screen">
        <LaserFlow
          color="#8b5cf6"
          verticalBeamOffset={-0.04}
          horizontalBeamOffset={0.0}
          verticalSizing={1.4}
          horizontalSizing={1.2}
          wispDensity={4}
          wispIntensity={4.5}
          fogIntensity={0.42}
          flowStrength={0.22}
        />
      </div>

      <div
        className={[
          "relative rounded-xl border border-white/10 bg-surface/5",
          "before:absolute before:-top-8 before:left-0 before:h-[120%] before:w-full before:opacity-0",
          "before:[background-image:linear-gradient(to_bottom,var(--accent),var(--accent-soft-fg),transparent_50%)]",
          "before:[filter:blur(140px)]",
          inView ? "before:animate-image-glow" : "",
        ].join(" ")}
      >
        <BorderBeam
          size={250}
          duration={12}
          delay={0}
          colorFrom="var(--accent)"
          colorTo="var(--accent-soft-fg)"
        />
        <Image
          src="/landing/dashboard-preview.png"
          alt="Traqit dashboard preview"
          width={1280}
          height={800}
          className="relative w-full rounded-[inherit] border border-white/5 object-contain"
          priority
        />
      </div>
    </div>
  );
}
