"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { applyBranchFilter, getBranchScopedServerClient } from "@/lib/branches";
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
  const { branchScope, supabase } = await getBranchScopedServerClient("staff:write");
  const branchId = values.staffId
    ? await getExistingStaffBranchId(supabase, branchScope.selectedBranchId, values.staffId)
    : branchScope.writeBranchId;

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

async function getExistingStaffBranchId(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  selectedBranchId: string | null,
  staffId: string,
) {
  const { data, error } = await applyBranchFilter(
    supabase.from("staff").select("branch_id"),
    selectedBranchId,
  )
    .eq("id", staffId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.branch_id) {
    throw new Error("Staff record does not exist.");
  }

  return data.branch_id;
}
