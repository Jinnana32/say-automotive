"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { LocateFixed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createGeofenceCircleCoordinates,
  DEFAULT_ATTENDANCE_GEOFENCE_RADIUS_METERS,
  MAX_ATTENDANCE_GEOFENCE_RADIUS_METERS,
  MIN_ATTENDANCE_GEOFENCE_RADIUS_METERS,
} from "@/lib/geolocation/geofence";

import "mapbox-gl/dist/mapbox-gl.css";

const DEFAULT_MAP_CENTER = {
  latitude: 14.5995,
  longitude: 120.9842,
};

type AttendanceGeofenceMapProps = {
  latitude: string;
  longitude: string;
  radiusMeters: string;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
  onRadiusChange: (value: string) => void;
};

export function AttendanceGeofenceMap({
  latitude,
  longitude,
  radiusMeters,
  onLatitudeChange,
  onLongitudeChange,
  onRadiusChange,
}: AttendanceGeofenceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const parsedLatitude = parseCoordinate(latitude);
  const parsedLongitude = parseCoordinate(longitude);
  const parsedRadius = parseRadius(radiusMeters);
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !accessToken) {
      if (!accessToken) {
        setMapError("Mapbox access token is missing. Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN.");
      }
      return;
    }

    mapboxgl.accessToken = accessToken;

    const initialLatitude = parsedLatitude ?? DEFAULT_MAP_CENTER.latitude;
    const initialLongitude = parsedLongitude ?? DEFAULT_MAP_CENTER.longitude;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [initialLongitude, initialLatitude],
      zoom: 16,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      map.addSource("attendance-geofence", {
        type: "geojson",
        data: buildGeofenceFeature({
          latitude: initialLatitude,
          longitude: initialLongitude,
          radiusMeters: parsedRadius,
        }),
      });

      map.addLayer({
        id: "attendance-geofence-fill",
        type: "fill",
        source: "attendance-geofence",
        paint: {
          "fill-color": "#2563eb",
          "fill-opacity": 0.15,
        },
      });

      map.addLayer({
        id: "attendance-geofence-outline",
        type: "line",
        source: "attendance-geofence",
        paint: {
          "line-color": "#2563eb",
          "line-width": 2,
        },
      });
    });

    const marker = new mapboxgl.Marker({ draggable: true })
      .setLngLat([initialLongitude, initialLatitude])
      .addTo(map);

    marker.on("dragend", () => {
      const nextPosition = marker.getLngLat();
      onLatitudeChange(formatCoordinate(nextPosition.lat));
      onLongitudeChange(formatCoordinate(nextPosition.lng));
    });

    map.on("click", (event) => {
      marker.setLngLat(event.lngLat);
      onLatitudeChange(formatCoordinate(event.lngLat.lat));
      onLongitudeChange(formatCoordinate(event.lngLat.lng));
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      marker.remove();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;

    if (!map || !marker || parsedLatitude === null || parsedLongitude === null) {
      return;
    }

    marker.setLngLat([parsedLongitude, parsedLatitude]);

    const source = map.getSource("attendance-geofence") as mapboxgl.GeoJSONSource | undefined;
    source?.setData(
      buildGeofenceFeature({
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        radiusMeters: parsedRadius,
      }),
    );
  }, [parsedLatitude, parsedLongitude, parsedRadius]);

  async function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setMapError("This browser does not support location access.");
      return;
    }

    setIsLocating(true);
    setMapError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLatitude = formatCoordinate(position.coords.latitude);
        const nextLongitude = formatCoordinate(position.coords.longitude);
        onLatitudeChange(nextLatitude);
        onLongitudeChange(nextLongitude);
        mapRef.current?.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 17,
        });
        setIsLocating(false);
      },
      (error) => {
        setMapError(
          error.code === error.PERMISSION_DENIED
            ? "Location permission was denied. Allow location access to place the shop pin."
            : "Unable to detect your current location.",
        );
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 0,
      },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Shop location geofence</p>
          <p className="text-sm text-muted-foreground">
            Drag the pin or click the map to set the branch center. The circle shows the
            attendance radius mechanics must be inside.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
        >
          <LocateFixed className="size-4" />
          {isLocating ? "Locating..." : "Use my location"}
        </Button>
      </div>

      <div
        ref={mapContainerRef}
        className="h-[320px] overflow-hidden rounded-[1.25rem] border border-border/70"
      />

      {mapError ? <p className="text-sm text-destructive">{mapError}</p> : null}

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)]">
        <div className="space-y-2">
          <Label htmlFor="geofenceLatitude">Latitude</Label>
          <Input
            id="geofenceLatitude"
            name="geofenceLatitude"
            value={latitude}
            onChange={(event) => onLatitudeChange(event.target.value)}
            placeholder="14.5995"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="geofenceLongitude">Longitude</Label>
          <Input
            id="geofenceLongitude"
            name="geofenceLongitude"
            value={longitude}
            onChange={(event) => onLongitudeChange(event.target.value)}
            placeholder="120.9842"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="geofenceRadiusMeters">Radius (meters)</Label>
          <Input
            id="geofenceRadiusMeters"
            name="geofenceRadiusMeters"
            type="number"
            min={MIN_ATTENDANCE_GEOFENCE_RADIUS_METERS}
            max={MAX_ATTENDANCE_GEOFENCE_RADIUS_METERS}
            value={radiusMeters}
            onChange={(event) => onRadiusChange(event.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

function buildGeofenceFeature({
  latitude,
  longitude,
  radiusMeters,
}: {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}) {
  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "Polygon" as const,
      coordinates: [
        createGeofenceCircleCoordinates({
          center: { latitude, longitude },
          radiusMeters,
        }),
      ],
    },
  };
}

function parseCoordinate(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseRadius(value: string) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_ATTENDANCE_GEOFENCE_RADIUS_METERS;
  }

  return Math.min(
    MAX_ATTENDANCE_GEOFENCE_RADIUS_METERS,
    Math.max(MIN_ATTENDANCE_GEOFENCE_RADIUS_METERS, parsed),
  );
}

function formatCoordinate(value: number) {
  return value.toFixed(6);
}
