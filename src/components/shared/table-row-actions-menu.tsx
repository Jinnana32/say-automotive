"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CalendarClock,
  Check,
  Eye,
  FileText,
  HandCoins,
  MoreHorizontal,
  Pencil,
  Power,
  Trash2,
} from "lucide-react";
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

const TABLE_ROW_ACTION_ICONS = {
  eye: Eye,
  pencil: Pencil,
  fileText: FileText,
  trash: Trash2,
  check: Check,
  power: Power,
  calendarClock: CalendarClock,
  handCoins: HandCoins,
} as const;

export type TableRowActionIconName = keyof typeof TABLE_ROW_ACTION_ICONS;

type RowActionIconProps = {
  icon?: LucideIcon;
  iconName?: TableRowActionIconName;
  className?: string;
};

function RowActionIcon({ icon, iconName, className = "size-4" }: RowActionIconProps) {
  const Icon = icon ?? (iconName ? TABLE_ROW_ACTION_ICONS[iconName] : undefined);

  return Icon ? <Icon className={className} /> : null;
}

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
          className={cn(
            "size-8 text-slate-500 hover:bg-[#071F4A]/8 hover:text-[#071F4A] focus-visible:ring-[#071F4A]/25",
            className,
          )}
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
  icon,
  iconName,
  tone = "default",
}: {
  href: string;
  label: string;
  icon?: LucideIcon;
  iconName?: TableRowActionIconName;
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
        <RowActionIcon icon={icon} iconName={iconName} />
        <span>{label}</span>
      </Link>
    </DropdownMenuItem>
  );
}

export function TableRowActionsMenuButton({
  label,
  icon,
  iconName,
  tone = "default",
  onSelect,
  disabled = false,
}: {
  label: string;
  icon?: LucideIcon;
  iconName?: TableRowActionIconName;
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
      <RowActionIcon icon={icon} iconName={iconName} />
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
  icon,
  iconName,
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
  iconName?: TableRowActionIconName;
  tone?: RowActionTone;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <DropdownMenuItem
        className={cn(
          itemBaseClass,
          tone === "destructive" && "text-destructive hover:bg-destructive/10 hover:text-destructive",
        )}
        onSelect={(event) => {
          event.preventDefault();
          setIsOpen(true);
        }}
        disabled={disabled}
      >
        <RowActionIcon icon={icon} iconName={iconName} />
        <span>{label}</span>
      </DropdownMenuItem>
      <ConfirmActionDialog
        title={title}
        description={description}
        action={action}
        fields={fields}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        confirmVariant={confirmVariant}
        closeOnSubmit={false}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  );
}
