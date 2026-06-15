import { describe, expect, it } from "vitest";

import {
  businessProfileSettingsSchema,
  documentSequenceSettingsSchema,
  operationalRulesSettingsSchema,
} from "@/features/settings/schemas/settings-forms";

describe("settings form schemas", () => {
  it("rejects empty business names", () => {
    const parsed = businessProfileSettingsSchema.safeParse({
      businessName: "",
      businessAddress: "",
      businessContact: "",
      businessEmail: "",
      businessVatRegistrationNo: "",
      receiptFooter: "",
      defaultTaxRate: "12",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts operational rule toggles", () => {
    const parsed = operationalRulesSettingsSchema.safeParse({
      allowGlobalProductCatalog: false,
      allowGlobalServiceCatalog: true,
      allowPartialPayments: true,
      requireInvoiceBeforeJobCompletion: false,
      requireInvoiceBeforeVehicleRelease: false,
      allowReleaseWithBalance: false,
      requireFullPaymentBeforeRelease: true,
      requireAdditionalItemPreApproval: true,
      enableBarcodeSupport: true,
      enableShelfLocation: false,
      payrollStandardDailyHours: "8",
      payrollHolidayPremiumRate: "30",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid payroll rule settings", () => {
    const parsed = operationalRulesSettingsSchema.safeParse({
      allowGlobalProductCatalog: false,
      allowGlobalServiceCatalog: true,
      allowPartialPayments: true,
      requireInvoiceBeforeJobCompletion: false,
      requireInvoiceBeforeVehicleRelease: false,
      allowReleaseWithBalance: false,
      requireFullPaymentBeforeRelease: true,
      requireAdditionalItemPreApproval: true,
      enableBarcodeSupport: true,
      enableShelfLocation: false,
      payrollStandardDailyHours: "0",
      payrollHolidayPremiumRate: "-5",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects invalid document sequence padding", () => {
    const parsed = documentSequenceSettingsSchema.safeParse({
      key: "invoice",
      prefix: "INV-",
      padding: "0",
      lastValue: "10",
    });

    expect(parsed.success).toBe(false);
  });
});
