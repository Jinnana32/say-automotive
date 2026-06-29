"use client";

import { Plus } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AddEntryButton({
  children,
  className,
  size = "default",
  variant = "add",
  showPlusIcon = true,
  ...props
}: ButtonProps & {
  showPlusIcon?: boolean;
}) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(className)}
      {...props}
    >
      {showPlusIcon ? <Plus className="size-4 shrink-0" aria-hidden /> : null}
      {children}
    </Button>
  );
}
