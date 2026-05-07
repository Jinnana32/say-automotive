import { cva } from "class-variance-authority";

export const websiteCardVariants = cva("rounded-2xl border bg-white text-[#10224d]", {
  variants: {
    variant: {
      feature: "border-[#dbe3f5] p-6 shadow-[0_18px_36px_rgba(7,18,57,0.12)] sm:p-7",
      product:
        "overflow-hidden border-[#dbe3f5] shadow-[0_18px_36px_rgba(7,18,57,0.12)]",
      footer: "border-white/12 bg-white/10 p-4 text-white backdrop-blur",
      formSection:
        "border-[#dbe3f5] bg-[#fbfcff] p-5 shadow-[0_14px_30px_rgba(7,18,57,0.08)] sm:p-6",
    },
  },
  defaultVariants: {
    variant: "feature",
  },
});
