import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Tooltip } from "@/components/ui/tooltip";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SharedIconActionProps = {
  label: string;
  icon: LucideIcon;
  className?: string;
};

export function IconActionLink({
  href,
  label,
  icon: Icon,
  className,
  variant = "ghost",
}: SharedIconActionProps & {
  href: string;
  variant?: ButtonProps["variant"];
}) {
  return (
    <Tooltip content={label}>
      <Button asChild size="sm" variant={variant} className={cn("size-8 p-0", className)}>
        <Link href={href} aria-label={label} title={label}>
          <Icon className="size-4" />
          <span className="sr-only">{label}</span>
        </Link>
      </Button>
    </Tooltip>
  );
}

export function IconActionButton({
  label,
  icon: Icon,
  className,
  type = "button",
  variant = "ghost",
  ...props
}: SharedIconActionProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
    type?: "button" | "submit" | "reset";
    variant?: ButtonProps["variant"];
  }) {
  return (
    <Tooltip content={label}>
      <Button
        type={type}
        size="sm"
        variant={variant}
        className={cn("size-8 p-0", className)}
        aria-label={label}
        title={label}
        {...props}
      >
        <Icon className="size-4" />
        <span className="sr-only">{label}</span>
      </Button>
    </Tooltip>
  );
}
