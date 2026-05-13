import { BUSINESS_ASSETS_BUCKET } from "@/lib/constants/storage";

const SUPABASE_PUBLIC_STORAGE_PREFIX = "/storage/v1/object/public";

export function buildPublicStorageUrl(bucket: string, objectPath: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!baseUrl) {
    throw new Error("Missing public Supabase environment variables.");
  }

  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  const encodedPath = objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${normalizedBaseUrl}${SUPABASE_PUBLIC_STORAGE_PREFIX}/${bucket}/${encodedPath}`;
}

export function buildBusinessLogoUrl(objectPath: string | null) {
  if (!objectPath) {
    return null;
  }

  return buildPublicStorageUrl(BUSINESS_ASSETS_BUCKET, objectPath);
}
