"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import { toast } from "sonner";
import "driver.js/dist/driver.css";
import { consumePendingAction } from "@/lib/pending-action";

const TOUR_KEY = "traqit_main_tour_v1";

/**
 * Drives the three-step spotlight tour if its target elements exist (the
 * user has at least one application). Returns a cleanup function on success,
 * or null if there was nothing to highlight.
 */
function runTour(): (() => void) | null {
  const stageCell = document.querySelector('[data-tour="current-stage-cell"]');
  if (!stageCell) return null; // no apps yet — nothing to highlight

  // Tint the spotlight overlay with the live theme background (driver.js
  // paints it as an SVG fill, so CSS overrides are unreliable). Reading the
  // token keeps it hex-free and correct in both dark and light themes.
  const overlayColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--bg")
      .trim() || undefined;

  const driverObj = driver({
    showProgress: true,
    progressText: "{{current}} of {{total}}",
    nextBtnText: "Next →",
    prevBtnText: "← Back",
    doneBtnText: "Got it",
    smoothScroll: true,
    allowClose: true,
    overlayColor,
    overlayOpacity: 0.55,
    stagePadding: 8,
    stageRadius: 12,
    popoverClass: "traqit-tour-popover",
    onDestroyed: () => {
      localStorage.setItem(TOUR_KEY, "true");
    },
    steps: [
      {
        element: '[data-tour="current-stage-cell"]',
        popover: {
          title: "Your interview pipeline",
          description:
            "Click any stage to open the pipeline builder — build a custom interview flow for each job.",
          side: "right",
          align: "start",
        },
      },
      {
        element: '[data-tour="save-job-btn"]',
        popover: {
          title: "Save jobs for later",
          description:
            "Spotted a job but not ready to apply? Save it here — it'll wait with a deadline countdown.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: '[data-tour="board-view-chip"]',
        popover: {
          title: "Kanban board view",
          description:
            "Switch to a board and drag cards between columns to update status instantly.",
          side: "bottom",
          align: "start",
        },
      },
    ],
  });

  // Small delay so the page fully renders before highlighting.
  const timeout = setTimeout(() => driverObj.drive(), 800);
  return () => {
    clearTimeout(timeout);
    driverObj.destroy();
  };
}

/**
 * Product tour for the Applications page. Renders nothing — it's a
 * side-effect only component. Fires automatically the first time a user
 * lands here after onboarding (recorded in localStorage so it never shows
 * again unassisted), or on demand via the "Replay tour" entry point in
 * Settings, which hands off through the pending-action mechanism since that
 * button lives on a different route.
 */
export function AppTour() {
  useEffect(() => {
    const isReplay = consumePendingAction("replay-tour");
    if (!isReplay && localStorage.getItem(TOUR_KEY)) return;

    const cleanup = runTour();
    if (!cleanup && isReplay) {
      toast.error("Add an application first to replay the tour");
    }
    return cleanup ?? undefined;
  }, []);

  return null; // renders nothing — side-effect only
}
