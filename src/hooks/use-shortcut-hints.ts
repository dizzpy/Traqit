"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "shortcut-hints";

function current(): boolean {
  if (typeof document === "undefined") return true;
  return document.documentElement.getAttribute("data-shortcut-hints") !== "off";
}

/**
 * Whether to show the little keycap hints next to nav items, buttons, etc.
 * Defaults to on. Synced through the `<html data-shortcut-hints>` attribute so
 * the Settings toggle updates every indicator across the app instantly.
 */
export function useShortcutHints(): [boolean, (next: boolean) => void] {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Reflect the persisted preference onto <html> so all consumers agree,
    // then mirror it into local state.
    const persisted = localStorage.getItem(STORAGE_KEY) !== "off";
    if (persisted) document.documentElement.removeAttribute("data-shortcut-hints");
    else document.documentElement.setAttribute("data-shortcut-hints", "off");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(persisted);

    const observer = new MutationObserver(() => setShow(current()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-shortcut-hints"],
    });
    return () => observer.disconnect();
  }, []);

  function setShowHints(next: boolean) {
    localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    if (next) document.documentElement.removeAttribute("data-shortcut-hints");
    else document.documentElement.setAttribute("data-shortcut-hints", "off");
    // The observer propagates the change to every consumer.
  }

  return [show, setShowHints];
}
