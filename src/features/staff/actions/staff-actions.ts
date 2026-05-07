"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { getDefaultBranch } from "@/lib/branches";
import { INITIAL_FORM_ACTION_STATE, toFormActionState, type FormActionState } from "@/lib/forms";
import { parseStaffFormData, staffFormSchema } from "@/features/staff/schemas/staff-form-schema";

export async function createStaffAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  return saveStaff(formData);
}

export async function updateStaffAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  return saveStaff(formData);
}

async function saveStaff(formData: FormData): Promise<FormActionState> {
  const parsed = staffFormSchema.safeParse(parseStaffFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const values = parsed.data;
  const [{ id: branchId }, { supabase }] = await Promise.all([
    getDefaultBranch(),
    getAuthorizedSupabaseServerClient("staff:write"),
  ]);

  const payload = {
    branch_id: branchId,
    first_name: values.firstName,
    last_name: values.lastName,
    role: values.role,
    contact_number: normalizeNullable(values.contactNumber),
    address: normalizeNullable(values.address),
    sss_number: normalizeNullable(values.sssNumber),
    philhealth_number: normalizeNullable(values.philhealthNumber),
    tin_number: normalizeNullable(values.tinNumber),
    emergency_contact_name: normalizeNullable(values.emergencyContactName),
    emergency_contact_number: normalizeNullable(values.emergencyContactNumber),
    status: values.status,
  };

  const operation = values.staffId
    ? supabase.from("staff").update(payload).eq("id", values.staffId).select("id").single()
    : supabase.from("staff").insert(payload).select("id").single();

  const { error } = await operation;

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/staff");
  redirect("/staff");
}

function normalizeNullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
