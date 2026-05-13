import { describe, expect, it } from "vitest";

import {
  ipMatchesAllowedList,
  isPublicIpAddress,
  isValidIpAddress,
  normalizePublicIpAddress,
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

  it("rejects private or local IPs for public network checks", () => {
    expect(isPublicIpAddress("124.217.16.204")).toBe(true);
    expect(isPublicIpAddress("8.8.8.8")).toBe(true);
    expect(isPublicIpAddress("192.168.1.9")).toBe(false);
    expect(isPublicIpAddress("10.0.0.5")).toBe(false);
    expect(isPublicIpAddress("172.16.0.10")).toBe(false);
    expect(isPublicIpAddress("127.0.0.1")).toBe(false);
    expect(isPublicIpAddress("169.254.1.1")).toBe(false);
  });

  it("only returns public IPs for detected public IP display", () => {
    expect(normalizePublicIpAddress("124.217.16.204")).toBe("124.217.16.204");
    expect(normalizePublicIpAddress("::1")).toBeNull();
    expect(normalizePublicIpAddress("192.168.1.9")).toBeNull();
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
