import "server-only";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";

import { writeAuditLog } from "@/lib/audit";
import { getBusinessNow } from "@/lib/dates";
import { MECHANIC_PORTAL_DEVICE_COOKIE_NAME } from "@/features/attendance/device-constants";
import { deriveDeviceNameFromUserAgent } from "@/features/attendance/device-utils";
import type { DatabaseClient } from "@/features/attendance/server-utils";
import type {
  MechanicPortalDeviceStatus,
  StaffDeviceSummary,
} from "@/features/attendance/types";
import type { TableInsert, TableRow } from "@/types/database";

type StaffDeviceRow = TableRow<"staff_devices">;

export async function resolveMechanicPortalDeviceStatus({
  admin,
  staffId,
  requestIp,
  userAgent,
  userIdForAudit,
}: {
  admin: DatabaseClient;
  staffId: string;
  requestIp: string | null;
  userAgent: string | null;
  userIdForAudit?: string | null;
}): Promise<MechanicPortalDeviceStatus> {
  const cookieStore = await cookies();
  const rawDeviceId = cookieStore.get(MECHANIC_PORTAL_DEVICE_COOKIE_NAME)?.value ?? null;

  if (!rawDeviceId) {
    return {
      status: "missing",
      hasDeviceToken: false,
      isApproved: false,
      currentDevice: null,
    };
  }

  const deviceIdHash = hashDeviceIdentifier(rawDeviceId);
  const { data: existingDeviceData, error: existingDeviceError } = await admin
    .from("staff_devices")
    .select("*")
    .eq("device_id_hash", deviceIdHash)
    .maybeSingle();

  if (existingDeviceError) {
    throw new Error(existingDeviceError.message);
  }

  const existingDevice = (existingDeviceData as StaffDeviceRow | null) ?? null;

  if (existingDevice && existingDevice.staff_id !== staffId) {
    return {
      status: "registered_to_other_staff",
      hasDeviceToken: true,
      isApproved: false,
      currentDevice: null,
    };
  }

  const nowIso = ensureIso(getBusinessNow().toUTC().toISO());
  const deviceName = deriveDeviceNameFromUserAgent(userAgent);
  let currentDevice = existingDevice;

  if (!existingDevice) {
    const payload: TableInsert<"staff_devices"> = {
      staff_id: staffId,
      device_id_hash: deviceIdHash,
      device_name: deviceName,
      user_agent: userAgent,
      first_seen_at: nowIso,
      last_seen_at: nowIso,
      last_ip: requestIp,
      status: "pending",
      approved_at: null,
      approved_by_staff_id: null,
      revoked_at: null,
      revoked_by_staff_id: null,
    };
    const { data: insertedDevice, error: insertError } = await admin
      .from("staff_devices")
      .insert(payload)
      .select("*")
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    currentDevice = insertedDevice as StaffDeviceRow;

    await writeAuditLog(admin, {
      action: "Registered pending mechanic attendance device",
      entityType: "staff_device",
      entityId: currentDevice.id,
      userId: userIdForAudit ?? null,
      afterData: currentDevice,
    });
  } else {
    const knownDevice = existingDevice;
    const updatePayload = {
      device_name: knownDevice.device_name || deviceName,
      user_agent: userAgent,
      last_seen_at: nowIso,
      last_ip: requestIp,
    };
    const { data: updatedDevice, error: updateError } = await admin
      .from("staff_devices")
      .update(updatePayload)
      .eq("id", knownDevice.id)
      .select("*")
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    currentDevice = updatedDevice as StaffDeviceRow;
  }

  if (!currentDevice) {
    throw new Error("Failed to resolve staff device.");
  }

  return {
    status: currentDevice.status as MechanicPortalDeviceStatus["status"],
    hasDeviceToken: true,
    isApproved: currentDevice.status === "approved",
    currentDevice: mapStaffDevice(currentDevice),
  };
}

export function hashDeviceIdentifier(rawDeviceId: string) {
  return createHash("sha256").update(rawDeviceId).digest("hex");
}

export function mapStaffDevice(row: StaffDeviceRow): StaffDeviceSummary {
  return {
    id: row.id,
    staffId: row.staff_id,
    deviceName: row.device_name,
    userAgent: row.user_agent,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    lastIp: row.last_ip,
    status: row.status as StaffDeviceSummary["status"],
    approvedAt: row.approved_at,
    approvedByStaffId: row.approved_by_staff_id,
    revokedAt: row.revoked_at,
    revokedByStaffId: row.revoked_by_staff_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function ensureIso(value: string | null) {
  if (!value) {
    throw new Error("Expected a valid ISO timestamp.");
  }

  return value;
}
