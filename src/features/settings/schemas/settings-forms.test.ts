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
      allowPartialPayments: true,
      requireInvoiceBeforeJobCompletion: false,
      requireInvoiceBeforeVehicleRelease: false,
      allowReleaseWithBalance: false,
      requireFullPaymentBeforeRelease: true,
      requireAdditionalItemPreApproval: true,
      enableBarcodeSupport: true,
      enableShelfLocation: false,
    });

    expect(parsed.success).toBe(true);
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
