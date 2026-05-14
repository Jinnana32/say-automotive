import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/92",
        navyPrimary:
          "bg-brand-navy text-white shadow-[0_14px_28px_rgba(6,27,58,0.18)] hover:bg-brand-navyHover",
        yellowPrimary:
          "bg-[#ffd24a] text-[#10224d] shadow-[0_12px_24px_rgba(255,210,74,0.28)] hover:bg-[#ffdc72]",
        bluePrimary:
          "bg-brand-navy text-white shadow-[0_14px_28px_rgba(6,27,58,0.18)] hover:bg-brand-navyHover",
        outlineBlue:
          "border border-brand-navy bg-white text-brand-navy hover:bg-brand-soft",
        outlineLight:
          "border border-white/18 bg-white/5 text-white hover:bg-white/12 hover:text-white",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/85",
        outline: "border border-border bg-background text-foreground hover:bg-muted/70",
        ghost: "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-5",
        icon: "h-10 w-10 p-0",
        pill: "h-11 rounded-full px-6 text-sm font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { buttonVariants };
