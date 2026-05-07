import Link from "next/link";

import { cn } from "@/lib/utils";

export function TableCellLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group block -mx-4 -my-3.5 rounded-lg px-4 py-3.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2",
        className,
      )}
    >
      {children}
    </Link>
  );
}
