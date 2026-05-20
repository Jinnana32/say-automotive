import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";

export function ProductImage({
  src,
  alt,
  className,
  imageClassName,
  fallbackLabel = "No photo",
}: {
  src: string | null;
  alt: string;
  className?: string;
  imageClassName?: string;
  fallbackLabel?: string;
}) {
  if (src) {
    return (
      <div className={cn("overflow-hidden rounded-2xl bg-muted/30", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={cn("h-full w-full object-cover", imageClassName)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-2xl border border-dashed border-border/80 bg-brand-soft/35 text-brand-navy",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-2 px-3 py-4 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-white/80 shadow-sm">
          <ImageOff className="size-5" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-navy/80">
          {fallbackLabel}
        </p>
      </div>
    </div>
  );
}
