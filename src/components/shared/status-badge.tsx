import { Badge } from "@/components/ui/badge";

export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "warning" | "destructive" | "info" | "neutral";
  className?: string;
}) {
  return (
    <Badge
      variant={
        tone === "default"
          ? "default"
          : tone === "success"
            ? "success"
            : tone === "warning"
              ? "warning"
              : tone === "destructive"
                ? "destructive"
                : tone === "info"
                  ? "info"
                  : "neutral"
      }
      className={className}
    >
      {children}
    </Badge>
  );
}
