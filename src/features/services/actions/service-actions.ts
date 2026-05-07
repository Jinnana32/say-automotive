"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { getDefaultBranch } from "@/lib/branches";
import { INITIAL_FORM_ACTION_STATE, toFormActionState, type FormActionState } from "@/lib/forms";
import { parseServiceFormData, serviceFormSchema } from "@/features/services/schemas/service-form-schema";

export async function createServiceAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  return saveService(formData);
}

export async function updateServiceAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  return saveService(formData);
}

async function saveService(formData: FormData): Promise<FormActionState> {
  const parsed = serviceFormSchema.safeParse(parseServiceFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const values = parsed.data;
  const [{ id: branchId }, { supabase }] = await Promise.all([
    getDefaultBranch(),
    getAuthorizedSupabaseServerClient("services:write"),
  ]);

  const payload = {
    branch_id: branchId,
    name: values.name,
    category: normalizeNullable(values.category),
    description: normalizeNullable(values.description),
    labor_price: Number(values.laborPrice),
    estimated_duration_minutes: values.estimatedDurationMinutes
      ? Number(values.estimatedDurationMinutes)
      : null,
    status: values.status,
  };

  const operation = values.serviceId
    ? supabase.from("services").update(payload).eq("id", values.serviceId).select("id").single()
    : supabase.from("services").insert(payload).select("id").single();

  const { error } = await operation;

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/services");
  redirect("/services");
}

function normalizeNullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
