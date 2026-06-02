"use client";

import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

function currentTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

/**
 * Theme state kept in sync with the real `<html data-theme>` attribute.
 *
 * All controls (sidebar toggle, settings selector, …) read from the same
 * source of truth and observe attribute changes, so changing the theme from
 * any one of them instantly updates the others.
 */
export function useTheme(): [Theme, (next: Theme) => void] {
  // Start "dark" to match SSR output; the effect corrects to the real value
  // right after mount (avoids a hydration mismatch on the icon).
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(currentTheme());
    const observer = new MutationObserver(() => setThemeState(currentTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  function setTheme(next: Theme) {
    localStorage.setItem("theme", next);
    if (next === "light") document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
    // The observer propagates the change to every consumer (including this one).
  }

  return [theme, setTheme];
}
