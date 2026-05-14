"use client";

import { Loader2 } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type GlobalLoadingOverlayOptions = {
  label?: string;
  description?: string;
};

type OverlayEntry = Required<Pick<GlobalLoadingOverlayOptions, "label">> &
  Pick<GlobalLoadingOverlayOptions, "description"> & {
    id: number;
  };

const GlobalLoadingOverlayContext = createContext<{
  showOverlay: (options?: GlobalLoadingOverlayOptions) => () => void;
} | null>(null);

export function GlobalLoadingOverlayProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nextId = useRef(1);
  const [entries, setEntries] = useState<OverlayEntry[]>([]);

  const showOverlay = useCallback((options?: GlobalLoadingOverlayOptions) => {
    const id = nextId.current++;

    setEntries((current) => [
      ...current,
      {
        id,
        label: options?.label ?? "Loading",
        description: options?.description,
      },
    ]);

    return () => {
      setEntries((current) => current.filter((entry) => entry.id !== id));
    };
  }, []);

  const value = useMemo(
    () => ({
      showOverlay,
    }),
    [showOverlay],
  );

  const activeEntry = entries.at(-1) ?? null;

  return (
    <GlobalLoadingOverlayContext.Provider value={value}>
      {children}
      {activeEntry ? (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-[2px]">
          <div
            role="status"
            aria-live="polite"
            className="w-full max-w-sm rounded-3xl border border-border/70 bg-background px-6 py-5 text-center shadow-2xl shadow-slate-950/15"
          >
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand-navy/10 text-brand-navy">
              <Loader2 className="size-5 animate-spin" />
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm font-semibold text-foreground">{activeEntry.label}</p>
              {activeEntry.description ? (
                <p className="text-sm text-muted-foreground">{activeEntry.description}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </GlobalLoadingOverlayContext.Provider>
  );
}

export function useGlobalLoadingOverlay() {
  const context = useContext(GlobalLoadingOverlayContext);

  if (!context) {
    throw new Error("useGlobalLoadingOverlay must be used within GlobalLoadingOverlayProvider.");
  }

  return context;
}
