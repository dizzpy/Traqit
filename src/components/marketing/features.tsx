"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import { MagicCard } from "@/components/ui/magic-card"

// ─── Shared card props ────────────────────────────────────────────────────────

const CARD = {
  className: "rounded-2xl p-5 h-full",
  innerClassName: "flex flex-col h-full gap-4",
  innerBg: "var(--color-surface)",
  gradientFrom: "#c4b5fd",
  gradientTo: "#7c3aed",
  gradientColor: "#c4b5fd08",
} as const

// ─── Card 1: Custom Pipelines ─────────────────────────────────────────────────

const PIPELINE_STAGES = ["Applied", "OA", "Technical", "HR", "Offer 🎉"]
const COMPANIES = [
  { name: "Google STEP", color: "#4285F4", initial: "G" },
  { name: "Stripe SWE", color: "#635BFF", initial: "S" },
]

function PipelineCard() {
  const [stage, setStage] = useState(1)
  const [companyIdx, setCompanyIdx] = useState(0)
  const company = COMPANIES[companyIdx]

  return (
    <MagicCard {...CARD}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
          Custom Pipelines
        </span>
        <button
          onClick={() => setCompanyIdx((p) => (p + 1) % COMPANIES.length)}
          className="text-[10px] text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded-full hover:bg-accent/20 transition-colors"
        >
          {company.name}
        </button>
      </div>

      {/* Stage chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {PIPELINE_STAGES.map((s, i) => (
          <button
            key={s}
            onClick={() => setStage(i)}
            className={cn(
              "px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200",
              i === stage
                ? "bg-accent text-white shadow-sm shadow-accent/30"
                : i < stage
                  ? "bg-accent/15 text-accent"
                  : "bg-background text-text-tertiary border border-border hover:border-accent/30"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Application card */}
      <div className="rounded-xl border border-border bg-background p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ background: company.color }}
          >
            {company.initial}
          </span>
          <div>
            <p className="text-xs font-semibold text-text-primary">{company.name}</p>
            <AnimatePresence mode="wait">
              <motion.p
                key={stage}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-[11px] text-accent font-medium"
              >
                {PIPELINE_STAGES[stage]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setStage((p) => Math.max(p - 1, 0))}
            disabled={stage === 0}
            className="h-6 w-6 rounded-md border border-border text-text-secondary hover:border-accent/40 hover:text-accent transition-colors disabled:opacity-25 text-xs flex items-center justify-center"
          >
            ←
          </button>
          <button
            onClick={() => setStage((p) => Math.min(p + 1, PIPELINE_STAGES.length - 1))}
            disabled={stage === PIPELINE_STAGES.length - 1}
            className="h-6 w-6 rounded-md border border-border text-text-secondary hover:border-accent/40 hover:text-accent transition-colors disabled:opacity-25 text-xs flex items-center justify-center"
          >
            →
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-1 rounded-full bg-background overflow-hidden mt-auto">
        <motion.div
          className="h-full rounded-full bg-linear-to-r from-accent/50 to-accent"
          animate={{ width: `${(stage / (PIPELINE_STAGES.length - 1)) * 100}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </div>

      {/* Footer */}
      <div className="pt-1 border-t border-border">
        <p className="text-xs font-semibold text-text-primary">Custom pipelines, per company</p>
        <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
          Every company has a different process. Build the exact stages for each one.
        </p>
      </div>
    </MagicCard>
  )
}

// ─── Card 2: Save Jobs ────────────────────────────────────────────────────────

const SAVE_JOBS = [
  { company: "Stripe", role: "SWE Intern", deadline: "Aug 1", color: "#635BFF", initial: "S" },
  { company: "Figma", role: "Design Intern", deadline: "Jul 20", color: "#F24E1E", initial: "F" },
]

function SaveJobCard() {
  const [saved, setSaved] = useState(false)
  const [jobIdx, setJobIdx] = useState(0)
  const job = SAVE_JOBS[jobIdx]

  return (
    <MagicCard {...CARD}>
      <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
        Saved Roles
      </span>

      {/* Job card */}
      <div className="rounded-xl border border-border bg-background p-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span
              className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: job.color }}
            >
              {job.initial}
            </span>
            <div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={job.company}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs font-semibold text-text-primary"
                >
                  {job.company}
                </motion.p>
              </AnimatePresence>
              <p className="text-[11px] text-text-secondary">{job.role}</p>
            </div>
          </div>
          <button
            onClick={() => setSaved((p) => !p)}
            className={cn(
              "h-7 w-7 rounded-lg border flex items-center justify-center transition-all duration-200 shrink-0",
              saved
                ? "bg-accent border-accent text-white"
                : "border-border text-text-tertiary hover:border-accent/40 hover:text-accent"
            )}
          >
            <motion.span
              animate={{ scale: saved ? [1, 1.3, 1] : 1 }}
              transition={{ duration: 0.3 }}
              className="text-xs leading-none"
            >
              {saved ? "★" : "☆"}
            </motion.span>
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-text-tertiary">📅 Deadline: {job.deadline}</span>
          <AnimatePresence>
            {saved && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-[10px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full"
              >
                Saved ✓
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Job switcher */}
      <div className="flex gap-1.5">
        {SAVE_JOBS.map((j, i) => (
          <button
            key={j.company}
            onClick={() => { setJobIdx(i); setSaved(false) }}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === jobIdx ? "w-4 bg-accent" : "w-1.5 bg-border hover:bg-border-hover"
            )}
          />
        ))}
      </div>

      <div className="pt-1 border-t border-border mt-auto">
        <p className="text-xs font-semibold text-text-primary">Save jobs before you apply</p>
        <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
          Spot a role but not ready? Save it with a deadline and promote it when you are.
        </p>
      </div>
    </MagicCard>
  )
}

// ─── Card 3: Draft Outreach ───────────────────────────────────────────────────

const TEMPLATES = [
  {
    to: "recruiter@stripe.com",
    subject: "SWE Intern — {name}",
    body: "Hi {company} team,\n\nI came across the {position} role and I'm genuinely excited — your work on payments infra is something I've followed closely.\n\nWould love to connect.",
  },
  {
    to: "hiring@figma.com",
    subject: "Design Intern — {name}",
    body: "Hi {company} team,\n\nI'm reaching out about the {position} opening. As a long-time Figma user who has contributed to open design systems, I'd love to bring that perspective to your team.",
  },
]

function highlight(text: string) {
  return text.split(/(\{[^}]+\})/g).map((part, i) =>
    part.startsWith("{") ? (
      <span key={i} className="text-accent font-semibold bg-accent/10 px-0.5 rounded">
        {part}
      </span>
    ) : (
      part
    )
  )
}

function OutreachCard() {
  const [idx, setIdx] = useState(0)
  const t = TEMPLATES[idx]

  return (
    <MagicCard {...CARD}>
      <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
        Outreach Templates
      </span>

      {/* Email preview */}
      <div className="rounded-xl border border-border bg-background overflow-hidden flex-1">
        {/* Email header */}
        <div className="border-b border-border px-3 py-2 space-y-1">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-text-tertiary w-8 shrink-0">To</span>
            <span className="text-text-secondary">{t.to}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-text-tertiary w-8 shrink-0">Sub</span>
            <span className="text-text-secondary">{highlight(t.subject)}</span>
          </div>
        </div>
        {/* Body */}
        <div className="px-3 py-2.5">
          <AnimatePresence mode="wait">
            <motion.p
              key={idx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="text-[11px] text-text-secondary leading-relaxed whitespace-pre-line"
            >
              {highlight(t.body)}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {TEMPLATES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === idx ? "w-4 bg-accent" : "w-1.5 bg-border hover:bg-border-hover"
              )}
            />
          ))}
        </div>
        <button className="text-[11px] text-accent font-semibold hover:underline underline-offset-2 transition-opacity">
          Open Gmail draft →
        </button>
      </div>

      <div className="pt-1 border-t border-border mt-auto">
        <p className="text-xs font-semibold text-text-primary">Draft outreach in one click</p>
        <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
          Reusable templates with placeholders. Opens a pre-filled Gmail draft — just hit send.
        </p>
      </div>
    </MagicCard>
  )
}

// ─── Card 4: Ghost Detection ──────────────────────────────────────────────────

const GHOST_APPS = [
  { company: "Stripe", initial: "S", color: "#635BFF", days: 14, stage: "HR" },
  { company: "Google", initial: "G", color: "#4285F4", days: 3,  stage: "OA" },
  { company: "Meta",   initial: "M", color: "#0081FB", days: 21, stage: "Applied" },
  { company: "Amazon", initial: "A", color: "#FF9900", days: 6,  stage: "Technical" },
]

function GhostCard() {
  return (
    <MagicCard {...CARD}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
          Ghost Detection
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-amber-400 font-semibold bg-amber-400/10 px-2 py-0.5 rounded-full">
          <span className="h-1 w-1 rounded-full bg-amber-400 animate-pulse" />
          2 alerts
        </span>
      </div>

      <div className="space-y-2 flex-1">
        {GHOST_APPS.map((app, i) => {
          const isGhost = app.days >= 14
          return (
            <motion.div
              key={app.company}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07, duration: 0.3 }}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border p-2.5 transition-colors duration-200",
                isGhost
                  ? "border-amber-400/20 bg-amber-400/5"
                  : "border-border bg-background"
              )}
            >
              <span
                className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{ background: app.color }}
              >
                {app.initial}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text-primary">{app.company}</p>
                <p className="text-[10px] text-text-tertiary">{app.stage}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={cn(
                  "text-xs font-bold tabular-nums",
                  isGhost ? "text-amber-400" : "text-text-secondary"
                )}>
                  {app.days}d
                </p>
                {isGhost
                  ? <p className="text-[9px] text-amber-400 font-medium">ghosted?</p>
                  : <p className="text-[9px] text-text-tertiary">active</p>
                }
              </div>
              {isGhost && (
                <span className="text-sm select-none" title="No response in 14+ days">👻</span>
              )}
            </motion.div>
          )
        })}
      </div>

      <div className="pt-1 border-t border-border mt-auto">
        <p className="text-xs font-semibold text-text-primary">Ghost detection, automatic</p>
        <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
          Auto-flagged when a company goes quiet after 14 days. No more wondering.
        </p>
      </div>
    </MagicCard>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function Features() {
  return (
    <section id="features" className="max-w-5xl mx-auto px-6 py-20 md:py-24 scroll-mt-20">
      {/* Header */}
      <div className="text-center mb-12 space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/8 px-3 py-1 text-xs font-semibold text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Features
        </span>
        <h2
          className="text-2xl sm:text-3xl md:text-4xl font-semibold text-text-primary tracking-[-0.02em] leading-[1.15]"
          style={{ fontFamily: "var(--font-family-display)" }}
        >
          Built around how hiring
          <br className="hidden sm:block" />
          actually works.
        </h2>
        <p className="text-sm text-text-secondary max-w-sm mx-auto leading-relaxed">
          Every feature maps to a real friction point in the internship hunt.
        </p>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Row 1 */}
        <div className="md:col-span-2"><PipelineCard /></div>
        <div className="md:col-span-1"><SaveJobCard /></div>

        {/* Row 2 */}
        <div className="md:col-span-1"><OutreachCard /></div>
        <div className="md:col-span-2"><GhostCard /></div>
      </div>
    </section>
  )
}
