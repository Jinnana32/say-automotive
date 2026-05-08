"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  additionalJobOrderItemSchema,
  jobOrderDetailsSchema,
  jobOrderStatusTransitionSchema,
  jobOrderPartUsageSchema,
  mechanicAssignmentSchema,
  parseAdditionalJobOrderItemFormData,
  parseJobOrderDetailsFormData,
  parseJobOrderPartUsageFormData,
  parseJobOrderStatusTransitionFormData,
  parseMechanicAssignmentFormData,
  parseOptionalNumeric,
} from "@/features/job-orders/schemas/job-order-forms";
import { resolveJobOrderDetailTab, toNumeric } from "@/features/job-orders/utils";
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
  const { supabase } = await getAuthorizedSupabaseServerClient("job_orders:write");
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
  const { error } = await supabase.rpc("add_job_order_item", {
    p_job_order_id: values.jobOrderId,
    p_item_type: values.itemType,
    p_product_id: values.productId || null,
    p_service_id: values.serviceId || null,
    p_description: values.description,
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
