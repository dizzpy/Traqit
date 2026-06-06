"use client"

import Image from "next/image"
import { motion } from "motion/react"
import { BlurFade } from "@/components/ui/blur-fade"

export function FounderMemo() {
  return (
    <section className="max-w-2xl mx-auto px-6 py-16 md:py-20">
      <BlurFade inView delay={0}>
        <motion.div
          className="relative rounded-2xl border border-accent/20 bg-surface p-8 md:p-10"
          initial={{ y: 16, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.05 }}
        >
          {/* Ambient glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-px rounded-2xl opacity-20"
            style={{
              background:
                "radial-gradient(ellipse at 30% 0%, #7c3aed 0%, transparent 60%)",
            }}
          />

          {/* Opening mark */}
          <span
            className="block text-5xl leading-none text-accent/25 font-serif select-none mb-4"
            aria-hidden
          >
            "
          </span>

          <BlurFade inView delay={0.1}>
            <p className="relative text-[15px] leading-[1.8] text-text-secondary italic">
              I started building Traqit during my own intern hunt. I was
              juggling 30+ applications across Notion, a spreadsheet, and WhatsApp
              reminders — and I missed two follow-ups because I lost track of a
              tab. I ended up ghosting companies I actually wanted to hear from.
              <br className="block h-3" />
              This is the tool I needed back then. Calm, focused, and built for
              exactly this.
            </p>
          </BlurFade>

          {/* Attribution */}
          <BlurFade inView delay={0.2}>
            <div className="mt-8 flex items-center gap-3">
              {/* Avatar */}
              <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden border border-accent/25 ring-2 ring-accent/10">
                <Image
                  src="https://avatars.githubusercontent.com/u/28524634?v=4"
                  alt="Anuja Rathnayaka"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Anuja Rathnayaka</p>
                <p className="text-xs text-text-tertiary">Founder, Traqit</p>
              </div>

              {/* Sri Lanka tag */}
              <div className="ml-auto hidden sm:flex items-center gap-1.5 rounded-full bg-surface-elevated border border-border px-3 py-1">
                <span className="text-sm">🇱🇰</span>
                <span className="text-[11px] text-text-tertiary font-medium">Sri Lanka</span>
              </div>
            </div>
          </BlurFade>
        </motion.div>
      </BlurFade>
    </section>
  )
}
