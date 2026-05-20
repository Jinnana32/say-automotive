import Image from "next/image";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  src?: string | null;
  markSrc?: string | null;
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
  markSrc,
  alt,
  width,
  height,
  variant = "full",
  className,
  priority = false,
  fallbackClassName,
}: BrandLogoProps) {
  if (variant === "mark") {
    if (markSrc) {
      return (
        <Image
          src={markSrc}
          alt={alt}
          width={width}
          height={height}
          className={className}
          priority={priority}
        />
      );
    }

    return (
      <div role="img" aria-label={alt} className={cn("inline-flex", fallbackClassName)}>
        <svg
          viewBox="0 0 64 64"
          className={cn("size-full", className)}
          aria-hidden="true"
        >
          <path
            d="M32 4L53 12V30C53 43.5 43.8 55.6 32 60C20.2 55.6 11 43.5 11 30V12L32 4Z"
            fill="#0B1F4D"
          />
          <path
            d="M32 10L47 15.8V29.4C47 39.5 40.2 48.2 32 51.8C23.8 48.2 17 39.5 17 29.4V15.8L32 10Z"
            fill="#F8FAFC"
            opacity="0.16"
          />
          <path d="M18 18H46L40.2 26H23.8L18 18Z" fill="#D62828" />
          <text
            x="32"
            y="41"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="17"
            fontWeight="800"
            fontStyle="italic"
            fontFamily="Arial, sans-serif"
            letterSpacing="-0.8"
          >
            SAY
          </text>
        </svg>
      </div>
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
