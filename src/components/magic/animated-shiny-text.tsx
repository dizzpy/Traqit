import { cn } from "@/lib/utils";

interface AnimatedShinyTextProps {
  children: React.ReactNode;
  className?: string;
  shimmerWidth?: number;
}

export function AnimatedShinyText({
  children,
  className,
  shimmerWidth = 100,
}: AnimatedShinyTextProps) {
  return (
    <span
      style={{ "--shimmer-width": `${shimmerWidth}px` } as React.CSSProperties}
      className={cn(
        "inline-flex items-center justify-center text-text-secondary/60",
        "animate-shimmer bg-clip-text bg-no-repeat [background-position:0_0] [background-size:var(--shimmer-width)_100%] [transition:background-position_1s_cubic-bezier(.6,.6,0,1)_infinite]",
        "bg-gradient-to-r from-transparent via-text-primary/80 via-50% to-transparent",
        className
      )}
    >
      {children}
    </span>
  );
}
