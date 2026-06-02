"use client";

import { useEffect, useState } from "react";
import { Briefcase01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createClient } from "@/lib/supabase/client";

const MESSAGES = [
  "Signing you in…",
  "Loading your applications…",
  "Checking upcoming interviews…",
  "Preparing your board…",
];

function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 22) return "Good evening";
  return "Hey";
}

function firstName(raw: string | null | undefined): string {
  if (!raw) return "there";
  const trimmed = raw.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0];
}

/**
 * Warm greeting shown while the (main) segment loads, replacing the blank flash
 * after sign-in. Rendered as a Next.js Suspense fallback, so its lifetime is
 * controlled by the framework — the rotating copy + bar give it a calm feel for
 * however long it's on screen.
 */
export default function MainLoading() {
  const [name, setName] = useState("there");
  const [greeting, setGreeting] = useState("Hey");
  const [messageIndex, setMessageIndex] = useState(0);
  const [messageVisible, setMessageVisible] = useState(true);

  useEffect(() => {
    // Time-of-day greeting is computed after hydration to avoid a server/client
    // clock mismatch; server renders the neutral "Hey" fallback first.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGreeting(greetingFor(new Date().getHours()));

    let active = true;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const meta = data.user?.user_metadata ?? {};
      const candidate =
        (meta.user_name as string | undefined) ||
        (meta.full_name as string | undefined) ||
        (meta.name as string | undefined) ||
        data.user?.email?.split("@")[0];
      setName(firstName(candidate));
    });
    return () => {
      active = false;
    };
  }, []);

  // Rotate the subtitle every 1.6s with a 200ms cross-fade.
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageVisible(false);
      const fade = setTimeout(() => {
        setMessageIndex((i) => (i + 1) % MESSAGES.length);
        setMessageVisible(true);
      }, 200);
      return () => clearTimeout(fade);
    }, 1600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-bg px-6">
      <style>{`
        @keyframes traqit-rise-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes traqit-bar-fill {
          from { width: 0%; }
          to   { width: 90%; }
        }
      `}</style>

      <div
        className="flex flex-col items-center text-center"
        style={{ animation: "traqit-rise-in 500ms cubic-bezier(0.22, 1, 0.36, 1) both" }}
      >
        {/* Icon */}
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
          <HugeiconsIcon icon={Briefcase01Icon} size={20} strokeWidth={1.5} className="text-white" />
        </div>

        {/* Greeting */}
        <h1
          className="mt-4 text-xl font-semibold text-text-primary"
          style={{ fontFamily: "var(--font-family-display)" }}
        >
          {greeting}, {name}
        </h1>

        {/* Rotating subtitle */}
        <p
          className="mt-1.5 text-sm font-medium text-text-muted transition-opacity duration-200"
          style={{ opacity: messageVisible ? 1 : 0 }}
          aria-live="polite"
        >
          {MESSAGES[messageIndex]}
        </p>

        {/* Progress bar */}
        <div
          className="mt-6 h-[3px] w-40 overflow-hidden rounded-full bg-surface"
          role="progressbar"
          aria-label="Loading"
        >
          <div
            className="h-full rounded-full bg-accent"
            style={{ animation: "traqit-bar-fill 2400ms cubic-bezier(0.22, 1, 0.36, 1) forwards" }}
          />
        </div>
      </div>
    </div>
  );
}
