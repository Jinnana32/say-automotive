"use server";

import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit";
import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { TableRow } from "@/types/database";

type StaffDeviceRow = TableRow<"staff_devices">;

export async function approveStaffDeviceAction(formData: FormData) {
  const deviceId = readString(formData, "deviceId");

  if (!deviceId) {
    return;
  }

  const { context } = await getAuthorizedSupabaseServerClient("attendance:write");
  const admin = getSupabaseAdminClient();
  const { data: currentDeviceData, error: currentDeviceError } = await admin
    .from("staff_devices")
    .select("*")
    .eq("id", deviceId)
    .maybeSingle();

  if (currentDeviceError || !currentDeviceData) {
    return;
  }

  const currentDevice = currentDeviceData as StaffDeviceRow;
  const reviewedAt = new Date().toISOString();
  const { data: previousApprovedDevices, error: previousApprovedError } = await admin
    .from("staff_devices")
    .select("*")
    .eq("staff_id", currentDevice.staff_id)
    .eq("status", "approved")
    .neq("id", currentDevice.id);

  if (previousApprovedError) {
    throw new Error(previousApprovedError.message);
  }

  if ((previousApprovedDevices ?? []).length > 0) {
    for (const approvedDevice of previousApprovedDevices as StaffDeviceRow[]) {
      const { data: revokedDevice, error: revokeError } = await admin
        .from("staff_devices")
        .update({
          status: "revoked",
          revoked_at: reviewedAt,
          revoked_by_staff_id: context.staffId,
        })
        .eq("id", approvedDevice.id)
        .select("*")
        .single();

      if (revokeError) {
        throw new Error(revokeError.message);
      }

      await writeAuditLog(admin, {
        action: "Auto-revoked previous approved attendance device",
        entityType: "staff_device",
        entityId: approvedDevice.id,
        userId: context.userId,
        beforeData: approvedDevice,
        afterData: revokedDevice,
      });
    }
  }

  const { data: approvedDevice, error: approveError } = await admin
    .from("staff_devices")
    .update({
      status: "approved",
      approved_at: reviewedAt,
      approved_by_staff_id: context.staffId,
      revoked_at: null,
      revoked_by_staff_id: null,
    })
    .eq("id", currentDevice.id)
    .select("*")
    .single();

  if (approveError) {
    throw new Error(approveError.message);
  }

  await writeAuditLog(admin, {
    action: "Approved mechanic attendance device",
    entityType: "staff_device",
    entityId: currentDevice.id,
    userId: context.userId,
    beforeData: currentDevice,
    afterData: approvedDevice,
  });

  revalidateAttendanceDevicePaths();
}

export async function revokeStaffDeviceAction(formData: FormData) {
  const deviceId = readString(formData, "deviceId");

  if (!deviceId) {
    return;
  }

  const { context } = await getAuthorizedSupabaseServerClient("attendance:write");
  const admin = getSupabaseAdminClient();
  const { data: currentDeviceData, error: currentDeviceError } = await admin
    .from("staff_devices")
    .select("*")
    .eq("id", deviceId)
    .maybeSingle();

  if (currentDeviceError || !currentDeviceData) {
    return;
  }

  const currentDevice = currentDeviceData as StaffDeviceRow;
  const revokedAt = new Date().toISOString();
  const { data: revokedDevice, error: revokeError } = await admin
    .from("staff_devices")
    .update({
      status: "revoked",
      revoked_at: revokedAt,
      revoked_by_staff_id: context.staffId,
    })
    .eq("id", currentDevice.id)
    .select("*")
    .single();

  if (revokeError) {
    throw new Error(revokeError.message);
  }

  await writeAuditLog(admin, {
    action: "Revoked mechanic attendance device",
    entityType: "staff_device",
    entityId: currentDevice.id,
    userId: context.userId,
    beforeData: currentDevice,
    afterData: revokedDevice,
  });

  revalidateAttendanceDevicePaths();
}

function revalidateAttendanceDevicePaths() {
  revalidatePath("/attendance/devices");
  revalidatePath("/attendance");
  revalidatePath("/settings/timekeeping");
  revalidatePath("/portal/attendance");
  revalidatePath("/portal/amendments");
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
