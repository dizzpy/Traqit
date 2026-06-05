"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import { BlurFade } from "@/components/ui/blur-fade"
import { MagicCard } from "@/components/ui/magic-card"
import { NumberTicker } from "@/components/ui/number-ticker"
import { AnimatedList } from "@/components/ui/animated-list"

// ─── Step 1: Add Applications ────────────────────────────────────────────────

const DEMO_JOBS = [
  {
    trigger: "stripe.com/jobs",
    company: "Stripe",
    role: "Software Engineer Intern",
    deadline: "Aug 1, 2026",
    location: "San Francisco, CA",
    avatar: "S",
    avatarBg: "bg-[#635BFF]",
  },
  {
    trigger: "careers.google.com",
    company: "Google",
    role: "STEP Intern",
    deadline: "Jul 15, 2026",
    location: "Mountain View, CA",
    avatar: "G",
    avatarBg: "bg-[#4285F4]",
  },
]

function AddApplicationCard() {
  const [url, setUrl] = useState("")
  const [job, setJob] = useState<(typeof DEMO_JOBS)[0] | null>(null)
  const [loading, setLoading] = useState(false)

  const autofill = (demoJob: (typeof DEMO_JOBS)[0]) => {
    setJob(null)
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setJob(demoJob)
    }, 900)
  }

  const handleFill = () => {
    const matched = DEMO_JOBS.find((j) =>
      url.toLowerCase().includes(j.trigger.split(".")[0])
    )
    autofill(matched ?? DEMO_JOBS[0])
  }

  return (
    <MagicCard
      className="rounded-xl p-4"
      innerClassName="space-y-3"
      innerBg="var(--color-surface)"
      gradientFrom="#c4b5fd"
      gradientTo="#7c3aed"
      gradientColor="#c4b5fd10"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
        Add a job
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setJob(null) }}
          onKeyDown={(e) => e.key === "Enter" && handleFill()}
          placeholder="Paste a job URL or title…"
          className="flex-1 text-xs bg-background border border-border rounded-lg px-3 py-2 text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent/60 transition-colors"
        />
        <button
          onClick={handleFill}
          disabled={loading}
          className="shrink-0 px-3 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-block h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
          ) : (
            "Autofill"
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-[11px] text-text-tertiary"
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full border border-accent/40 border-t-accent animate-spin" />
            Fetching job details…
          </motion.div>
        )}
        {job && (
          <motion.div
            key="filled"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="rounded-xl border border-accent/25 bg-accent/5 p-3 space-y-2.5"
          >
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-bold",
                  job.avatarBg
                )}
              >
                {job.avatar}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-text-primary">{job.company}</p>
                <p className="text-[11px] text-text-secondary truncate">{job.role}</p>
              </div>
              <span className="ml-auto shrink-0 text-[10px] text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded-full">
                Autofilled ✓
              </span>
            </div>
            <div className="flex gap-3 text-[11px] text-text-secondary pl-0.5">
              <span>📅 {job.deadline}</span>
              <span>📍 {job.location}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!job && !loading && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-text-tertiary">Try:</span>
          {DEMO_JOBS.map((j) => (
            <button
              key={j.company}
              onClick={() => { setUrl(j.trigger); autofill(j) }}
              className="text-[11px] text-accent hover:underline underline-offset-2"
            >
              {j.company}
            </button>
          ))}
        </div>
      )}
    </MagicCard>
  )
}

// ─── Step 2: Pipeline Builder ─────────────────────────────────────────────────

const STAGES = ["Applied", "OA", "Technical", "HR", "Offer 🎉"]

