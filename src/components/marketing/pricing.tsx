"use client"

import { useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import { MagicCard } from "@/components/ui/magic-card"
import { BlurFade } from "@/components/ui/blur-fade"
import { ShineBorder } from "@/components/ui/shine-border"
import { FaArrowRight } from "react-icons/fa6"

// ─── Config ───────────────────────────────────────────────────────────────────

type Currency = "USD" | "LKR"

const PRICES = {
  pro:  { USD: "0.99", LKR: "324" },
  free: { USD: "0",    LKR: "0"   },
  max:  { USD: "1.99", LKR: "652" },
} as const

const SYMBOLS: Record<Currency, string> = { USD: "$", LKR: "Rs." }

const FREE_FEATURES = [
  "Unlimited applications",
  "Custom pipelines per company",
  "Ghost detection — 14-day auto-flag",
  "Save jobs with deadlines",
  "Outreach templates",
  "Live activity feed",
]

const PRO_FEATURES = [
  "Everything in Free",
  "Email reminders before interviews",
  "Advanced analytics dashboard",
  "Browser extension — save any job in one click",
  "Data export (JSON)",
  "Custom ghost detection threshold",
]

const MAX_FEATURES = [
  "Everything in Pro",
  "Team workspace — up to 10 members",
  "Shared pipeline templates across the team",
  "Mentor view — read-only board access for coaches",
  "Bulk export for reporting",
  "Dedicated support",
]

// ─── GlareHover (ReactBits — inlined) ────────────────────────────────────────

function GlareCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const rgba = "rgba(196, 181, 253, 0.12)"

  const animateIn = () => {
    const el = overlayRef.current
    if (!el) return
    el.style.transition = "none"
    el.style.backgroundPosition = "-100% -100%, 0 0"
    el.style.transition = "700ms ease"
    el.style.backgroundPosition = "120% 120%, 0 0"
  }
  const animateOut = () => {
    const el = overlayRef.current
    if (!el) return
    el.style.transition = "700ms ease"
    el.style.backgroundPosition = "-100% -100%, 0 0"
  }

  return (
    <div
      className={cn("relative overflow-hidden rounded-2xl", className)}
      onMouseEnter={animateIn}
      onMouseLeave={animateOut}
    >
      <div
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 z-10 rounded-2xl"
        style={{
          background: `linear-gradient(-45deg, transparent 55%, ${rgba} 68%, transparent 100%)`,
          backgroundSize: "280% 280%, 100% 100%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "-100% -100%, 0 0",
        }}
      />
      {children}
    </div>
  )
}

// ─── Currency toggle ──────────────────────────────────────────────────────────

