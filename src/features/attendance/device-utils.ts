import type {
  MechanicPortalDeviceStatus,
  StaffDeviceStatus,
  StaffDeviceSummary,
} from "@/features/attendance/types";

export const STAFF_DEVICE_STATUS_VALUES = ["pending", "approved", "revoked"] as const;

export function formatStaffDeviceStatusLabel(status: StaffDeviceStatus) {
  switch (status) {
    case "pending":
      return "Pending approval";
    case "approved":
      return "Approved";
    case "revoked":
      return "Revoked";
  }
}

export function getStaffDeviceStatusTone(status: StaffDeviceStatus) {
  switch (status) {
    case "pending":
      return "warning";
    case "approved":
      return "success";
    case "revoked":
      return "destructive";
  }
}

export function formatMechanicDeviceStatusMessage(deviceStatus: MechanicPortalDeviceStatus) {
  switch (deviceStatus.status) {
    case "missing":
      return "This browser still needs a registered attendance device token. Reload after the device finishes registering.";
    case "pending":
      return "This device is not approved for time-in/time-out yet. Ask the owner or admin to approve it, or file a DTR amendment.";
    case "approved":
      return deviceStatus.currentDevice?.deviceName?.trim()
        ? `Approved attendance device: ${deviceStatus.currentDevice.deviceName}.`
        : "This device is approved for time-in/time-out.";
    case "revoked":
      return "This device was revoked for mechanic attendance. Ask the owner or admin to approve a different device, or file a DTR amendment.";
    case "registered_to_other_staff":
      return "This device is already registered to a different mechanic account and cannot be used for your attendance.";
  }
}

export function deriveDeviceNameFromUserAgent(userAgent: string | null) {
  if (!userAgent) {
    return "Unknown browser device";
  }

  const browser = userAgent.includes("Edg/")
    ? "Edge"
    : userAgent.includes("Chrome/")
      ? "Chrome"
      : userAgent.includes("Firefox/")
        ? "Firefox"
        : userAgent.includes("Safari/") && !userAgent.includes("Chrome/")
          ? "Safari"
          : "Browser";
  const platform = userAgent.includes("iPhone")
    ? "iPhone"
    : userAgent.includes("Android")
      ? "Android"
      : userAgent.includes("Windows")
        ? "Windows"
        : userAgent.includes("Mac OS X")
          ? "Mac"
          : "device";

  return `${browser} on ${platform}`;
}

export function summarizeCurrentDevice(device: StaffDeviceSummary | null) {
  if (!device) {
    return "No registered device yet";
  }

  return device.deviceName?.trim() || device.userAgent?.trim() || "Registered device";
}
