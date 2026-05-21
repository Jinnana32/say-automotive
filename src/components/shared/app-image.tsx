import Image from "next/image";

import { cn } from "@/lib/utils";

type AppImageMode = "brand" | "content";
type AppImageSurface = "light" | "dark";

type AppImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  mode?: AppImageMode;
  fit?: "contain" | "cover";
  surface?: AppImageSurface;
  className?: string;
  priority?: boolean;
  unoptimized?: boolean;
  sizes?: string;
};

function isRasterAsset(src: string) {
  return /\.(png|jpe?g|webp)(\?.*)?$/i.test(src);
}

export function AppImage({
  src,
  alt,
  width,
  height,
  mode = "content",
  fit,
  surface = "light",
  className,
  priority = false,
  unoptimized = false,
  sizes,
}: AppImageProps) {
  const resolvedFit =
    fit ?? (mode === "brand" ? "contain" : "cover");
  const shouldBlendBrandAsset =
    mode === "brand" && surface !== "dark" && isRasterAsset(src);

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      sizes={sizes}
      draggable={false}
      {...(unoptimized ? { unoptimized: true } : {})}
      className={cn(
        "bg-transparent",
        resolvedFit === "contain" ? "object-contain" : "object-cover",
        mode === "brand" && "select-none",
        shouldBlendBrandAsset && "mix-blend-multiply",
        className,
      )}
    />
  );
}
