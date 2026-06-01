/**
 * Single source of truth for the app's keyboard shortcuts — consumed by the
 * global handler (`KeyboardShortcuts`) and the "View shortcuts" dialog so the
 * two never drift apart.
 */

/** Single-key → route map for navigation shortcuts. */
export const ROUTE_SHORTCUTS: Record<string, string> = {
  a: "/applications",
  s: "/saved",
  c: "/calendar",
  g: "/analytics",
  t: "/templates",
  p: "/profile",
  ",": "/settings",
};

export interface ShortcutItem {
  /** Keys to press. "Mod" renders as ⌘ on mac, Ctrl elsewhere. */
  keys: string[];
  label: string;
}

export interface ShortcutGroup {
  title: string;
  items: ShortcutItem[];
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Navigation",
    items: [
      { keys: ["a"], label: "Applications" },
      { keys: ["s"], label: "Saved jobs" },
      { keys: ["c"], label: "Calendar" },
      { keys: ["g"], label: "Analytics" },
      { keys: ["t"], label: "Email templates" },
      { keys: ["p"], label: "Profile" },
      { keys: [","], label: "Settings" },
    ],
  },
  {
    title: "Actions",
    items: [
      { keys: ["n"], label: "New application" },
      { keys: ["b"], label: "Save job" },
      { keys: ["/"], label: "Focus search" },
      { keys: ["d"], label: "Toggle theme" },
    ],
  },
  {
    title: "General",
    items: [{ keys: ["Mod", "B"], label: "Toggle sidebar" }],
  },
];
