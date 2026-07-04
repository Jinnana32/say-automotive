import type { AttendanceAccessSettings } from "@/features/attendance/types";
import { DEFAULT_ATTENDANCE_GEOFENCE_RADIUS_METERS } from "@/lib/geolocation/geofence";
import type { TableRow } from "@/types/database";

type BusinessSettingsAttendanceRow = Pick<
  TableRow<"business_settings">,
  | "allow_attendance_admin_override"
  | "allow_dtr_amendments"
  | "require_shop_ip_for_mechanic_attendance"
  | "require_shop_location_for_mechanic_attendance"
  | "attendance_geofence_latitude"
  | "attendance_geofence_longitude"
  | "attendance_geofence_radius_meters"
>;

export function mapAttendanceAccessSettings(
  row: BusinessSettingsAttendanceRow,
): AttendanceAccessSettings {
  return {
    requireShopIpForMechanicAttendance: row.require_shop_ip_for_mechanic_attendance,
    requireShopLocationForMechanicAttendance:
      row.require_shop_location_for_mechanic_attendance,
    allowDtrAmendments: row.allow_dtr_amendments,
    allowAttendanceAdminOverride: row.allow_attendance_admin_override,
    geofence: {
      latitude: row.attendance_geofence_latitude,
      longitude: row.attendance_geofence_longitude,
      radiusMeters:
        row.attendance_geofence_radius_meters ??
        DEFAULT_ATTENDANCE_GEOFENCE_RADIUS_METERS,
    },
  };
}
