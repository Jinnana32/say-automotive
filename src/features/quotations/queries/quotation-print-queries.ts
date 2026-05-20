import { cache } from "react";
import { DateTime } from "luxon";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { buildPreparedByProfile } from "@/lib/auth/prepared-by";
import { getQuotationById } from "@/features/quotations/queries/quotation-queries";
import type {
  QuotationPrintBusinessProfile,
  QuotationPrintDocument,
} from "@/features/quotations/types";
import { buildBusinessLogoUrl } from "@/lib/storage";

export const getQuotationPrintDocument = cache(
  async (quotationId: string): Promise<QuotationPrintDocument | null> => {
    const quotation = await getQuotationById(quotationId);

    if (!quotation) {
      return null;
    }

    const { supabase, context } = await getAuthorizedSupabaseServerClient("quotations:read");
    const preparedBy = buildPreparedByProfile(context);
    const [
      { data: businessSettings, error },
      { data: customer, error: customerError },
      { data: vehicle, error: vehicleError },
    ] = await Promise.all([
      supabase
        .from("business_settings")
          .select(
          "business_name, business_logo_path, business_vat_registration_no, business_contact, business_email, business_address, updated_at",
        )
        .eq("branch_id", quotation.branchId)
        .maybeSingle(),
      supabase
        .from("customers")
        .select("company_name, email")
        .eq("id", quotation.customerId)
        .maybeSingle(),
      supabase
        .from("vehicles")
        .select("color, mileage")
        .eq("id", quotation.vehicleId)
        .maybeSingle(),
    ]);

    if (error) {
      throw new Error(error.message);
    }

    if (customerError) {
      throw new Error(customerError.message);
    }

    if (vehicleError) {
      throw new Error(vehicleError.message);
    }

    const businessProfile: QuotationPrintBusinessProfile = {
      businessName: businessSettings?.business_name ?? "SAY Auto Care Center",
      businessLogoUrl: buildBusinessLogoUrl(
        businessSettings?.business_logo_path ?? null,
        businessSettings?.updated_at ?? null,
      ),
      businessVatRegistrationNo: businessSettings?.business_vat_registration_no ?? null,
      businessContact: businessSettings?.business_contact ?? null,
      businessEmail: businessSettings?.business_email ?? null,
      businessAddress: businessSettings?.business_address ?? null,
    };
    const validUntil = DateTime.fromISO(quotation.createdAt, { zone: "utc" })
      .setZone("Asia/Manila")
      .plus({ days: 14 })
      .toISO();

    return {
      quotation: {
        ...quotation,
        preparedByName: preparedBy.name,
        preparedByTitle: preparedBy.title,
      },
      businessProfile,
      customerSnapshot: {
        companyName: customer?.company_name ?? null,
        email: customer?.email ?? null,
      },
      vehicleSnapshot: {
        color: vehicle?.color ?? null,
        mileage: vehicle?.mileage ?? null,
      },
      validUntil,
    };
  },
);
