"use client";

import { useEffect, useState } from "react";
import { DateTime } from "luxon";

import { cn } from "@/lib/utils";

export function MechanicPortalClock({
  className,
  timeClassName,
  dateClassName,
  timeFormat = "hh:mm:ss a",
}: {
  className?: string;
  timeClassName?: string;
  dateClassName?: string;
  timeFormat?: string;
}) {
  const [now, setNow] = useState(() => DateTime.now().setZone("Asia/Manila"));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(DateTime.now().setZone("Asia/Manila"));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={className}>
      <p className={cn("text-3xl font-semibold tracking-tight text-foreground", timeClassName)}>
        {now.toFormat(timeFormat)}
      </p>
      <p className={cn("text-sm text-muted-foreground", dateClassName)}>
        {now.toFormat("cccc, LLL dd, yyyy")}
      </p>
    </div>
  );
}
