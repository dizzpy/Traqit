import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Shared base: soft 11px corners, comfortable padding (set per size), a subtle
  // -1px hover lift that snaps back on press, and a snappy 150ms ease. `group`
  // lets directional icons opt into a +3px nudge via `group-hover:translate-x-[3px]`.
  "group inline-flex shrink-0 cursor-pointer items-center justify-center gap-[7px] border border-transparent bg-clip-padding font-sans font-medium tracking-[-0.01em] whitespace-nowrap select-none outline-none transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-px active:translate-y-0 focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 disabled:transform-none aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Primary CTA — violet filled.
        default: "bg-accent text-accent-foreground hover:bg-accent-hover",
        // Soft surface button.
        secondary:
          "bg-surface-elevated text-text-primary border-border hover:bg-surface-hover hover:border-border-hover",
        // Bordered, transparent background.
        outline:
          "bg-transparent text-text-primary border-border hover:bg-surface-elevated hover:border-border-hover aria-expanded:bg-surface-elevated",
        // No background, no border.
        ghost:
          "bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary aria-expanded:bg-surface-hover aria-expanded:text-text-primary",
        // Danger actions — filled red. (`danger` and `destructive` share the look;
        // both names are kept so existing call sites don't break.)
        destructive: "bg-destructive text-accent-foreground hover:opacity-90",
        danger: "bg-destructive text-accent-foreground hover:opacity-90",
        // Text-only link — no lift, no padding.
        link: "bg-transparent text-accent underline-offset-4 hover:underline",
      },
      size: {
        xs: "py-1 px-2.5 text-[12px] rounded-[8px] [&_svg:not([class*='size-'])]:size-3.5",
        sm: "py-1.5 px-3 text-[12px] rounded-[9px] [&_svg:not([class*='size-'])]:size-3.5",
        default: "py-2.5 px-5 text-[13px] rounded-[11px]",
        lg: "py-3 px-6 text-[14px] rounded-[12px]",
        icon: "h-9 w-9 p-0 rounded-[10px]",
        "icon-xs": "h-7 w-7 p-0 rounded-[9px] [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "h-8 w-8 p-0 rounded-[10px]",
        "icon-lg": "h-10 w-10 p-0 rounded-[11px]",
      },
    },
    compoundVariants: [
      // A link is text, not a button: strip padding/height and never lift.
      {
        variant: "link",
        class: "px-0 py-0 h-auto rounded-none hover:translate-y-0",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
