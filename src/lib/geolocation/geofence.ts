export const DEFAULT_ATTENDANCE_GEOFENCE_RADIUS_METERS = 100;
export const MIN_ATTENDANCE_GEOFENCE_RADIUS_METERS = 25;
export const MAX_ATTENDANCE_GEOFENCE_RADIUS_METERS = 2000;
export const MAX_MECHANIC_LOCATION_ACCURACY_METERS = 100;
export const MAX_MECHANIC_LOCATION_AGE_SECONDS = 90;

export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type AttendanceGeofence = GeoPoint & {
  radiusMeters: number;
};

export type MechanicLocationReading = GeoPoint & {
  accuracyMeters: number;
  capturedAtMs: number;
};

const EARTH_RADIUS_METERS = 6_371_000;

export function calculateDistanceMeters(
  from: GeoPoint,
  to: GeoPoint,
) {
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) *
      Math.cos(toLat) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

export function isLocationReadingFresh(
  capturedAtMs: number,
  nowMs = Date.now(),
  maxAgeSeconds = MAX_MECHANIC_LOCATION_AGE_SECONDS,
) {
  if (!Number.isFinite(capturedAtMs)) {
    return false;
  }

  const ageSeconds = (nowMs - capturedAtMs) / 1000;
  return ageSeconds >= 0 && ageSeconds <= maxAgeSeconds;
}

export function isWithinGeofence({
  point,
  geofence,
  accuracyMeters,
  maxAccuracyMeters = MAX_MECHANIC_LOCATION_ACCURACY_METERS,
}: {
  point: GeoPoint;
  geofence: AttendanceGeofence;
  accuracyMeters?: number | null;
  maxAccuracyMeters?: number;
}) {
  if (!isValidCoordinate(point.latitude, point.longitude)) {
    return {
      isAllowed: false,
      distanceMeters: null,
      reason: "invalid_coordinates" as const,
    };
  }

  if (!isValidCoordinate(geofence.latitude, geofence.longitude)) {
    return {
      isAllowed: false,
      distanceMeters: null,
      reason: "geofence_not_configured" as const,
    };
  }

  if (
    typeof accuracyMeters === "number" &&
    Number.isFinite(accuracyMeters) &&
    accuracyMeters > maxAccuracyMeters
  ) {
    return {
      isAllowed: false,
      distanceMeters: null,
      reason: "accuracy_too_low" as const,
    };
  }

  const distanceMeters = calculateDistanceMeters(point, geofence);

  return {
    isAllowed: distanceMeters <= geofence.radiusMeters,
    distanceMeters,
    reason: distanceMeters <= geofence.radiusMeters
      ? ("within_radius" as const)
      : ("outside_radius" as const),
  };
}

export function validateMechanicLocationReading({
  reading,
  geofence,
  nowMs = Date.now(),
}: {
  reading: MechanicLocationReading;
  geofence: AttendanceGeofence;
  nowMs?: number;
}) {
  if (!isLocationReadingFresh(reading.capturedAtMs, nowMs)) {
    return {
      isAllowed: false,
      distanceMeters: null,
      reason: "stale_reading" as const,
    };
  }

  return isWithinGeofence({
    point: reading,
    geofence,
    accuracyMeters: reading.accuracyMeters,
  });
}

export function isValidCoordinate(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export function createGeofenceCircleCoordinates({
  center,
  radiusMeters,
  points = 64,
}: {
  center: GeoPoint;
  radiusMeters: number;
  points?: number;
}) {
  const coordinates: Array<[number, number]> = [];
  const radiusKm = radiusMeters / 1000;
  const latitudeRadians = toRadians(center.latitude);
  const distanceX =
    radiusKm / (111.32 * Math.cos(latitudeRadians));
  const distanceY = radiusKm / 110.574;

  for (let index = 0; index < points; index += 1) {
    const theta = (index / points) * (Math.PI * 2);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coordinates.push([center.longitude + x, center.latitude + y]);
  }

  coordinates.push(coordinates[0] ?? [center.longitude, center.latitude]);

  return coordinates;
}

export function isPremiseVerificationPassed({
  requireShopIp,
  requireShopLocation,
  isIpAllowed,
  isLocationAllowed,
}: {
  requireShopIp: boolean;
  requireShopLocation: boolean;
  isIpAllowed: boolean;
  isLocationAllowed: boolean;
}) {
  const ipOk = !requireShopIp || isIpAllowed;
  const locationOk = !requireShopLocation || isLocationAllowed;

  return ipOk && locationOk;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
