import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { ConfirmActionDialog, type ConfirmActionField } from "@/components/shared/confirm-action-dialog";
import { Tooltip } from "@/components/ui/tooltip";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RowActionTone = "default" | "destructive";

type SharedIconActionProps = {
  label: string;
  icon: LucideIcon;
  className?: string;
  tone?: RowActionTone;
};

const baseActionClass =
  "size-8 p-0 text-slate-500 transition-colors hover:bg-[#071F4A]/8 hover:text-[#071F4A] focus-visible:ring-[#071F4A]/25";

function getToneClass(tone: RowActionTone) {
  return tone === "destructive"
    ? "text-destructive/80 hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/20"
    : null;
}

export function IconActionLink({
  href,
  label,
  icon: Icon,
  className,
  tone = "default",
  variant = "ghost",
}: SharedIconActionProps & {
  href: string;
  variant?: ButtonProps["variant"];
}) {
  return (
    <Tooltip content={label}>
      <Button
        asChild
        size="sm"
        variant={variant}
        className={cn(baseActionClass, getToneClass(tone), className)}
      >
        <Link href={href} aria-label={label} title={label}>
          <Icon className="size-4" />
          <span className="sr-only">{label}</span>
        </Link>
      </Button>
    </Tooltip>
  );
}

export function IconActionButton({
  label,
  icon: Icon,
  className,
  tone = "default",
  type = "button",
  variant = "ghost",
  ...props
}: SharedIconActionProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
    type?: "button" | "submit" | "reset";
    variant?: ButtonProps["variant"];
  }) {
  return (
    <Tooltip content={label}>
      <Button
        type={type}
        size="sm"
        variant={variant}
        className={cn(baseActionClass, getToneClass(tone), className)}
        aria-label={label}
        title={label}
        {...props}
      >
        <Icon className="size-4" />
        <span className="sr-only">{label}</span>
      </Button>
    </Tooltip>
  );
}

export function IconActionGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex items-center justify-end gap-1", className)}>{children}</div>;
}

export function IconActionConfirm({
  label,
  icon,
  tone = "destructive",
  className,
  title,
  description,
  action,
  fields = [],
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "destructive",
  disabled = false,
}: SharedIconActionProps & {
  title: string;
  description: string;
  action: (formData: FormData) => void | Promise<void>;
  fields?: ConfirmActionField[];
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonProps["variant"];
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
        <IconActionButton
          label={label}
          icon={icon}
          tone={tone}
          className={className}
          onClick={openDialog}
          disabled={disabled}
        />
      )}
    />
  );
}
