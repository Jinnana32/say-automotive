import { cache } from "react";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { buildBusinessLogoUrl } from "@/lib/storage";
import { toTitleCaseWords } from "@/features/job-orders/utils";
import { getJobOrderById } from "@/features/job-orders/queries/job-order-queries";
import type { JobOrderPrintDocument } from "@/features/job-orders/types";
import type { TableRow } from "@/types/database";

type JobOrderPrintSupportRow = Pick<
  TableRow<"job_orders">,
  "branch_id" | "customer_id" | "vehicle_id" | "created_by"
>;

export const getJobOrderPrintDocument = cache(
  async (jobOrderId: string): Promise<JobOrderPrintDocument | null> => {
    const jobOrder = await getJobOrderById(jobOrderId);

    if (!jobOrder) {
      return null;
    }

    const { supabase } = await getAuthorizedSupabaseServerClient("job_orders:read");
    const { data: supportRow, error: supportError } = await supabase
      .from("job_orders")
      .select("branch_id, customer_id, vehicle_id, created_by")
      .eq("id", jobOrderId)
      .maybeSingle();

    if (supportError) {
      throw new Error(supportError.message);
    }

    if (!supportRow) {
      return null;
    }

    const support = supportRow as JobOrderPrintSupportRow;
    const [
      { data: customer, error: customerError },
      { data: vehicle, error: vehicleError },
      { data: businessSettings, error: settingsError },
      preparedByResult,
    ] = await Promise.all([
      supabase
        .from("customers")
        .select("display_name, contact_number, address")
        .eq("id", support.customer_id)
        .maybeSingle(),
      supabase
        .from("vehicles")
        .select("make, model, year, plate_number, vin")
        .eq("id", support.vehicle_id)
        .maybeSingle(),
      supabase
        .from("business_settings")
        .select("business_name, business_logo_path, business_vat_registration_no, business_contact, business_email, business_address, updated_at")
        .eq("branch_id", support.branch_id)
        .maybeSingle(),
      support.created_by
        ? supabase
            .from("staff")
            .select("first_name, last_name, role")
            .eq("linked_user_id", support.created_by)
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
      jobOrder: {
        ...jobOrder,
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
