"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { getDefaultBranch } from "@/lib/branches";
import { INITIAL_FORM_ACTION_STATE, toFormActionState, type FormActionState } from "@/lib/forms";
import {
  parseQuotationFormData,
  quotationFormSchema,
} from "@/features/quotations/schemas/quotation-form-schema";
import {
  calculateQuotationGrandTotal,
  calculateQuotationLineTotal,
  calculateQuotationSubtotal,
  toNumeric,
} from "@/features/quotations/utils";

export async function createQuotationAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  return saveQuotation(formData);
}

export async function updateQuotationAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  return saveQuotation(formData);
}

export async function approveQuotationAction(formData: FormData) {
  const quotationId = readRequiredId(formData, "quotationId");
  const { context, supabase } = await getAuthorizedSupabaseServerClient("quotations:write");
  const { error } = await supabase.rpc("approve_quotation_to_job_order", {
    p_quotation_id: quotationId,
    p_user_id: context.userId,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidateQuotationPaths(quotationId);
  revalidatePath("/job-orders");
  redirect(`/quotations/${quotationId}`);
}

export async function rejectQuotationAction(formData: FormData) {
  const quotationId = readRequiredId(formData, "quotationId");
  const { supabase } = await getAuthorizedSupabaseServerClient("quotations:write");
  const { data: quotation, error: fetchError } = await supabase
    .from("quotations")
    .select("status")
    .eq("id", quotationId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!quotation) {
    throw new Error("Quotation does not exist.");
  }

  if (quotation.status === "approved") {
    throw new Error("Approved quotations cannot be rejected.");
  }

  const { error } = await supabase
    .from("quotations")
    .update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
      approved_at: null,
    })
    .eq("id", quotationId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateQuotationPaths(quotationId);
  redirect(`/quotations/${quotationId}`);
}

async function saveQuotation(formData: FormData): Promise<FormActionState> {
  const parsed = quotationFormSchema.safeParse(parseQuotationFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const values = parsed.data;
  const [{ id: branchId }, { context, supabase }] = await Promise.all([
    getDefaultBranch(),
    getAuthorizedSupabaseServerClient("quotations:write"),
  ]);
  const subtotal = calculateQuotationSubtotal(values.items);
  const discount = toNumeric(values.discount);
  const tax = toNumeric(values.tax);
  const totalAmount = calculateQuotationGrandTotal({
    items: values.items,
    discount: values.discount,
    tax: values.tax,
  });

  const rpcItems = values.items.map((item) => ({
    item_type: item.itemType,
    product_id: item.productId || null,
    service_id: item.serviceId || null,
    description: item.description.trim(),
    quantity: toNumeric(item.quantity),
    unit_price: toNumeric(item.unitPrice),
    total: calculateQuotationLineTotal(item),
  }));

  const { data, error } = await supabase.rpc("save_quotation_with_items", {
    p_quotation_id: values.quotationId ?? null,
    p_branch_id: branchId,
    p_customer_id: values.customerId,
    p_vehicle_id: values.vehicleId,
    p_inspection_notes: values.inspectionNotes || null,
    p_status: values.status,
    p_subtotal: subtotal,
    p_discount: discount,
    p_tax: tax,
    p_total_amount: totalAmount,
    p_items: rpcItems,
    p_created_by: context.userId,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  const quotationId = data;
  revalidateQuotationPaths(quotationId);
  redirect(`/quotations/${quotationId}`);
}

function readRequiredId(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || !value) {
    throw new Error("Required identifier is missing.");
  }

  return value;
}

function revalidateQuotationPaths(quotationId: string) {
  revalidatePath("/quotations");
  revalidatePath(`/quotations/${quotationId}`);
  revalidatePath(`/quotations/${quotationId}/edit`);
  revalidatePath("/dashboard");
}
