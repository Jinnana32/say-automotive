import { cache } from "react";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { getInvoiceById } from "@/features/invoices/queries/invoice-queries";
import type { InvoicePrintDocument } from "@/features/invoices/types";
import { toTitleCaseWords } from "@/features/job-orders/utils";
import { buildBusinessLogoUrl } from "@/lib/storage";

export const getInvoicePrintDocument = cache(
  async (invoiceId: string): Promise<InvoicePrintDocument | null> => {
    const invoice = await getInvoiceById(invoiceId);

    if (!invoice) {
      return null;
    }

    const { supabase } = await getAuthorizedSupabaseServerClient("invoices:read");
    const [{ data: invoiceSupport, error: invoiceSupportError }, sourceResult] = await Promise.all([
      supabase
        .from("invoices")
        .select("created_by")
        .eq("id", invoiceId)
        .maybeSingle(),
      invoice.jobOrderId
        ? supabase
            .from("job_orders")
            .select("branch_id")
            .eq("id", invoice.jobOrderId)
            .maybeSingle()
        : invoice.saleId
          ? supabase
              .from("sales")
              .select("branch_id")
              .eq("id", invoice.saleId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
    ]);

    if (invoiceSupportError) {
      throw new Error(invoiceSupportError.message);
    }

    if (sourceResult.error) {
      throw new Error(sourceResult.error.message);
    }

    const branchId = sourceResult.data?.branch_id ?? null;

    const [
      { data: customer, error: customerError },
      { data: vehicle, error: vehicleError },
      { data: businessSettings, error: settingsError },
      preparedByResult,
    ] = await Promise.all([
      invoice.customerId
        ? supabase
            .from("customers")
            .select("contact_number, address")
            .eq("id", invoice.customerId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      invoice.vehicleId
        ? supabase
            .from("vehicles")
            .select("make, model, year, plate_number, vin")
            .eq("id", invoice.vehicleId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      branchId
        ? supabase
            .from("business_settings")
            .select("business_name, business_logo_path, business_contact, business_email, business_address")
            .eq("branch_id", branchId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      invoiceSupport?.created_by
        ? supabase
            .from("staff")
            .select("first_name, last_name, role")
            .eq("linked_user_id", invoiceSupport.created_by)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (customerError) {
      throw new Error(customerError.message);
    }

    if (vehicleError) {
      throw new Error(vehicleError.message);
    }

    if (settingsError) {
      throw new Error(settingsError.message);
    }

    if (preparedByResult.error) {
      throw new Error(preparedByResult.error.message);
    }

    const preparedBy = preparedByResult.data;

    return {
      invoice: {
        ...invoice,
        customerContactNumber: customer?.contact_number ?? null,
        customerAddress: customer?.address ?? null,
        vehicleMake: vehicle?.make ?? null,
        vehicleModel: vehicle?.model ?? null,
        vehicleYear: vehicle?.year ?? null,
        vehiclePlateNumber: vehicle?.plate_number ?? null,
        vehicleVin: vehicle?.vin ?? null,
        preparedByName: preparedBy
          ? `${preparedBy.first_name} ${preparedBy.last_name}`.trim()
          : null,
        preparedByTitle: preparedBy ? toTitleCaseWords(preparedBy.role.replaceAll("_", " ")) : null,
      },
      businessProfile: {
        businessName: businessSettings?.business_name ?? "SAY Auto Care Center",
        businessLogoUrl: buildBusinessLogoUrl(businessSettings?.business_logo_path ?? null),
        businessContact: businessSettings?.business_contact ?? null,
        businessEmail: businessSettings?.business_email ?? null,
        businessAddress: businessSettings?.business_address ?? null,
      },
    };
  },
);
