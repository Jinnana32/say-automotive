import { z } from "zod";

import type { WebsitePostFormValues } from "@/features/website/types";

export const websitePostFormSchema = z.object({
  postId: z.string().uuid().optional(),
  title: z.string().trim().min(1, "Title is required."),
  slug: z.string().trim(),
  excerpt: z.string().trim().min(1, "Excerpt is required."),
  content: z.string().trim().min(1, "Content is required."),
  coverImageUrl: z
    .string()
    .trim()
    .refine((value) => !value || /^https?:\/\//i.test(value), "Enter a full image URL."),
  category: z.enum(["shop_update", "maintenance_tip", "promo"]),
  isFeatured: z.boolean(),
  status: z.enum(["active", "inactive"]),
});

export function parseWebsitePostFormData(formData: FormData): WebsitePostFormValues {
  return {
    postId: readString(formData, "postId") || undefined,
    title: readString(formData, "title"),
    slug: readString(formData, "slug"),
    excerpt: readString(formData, "excerpt"),
    content: readString(formData, "content"),
    coverImageUrl: readString(formData, "coverImageUrl"),
    category: readString(formData, "category") as WebsitePostFormValues["category"],
    isFeatured: formData.get("isFeatured") === "on",
    status: readString(formData, "status") as WebsitePostFormValues["status"],
  };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
