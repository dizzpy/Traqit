"use client"

import { motion } from "motion/react"
import { BlurFade } from "@/components/ui/blur-fade"
import { LaserFlow } from "@/components/marketing/laser-flow"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"

const NAV = {
  Product: [
    { label: "How it works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ],
  Legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Cookies", href: "#" },
  ],
}

export function MarketingFooter() {
  return (
    <footer className="relative w-full overflow-hidden border-t border-border/60">
      {/* Laser beam — canvas starts 192px above the footer so the bright
          zone (35–65% of 500px = 175–325px from canvas top) lands squarely
          inside the footer content area. mix-blend-screen drops the black
          canvas and keeps only the violet light. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-68.75 h-125 mix-blend-screen mask-[linear-gradient(to_bottom,transparent_0%,transparent_10%,black_32%,black_68%,transparent_95%)]"
      >
        <LaserFlow
          color="#8b5cf6"
          verticalBeamOffset={-0.03}
          horizontalBeamOffset={0.0}
          verticalSizing={2.2}
          horizontalSizing={1.1}
          wispDensity={4}
          wispIntensity={7}
          fogIntensity={0.65}
          fogScale={0.28}
          flowStrength={0.28}
          decay={1.1}
          falloffStart={1.3}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-10">

        {/* Top grid: brand + nav columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 pb-14 border-b border-border/50">

          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <BlurFade inView delay={0}>
              <div className="mb-4">
                <span
                  className="text-xl font-bold text-white tracking-tight"
                  style={{ fontFamily: "var(--font-family-display)" }}
                >
                  Traqit
                </span>
              </div>
              <p className="text-[13px] text-text-tertiary leading-relaxed max-w-55">
                Calm, focused job tracking for SE students in Sri Lanka. Built with intent.
              </p>

              {/* CTA micro-link */}
              <motion.a
                href="/login"
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
                whileHover={{ x: 2 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                Start free today
                <HugeiconsIcon icon={ArrowRight01Icon} size={12} strokeWidth={2.5} />
              </motion.a>
            </BlurFade>
          </div>

          {/* Nav columns */}
          {Object.entries(NAV).map(([group, links], gi) => (
            <div key={group} className="col-span-1">
              <BlurFade inView delay={0.06 + gi * 0.06}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-4">
                  {group}
                </p>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-[13px] text-text-secondary hover:text-text-primary transition-colors duration-150"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </BlurFade>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <BlurFade inView delay={0.2}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3">
              <p className="text-[11px] text-text-tertiary">
                © 2026{" "}
                <a
                  href="https://www.encrivolabs.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  Encriva Labs
                </a>
                . All rights reserved.
              </p>
              <span className="hidden sm:block text-text-tertiary/40 text-[11px]">·</span>
              <a
                href="https://www.encrivolabs.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-text-tertiary hover:text-accent transition-colors"
              >
                www.encrivolabs.com
              </a>
            </div>

            <p className="text-[11px] text-text-tertiary flex items-center gap-1.5">
              Built by{" "}
              <a
                href="https://www.dizzpy.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-secondary hover:text-accent transition-colors font-medium"
              >
                www.dizzpy.dev
              </a>
              <span
                aria-hidden
                className="h-1 w-1 rounded-full bg-accent/60 inline-block"
              />
            </p>
          </div>
        </BlurFade>
      </div>
    </footer>
  )
}