function CurrencyToggle({ value, onChange }: { value: Currency; onChange: (c: Currency) => void }) {
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-surface p-1 gap-0.5">
      {(["USD", "LKR"] as Currency[]).map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className="relative px-4 py-1.5 text-xs font-semibold rounded-full z-10 transition-colors duration-200"
          style={{ color: value === c ? "#fff" : "var(--color-text-secondary)" }}
        >
          {value === c && (
            <motion.div
              layoutId="currency-bg"
              className="absolute inset-0 rounded-full bg-accent"
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
            />
          )}
          <span className="relative z-10">{c}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Animated price number ────────────────────────────────────────────────────

function Price({
  plan,
  currency,
  large,
}: {
  plan: keyof typeof PRICES
  currency: Currency
  large?: boolean
}) {
  const raw = PRICES[plan][currency]
  const isFree = raw === "0"
  const symbol = SYMBOLS[currency]

  return (
    <div className="flex items-end gap-1 min-h-14">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${plan}-${currency}`}
          initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-end gap-1"
        >
          <span
            className={cn(
              "font-black leading-none tracking-tighter",
              large ? "text-5xl text-text-primary" : "text-4xl text-text-primary/50"
            )}
            style={{ fontFamily: "var(--font-family-display)" }}
          >
            {isFree ? "Free" : `${symbol}${raw}`}
          </span>
          {!isFree && (
            <span className="text-[11px] text-text-tertiary mb-1.5">/mo</span>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ─── Feature list ─────────────────────────────────────────────────────────────

function Features({ items, disabled }: { items: string[]; disabled?: boolean }) {
  return (
    <ul className="space-y-2.5">
      {items.map((f) => (
        <li key={f} className="flex items-start gap-2.5">
          <span
            className={cn(
              "mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full flex items-center justify-center text-[8px] font-black",
              disabled ? "bg-surface-elevated text-text-tertiary" : "bg-accent/15 text-accent"
            )}
          >
            ✓
          </span>
          <span className={cn("text-[11px] leading-relaxed", disabled ? "text-text-tertiary" : "text-text-secondary")}>
            {f}
          </span>
        </li>
      ))}
    </ul>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function Pricing() {
  const [currency, setCurrency] = useState<Currency>("USD")

  return (
    <section id="pricing" className="max-w-5xl mx-auto px-6 py-20 md:py-28 scroll-mt-20">

      {/* Header */}
      <BlurFade inView delay={0}>
        <div className="text-center mb-14 space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/8 px-3 py-1 text-xs font-semibold text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Pricing
          </span>
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-semibold text-text-primary tracking-[-0.02em] leading-[1.15]"
            style={{ fontFamily: "var(--font-family-display)" }}
          >
            Simple, transparent pricing.
            <br className="hidden sm:block" />
            Start free, upgrade when ready.
          </h2>
          <p className="text-sm text-text-secondary max-w-xs mx-auto leading-relaxed">
            One plan with everything you need. Paid tiers are coming soon.
          </p>
          {/* Currency toggle */}
          <motion.div
            className="flex justify-center pt-2"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <CurrencyToggle value={currency} onChange={setCurrency} />
          </motion.div>
        </div>
      </BlurFade>

      {/* 3-column grid: Pro | Free | Max */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.12fr_1fr] gap-4 items-start">

        {/* ── Pro (disabled) ── */}
        <BlurFade inView delay={0.12} direction="right">
          <GlareCard>
            <MagicCard
              className="rounded-2xl p-5"
              innerClassName="flex flex-col gap-4"
              innerBg="var(--color-surface)"
              gradientFrom="#4b5563"
              gradientTo="#1f2937"
              gradientColor="#ffffff04"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Pro</span>
                <span className="text-[10px] font-semibold text-text-tertiary bg-surface-elevated border border-border px-2 py-0.5 rounded-full">
                  Coming soon
                </span>
              </div>

              <Price plan="pro" currency={currency} />

              <p className="text-[11px] text-text-tertiary leading-relaxed">
                For serious job hunters who want deeper insights and more control.
              </p>

              <div className="opacity-40 pointer-events-none select-none">
                <Features items={PRO_FEATURES} disabled />
              </div>

              <button
                disabled
                className="w-full h-9 rounded-xl border border-border/50 text-[11px] font-semibold text-text-tertiary cursor-not-allowed opacity-40 mt-auto"
              >
                Coming soon
              </button>
            </MagicCard>
          </GlareCard>
        </BlurFade>

        {/* ── Free (hero card) ── */}
        <BlurFade inView delay={0.05}>
          <motion.div
            className="relative rounded-2xl"
            initial={{ y: 12 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.05 }}
          >
            {/* Outer ambient glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-3 -z-10 rounded-3xl opacity-30 blur-2xl"
              style={{
                background: "radial-gradient(ellipse at 50% 60%, #7c3aed, transparent 70%)",
              }}
            />

            {/* Animated shine border */}
            <ShineBorder
              borderWidth={1.5}
              duration={7}
              shineColor={["#c4b5fd", "#8b5cf6", "#c4b5fd"]}
            />

            <MagicCard
              className="rounded-2xl p-5"
              innerClassName="flex flex-col gap-4"
              innerBg="var(--color-surface)"
              gradientFrom="#c4b5fd"
              gradientTo="#7c3aed"
              gradientColor="#c4b5fd10"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent">Free</span>
                <span className="text-[10px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                  ✦ Active plan
                </span>
              </div>

              {/* Price + subtle breathing glow */}
              <div className="relative flex items-center justify-start py-3">
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute -left-2 top-1/2 -translate-y-1/2 w-28 h-28 rounded-full"
                  animate={{ scale: [1, 1.25, 1], opacity: [0.18, 0.07, 0.18] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    background: "radial-gradient(circle, var(--accent), transparent 70%)",
                    filter: "blur(16px)",
                  }}
                />
                <Price plan="free" currency={currency} large />
              </div>

              <p className="text-[11px] text-text-secondary leading-relaxed">
                Everything you need to manage your internship hunt, completely free. No credit card.
              </p>

              <Features items={FREE_FEATURES} />

              <a
                href="/login"
                className="w-full h-10 rounded-xl bg-accent text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-accent/90 hover:-translate-y-0.5 transition-all duration-150 shadow-sm shadow-accent/20"
              >
                Get started free
                <FaArrowRight size={11} />
              </a>
            </MagicCard>
          </motion.div>
        </BlurFade>

        {/* ── Max (disabled) ── */}
        <BlurFade inView delay={0.18} direction="left">
          <GlareCard>
            <MagicCard
              className="rounded-2xl p-5"
              innerClassName="flex flex-col gap-4"
              innerBg="var(--color-surface)"
              gradientFrom="#4b5563"
              gradientTo="#1f2937"
              gradientColor="#ffffff04"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Max</span>
                <span className="text-[10px] font-semibold text-text-tertiary bg-surface-elevated border border-border px-2 py-0.5 rounded-full">
                  Coming soon
                </span>
              </div>

              <Price plan="max" currency={currency} />

              <p className="text-[11px] text-text-tertiary leading-relaxed">
                For power users who want AI features, team tools, and full platform access.
              </p>

              <div className="opacity-40 pointer-events-none select-none">
                <Features items={MAX_FEATURES} disabled />
              </div>

              <button
                disabled
                className="w-full h-9 rounded-xl border border-border/50 text-[11px] font-semibold text-text-tertiary cursor-not-allowed opacity-40 mt-auto"
              >
                Coming soon
              </button>
            </MagicCard>
          </GlareCard>
        </BlurFade>
      </div>

      {/* Footer */}
      <BlurFade inView delay={0.3}>
        <p className="text-center text-[11px] text-text-tertiary mt-10">
          Paid plans will include a 14-day free trial. No credit card needed to start today.
        </p>
      </BlurFade>
    </section>
  )
}
