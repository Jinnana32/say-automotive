import { cache } from "react";
import { DateTime } from "luxon";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
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
    const { supabase } = await getAuthorizedSupabaseServerClient("reports:read");
    const { data: settingsRows, error } = await supabase
      .from("business_settings")
      .select("business_name, business_logo_path, business_contact, business_email, business_address")
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    const settings = settingsRows?.[0] ?? null;

    return {
      reports,
      businessProfile: {
        businessName: settings?.business_name ?? "SAY Auto Care Center",
        businessLogoUrl: buildBusinessLogoUrl(settings?.business_logo_path ?? null),
        businessContact: settings?.business_contact ?? null,
        businessEmail: settings?.business_email ?? null,
        businessAddress: settings?.business_address ?? null,
      },
      generatedAt: DateTime.now().setZone("Asia/Manila").toISO() ?? new Date().toISOString(),
    };
  },
);
