"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGridIcon,
  BookmarkIcon,
  Calendar01Icon,
  BarChartIcon,
  Mail01Icon,
  Settings01Icon,
  Briefcase01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const NAV_ITEMS = [
  { href: "/applications", label: "Applications", icon: LayoutGridIcon },
  { href: "/saved",        label: "Saved jobs",   icon: BookmarkIcon },
  { href: "/calendar",     label: "Calendar",     icon: Calendar01Icon },
  { href: "/analytics",    label: "Analytics",    icon: BarChartIcon },
  { href: "/templates",    label: "Email templates", icon: Mail01Icon },
  { href: "/settings",     label: "Settings",     icon: Settings01Icon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] shrink-0 h-screen bg-surface border-r border-border flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <Link href="/applications" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <HugeiconsIcon icon={Briefcase01Icon} size={14} className="text-white" strokeWidth={1.5} />
          </div>
          <span className="text-sm font-semibold text-text-primary" style={{ fontFamily: "var(--font-family-display)" }}>
            InternTracker
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
                active
                  ? "bg-surface-hover text-text-primary"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              )}
            >
              <HugeiconsIcon icon={icon} size={16} strokeWidth={1.5} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer — profile chip + theme toggle */}
      <div className="px-3 py-3 border-t border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-accent-soft flex items-center justify-center shrink-0">
            <HugeiconsIcon icon={UserIcon} size={12} className="text-accent-soft-fg" strokeWidth={1.5} />
          </div>
          <span className="text-xs text-text-muted truncate">My profile</span>
        </div>
        <ThemeToggle />
      </div>
    </aside>
  );
}
