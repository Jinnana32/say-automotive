"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { createPortal } from "react-dom";

import { Button, type ButtonProps } from "@/components/ui/button";

export type ConfirmActionField = {
  name: string;
  value: string;
};

export function ConfirmActionDialog({
  trigger,
  title,
  description,
  action,
  fields = [],
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "destructive",
  open,
  onOpenChange,
}: {
  trigger?: (controls: { openDialog: () => void }) => React.ReactNode;
  title: string;
  description: string;
  action: (formData: FormData) => void | Promise<void>;
  fields?: ConfirmActionField[];
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonProps["variant"];
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
              className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-[2px]"
              onMouseDown={() => setDialogOpen(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                className="w-full max-w-md rounded-3xl border border-border/70 bg-background shadow-2xl shadow-slate-950/15"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4 border-b border-border/70 px-6 py-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-10 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                      <AlertTriangle className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <h2 id={titleId} className="text-base font-semibold text-foreground">
                        {title}
                      </h2>
                      <p id={descriptionId} className="text-sm text-muted-foreground">
                        {description}
                      </p>
                    </div>
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

                <form
                  action={action}
                  className="space-y-5 px-6 py-5"
                  onSubmit={() => setDialogOpen(false)}
                >
                  {fields.map((field) => (
                    <input
                      key={`${field.name}-${field.value}`}
                      type="hidden"
                      name={field.name}
                      value={field.value}
                    />
                  ))}

                  <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                    This action may be blocked if the record is already linked to operational data.
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      autoFocus
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      {cancelLabel}
                    </Button>
                    <Button type="submit" variant={confirmVariant}>
                      {confirmLabel}
                    </Button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
