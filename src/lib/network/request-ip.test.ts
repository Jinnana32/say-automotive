import { describe, expect, it } from "vitest";

import {
  ipMatchesAllowedList,
  isValidIpAddress,
  normalizeIpAddress,
} from "@/lib/network/request-ip";

describe("request IP helpers", () => {
  it("normalizes forwarded IPv4 and IPv6 values", () => {
    expect(normalizeIpAddress("203.0.113.10, 70.41.3.18")).toBe("203.0.113.10");
    expect(normalizeIpAddress("::ffff:203.0.113.10")).toBe("203.0.113.10");
    expect(normalizeIpAddress("[2001:db8::1]")).toBe("2001:db8::1");
  });

  it("validates literal IP addresses only", () => {
    expect(isValidIpAddress("203.0.113.10")).toBe(true);
    expect(isValidIpAddress("2001:db8::1")).toBe(true);
    expect(isValidIpAddress("example.com")).toBe(false);
  });

  it("matches a normalized request IP against the approved list", () => {
    expect(
      ipMatchesAllowedList("203.0.113.10", [
        { ipAddress: "198.51.100.7" },
        { ipAddress: "203.0.113.10" },
      ]),
    ).toEqual({ ipAddress: "203.0.113.10" });
    expect(
      ipMatchesAllowedList("203.0.113.11", [
        { ipAddress: "198.51.100.7" },
        { ipAddress: "203.0.113.10" },
      ]),
    ).toBeNull();
  });
});
