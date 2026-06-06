"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { BlurFade } from "@/components/ui/blur-fade"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

const FAQS = [
  {
    q: "Is InternTracker really free?",
    a: "Yes, completely. No credit card required, no trial period that expires. The Free plan gives you unlimited applications, custom pipelines per company, ghost detection, and every core feature. Pro and Max tiers will come later for advanced stuff.",
  },
  {
    q: "How is this different from a Notion template or spreadsheet?",
    a: "Spreadsheets are general-purpose — InternTracker is built specifically for job hunting. It auto-flags applications that go quiet after 14 days, lets you build a custom stage pipeline per company, and shows a real-time activity feed with no manual logging.",
  },
  {
    q: "What is ghost detection?",
    a: "When a company hasn't responded in 14 days, InternTracker automatically marks that application as a ghost — a soft amber alert in your feed. It's a gentle nudge so you know to follow up or mentally move on, without having to track dates yourself.",
  },
  {
    q: "Is my data private?",
    a: "Your applications and notes are yours alone. We don't sell, share, or analyze your personal job hunt data. Everything is stored securely in your account and only ever visible to you.",
  },
  {
    q: "When are paid plans launching?",
    a: "Pro and Max are in development. Early Free users will hear first and get a discounted rate when they're ready. No locked-in ETA — we'd rather ship it right than rush it.",
  },
  {
    q: "Does it work on mobile?",
    a: "The web app is fully responsive and works great on any screen size. A native mobile app is on the roadmap — it'll happen once the core experience is polished.",
  },
]

function FAQItem({ q, a, delay }: { q: string; a: string; delay: number }) {
  const [open, setOpen] = useState(false)

  return (
    <BlurFade inView delay={delay}>
      <div
        className={cn(
          "group rounded-2xl border transition-colors duration-200",
          open
            ? "border-accent/30 bg-surface"
            : "border-border bg-surface/40 hover:border-border/70 hover:bg-surface/70"
        )}
      >
        {/* Question row */}
        <button
          className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left"
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className={cn(
              "text-sm font-medium leading-snug transition-colors duration-200 pt-px",
              open ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary"
            )}
          >
            {q}
          </span>

          <motion.span
            className={cn(
              "shrink-0 flex items-center justify-center w-6 h-6 rounded-full mt-px transition-colors duration-200",
              open ? "bg-accent/15 text-accent" : "bg-surface-elevated text-text-tertiary"
            )}
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
          >
            <HugeiconsIcon icon={Add01Icon} size={12} strokeWidth={2.5} />
          </motion.span>
        </button>

        {/* Answer — animated height */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="answer"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { type: "spring", stiffness: 320, damping: 30 },
                opacity: { duration: 0.18, ease: "easeOut" },
              }}
              className="overflow-hidden"
            >
              <motion.p
                initial={{ y: -6 }}
                animate={{ y: 0 }}
                exit={{ y: -4 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="px-5 pb-4 text-[13px] text-text-secondary leading-relaxed"
              >
                {a}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BlurFade>
  )
}

export function FAQ() {
  return (
    <section id="faq" className="max-w-2xl mx-auto px-6 py-20 md:py-28 scroll-mt-20">

      {/* Header */}
      <BlurFade inView delay={0}>
        <div className="text-center mb-12 space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/8 px-3 py-1 text-xs font-semibold text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            FAQ
          </span>
          <h2
            className="text-2xl sm:text-3xl font-semibold text-text-primary tracking-[-0.02em] leading-[1.15]"
            style={{ fontFamily: "var(--font-family-display)" }}
          >
            Questions? Answered.
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Still have questions?{" "}
            <a
              href="mailto:hello@interntracker.app"
              className="text-accent underline-offset-2 hover:underline"
            >
              hello@interntracker.app
            </a>
          </p>
        </div>
      </BlurFade>

      {/* FAQ items */}
      <div className="flex flex-col gap-2">
        {FAQS.map((faq, i) => (
          <FAQItem key={faq.q} q={faq.q} a={faq.a} delay={0.04 + i * 0.055} />
        ))}
      </div>
    </section>
  )
}
