import { cn } from "@/lib/utils";

/** A small keycap used to surface keyboard-shortcut hints. */
export function Kbd({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-border bg-surface px-1.5",
        "text-2xs font-medium leading-none text-text-muted",
        className
      )}
    >
      {children}
    </kbd>
  );
}
