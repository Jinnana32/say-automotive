"use client";

import { useEffect } from "react";

export function ReportAutoPrint({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      window.print();

      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.delete("autoprint");
      window.history.replaceState(null, "", nextUrl.toString());
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [enabled]);

  return null;
}
