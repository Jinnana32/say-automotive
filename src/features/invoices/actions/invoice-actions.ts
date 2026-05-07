"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createInvoiceFromJobOrderSchema,
  parseCreateInvoiceFromJobOrderFormData,
  parseRecordInvoicePaymentFormData,
  parseReleaseJobOrderVehicleFormData,
  recordInvoicePaymentSchema,
  releaseJobOrderVehicleSchema,
} from "@/features/invoices/schemas/invoice-forms";
import { toNumeric } from "@/features/invoices/utils";
import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { INITIAL_FORM_ACTION_STATE, toFormActionState, type FormActionState } from "@/lib/forms";
import { getBusinessNow } from "@/lib/dates";

export async function createInvoiceFromJobOrderAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = createInvoiceFromJobOrderSchema.safeParse(
    parseCreateInvoiceFromJobOrderFormData(formData),
  );

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const values = parsed.data;
  const { context, supabase } = await getAuthorizedSupabaseServerClient("invoices:write");
  const { data, error } = await supabase.rpc("create_invoice_from_job_order", {
    p_job_order_id: values.jobOrderId,
    p_invoice_date: getBusinessNow().toISODate() ?? new Date().toISOString().slice(0, 10),
    p_created_by: context.userId,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidateBillingPaths({
    jobOrderId: values.jobOrderId,
    invoiceId: data,
  });
  redirect(`/invoices/${data}`);
}

export async function recordInvoicePaymentAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = recordInvoicePaymentSchema.safeParse(parseRecordInvoicePaymentFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const values = parsed.data;
  const { context, supabase } = await getAuthorizedSupabaseServerClient("payments:write");
  const { error } = await supabase.rpc("record_invoice_payment", {
    p_invoice_id: values.invoiceId,
    p_amount: toNumeric(values.amount),
    p_payment_method: values.paymentMethod,
    p_reference_number: values.referenceNumber || null,
    p_notes: values.notes || null,
    p_received_by: context.userId,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidateBillingPaths({
    invoiceId: values.invoiceId,
    jobOrderId: values.jobOrderId,
  });
  redirect(`/invoices/${values.invoiceId}`);
}

export async function releaseJobOrderVehicleAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = releaseJobOrderVehicleSchema.safeParse(
    parseReleaseJobOrderVehicleFormData(formData),
  );

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const values = parsed.data;
  const { supabase } = await getAuthorizedSupabaseServerClient("invoices:write");
  const { error } = await supabase.rpc("release_job_order_vehicle", {
    p_job_order_id: values.jobOrderId,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidateBillingPaths({
    jobOrderId: values.jobOrderId,
  });
  redirect(`/job-orders/${values.jobOrderId}`);
}

function revalidateBillingPaths(params: {
  jobOrderId?: string;
  invoiceId?: string;
}) {
  revalidatePath("/dashboard");
  revalidatePath("/job-orders");
  revalidatePath("/invoices");
  revalidatePath("/payments");

  if (params.jobOrderId) {
    revalidatePath(`/job-orders/${params.jobOrderId}`);
  }

  if (params.invoiceId) {
    revalidatePath(`/invoices/${params.invoiceId}`);
  }
}
