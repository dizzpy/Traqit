"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const TOUR_KEY = "traqit_main_tour_v1";

/**
 * One-time product tour for the Applications page.
 *
 * Renders nothing — it's a side-effect only component. It fires three
 * spotlight tips the first time a user lands on /applications after
 * onboarding, then records the dismissal in localStorage so it never
 * shows again. If there are no applications yet (no target element),
 * it skips silently.
 */
export function AppTour() {
  useEffect(() => {
    // Only run once — check localStorage.
    if (localStorage.getItem(TOUR_KEY)) return;

    // Only run if target elements exist (user has at least one application).
    const stageCell = document.querySelector('[data-tour="current-stage-cell"]');
    if (!stageCell) return; // no apps yet — skip tour silently

    // Tint the spotlight overlay with the live theme background (driver.js
    // paints it as an SVG fill, so CSS overrides are unreliable). Reading the
    // token keeps it hex-free and correct in both dark and light themes.
    const overlayColor =
      getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || undefined;

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
  }, []);

  return null; // renders nothing — side-effect only
}
