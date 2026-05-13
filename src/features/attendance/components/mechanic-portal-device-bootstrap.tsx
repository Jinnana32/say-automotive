"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  MECHANIC_PORTAL_DEVICE_COOKIE_NAME,
  MECHANIC_PORTAL_DEVICE_STORAGE_KEY,
} from "@/features/attendance/device-constants";

export function MechanicPortalDeviceBootstrap() {
  const router = useRouter();

  useEffect(() => {
    const localToken = window.localStorage.getItem(MECHANIC_PORTAL_DEVICE_STORAGE_KEY);
    const cookieToken = readCookie(MECHANIC_PORTAL_DEVICE_COOKIE_NAME);
    let nextToken = cookieToken || localToken;
    let changed = false;

    if (!nextToken) {
      nextToken = createDeviceToken();
      changed = true;
    }

    if (localToken !== nextToken) {
      window.localStorage.setItem(MECHANIC_PORTAL_DEVICE_STORAGE_KEY, nextToken);
      changed = true;
    }

    if (cookieToken !== nextToken) {
      writeCookie(MECHANIC_PORTAL_DEVICE_COOKIE_NAME, nextToken);
      changed = true;
    }

    if (changed) {
      router.refresh();
    }
  }, [router]);
  return null;
}

function createDeviceToken() {
  return `${window.crypto.randomUUID()}-${window.crypto.randomUUID()}`;
}

function readCookie(name: string) {
  const target = `${name}=`;

  return document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(target))
    ?.slice(target.length) ?? null;
}

function writeCookie(name: string, value: string) {
  const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${value}; Max-Age=31536000; Path=/; SameSite=Lax${secureFlag}`;
}
