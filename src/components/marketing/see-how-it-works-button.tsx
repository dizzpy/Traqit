"use client";

/**
 * Secondary hero CTA. Smooth-scrolls to the features section instead of
 * navigating — kept as a tiny client island so the rest of the landing page
 * stays a server component.
 */
export function SeeHowItWorksButton() {
  return (
    <button
      type="button"
      onClick={() =>
        document
          .getElementById("features")
          ?.scrollIntoView({ behavior: "smooth", block: "start" })
      }
      className="inline-flex items-center justify-center h-11 px-6 rounded-[11px] border border-border bg-transparent text-text-primary text-sm font-medium hover:bg-surface-elevated hover:border-border-hover transition-colors duration-150"
    >
      See how it works
    </button>
  );
}
