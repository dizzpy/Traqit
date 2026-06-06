"use client"

import { FaArrowRight } from "react-icons/fa6"

export function HeroCTA() {
  return (
    <a
      href="/login"
      className="inline-flex items-center gap-2.5 h-11 px-6 rounded-xl bg-white text-[#0b0a0e] text-sm font-semibold hover:bg-white/90 hover:-translate-y-px transition-all duration-150"
    >
      Start for Free
      <FaArrowRight size={11} />
    </a>
  )
}
