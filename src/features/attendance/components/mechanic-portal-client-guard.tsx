"use client";

import { useEffect } from "react";

import { isKnownExternalJsonRpcError } from "@/features/attendance/mechanic-portal-client-guard";

export function MechanicPortalClientGuard() {
  useEffect(() => {
    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      if (isKnownExternalJsonRpcError(event.reason)) {
        if (typeof event.stopImmediatePropagation === "function") {
          event.stopImmediatePropagation();
        }
        event.preventDefault();
      }
    }

    window.addEventListener("unhandledrejection", handleUnhandledRejection, true);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection, true);
    };
  }, []);

  return null;
}
