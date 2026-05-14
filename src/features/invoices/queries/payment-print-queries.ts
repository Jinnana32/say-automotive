import { cache } from "react";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { getPaymentById } from "@/features/invoices/queries/invoice-queries";
import type { PaymentPrintDocument } from "@/features/invoices/types";
import { buildBusinessLogoUrl } from "@/lib/storage";

export const getPaymentPrintDocument = cache(
  async (paymentId: string): Promise<PaymentPrintDocument | null> => {
    const payment = await getPaymentById(paymentId);

    if (!payment) {
      return null;
    }

    const { supabase } = await getAuthorizedSupabaseServerClient("payments:read");
    const { data: businessSettings, error } = payment.branchId
      ? await supabase
          .from("business_settings")
          .select("business_name, business_logo_path, business_vat_registration_no, business_contact, business_email, business_address, updated_at")
          .eq("branch_id", payment.branchId)
          .maybeSingle()
      : { data: null, error: null };

    if (error) {
      throw new Error(error.message);
    }

    return {
      payment,
      businessProfile: {
        businessName: businessSettings?.business_name ?? "SAY Auto Care Center",
        businessLogoUrl: buildBusinessLogoUrl(
          businessSettings?.business_logo_path ?? null,
          businessSettings?.updated_at ?? null,
        ),
        businessVatRegistrationNo: businessSettings?.business_vat_registration_no ?? null,
        businessContact: businessSettings?.business_contact ?? null,
        businessEmail: businessSettings?.business_email ?? null,
        businessAddress: businessSettings?.business_address ?? null,
      },
    };
  },
);
