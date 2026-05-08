import { cache } from "react";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { getQuotationById } from "@/features/quotations/queries/quotation-queries";
import type { QuotationPrintBusinessProfile, QuotationPrintDocument } from "@/features/quotations/types";

export const getQuotationPrintDocument = cache(
  async (quotationId: string): Promise<QuotationPrintDocument | null> => {
    const quotation = await getQuotationById(quotationId);

    if (!quotation) {
      return null;
    }

    const { supabase } = await getAuthorizedSupabaseServerClient("quotations:read");
    const { data: businessSettings, error } = await supabase
      .from("business_settings")
      .select("business_name, business_contact, business_email, business_address")
      .eq("branch_id", quotation.branchId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    const businessProfile: QuotationPrintBusinessProfile = {
      businessName: businessSettings?.business_name ?? "SAY Auto Care Center",
      businessContact: businessSettings?.business_contact ?? null,
      businessEmail: businessSettings?.business_email ?? null,
      businessAddress: businessSettings?.business_address ?? null,
    };

    return {
      quotation,
      businessProfile,
    };
  },
);
