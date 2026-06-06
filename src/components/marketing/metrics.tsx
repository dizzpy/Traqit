"use client"

import { motion } from "motion/react"
import { BlurFade } from "@/components/ui/blur-fade"
import { NumberTicker } from "@/components/ui/number-ticker"

const STATS = [
  {
    value: 0,
    prefix: "$",
    suffix: "",
    label: "Cost to get started",
    sub: "Free, always. No card needed.",
  },
  {
    value: 14,
    prefix: "",
    suffix: "d",
    label: "Ghost detection window",
    sub: "Auto-flagged when silence hits 14 days.",
  },
  {
    value: 100,
    prefix: "",
    suffix: "%",
    label: "Your data, yours alone",
    sub: "Zero data sold. Zero data shared.",
  },
  {
    value: 30,
    prefix: "",
    suffix: "+",
    label: "Applications tracked",
    sub: "Average per user in their first month.",
  },
] as const

export function Metrics() {
  return (
    <section className="w-full py-16 md:py-20 border-y border-border/50 overflow-hidden">
      {/* Subtle background grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative max-w-5xl mx-auto px-6">
        {/* Label */}
        <BlurFade inView delay={0}>
          <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-text-tertiary mb-12">
            Why InternTracker
          </p>
        </BlurFade>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/40 rounded-2xl overflow-hidden border border-border/50">
          {STATS.map((stat, i) => (
            <BlurFade key={stat.label} inView delay={0.06 + i * 0.07}>
              <motion.div
                className="bg-background flex flex-col gap-2 px-6 py-8 h-full"
                whileHover={{ backgroundColor: "var(--color-surface)" }}
                transition={{ duration: 0.2 }}
              >
                {/* Number */}
                <div
                  className="flex items-end gap-0.5 leading-none"
                  style={{ fontFamily: "var(--font-family-display)" }}
                >
                  {stat.prefix && (
                    <span className="text-2xl font-black text-accent/60 mb-0.5">
                      {stat.prefix}
                    </span>
                  )}
                  {stat.value === 0 ? (
                    <span className="text-4xl md:text-5xl font-black text-text-primary">
                      0
                    </span>
                  ) : (
                    <NumberTicker
                      value={stat.value}
                      className="text-4xl md:text-5xl font-black text-text-primary"
                    />
                  )}
                  {stat.suffix && (
                    <span className="text-2xl font-black text-accent mb-0.5">
                      {stat.suffix}
                    </span>
                  )}
                </div>

                {/* Label */}
                <p className="text-[13px] font-semibold text-text-primary leading-snug">
                  {stat.label}
                </p>

                {/* Sub */}
                <p className="text-[11px] text-text-tertiary leading-relaxed">
                  {stat.sub}
                </p>
              </motion.div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  )
}
