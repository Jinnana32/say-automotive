"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ModalDialog({
  trigger,
  title,
  description,
  size = "md",
  children,
  open,
  onOpenChange,
}: {
  trigger?: (controls: { openDialog: () => void }) => React.ReactNode;
  title: string;
  description?: string;
  size?: "md" | "lg" | "xl";
  children: (controls: { closeDialog: () => void }) => React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const setDialogOpen = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDialogOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, setDialogOpen]);

  return (
    <>
      {trigger?.({
        openDialog: () => setDialogOpen(true),
      })}
      {isOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-slate-950/45 px-4 py-4 backdrop-blur-[2px] sm:items-center sm:py-6"
              onMouseDown={() => setDialogOpen(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={description ? descriptionId : undefined}
                className={cn(
                  "flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-background shadow-2xl shadow-slate-950/15 sm:max-h-[calc(100dvh-3rem)]",
                  size === "md"
                    ? "max-w-lg"
                    : size === "lg"
                      ? "max-w-3xl"
                      : "max-w-5xl",
                )}
                onMouseDown={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4 border-b border-border/70 px-6 py-5">
                  <div className="space-y-1">
                    <h2 id={titleId} className="text-base font-semibold text-foreground">
                      {title}
                    </h2>
                    {description ? (
                      <p id={descriptionId} className="text-sm text-muted-foreground">
                        {description}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="size-8 p-0"
                    onClick={() => setDialogOpen(false)}
                    aria-label="Close dialog"
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                <div className="min-h-0 overflow-y-auto overscroll-contain px-6 py-5">
                  {children({ closeDialog: () => setDialogOpen(false) })}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
