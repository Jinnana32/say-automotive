"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getBranchScopedServerClient } from "@/lib/branches";
import {
  additionalJobOrderItemSchema,
  jobOrderDetailsSchema,
  jobOrderItemEditSchema,
  jobOrderChecklistStateSchema,
  jobOrderStatusTransitionSchema,
  jobOrderPartUsageSchema,
  mechanicAssignmentSchema,
  parseAdditionalJobOrderItemFormData,
  parseJobOrderChecklistStateFormData,
  parseJobOrderDetailsFormData,
  parseJobOrderItemEditFormData,
  parseJobOrderPartUsageFormData,
  parseJobOrderStatusTransitionFormData,
  parseMechanicAssignmentFormData,
  parseOptionalNumeric,
} from "@/features/job-orders/schemas/job-order-forms";
import { resolveJobOrderDetailTab, toNumeric } from "@/features/job-orders/utils";
import { resolveCatalogLineItemDescription } from "@/lib/catalog/line-item-descriptions";
import { writeAuditLog } from "@/lib/audit";
import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { INITIAL_FORM_ACTION_STATE, toFormActionState, type FormActionState } from "@/lib/forms";

export async function saveJobOrderDetailsAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = jobOrderDetailsSchema.safeParse(parseJobOrderDetailsFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const values = parsed.data;
  const redirectTab = resolveJobOrderDetailTab(readOptionalValue(formData, "redirectTab"));
  const { supabase } = await getAuthorizedSupabaseServerClient("job_orders:write");
  const { error } = await supabase.rpc("save_job_order_details", {
    p_job_order_id: values.jobOrderId,
    p_mileage_in: parseOptionalNumeric(values.mileageIn),
    p_mileage_out: parseOptionalNumeric(values.mileageOut),
    p_customer_concern: values.customerConcern || null,
    p_inspection_notes: values.inspectionNotes || null,
    p_diagnosis: values.diagnosis || null,
    p_work_performed: values.workPerformed || null,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidateJobOrderPaths(values.jobOrderId);
  redirect(buildJobOrderRedirectPath(values.jobOrderId, redirectTab));
}

export async function updateJobOrderStatusAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = jobOrderStatusTransitionSchema.safeParse(
    parseJobOrderStatusTransitionFormData(formData),
  );

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const values = parsed.data;
  const redirectTab = resolveJobOrderDetailTab(readOptionalValue(formData, "redirectTab"));
  const { context, supabase } = await getAuthorizedSupabaseServerClient("job_orders:write");
  const { data: beforeJobOrder, error: beforeError } = await supabase
    .from("job_orders")
    .select("id, status")
    .eq("id", values.jobOrderId)
    .maybeSingle();

  if (beforeError) {
    return {
      status: "error",
      message: beforeError.message,
    };
  }

  if (!beforeJobOrder) {
    return {
      status: "error",
      message: "Job order does not exist.",
    };
  }

  const { error } = await supabase.rpc("update_job_order_status", {
    p_job_order_id: values.jobOrderId,
    p_next_status: values.nextStatus,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  await writeAuditLog(supabase, {
    action:
      values.nextStatus === "cancelled"
        ? "Cancelled job order"
        : "Updated job order status",
    entityType: "job_order",
    entityId: values.jobOrderId,
    userId: context.userId,
    beforeData: {
      status: beforeJobOrder.status,
    },
    afterData: {
      status: values.nextStatus,
      cancellationReason:
        values.nextStatus === "cancelled"
          ? values.cancellationReason || null
          : null,
    },
  });

  revalidateJobOrderPaths(values.jobOrderId);
  redirect(buildJobOrderRedirectPath(values.jobOrderId, redirectTab));
}

export async function assignMechanicAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = mechanicAssignmentSchema.safeParse(parseMechanicAssignmentFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const values = parsed.data;
  const redirectTab = resolveJobOrderDetailTab(readOptionalValue(formData, "redirectTab"));
  const { supabase } = await getAuthorizedSupabaseServerClient("job_orders:write");
  const { error } = await supabase.rpc("assign_job_order_mechanic", {
    p_job_order_id: values.jobOrderId,
    p_staff_id: values.staffId,
    p_task_description: values.taskDescription || null,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidateJobOrderPaths(values.jobOrderId);
  redirect(buildJobOrderRedirectPath(values.jobOrderId, redirectTab));
}

export async function addJobOrderItemAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = additionalJobOrderItemSchema.safeParse(parseAdditionalJobOrderItemFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const values = parsed.data;
  const redirectTab = resolveJobOrderDetailTab(readOptionalValue(formData, "redirectTab"));
  const { supabase } = await getAuthorizedSupabaseServerClient("job_orders:write");
  const description = await resolveCatalogLineItemDescription(supabase, {
    itemType: values.itemType,
    description: values.description,
    productId: values.productId,
    serviceId: values.serviceId,
  });

  if (!description.trim()) {
    return {
      status: "error",
      message: "Each line item needs a catalog selection or description.",
      fieldErrors: {
        description: ["Each line item needs a catalog selection or description."],
      },
    };
  }

  const { error } = await supabase.rpc("add_job_order_item", {
    p_job_order_id: values.jobOrderId,
    p_item_type: values.itemType,
    p_product_id: values.productId || null,
    p_service_id: values.serviceId || null,
    p_description: description,
    p_quantity: toNumeric(values.quantity),
    p_unit_price: toNumeric(values.unitPrice),
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidateJobOrderPaths(values.jobOrderId);
  redirect(buildJobOrderRedirectPath(values.jobOrderId, redirectTab));
}

export async function updateJobOrderItemAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = jobOrderItemEditSchema.safeParse(parseJobOrderItemEditFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const values = parsed.data;
  const redirectTab = resolveJobOrderDetailTab(readOptionalValue(formData, "redirectTab"));
  const { context, supabase } = await getAuthorizedSupabaseServerClient("job_orders:write");
  const { data: beforeItem, error: beforeError } = await supabase
    .from("job_order_items")
    .select("id, job_order_id, line_number, item_type, description, quantity, unit_price, total, is_additional, approval_status, usage_status, approved_at, rejected_at")
    .eq("id", values.jobOrderItemId)
    .maybeSingle();

  if (beforeError) {
    return {
      status: "error",
      message: beforeError.message,
    };
  }

  if (!beforeItem) {
    return {
      status: "error",
      message: "Job order item does not exist.",
    };
  }

  if (beforeItem.job_order_id !== values.jobOrderId) {
    return {
      status: "error",
      message: "Job order item does not belong to the selected job order.",
    };
  }

  const { error } = await supabase.rpc("update_job_order_item", {
    p_job_order_item_id: values.jobOrderItemId,
    p_description: values.description.trim() || beforeItem.description,
    p_quantity: toNumeric(values.quantity),
    p_unit_price: toNumeric(values.unitPrice),
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  const { data: afterItem, error: afterError } = await supabase
    .from("job_order_items")
    .select("id, job_order_id, line_number, item_type, description, quantity, unit_price, total, is_additional, approval_status, usage_status, approved_at, rejected_at")
    .eq("id", values.jobOrderItemId)
    .maybeSingle();

  if (afterError) {
    return {
      status: "error",
      message: afterError.message,
    };
  }

  await writeAuditLog(supabase, {
    action: "Updated job order item",
    entityType: "job_order_item",
    entityId: values.jobOrderItemId,
    userId: context.userId,
    beforeData: beforeItem
      ? {
          description: beforeItem.description,
          quantity: beforeItem.quantity,
          unit_price: beforeItem.unit_price,
          total: beforeItem.total,
          approval_status: beforeItem.approval_status,
          usage_status: beforeItem.usage_status,
          is_additional: beforeItem.is_additional,
        }
      : null,
    afterData: afterItem
      ? {
          description: afterItem.description,
          quantity: afterItem.quantity,
          unit_price: afterItem.unit_price,
          total: afterItem.total,
          approval_status: afterItem.approval_status,
          usage_status: afterItem.usage_status,
          is_additional: afterItem.is_additional,
        }
      : null,
  });

  revalidateJobOrderPaths(values.jobOrderId);
  redirect(buildJobOrderRedirectPath(values.jobOrderId, redirectTab));
}

export async function recordJobOrderPartUsageAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  return saveJobOrderPartMovement("use", formData);
}

export async function recordJobOrderPartReturnAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  return saveJobOrderPartMovement("return", formData);
}

export async function removeMechanicAction(formData: FormData) {
  const jobOrderId = readRequiredValue(formData, "jobOrderId");
  const assignmentId = readRequiredValue(formData, "assignmentId");
  const redirectTab = resolveJobOrderDetailTab(readOptionalValue(formData, "redirectTab"));
  const { supabase } = await getAuthorizedSupabaseServerClient("job_orders:write");
  const { error } = await supabase.rpc("remove_job_order_mechanic", {
    p_assignment_id: assignmentId,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidateJobOrderPaths(jobOrderId);
  redirect(buildJobOrderRedirectPath(jobOrderId, redirectTab));
}

export async function setJobOrderItemApprovalAction(formData: FormData) {
  const jobOrderId = readRequiredValue(formData, "jobOrderId");
  const itemId = readRequiredValue(formData, "jobOrderItemId");
  const approvalStatus = readRequiredValue(formData, "approvalStatus");
  const redirectTab = resolveJobOrderDetailTab(readOptionalValue(formData, "redirectTab"));

  if (!["pending", "approved", "rejected"].includes(approvalStatus)) {
    throw new Error("Unsupported approval status.");
  }

  const nextApprovalStatus = approvalStatus as "pending" | "approved" | "rejected";

  const { supabase } = await getAuthorizedSupabaseServerClient("job_orders:write");
  const { error } = await supabase.rpc("set_job_order_item_approval", {
    p_job_order_item_id: itemId,
    p_approval_status: nextApprovalStatus,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidateJobOrderPaths(jobOrderId);
  redirect(buildJobOrderRedirectPath(jobOrderId, redirectTab));
}

export async function setJobOrderItemChecklistStateAction(formData: FormData) {
  const parsed = jobOrderChecklistStateSchema.safeParse(
    parseJobOrderChecklistStateFormData(formData),
  );

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid checklist request.");
  }

  const values = parsed.data;
  const redirectTab = resolveJobOrderDetailTab(readOptionalValue(formData, "redirectTab"));
  const nextChecklistCompleted = values.checklistCompleted === "true";
  const { context, supabase } = await getAuthorizedSupabaseServerClient("job_orders:write");
  const { data: beforeItem, error: beforeError } = await supabase
    .from("job_order_items")
    .select(
      "id, job_order_id, description, approval_status, checklist_completed, checklist_checked_at, checklist_checked_by_staff_id",
    )
    .eq("id", values.jobOrderItemId)
    .maybeSingle();

  if (beforeError) {
    throw new Error(beforeError.message);
  }

  if (!beforeItem) {
    throw new Error("Job order item does not exist.");
  }

  if (beforeItem.job_order_id !== values.jobOrderId) {
    throw new Error("Job order item does not belong to the selected job order.");
  }

  const { error } = await supabase.rpc("set_job_order_item_checklist_state", {
    p_job_order_item_id: values.jobOrderItemId,
    p_checklist_completed: nextChecklistCompleted,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data: afterItem, error: afterError } = await supabase
    .from("job_order_items")
    .select(
      "id, job_order_id, description, approval_status, checklist_completed, checklist_checked_at, checklist_checked_by_staff_id",
    )
    .eq("id", values.jobOrderItemId)
    .maybeSingle();

  if (afterError) {
    throw new Error(afterError.message);
  }

  await writeAuditLog(supabase, {
    action: nextChecklistCompleted
      ? "Completed job order checklist item"
      : "Reopened job order checklist item",
    entityType: "job_order_item",
    entityId: values.jobOrderItemId,
    userId: context.userId,
    beforeData: beforeItem
      ? {
          description: beforeItem.description,
          approval_status: beforeItem.approval_status,
          checklist_completed: beforeItem.checklist_completed,
          checklist_checked_at: beforeItem.checklist_checked_at,
          checklist_checked_by_staff_id: beforeItem.checklist_checked_by_staff_id,
        }
      : null,
    afterData: afterItem
      ? {
          description: afterItem.description,
          approval_status: afterItem.approval_status,
          checklist_completed: afterItem.checklist_completed,
          checklist_checked_at: afterItem.checklist_checked_at,
          checklist_checked_by_staff_id: afterItem.checklist_checked_by_staff_id,
        }
      : null,
  });

  revalidateJobOrderPaths(values.jobOrderId);
  redirect(buildJobOrderRedirectPath(values.jobOrderId, redirectTab));
}

export async function deleteJobOrderAction(formData: FormData) {
  const jobOrderId = readRequiredValue(formData, "jobOrderId");
  const { context, supabase } = await getBranchScopedServerClient("job_orders:write");
  const { data: jobOrder, error: fetchError } = await supabase
    .from("job_orders")
    .select("id, job_order_number, status, branch_id, customer_id, vehicle_id, quotation_id")
    .eq("id", jobOrderId)
    .maybeSingle();

  if (fetchError) {
    redirect(`/job-orders?error=${encodeURIComponent(fetchError.message)}`);
  }

  if (!jobOrder) {
    redirect("/job-orders?error=Job%20order%20not%20found%20or%20you%20do%20not%20have%20access.");
  }

  const { error } = await supabase.rpc("delete_job_order", {
    p_job_order_id: jobOrderId,
  });

  if (error) {
    redirect(`/job-orders?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, {
    action: `Deleted job order ${jobOrder.job_order_number}`,
    entityType: "job_order",
    entityId: jobOrder.id,
    userId: context.userId,
    beforeData: jobOrder,
  });

  revalidatePath("/job-orders");
  revalidatePath("/quotations");
  revalidatePath("/dashboard");
  if (jobOrder.quotation_id) {
    revalidatePath(`/quotations/${jobOrder.quotation_id}`);
  }
  revalidatePath(`/customers/${jobOrder.customer_id}`);
  revalidatePath(`/vehicles/${jobOrder.vehicle_id}`);
  redirect("/job-orders");
}

function readRequiredValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || !value) {
    throw new Error("Required form value is missing.");
  }

  return value;
}

function readOptionalValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function revalidateJobOrderPaths(jobOrderId: string) {
  revalidatePath("/job-orders");
  revalidatePath(`/job-orders/${jobOrderId}`);
  revalidatePath(`/job-orders/${jobOrderId}/print`);
  revalidatePath("/dashboard");
}

function buildJobOrderRedirectPath(jobOrderId: string, tab?: string) {
  if (tab) {
    return `/job-orders/${jobOrderId}?tab=${encodeURIComponent(tab)}`;
  }

  return `/job-orders/${jobOrderId}`;
}

async function saveJobOrderPartMovement(
  mode: "use" | "return",
  formData: FormData,
): Promise<FormActionState> {
  const parsed = jobOrderPartUsageSchema.safeParse(parseJobOrderPartUsageFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const values = parsed.data;
  const redirectTab = resolveJobOrderDetailTab(readOptionalValue(formData, "redirectTab"));
  const { context, supabase } = await getAuthorizedSupabaseServerClient("job_orders:write");
  const rpcArgs = {
    p_job_order_item_id: values.jobOrderItemId,
    p_quantity: toNumeric(values.quantity),
    p_notes: values.notes || null,
    p_performed_by: context.userId,
  };
  const { error } =
    mode === "use"
      ? await supabase.rpc("record_job_order_part_usage", rpcArgs)
      : await supabase.rpc("record_job_order_part_return", rpcArgs);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidateJobOrderPaths(values.jobOrderId);
  redirect(buildJobOrderRedirectPath(values.jobOrderId, redirectTab));
}
