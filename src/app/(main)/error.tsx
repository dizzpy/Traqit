"use client";

/**
 * Error boundary for the (main) app segment. Catches render/data errors thrown
 * by any page in the dashboard and offers a calm retry — keeping the sidebar +
 * header shell intact. Deliberately minimal, in the Violet Haze quiet style.
 */
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-text-primary">
          Something went wrong
        </p>
        <p className="max-w-xs text-xs font-medium text-text-muted">
          We couldn&apos;t load this page. Try again — if it keeps happening,
          give it a moment and refresh.
        </p>
      </div>
      <Button variant="secondary" size="sm" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
