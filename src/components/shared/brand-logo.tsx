import Image from "next/image";

import { OFFICIAL_BRAND_MARK_SRC } from "@/components/shared/brand-assets";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  src?: string | null;
  alt: string;
  width: number;
  height: number;
  variant?: "full" | "mark";
  className?: string;
  priority?: boolean;
  fallbackClassName?: string;
};

export function BrandLogo({
  src,
  alt,
  width,
  height,
  variant = "full",
  className,
  priority = false,
  fallbackClassName,
}: BrandLogoProps) {
  if (variant === "mark") {
    return (
      <Image
        src={OFFICIAL_BRAND_MARK_SRC}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={priority}
      />
    );
  }

  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={priority}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        "flex items-center gap-2 leading-none text-[#0B1F4D]",
        fallbackClassName,
      )}
    >
      <span className="text-[1.85em] font-black italic tracking-[-0.08em] text-[#E11D2E]">
        SAY
      </span>
      <span className="flex flex-col justify-center text-[0.68em] font-black uppercase tracking-[-0.03em]">
        <span>Auto Care</span>
        <span>Center</span>
      </span>
    </div>
  );
}
