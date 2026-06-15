"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { applyBranchFilter, getBranchScopedServerClient } from "@/lib/branches";
import { INITIAL_FORM_ACTION_STATE, toFormActionState, type FormActionState } from "@/lib/forms";
import { isMissingStaffDocumentTitleColumnError } from "@/features/staff/document-title-compat";
import { parseStaffFormData, staffFormSchema } from "@/features/staff/schemas/staff-form-schema";
import type { TableInsert } from "@/types/database";

type StaffSavePayload = Pick<
  TableInsert<"staff">,
  | "branch_id"
  | "first_name"
  | "last_name"
  | "document_title"
  | "role"
  | "is_payroll_eligible"
  | "contact_number"
  | "address"
  | "sss_number"
  | "philhealth_number"
  | "tin_number"
  | "emergency_contact_name"
  | "emergency_contact_number"
  | "status"
>;

type LegacyStaffSavePayload = Omit<StaffSavePayload, "document_title">;

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
    document_title: normalizeNullable(values.documentTitle),
    role: values.role,
    is_payroll_eligible: values.isPayrollEligible,
    contact_number: normalizeNullable(values.contactNumber),
    address: normalizeNullable(values.address),
    sss_number: normalizeNullable(values.sssNumber),
    philhealth_number: normalizeNullable(values.philhealthNumber),
    tin_number: normalizeNullable(values.tinNumber),
    emergency_contact_name: normalizeNullable(values.emergencyContactName),
    emergency_contact_number: normalizeNullable(values.emergencyContactNumber),
    status: values.status,
  };

  let { error } = await executeStaffSaveOperation({
    supabase,
    staffId: values.staffId,
    payload,
  });

  if (error && isMissingStaffDocumentTitleColumnError(error)) {
    const { document_title: _documentTitle, ...fallbackPayload } = payload;
    const retryResult = await executeStaffSaveOperation({
      supabase,
      staffId: values.staffId,
      payload: fallbackPayload,
    });
    error = retryResult.error;
  }

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

async function executeStaffSaveOperation({
  supabase,
  staffId,
  payload,
}: {
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"];
  staffId?: string;
  payload: StaffSavePayload | LegacyStaffSavePayload;
}) {
  return staffId
    ? supabase.from("staff").update(payload).eq("id", staffId).select("id").single()
    : supabase.from("staff").insert(payload).select("id").single();
}
