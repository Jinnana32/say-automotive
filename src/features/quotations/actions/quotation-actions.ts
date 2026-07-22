"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { applyBranchFilter, getBranchScopedServerClient } from "@/lib/branches";
import { writeAuditLog } from "@/lib/audit";
import { INITIAL_FORM_ACTION_STATE, toFormActionState, type FormActionState } from "@/lib/forms";
import {
  parseQuotationFormData,
  quotationFormSchema,
} from "@/features/quotations/schemas/quotation-form-schema";
import {
  parseQuotationReviseFormData,
  quotationReviseFormSchema,
} from "@/features/quotations/schemas/quotation-revise-schema";
import {
  calculateQuotationGrandTotal,
  calculateQuotationLineTotal,
  calculateQuotationSubtotal,
  toNumeric,
} from "@/features/quotations/utils";
import type { QuotationFormItem } from "@/features/quotations/types";
import {
  fetchCatalogLineItemLabelMaps,
  resolveLineItemDescriptionFromMaps,
} from "@/lib/catalog/line-item-descriptions";

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

export async function reviseQuotationAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = quotationReviseFormSchema.safeParse(parseQuotationReviseFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const values = parsed.data;
  const { branchScope, context, supabase } = await getBranchScopedServerClient("quotations:write");
  const enrichedItems = await enrichQuotationItemsWithDescriptions(supabase, values.items);

  if (!enrichedItems.success) {
    return enrichedItems.state;
  }

  const items = enrichedItems.items;
  const subtotal = calculateQuotationSubtotal(items);
  const discount = toNumeric(values.discount);
  const tax = toNumeric(values.tax);
  const totalAmount = calculateQuotationGrandTotal({
    items,
    discount: values.discount,
    tax: values.tax,
  });

  const { data: quotation, error: fetchError } = await applyBranchFilter(
    supabase.from("quotations").select("id, quotation_number, branch_id, customer_id, vehicle_id"),
    branchScope.selectedBranchId,
  )
    .eq("id", values.quotationId)
    .maybeSingle();

  if (fetchError) {
    return {
      status: "error",
      message: fetchError.message,
    };
  }

  if (!quotation) {
    return {
      status: "error",
      message: "Quotation does not exist.",
    };
  }

  if (quotation.customer_id !== values.customerId || quotation.vehicle_id !== values.vehicleId) {
    return {
      status: "error",
      message: "Customer and vehicle cannot be changed while revising an approved quotation.",
    };
  }

  const rpcItems = items.map((item, index) => ({
    line_number: index + 1,
    item_type: item.itemType,
    product_id: item.productId || null,
    service_id: item.serviceId || null,
    description: item.description.trim(),
    quantity: toNumeric(item.quantity),
    unit_price: toNumeric(item.unitPrice),
    total: calculateQuotationLineTotal(item),
    job_order_item_id: item.jobOrderItemId ?? null,
    quotation_item_id: item.quotationItemId ?? null,
  }));

  const { error } = await supabase.rpc("sync_quotation_with_job_order", {
    p_quotation_id: values.quotationId,
    p_nature_of_repair: values.natureOfRepair || null,
    p_inspection_notes: values.inspectionNotes || null,
    p_subtotal: subtotal,
    p_discount: discount,
    p_tax: tax,
    p_total_amount: totalAmount,
    p_items: rpcItems,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  const { data: jobOrder } = await supabase
    .from("job_orders")
    .select("id")
    .eq("quotation_id", values.quotationId)
    .maybeSingle();

  await writeAuditLog(supabase, {
    action: `Revised quotation ${quotation.quotation_number}`,
    entityType: "quotation",
    entityId: values.quotationId,
    userId: context.userId,
    afterData: {
      subtotal,
      discount,
      tax,
      totalAmount,
      lineCount: items.length,
    },
  });

  revalidateQuotationPaths(values.quotationId);
  revalidatePath("/job-orders");

  if (jobOrder?.id) {
    revalidatePath(`/job-orders/${jobOrder.id}`);
  }

  redirect(`/quotations/${values.quotationId}`);
}

export async function approveQuotationAction(formData: FormData) {
  const quotationId = readRequiredId(formData, "quotationId");
  const { context, supabase } = await getBranchScopedServerClient("quotations:write");
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
  const { branchScope, supabase } = await getBranchScopedServerClient("quotations:write");
  const { data: quotation, error: fetchError } = await applyBranchFilter(
    supabase.from("quotations").select("status"),
    branchScope.selectedBranchId,
  )
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

  const { error } = await applyBranchFilter(
    supabase.from("quotations").update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
      approved_at: null,
    }),
    branchScope.selectedBranchId,
  ).eq("id", quotationId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateQuotationPaths(quotationId);
  redirect(`/quotations/${quotationId}`);
}

export async function deleteQuotationAction(formData: FormData) {
  const quotationId = readRequiredId(formData, "quotationId");
  const { branchScope, context, supabase } = await getBranchScopedServerClient("quotations:write");
  const { data: quotation, error: fetchError } = await applyBranchFilter(
    supabase
      .from("quotations")
      .select("id, quotation_number, status, branch_id, customer_id, vehicle_id, total_amount"),
    branchScope.selectedBranchId,
  )
    .eq("id", quotationId)
    .maybeSingle();

  if (fetchError) {
    redirect(`/quotations?error=${encodeURIComponent(fetchError.message)}`);
  }

  if (!quotation) {
    redirect("/quotations?error=Quotation%20not%20found.");
  }

  const { error } = await supabase.rpc("delete_quotation", {
    p_quotation_id: quotationId,
  });

  if (error) {
    redirect(`/quotations?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, {
    action: `Deleted quotation ${quotation.quotation_number}`,
    entityType: "quotation",
    entityId: quotation.id,
    userId: context.userId,
    beforeData: quotation,
  });

  revalidatePath("/quotations");
  revalidatePath("/dashboard");
  revalidatePath(`/customers/${quotation.customer_id}`);
  redirect("/quotations");
}

async function saveQuotation(formData: FormData): Promise<FormActionState> {
  const parsed = quotationFormSchema.safeParse(parseQuotationFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const values = parsed.data;
  const { branchScope, context, supabase } = await getBranchScopedServerClient("quotations:write");
  const branchId = values.quotationId
    ? await getExistingQuotationBranchId(supabase, branchScope.selectedBranchId, values.quotationId)
    : branchScope.writeBranchId;
  const enrichedItems = await enrichQuotationItemsWithDescriptions(supabase, values.items);

  if (!enrichedItems.success) {
    return enrichedItems.state;
  }

  const items = enrichedItems.items;
  const subtotal = calculateQuotationSubtotal(items);
  const discount = toNumeric(values.discount);
  const tax = toNumeric(values.tax);
  const totalAmount = calculateQuotationGrandTotal({
    items,
    discount: values.discount,
    tax: values.tax,
  });

  const rpcItems = items.map((item) => ({
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
    p_nature_of_repair: values.natureOfRepair || null,
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
  revalidatePath(`/quotations/${quotationId}/revise`);
  revalidatePath("/dashboard");
}

async function getExistingQuotationBranchId(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  selectedBranchId: string | null,
  quotationId: string,
) {
  const { data, error } = await applyBranchFilter(
    supabase.from("quotations").select("branch_id"),
    selectedBranchId,
  )
    .eq("id", quotationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.branch_id) {
    throw new Error("Quotation does not exist.");
  }

  return data.branch_id;
}

async function enrichQuotationItemsWithDescriptions(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  items: QuotationFormItem[],
): Promise<
  | { success: true; items: QuotationFormItem[] }
  | { success: false; state: FormActionState }
> {
  const productIds = [
    ...new Set(
      items
        .filter((item) => item.itemType === "product" && item.productId && !item.description.trim())
        .map((item) => item.productId),
    ),
  ];
  const serviceIds = [
    ...new Set(
      items
        .filter((item) => item.itemType === "service" && item.serviceId && !item.description.trim())
        .map((item) => item.serviceId),
    ),
  ];

  try {
    const { productLabels, serviceLabels } = await fetchCatalogLineItemLabelMaps(
      supabase,
      productIds,
      serviceIds,
    );

    const enrichedItems = items.map((item) => ({
      ...item,
      description: resolveLineItemDescriptionFromMaps(item, productLabels, serviceLabels),
    }));

    const unresolvedItem = enrichedItems.find(
      (item) => item.itemType !== "labor" && !item.description.trim(),
    );

    if (unresolvedItem) {
      return {
        success: false,
        state: {
          status: "error",
          message: "Each line item needs a catalog selection or description.",
          fieldErrors: {
            items: ["Each line item needs a catalog selection or description."],
          },
        },
      };
    }

    return {
      success: true,
      items: enrichedItems,
    };
  } catch (error) {
    return {
      success: false,
      state: {
        status: "error",
        message: error instanceof Error ? error.message : "Unable to resolve line item descriptions.",
      },
    };
  }
}
