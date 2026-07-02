"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getBranchScopedServerClient } from "@/lib/branches";
import { writeAuditLog } from "@/lib/audit";
import { INITIAL_FORM_ACTION_STATE, toFormActionState, type FormActionState } from "@/lib/forms";
import {
  historicalServiceFormSchema,
  parseHistoricalServiceFormData,
} from "@/features/historical-service/schemas/historical-service-form-schema";
import { toOptionalNumeric } from "@/features/historical-service/utils";

export async function createHistoricalServiceRecordAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = historicalServiceFormSchema.safeParse(parseHistoricalServiceFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const values = parsed.data;
  const { context, supabase } = await getBranchScopedServerClient("job_orders:write");

  const rpcItems = values.items.map((item, index) => ({
    line_number: index + 1,
    item_type: item.itemType,
    description: item.description.trim(),
    quantity: Number(item.quantity),
    unit_price: Number(item.unitPrice),
  }));

  const { data: jobOrderId, error } = await supabase.rpc("create_historical_service_record", {
    p_vehicle_id: values.vehicleId,
    p_service_date: values.serviceDate,
    p_work_performed: values.workPerformed,
    p_customer_concern: values.customerConcern || null,
    p_diagnosis: values.diagnosis || null,
    p_inspection_notes: values.inspectionNotes || null,
    p_mileage_in: toOptionalNumeric(values.mileageIn),
    p_mileage_out: toOptionalNumeric(values.mileageOut),
    p_items: rpcItems,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, customer_id, branch_id, plate_number, make, model")
    .eq("id", values.vehicleId)
    .maybeSingle();

  await writeAuditLog(supabase, {
    action: "Recorded past service history",
    entityType: "job_order",
    entityId: jobOrderId,
    userId: context.userId,
    afterData: {
      vehicleId: values.vehicleId,
      serviceDate: values.serviceDate,
      lineCount: values.items.length,
    },
  });

  revalidatePath(`/vehicles/${values.vehicleId}`);
  revalidatePath(`/customers/${vehicle?.customer_id ?? ""}`);
  revalidatePath("/quick-access");
  revalidatePath("/job-orders");
  revalidatePath(`/job-orders/${jobOrderId}`);

  const addAnother = formData.get("addAnother") === "true";

  if (addAnother) {
    redirect(`/vehicles/${values.vehicleId}/past-service/new?saved=1`);
  }

  redirect(`/vehicles/${values.vehicleId}?historicalSaved=1`);
}
