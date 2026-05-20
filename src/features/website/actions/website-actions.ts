"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { getMainBranch } from "@/lib/branches";
import { INITIAL_FORM_ACTION_STATE, toFormActionState, type FormActionState } from "@/lib/forms";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/features/website/utils";
import {
  parseWebsitePostFormData,
  websitePostFormSchema,
} from "@/features/website/schemas/website-post-schema";
import {
  parseWebsiteQuoteRequestFormData,
  websiteQuoteRequestSchema,
} from "@/features/website/schemas/website-quote-request-schema";

export async function submitWebsiteQuoteRequestAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = websiteQuoteRequestSchema.safeParse(parseWebsiteQuoteRequestFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const supabase = getSupabaseAdminClient();
  const branch = await getMainBranch();

  const payload = {
    branch_id: branch.id,
    first_name: parsed.data.firstName,
    last_name: parsed.data.lastName,
    contact_number: parsed.data.contactNumber.trim() || null,
    email: parsed.data.email,
    province: parsed.data.province,
    city: parsed.data.city,
    barangay: parsed.data.barangay,
    vehicle_make: parsed.data.vehicleMake,
    vehicle_model: parsed.data.vehicleModel,
    vehicle_year: parsed.data.vehicleYear ? Number(parsed.data.vehicleYear) : null,
    transmission: parsed.data.transmission,
    mileage: parsed.data.mileage,
    engine_size: parsed.data.engineSize.trim() || null,
    oil_requirement_liters: parsed.data.oilRequirementLiters
      ? Number(parsed.data.oilRequirementLiters)
      : null,
    service_needed: parsed.data.serviceNeeded,
    customer_concern: parsed.data.customerConcern,
  };

  let { error } = await supabase.from("website_quote_requests").insert(payload);

  // Some deployed databases may still enforce the old plate-number constraint.
  // Retry with a blank legacy value so the public form keeps working until the
  // nullable migration is applied everywhere.
  if (isLegacyWebsiteQuotePlateNumberConstraint(error)) {
    ({ error } = await supabase.from("website_quote_requests").insert({
      ...payload,
      plate_number: "",
    }));
  }

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/quotations/website-requests");
  redirect("/get-quote?submitted=1");
}

export async function createWebsitePostAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  return saveWebsitePost(formData);
}

export async function updateWebsitePostAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  return saveWebsitePost(formData);
}

export async function toggleWebsitePostStatusAction(formData: FormData) {
  const postId = readString(formData, "postId");
  const nextStatus = readString(formData, "nextStatus");

  if (!postId || (nextStatus !== "active" && nextStatus !== "inactive")) {
    return;
  }

  const { supabase } = await getAuthorizedSupabaseServerClient("settings:write");
  const { error } = await supabase
    .from("website_posts")
    .update({
      status: nextStatus,
      published_at: nextStatus === "active" ? new Date().toISOString() : null,
    })
    .eq("id", postId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/garage-journal");
  revalidatePath("/settings/website");
  revalidatePath("/settings/website/journal");
}

export async function updateWebsiteQuoteRequestStatusAction(formData: FormData) {
  const requestId = readString(formData, "requestId");
  const status = readString(formData, "status");

  if (
    !requestId ||
    !["new", "reviewed", "contacted", "quoted", "closed"].includes(status)
  ) {
    return;
  }

  const { supabase } = await getAuthorizedSupabaseServerClient("quotations:write");
  const { data: existingRequest, error: existingRequestError } = await supabase
    .from("website_quote_requests")
    .select("contacted_at")
    .eq("id", requestId)
    .maybeSingle();

  if (existingRequestError) {
    throw new Error(existingRequestError.message);
  }

  const payload = {
    status,
    contacted_at:
      status === "contacted" || status === "quoted"
        ? existingRequest?.contacted_at ?? new Date().toISOString()
        : existingRequest?.contacted_at ?? null,
  };
  const { error } = await supabase
    .from("website_quote_requests")
    .update(payload)
    .eq("id", requestId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/quotations/website-requests");
  revalidatePath("/settings/website");
}

async function saveWebsitePost(formData: FormData): Promise<FormActionState> {
  const parsed = websitePostFormSchema.safeParse(parseWebsitePostFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const { supabase } = await getAuthorizedSupabaseServerClient("settings:write");
  const normalizedSlug = slugify(parsed.data.slug || parsed.data.title);
  let existingPublishedAt: string | null = null;

  if (parsed.data.postId) {
    const { data: existingPost, error: existingPostError } = await supabase
      .from("website_posts")
      .select("published_at")
      .eq("id", parsed.data.postId)
      .maybeSingle();

    if (existingPostError) {
      return { status: "error", message: existingPostError.message };
    }

    existingPublishedAt = existingPost?.published_at ?? null;
  }

  const { data: slugConflict, error: slugConflictError } = await supabase
    .from("website_posts")
    .select("id")
    .eq("slug", normalizedSlug)
    .neq("id", parsed.data.postId ?? "")
    .maybeSingle();

  if (slugConflictError) {
    return { status: "error", message: slugConflictError.message };
  }

  if (slugConflict) {
    return {
      status: "error",
      message: "Another journal post already uses this slug.",
      fieldErrors: {
        slug: ["Another journal post already uses this slug."],
      },
    };
  }

  const payload = {
    title: parsed.data.title,
    slug: normalizedSlug,
    excerpt: parsed.data.excerpt,
    content: parsed.data.content,
    cover_image_url: parsed.data.coverImageUrl.trim() || null,
    category: parsed.data.category,
    is_featured: parsed.data.isFeatured,
    status: parsed.data.status,
    published_at:
      parsed.data.status === "active"
        ? existingPublishedAt ?? new Date().toISOString()
        : null,
  };

  const operation = parsed.data.postId
    ? supabase.from("website_posts").update(payload).eq("id", parsed.data.postId).select("id").single()
    : supabase.from("website_posts").insert(payload).select("id").single();

  const { error } = await operation;

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/");
  revalidatePath("/garage-journal");
  revalidatePath("/settings/website");
  revalidatePath("/settings/website/journal");
  redirect("/settings/website/journal");
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function isLegacyWebsiteQuotePlateNumberConstraint(
  error: {
    code?: string;
    message?: string;
  } | null,
) {
  return error?.code === "23502" && error.message?.includes("plate_number");
}
