"use server";

import { setAttendanceApprovalAction } from "@/features/attendance/actions/attendance-actions";

export async function submitAttendanceApprovalAction(
  formData: FormData,
): Promise<void> {
  await setAttendanceApprovalAction(undefined, formData);
}
