"use client";

import Link from "next/link";

import { ChevronDown } from "lucide-react";

import { type ButtonProps, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActionDropdownItem = {
  label: string;
  href?: string;
  onSelect?: () => void;
  target?: string;
  rel?: string;
};

export function ActionDropdown({
  label,
  items,
  variant = "outline",
  size = "sm",
  className,
}: {
  label: string;
  items: ActionDropdownItem[];
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}) {
  return (
    <details className={cn("group relative", className)}>
      <summary
        className={cn(
          buttonVariants({ variant, size }),
          "list-none cursor-pointer [&::-webkit-details-marker]:hidden",
        )}
      >
        {label}
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
      </summary>

      <div className="absolute right-0 top-full z-20 mt-2 min-w-48 overflow-hidden rounded-xl border border-border bg-background p-1 shadow-lg">
        {items.map((item) =>
          item.href ? (
            <Link
              key={item.label}
              href={item.href}
              target={item.target}
              rel={item.rel}
              prefetch={false}
              className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-muted"
              onClick={(event) => {
                closeDropdown(event.currentTarget);
              }}
            >
              {item.label}
            </Link>
          ) : (
            <button
              key={item.label}
              type="button"
              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted"
              onClick={(event) => {
                item.onSelect?.();
                closeDropdown(event.currentTarget);
              }}
            >
              {item.label}
            </button>
          ),
        )}
      </div>
    </details>
  );
}

function closeDropdown(target: HTMLElement) {
  const details = target.closest("details");

  if (details instanceof HTMLDetailsElement) {
    details.open = false;
  }
}
