import { cache } from "react";
import { DateTime } from "luxon";

import { getBranchScopedServerClient } from "@/lib/branches";
import { buildBusinessLogoUrl } from "@/lib/storage";
import { getPayrollPeriodDetailData } from "@/features/payroll/queries/payroll-queries";
import type { PayrollPrintDocument } from "@/features/payroll/types";

export const getPayrollPrintDocument = cache(
  async (periodId: string): Promise<PayrollPrintDocument | null> => {
    const detail = await getPayrollPeriodDetailData(periodId);

    if (!detail.period.generatedAt || detail.items.length === 0) {
      return null;
    }

    const { supabase } = await getBranchScopedServerClient("payroll:read");
    const { data: settingsRow, error } = await supabase
      .from("business_settings")
      .select(
        "business_name, business_logo_path, business_vat_registration_no, business_contact, business_email, business_address, updated_at",
      )
      .eq("branch_id", detail.period.branchId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return {
      ...detail,
      businessProfile: {
        businessName: settingsRow?.business_name ?? "SAY Auto Care Center",
        businessLogoUrl: buildBusinessLogoUrl(
          settingsRow?.business_logo_path ?? null,
          settingsRow?.updated_at ?? null,
        ),
        businessVatRegistrationNo: settingsRow?.business_vat_registration_no ?? null,
        businessContact: settingsRow?.business_contact ?? null,
        businessEmail: settingsRow?.business_email ?? null,
        businessAddress: settingsRow?.business_address ?? null,
      },
      generatedAt:
        detail.period.generatedAt ??
        DateTime.now().setZone("Asia/Manila").toISO() ??
        new Date().toISOString(),
    };
  },
);
