import { headers } from "next/headers";
import { isIP } from "node:net";

export type RequestNetworkContext = {
  requestIp: string | null;
  userAgent: string | null;
};

export async function getServerRequestNetworkContext(): Promise<RequestNetworkContext> {
  const headerStore = await headers();

  return {
    requestIp: normalizeIpAddress(
      headerStore.get("x-forwarded-for") ??
        headerStore.get("x-real-ip") ??
        headerStore.get("cf-connecting-ip") ??
        headerStore.get("x-client-ip"),
    ),
    userAgent: headerStore.get("user-agent"),
  };
}

export function normalizeIpAddress(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  let candidate = value.split(",")[0]?.trim() ?? "";

  if (!candidate) {
    return null;
  }

  if (candidate.startsWith("::ffff:")) {
    candidate = candidate.slice("::ffff:".length);
  }

  if (candidate.startsWith("[") && candidate.includes("]")) {
    candidate = candidate.slice(1, candidate.indexOf("]"));
  }

  if (isIP(candidate) === 0 && candidate.includes(":")) {
    const ipv4Candidate = candidate.split(":")[0]?.trim() ?? "";

    if (isIP(ipv4Candidate) === 4) {
      candidate = ipv4Candidate;
    }
  }

  return isIP(candidate) === 0 ? null : candidate;
}

export function isValidIpAddress(value: string) {
  return normalizeIpAddress(value) !== null;
}

export function ipMatchesAllowedList(
  requestIp: string | null,
  allowedIps: Array<{ ipAddress: string }>,
) {
  if (!requestIp) {
    return null;
  }

  const normalizedRequestIp = normalizeIpAddress(requestIp);

  if (!normalizedRequestIp) {
    return null;
  }

  return (
    allowedIps.find(
      (allowedIp) => normalizeIpAddress(allowedIp.ipAddress) === normalizedRequestIp,
    ) ?? null
  );
}
