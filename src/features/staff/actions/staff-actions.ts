"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { applyBranchFilter, getBranchScopedServerClient } from "@/lib/branches";
import { INITIAL_FORM_ACTION_STATE, toFormActionState, type FormActionState } from "@/lib/forms";
import { isMissingStaffDocumentTitleColumnError } from "@/features/staff/document-title-compat";
import { parseStaffFormData, staffFormSchema } from "@/features/staff/schemas/staff-form-schema";
import {
  deleteAuthUser,
  linkExistingMechanicPortalLogin,
  provisionMechanicPortalLogin,
} from "@/features/staff/services/mechanic-portal-login";
import type { StaffCreateActionState } from "@/features/staff/types";
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
  | "linked_user_id"
>;

type LegacyStaffSavePayload = Omit<StaffSavePayload, "document_title">;

const INITIAL_STAFF_CREATE_ACTION_STATE: StaffCreateActionState = {
  status: "idle",
};

export async function createStaffAction(
  _prevState: StaffCreateActionState = INITIAL_STAFF_CREATE_ACTION_STATE,
  formData: FormData,
): Promise<StaffCreateActionState> {
  return saveStaff(formData, { mode: "create" });
}

export async function updateStaffAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const result = await saveStaff(formData, { mode: "update" });

  if (result.status === "success") {
    redirect("/staff");
  }

  return {
    status: result.status,
    message: result.message,
    fieldErrors: result.fieldErrors,
  };
}

async function saveStaff(
  formData: FormData,
  options: { mode: "create" | "update" },
): Promise<StaffCreateActionState> {
  const parsed = staffFormSchema.safeParse(parseStaffFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const values = parsed.data;
  const { branchScope, supabase } = await getBranchScopedServerClient("staff:write");
  const branchId = values.staffId
    ? await getExistingStaffBranchId(supabase, branchScope.selectedBranchId, values.staffId)
    : branchScope.writeBranchId;

  const existingStaff = values.staffId
    ? await getExistingStaffRecord(supabase, branchScope.selectedBranchId, values.staffId)
    : null;

  if (values.staffId && !existingStaff) {
    return { status: "error", message: "Staff record does not exist." };
  }

  const payload: StaffSavePayload = {
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
    linked_user_id: existingStaff?.linked_user_id ?? null,
  };

  let { data, error } = await executeStaffSaveOperation({
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
    data = retryResult.data;
    error = retryResult.error;
  }

  if (error || !data?.id) {
    return { status: "error", message: error?.message ?? "Unable to save the staff record." };
  }

  const staffId = data.id;

  if (
    options.mode === "update" &&
    values.role === "mechanic" &&
    !existingStaff?.linked_user_id &&
    values.portalLoginEmail.trim()
  ) {
    const linkResult = await linkExistingMechanicPortalLogin({
      staffId,
      email: values.portalLoginEmail,
    });

    if (!linkResult.success) {
      return { status: "error", message: linkResult.message };
    }
  }

  if (options.mode === "create" && values.role === "mechanic") {
    const loginResult = await provisionMechanicPortalLogin({
      firstName: values.firstName,
      lastName: values.lastName,
    });

    if (!loginResult.success) {
      await supabase.from("staff").delete().eq("id", staffId);
      return { status: "error", message: loginResult.message };
    }

    const { error: linkError } = await supabase
      .from("staff")
      .update({ linked_user_id: loginResult.credentials.userId })
      .eq("id", staffId);

    if (linkError) {
      try {
        await deleteAuthUser(loginResult.credentials.userId);
      } catch {
        // Best effort cleanup if linking fails after auth user creation.
      }

      await supabase.from("staff").delete().eq("id", staffId);
      return { status: "error", message: linkError.message };
    }

    revalidatePath("/staff");
    return {
      status: "success",
      staffId,
      portalLogin: {
        email: loginResult.credentials.email,
        temporaryPassword: loginResult.credentials.temporaryPassword,
      },
    };
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
  const staff = await getExistingStaffRecord(supabase, selectedBranchId, staffId);

  if (!staff?.branch_id) {
    throw new Error("Staff record does not exist.");
  }

  return staff.branch_id;
}

async function getExistingStaffRecord(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  selectedBranchId: string | null,
  staffId: string,
) {
  const { data, error } = await applyBranchFilter(
    supabase.from("staff").select("id, branch_id, linked_user_id"),
    selectedBranchId,
  )
    .eq("id", staffId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
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
