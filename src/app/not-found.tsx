/**
 * 404 page. Calm and kind, matching the app's quiet tone — points the user
 * back to their applications rather than dead-ending.
 */
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-full min-h-screen w-full flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-text-primary">Page not found</p>
        <p className="max-w-xs text-xs font-medium text-text-muted">
          This page doesn&apos;t exist or may have moved.
        </p>
      </div>
      <Link
        href="/app/applications"
        className={buttonVariants({ variant: "secondary", size: "sm" })}
      >
        Back to applications
      </Link>
    </div>
  );
}
