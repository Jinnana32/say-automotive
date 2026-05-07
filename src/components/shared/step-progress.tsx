"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type StepProgressStatus = "complete" | "current" | "pending";

export function StepProgress({
  items,
  className,
}: {
  items: Array<{
    key: string;
    stepLabel: string;
    title: string;
    status: StepProgressStatus;
  }>;
  className?: string;
}) {
  return (
    <div className={cn("w-full rounded-[2rem] border border-border/70 bg-card px-6 py-6 shadow-sm", className)}>
      <ol className="grid gap-8 md:flex md:items-start md:gap-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.key} className="min-w-0 md:flex-1">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full border-2",
                    item.status === "complete" && "border-emerald-600 bg-emerald-600 text-white",
                    item.status === "current" && "border-primary bg-primary text-primary-foreground",
                    item.status === "pending" && "border-primary/25 bg-primary/12 text-transparent",
                  )}
                >
                  {item.status === "complete" ? <Check className="size-4" /> : <span className="size-2 rounded-full bg-current" />}
                </div>
                {!isLast ? (
                  <div
                    className={cn(
                      "hidden h-0.5 flex-1 rounded-full md:block",
                      item.status === "complete" ? "bg-emerald-600" : "bg-primary/30",
                    )}
                  />
                ) : null}
              </div>
              <div className="mt-5 space-y-1 pl-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {item.stepLabel}
                </p>
                <p className="text-base font-semibold text-foreground">{item.title}</p>
                <p
                  className={cn(
                    "text-xs",
                    item.status === "complete" && "text-emerald-600",
                    item.status === "current" && "text-primary",
                    item.status === "pending" && "text-muted-foreground",
                  )}
                >
                  {item.status === "complete"
                    ? "Completed"
                    : item.status === "current"
                      ? "In progress"
                      : "Pending"}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export type { StepProgressStatus };
