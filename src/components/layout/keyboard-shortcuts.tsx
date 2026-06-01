"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/hooks/use-theme";
import { setPendingAction } from "@/lib/pending-action";
import { ROUTE_SHORTCUTS } from "@/lib/shortcuts";

/**
 * Global single-key shortcuts (no modifier). Active everywhere in the app
 * shell except while typing in a field or with a dialog/sheet open.
 *
 *   Navigation   a Applications · s Saved · c Calendar · g Analytics
 *                t Templates · p Profile · , Settings
 *   Actions      n New application · b Save job · / Focus search · d Toggle theme
 *
 * (⌘/Ctrl+B for the sidebar is handled in the sidebar itself.)
 */

function isEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || /^(input|textarea|select)$/i.test(el.tagName);
}

function overlayOpen(): boolean {
  return !!document.querySelector(
    '[data-slot="dialog-content"],[data-slot="sheet-content"],[role="dialog"],[data-modal="true"]'
  );
}

export function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const [theme, setTheme] = useTheme();

  useEffect(() => {
    // Open a page-scoped action: fire it now if already there, else navigate
    // and let the destination page pick it up on mount.
    function runAction(action: string, targetPath: string) {
      if (pathname === targetPath) {
        window.dispatchEvent(new CustomEvent(`app:${action}`));
      } else {
        setPendingAction(action);
        router.push(targetPath);
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return;
      if (isEditable(e.target) || overlayOpen()) return;

      const key = e.key.toLowerCase();

      const route = ROUTE_SHORTCUTS[key];
      if (route) {
        e.preventDefault();
        if (pathname !== route) router.push(route);
        return;
      }

      switch (key) {
        case "n":
          e.preventDefault();
          runAction("new-application", "/applications");
          break;
        case "b":
          e.preventDefault();
          runAction("save-job", "/saved");
          break;
        case "/": {
          const input = document.querySelector<HTMLInputElement>('input[data-search="true"]');
          if (input) {
            e.preventDefault();
            input.focus();
            input.select();
          }
          break;
        }
        case "d":
          e.preventDefault();
          setTheme(theme === "dark" ? "light" : "dark");
          break;
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pathname, router, theme, setTheme]);

  return null;
}
