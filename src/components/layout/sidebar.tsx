"use client";

import { useEffect, useState } from "react";
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
import Image from "next/image";
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/use-profile";
import { ThemeToggle } from "./theme-toggle";

const NAV_ITEMS = [
  { href: "/applications", label: "Applications", icon: LayoutGridIcon },
  { href: "/saved",        label: "Saved jobs",   icon: BookmarkIcon },
  { href: "/calendar",     label: "Calendar",     icon: Calendar01Icon },
  { href: "/analytics",    label: "Analytics",    icon: BarChartIcon },
  { href: "/templates",    label: "Email templates", icon: Mail01Icon },
  { href: "/settings",     label: "Settings",     icon: Settings01Icon },
];

const STORAGE_KEY = "it-sidebar-collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const { profile } = useProfile();
  const [collapsed, setCollapsed] = useState(false);

  // Restore persisted state on mount. Reading localStorage must happen after
  // hydration (it's unavailable during SSR), so this effect is intentional.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "relative z-30 shrink-0 h-screen bg-surface border-r border-border flex flex-col",
        "transition-[width] duration-300 ease-in-out",
        collapsed ? "w-16" : "w-55"
      )}
    >
      {/* Cute little bump on the divider — two rounded segments that bend into a
          soft curve on hover, pointing the way the sidebar will move. */}
      <button
        onClick={toggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="group/bump absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 z-40 flex h-12 w-4 flex-col items-center justify-center"
      >
        <span
          className={cn(
            "h-3.5 w-1 rounded-full bg-border origin-bottom transition-all duration-200 ease-out group-hover/bump:bg-accent",
            collapsed ? "group-hover/bump:-rotate-[18deg]" : "group-hover/bump:rotate-[18deg]"
          )}
        />
        <span
          className={cn(
            "h-3.5 w-1 -mt-px rounded-full bg-border origin-top transition-all duration-200 ease-out group-hover/bump:bg-accent",
            collapsed ? "group-hover/bump:rotate-[18deg]" : "group-hover/bump:-rotate-[18deg]"
          )}
        />
      </button>

      {/* Logo + collapse toggle */}
      <div
        className={cn(
          "h-15.25 px-3 border-b border-border flex items-center",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <Link href="/applications" className="flex items-center gap-2.5 min-w-0 pl-2">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={Briefcase01Icon} size={14} className="text-white" strokeWidth={1.5} />
            </div>
            <span
              className="text-sm font-semibold text-text-primary truncate"
              style={{ fontFamily: "var(--font-family-display)" }}
            >
              InternTracker
            </span>
          </Link>
        )}
        <button
          onClick={toggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors duration-150 shrink-0"
        >
          {collapsed ? (
            <PanelLeftOpenIcon size={17} strokeWidth={1.5} />
          ) : (
            <PanelLeftCloseIcon size={17} strokeWidth={1.5} />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="px-3 py-4 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
                collapsed && "justify-center px-0",
                active
                  ? "bg-surface-hover text-text-primary"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              )}
            >
              <HugeiconsIcon icon={icon} size={16} strokeWidth={1.5} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Empty middle — when collapsed, click anywhere here to expand */}
      {collapsed ? (
        <button
          onClick={toggle}
          aria-label="Expand sidebar"
          title="Expand sidebar"
          className="flex-1 w-full cursor-pointer"
        />
      ) : (
        <div className="flex-1" />
      )}

      {/* Footer — profile chip + theme toggle */}
      <div
        className={cn(
          "px-3 py-3 border-t border-border flex items-center gap-2",
          collapsed ? "flex-col" : "justify-between"
        )}
      >
        <Link
          href="/profile"
          title="My profile"
          className={cn(
            "flex items-center gap-2 min-w-0 rounded-lg transition-colors duration-150 hover:bg-surface-hover",
            collapsed ? "justify-center p-1" : "-ml-1 px-1 py-1 flex-1"
          )}
        >
          {profile?.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={profile.name}
              width={24}
              height={24}
              className="w-6 h-6 rounded-full object-cover shrink-0"
              unoptimized
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-accent-soft flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={UserIcon} size={12} className="text-accent-soft-fg" strokeWidth={1.5} />
            </div>
          )}
          {!collapsed && (
            <span className="text-xs text-text-secondary truncate">
              {profile?.name ?? "My profile"}
            </span>
          )}
        </Link>
        <ThemeToggle />
      </div>
    </aside>
  );
}
