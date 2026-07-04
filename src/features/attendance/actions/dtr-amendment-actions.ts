"use server";

import { revalidatePath } from "next/cache";

import { getPayrollPeriodLockForDate } from "@/features/attendance/server-utils";
import { writeAuditLog } from "@/lib/audit";
import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { TableRow } from "@/types/database";

type DtrAmendmentRow = TableRow<"dtr_amendment_requests">;

export async function deleteDtrAmendmentAction(formData: FormData) {
  const amendmentId = readString(formData, "amendmentId");

  if (!amendmentId) {
    return;
  }

  const { context } = await getAuthorizedSupabaseServerClient("attendance:write");
  const admin = getSupabaseAdminClient();
  const { data: amendmentData, error: amendmentError } = await admin
    .from("dtr_amendment_requests")
    .select("*")
    .eq("id", amendmentId)
    .maybeSingle();

  if (amendmentError || !amendmentData) {
    return;
  }

  const amendment = amendmentData as DtrAmendmentRow;
  const payrollLock = await getPayrollPeriodLockForDate(
    admin,
    amendment.branch_id,
    amendment.attendance_date,
  );

  if (payrollLock) {
    throw new Error(
      payrollLock.status === "finalized"
        ? `This amendment is locked because payroll period ${payrollLock.label} is finalized.`
        : `This amendment is locked because payroll period ${payrollLock.label} is in processing.`,
    );
  }

  const { error } = await admin.from("dtr_amendment_requests").delete().eq("id", amendment.id);

  if (error) {
    throw new Error(error.message);
  }

  await writeAuditLog(admin, {
    action: "Deleted DTR amendment request",
    entityType: "dtr_amendment_request",
    entityId: amendment.id,
    userId: context.userId,
    beforeData: amendment,
  });

  revalidateDtrAmendmentPaths();
}

function revalidateDtrAmendmentPaths() {
  revalidatePath("/attendance/amendments");
  revalidatePath("/attendance");
  revalidatePath("/settings/timekeeping");
  revalidatePath("/portal/amendments");
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
