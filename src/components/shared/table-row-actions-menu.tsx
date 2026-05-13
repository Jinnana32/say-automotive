"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ConfirmActionDialog, type ConfirmActionField } from "@/components/shared/confirm-action-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RowActionTone = "default" | "destructive";

const itemBaseClass =
  "group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors focus:bg-muted/70";

export function TableRowActionsMenu({
  label = "Row actions",
  children,
  className,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("size-8 text-muted-foreground hover:bg-muted/70 hover:text-foreground", className)}
          aria-label={label}
          title={label}
        >
          <MoreHorizontal className="size-4" />
          <span className="sr-only">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TableRowActionsMenuSeparator() {
  return <DropdownMenuSeparator />;
}

export function TableRowActionsMenuLink({
  href,
  label,
  icon: Icon,
  tone = "default",
}: {
  href: string;
  label: string;
  icon?: LucideIcon;
  tone?: RowActionTone;
}) {
  return (
    <DropdownMenuItem
      asChild
      className={cn(
        itemBaseClass,
        tone === "destructive" && "text-destructive hover:bg-destructive/10 hover:text-destructive",
      )}
    >
      <Link href={href} aria-label={label} title={label}>
        {Icon ? <Icon className="size-4" /> : null}
        <span>{label}</span>
      </Link>
    </DropdownMenuItem>
  );
}

export function TableRowActionsMenuButton({
  label,
  icon: Icon,
  tone = "default",
  onSelect,
  disabled = false,
}: {
  label: string;
  icon?: LucideIcon;
  tone?: RowActionTone;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <DropdownMenuItem
      className={cn(
        itemBaseClass,
        tone === "destructive" && "text-destructive hover:bg-destructive/10 hover:text-destructive",
      )}
      onSelect={() => onSelect()}
      disabled={disabled}
    >
      {Icon ? <Icon className="size-4" /> : null}
      <span>{label}</span>
    </DropdownMenuItem>
  );
}

export function TableRowActionsMenuConfirm({
  label,
  title,
  description,
  action,
  fields = [],
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "destructive",
  icon: Icon,
  tone = "destructive",
  disabled = false,
}: {
  label: string;
  title: string;
  description: string;
  action: (formData: FormData) => void | Promise<void>;
  fields?: ConfirmActionField[];
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonProps["variant"];
  icon?: LucideIcon;
  tone?: RowActionTone;
  disabled?: boolean;
}) {
  return (
    <ConfirmActionDialog
      title={title}
      description={description}
      action={action}
      fields={fields}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      confirmVariant={confirmVariant}
      trigger={({ openDialog }) => (
        <DropdownMenuItem
          className={cn(
            itemBaseClass,
            tone === "destructive" && "text-destructive hover:bg-destructive/10 hover:text-destructive",
          )}
          onSelect={() => openDialog()}
          disabled={disabled}
        >
          {Icon ? <Icon className="size-4" /> : null}
          <span>{label}</span>
        </DropdownMenuItem>
      )}
    />
  );
}
