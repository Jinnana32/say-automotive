import { cn } from "@/lib/utils";

type SectionTone = "white" | "muted" | "navy";
type SectionWidth = "default" | "narrow";
type SectionSpacing = "hero" | "default" | "compact";

const TONE_CLASS_NAMES: Record<SectionTone, string> = {
  white: "bg-white",
  muted: "bg-[#f3f5fa]",
  navy: "bg-[linear-gradient(135deg,#091a4f_0%,#143c9b_100%)] text-white",
};

const WIDTH_CLASS_NAMES: Record<SectionWidth, string> = {
  default: "max-w-7xl",
  narrow: "max-w-6xl",
};

const SPACING_CLASS_NAMES: Record<SectionSpacing, string> = {
  hero: "py-12 sm:py-14 lg:py-16",
  default: "py-14 sm:py-16",
  compact: "py-12 sm:py-14",
};

export function SectionContainer({
  children,
  className,
  innerClassName,
  id,
  tone = "white",
  width = "default",
  spacing = "default",
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  id?: string;
  tone?: SectionTone;
  width?: SectionWidth;
  spacing?: SectionSpacing;
}) {
  return (
    <section
      id={id}
      className={cn(SPACING_CLASS_NAMES[spacing], TONE_CLASS_NAMES[tone], className)}
    >
      <div
        className={cn(
          "mx-auto w-full px-4 sm:px-6 lg:px-8",
          WIDTH_CLASS_NAMES[width],
          innerClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
