import { describe, expect, it } from "vitest";

import { hasCapability } from "@/lib/auth/permissions";

describe("hasCapability", () => {
  it("allows owners to access settings", () => {
    expect(hasCapability("owner", "settings:write")).toBe(true);
  });

  it("keeps cashiers out of settings and customer writes", () => {
    expect(hasCapability("cashier", "settings:read")).toBe(false);
    expect(hasCapability("cashier", "customers:write")).toBe(false);
  });

  it("allows mechanics to work job orders without billing access", () => {
    expect(hasCapability("mechanic", "job_orders:write")).toBe(true);
    expect(hasCapability("mechanic", "payments:write")).toBe(false);
  });

  it("keeps inventory staff in stock modules only", () => {
    expect(hasCapability("inventory_staff", "inventory:write")).toBe(true);
    expect(hasCapability("inventory_staff", "invoices:read")).toBe(false);
  });

  it("keeps service advisors out of payroll access", () => {
    expect(hasCapability("service_advisor", "payroll:read")).toBe(false);
  });
});