function PipelineCard() {
  const [activeIdx, setActiveIdx] = useState(1)

  return (
    <MagicCard
      className="rounded-xl p-4"
      innerClassName="space-y-3"
      innerBg="var(--color-surface)"
      gradientFrom="#c4b5fd"
      gradientTo="#7c3aed"
      gradientColor="#c4b5fd10"
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
          Pipeline
        </p>
        <span className="text-[10px] text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded-full">
          Google STEP
        </span>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {STAGES.map((stage, i) => (
          <button
            key={stage}
            onClick={() => setActiveIdx(i)}
            className={cn(
              "shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-150",
              i === activeIdx
                ? "bg-accent text-white shadow-sm"
                : i < activeIdx
                  ? "bg-accent/15 text-accent"
                  : "bg-background text-text-tertiary border border-border"
            )}
          >
            {stage}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-background p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] text-text-tertiary">Current stage</p>
            <p className="text-sm font-semibold text-text-primary mt-0.5">
              {STAGES[activeIdx]}
            </p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setActiveIdx((p) => Math.max(p - 1, 0))}
              disabled={activeIdx === 0}
              className="h-6 w-6 rounded-md border border-border flex items-center justify-center text-text-secondary hover:border-accent/40 hover:text-accent transition-colors disabled:opacity-30 text-xs"
            >
              ←
            </button>
            <button
              onClick={() => setActiveIdx((p) => Math.min(p + 1, STAGES.length - 1))}
              disabled={activeIdx === STAGES.length - 1}
              className="h-6 w-6 rounded-md border border-border flex items-center justify-center text-text-secondary hover:border-accent/40 hover:text-accent transition-colors disabled:opacity-30 text-xs"
            >
              →
            </button>
          </div>
        </div>
        {activeIdx === STAGES.length - 1 ? (
          <p className="text-[11px] text-accent font-medium">You made it through the whole pipeline!</p>
        ) : (
          <p className="text-[11px] text-text-tertiary">
            {STAGES.length - 1 - activeIdx} stage{STAGES.length - 1 - activeIdx !== 1 ? "s" : ""} remaining
          </p>
        )}
      </div>

      <div className="relative h-1.5 rounded-full bg-background overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-linear-to-r from-accent/60 to-accent"
          animate={{ width: `${((activeIdx) / (STAGES.length - 1)) * 100}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </div>
    </MagicCard>
  )
}

// ─── Step 3: Activity Feed ────────────────────────────────────────────────────

const NOTIFICATIONS = [
  {
    icon: "👻",
    label: "Ghost alert",
    text: "Stripe hasn't responded in 14 days",
    labelColor: "text-amber-400",
    labelBg: "bg-amber-400/10",
  },
  {
    icon: "⏰",
    label: "Reminder",
    text: "Amazon OA deadline in 2 days",
    labelColor: "text-sky-400",
    labelBg: "bg-sky-400/10",
  },
  {
    icon: "✅",
    label: "Update",
    text: "Google interview confirmed for Thu",
    labelColor: "text-green-400",
    labelBg: "bg-green-400/10",
  },
  {
    icon: "👻",
    label: "Ghost alert",
    text: "Meta hasn't responded in 21 days",
    labelColor: "text-amber-400",
    labelBg: "bg-amber-400/10",
  },
]

function ActivityFeedCard() {
  return (
    <MagicCard
      className="rounded-xl p-4"
      innerClassName="space-y-3"
      innerBg="var(--color-surface)"
      gradientFrom="#c4b5fd"
      gradientTo="#7c3aed"
      gradientColor="#c4b5fd10"
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
          Activity feed
        </p>
        <span className="flex items-center gap-1.5 text-[11px] text-green-400 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          Live
        </span>
      </div>
      <div className="overflow-y-auto max-h-52 space-y-2 pr-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <AnimatedList delay={1800} className="gap-2">
          {NOTIFICATIONS.map((n) => (
            <div
              key={n.text}
              className="flex items-start gap-2.5 rounded-lg border border-border bg-background p-2.5 w-full"
            >
              <span
                className={cn(
                  "h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-xs mt-0.5",
                  n.labelBg
                )}
              >
                {n.icon}
              </span>
              <div className="min-w-0">
                <p className={cn("text-[10px] font-bold", n.labelColor)}>{n.label}</p>
                <p className="text-xs text-text-secondary leading-snug">{n.text}</p>
              </div>
            </div>
          ))}
        </AnimatedList>
      </div>
    </MagicCard>
  )
}

// ─── Step 4: Stats / Offer Card ───────────────────────────────────────────────

const STATS = [
  { label: "Applied", value: 24 },
  { label: "Interviews", value: 8 },
  { label: "Offers", value: 2 },
]

function StatsCard() {
  return (
    <MagicCard
      className="rounded-xl p-4"
      innerClassName="space-y-4"
      innerBg="var(--color-surface)"
      gradientFrom="#c4b5fd"
      gradientTo="#7c3aed"
      gradientColor="#c4b5fd10"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
        Your season
      </p>
      <div className="grid grid-cols-3 gap-2">
        {STATS.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-lg border border-border bg-background p-3 text-center"
          >
            <p className="text-xl font-bold text-accent tabular-nums">
              <NumberTicker value={value} className="text-accent" />
            </p>
            <p className="text-[11px] text-text-secondary mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 25 }}
        className="rounded-xl border border-accent/25 bg-accent/5 p-3 flex items-center gap-3"
      >
        <motion.span
          animate={{ rotate: [0, -10, 10, -6, 6, 0] }}
          transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.5 }}
          className="text-2xl select-none"
        >
          🎉
        </motion.span>
        <div>
          <p className="text-xs font-semibold text-text-primary">Offer received — Stripe</p>
          <p className="text-[11px] text-text-secondary mt-0.5">
            Software Engineer Intern · $55 / hr
          </p>
        </div>
      </motion.div>
    </MagicCard>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: "01",
    title: "Add your applications",
    body: "Paste a job URL or type a title — InternTracker autofills the company, role, and deadline so you don't have to copy-paste anything.",
    card: <AddApplicationCard />,
  },
  {
    number: "02",
    title: "Build your pipeline",
    body: "Every company has a different process. Design the exact interview stages for each one — OA, Technical, HR, whatever theirs actually is.",
    card: <PipelineCard />,
  },
  {
    number: "03",
    title: "Stay in the loop",
    body: "Log contacts, set reminders, and get flagged automatically when a company goes quiet after 14 days. No more wondering.",
    card: <ActivityFeedCard />,
  },
  {
    number: "04",
    title: "Land the offer",
    body: "A clean record of every application, stage, and conversation. Know your conversion rate. Know what worked.",
    card: <StatsCard />,
  },
]

export function HowItWorks() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-20 md:py-28">
      {/* Header */}
      <BlurFade inView delay={0}>
        <div className="text-center mb-16 space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/8 px-3 py-1 text-xs font-semibold text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            How it works
          </span>
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-semibold text-text-primary tracking-[-0.02em] leading-[1.15]"
            style={{ fontFamily: "var(--font-family-display)" }}
          >
            From saved to signed —
            <br />
            in four steps.
          </h2>
          <p className="text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
            No spreadsheets. No Notion databases. Just a calm, focused tracker
            built around how internship hiring actually works.
          </p>
        </div>
      </BlurFade>

      {/* Steps */}
      <div className="space-y-14 md:space-y-20">
        {STEPS.map((step, i) => (
          <BlurFade key={step.number} inView delay={0.1 + i * 0.1}>
            <div className="grid md:grid-cols-2 gap-8 md:gap-14 items-center">
              {/* Step info — always first in DOM for mobile */}
              <div
                className={cn(
                  "space-y-3",
                  i % 2 !== 0 && "md:order-last"
                )}
              >
                <span
                  className="block text-6xl font-black leading-none select-none"
                  style={{
                    fontFamily: "var(--font-family-display)",
                    color: "color-mix(in oklab, var(--accent) 18%, transparent)",
                  }}
                >
                  {step.number}
                </span>
                <h3
                  className="text-xl font-semibold text-text-primary tracking-[-0.01em]"
                  style={{ fontFamily: "var(--font-family-display)" }}
                >
                  {step.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {step.body}
                </p>
              </div>

              {/* Interactive card */}
              <div className={cn(i % 2 !== 0 && "md:order-first")}>
                {step.card}
              </div>
            </div>

            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div className="hidden md:flex justify-center mt-14">
                <div className="w-px h-10 bg-linear-to-b from-accent/20 to-transparent" />
              </div>
            )}
          </BlurFade>
        ))}
      </div>
    </section>
  )
}
