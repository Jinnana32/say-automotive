import { cache } from "react";
import { DateTime } from "luxon";

import { getBranchScopedServerClient } from "@/lib/branches";
import { getReportsPageData } from "@/features/reports/queries/report-queries";
import type { ReportsPrintDocument } from "@/features/reports/types";
import { buildBusinessLogoUrl } from "@/lib/storage";

export const getReportsPrintDocument = cache(
  async (input: {
    preset?: string;
    from?: string;
    to?: string;
    groupBy?: string;
  }): Promise<ReportsPrintDocument> => {
    const reports = await getReportsPageData(input);
    const { branchScope, supabase } = await getBranchScopedServerClient("reports:read");
    const { data: settingsRow, error } = await supabase
      .from("business_settings")
      .select("business_name, business_logo_path, business_vat_registration_no, business_contact, business_email, business_address, updated_at")
      .eq("branch_id", branchScope.writeBranchId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return {
      reports,
      businessProfile: {
        businessName: settingsRow?.business_name ?? "SAY Auto Care Center",
        businessLogoUrl: buildBusinessLogoUrl(settingsRow?.business_logo_path ?? null, settingsRow?.updated_at ?? null),
        businessVatRegistrationNo: settingsRow?.business_vat_registration_no ?? null,
        businessContact: settingsRow?.business_contact ?? null,
        businessEmail: settingsRow?.business_email ?? null,
        businessAddress: settingsRow?.business_address ?? null,
      },
      generatedAt: DateTime.now().setZone("Asia/Manila").toISO() ?? new Date().toISOString(),
    };
  },
);
