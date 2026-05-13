"use client";

import { useEffect, useState } from "react";
import { DateTime } from "luxon";

export function MechanicPortalClock() {
  const [now, setNow] = useState(() => DateTime.now().setZone("Asia/Manila"));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(DateTime.now().setZone("Asia/Manila"));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div>
      <p className="text-3xl font-semibold tracking-tight text-foreground">
        {now.toFormat("hh:mm:ss a")}
      </p>
      <p className="text-sm text-muted-foreground">{now.toFormat("cccc, LLL dd, yyyy")}</p>
    </div>
  );
}
