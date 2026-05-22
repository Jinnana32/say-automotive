import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  align = "center",
  inverse = false,
  className,
  titleTag = "h2",
  size = "section",
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  align?: "left" | "center";
  inverse?: boolean;
  className?: string;
  titleTag?: "h1" | "h2";
  size?: "hero" | "section";
}) {
  const centered = align === "center";
  const TitleTag = titleTag;

  return (
    <div className={cn("max-w-full space-y-4", centered ? "text-center" : "text-left", className)}>
      <p
        className={cn(
          "text-[11px] font-semibold uppercase tracking-[0.18em] sm:text-xs sm:tracking-[0.24em]",
          inverse ? "text-[#ffd24a]" : "text-[#173c99]",
        )}
      >
        {eyebrow}
      </p>
      <TitleTag
        className={cn(
          "max-w-full text-balance break-words font-display uppercase leading-[0.96] tracking-[0.012em] sm:leading-[0.92] sm:tracking-[0.03em]",
          size === "hero"
            ? "text-[2.35rem] sm:text-5xl lg:text-6xl"
            : "text-3xl sm:text-4xl lg:text-5xl",
          inverse ? "text-white" : "text-[#10224d]",
        )}
      >
        {title}
      </TitleTag>
      <p
        className={cn(
          "text-sm leading-7 sm:text-[15px]",
          centered ? "mx-auto max-w-3xl" : "max-w-3xl",
          inverse ? "text-[#d8e3ff]" : "text-[#5b6783]",
        )}
      >
        {description}
      </p>
      {actions ? (
        <div
          className={cn(
            "flex flex-col gap-3 pt-2 [&>*]:w-full sm:flex-row sm:flex-wrap sm:gap-4 sm:[&>*]:w-auto",
            centered ? "justify-center" : "",
          )}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}
