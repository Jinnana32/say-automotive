"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  canMarkCatalogRecordGlobal,
  canSelectCatalogOwningBranch,
  resolveCatalogWriteBranchId,
} from "@/lib/catalog-visibility";
import { getBranchScopedServerClient } from "@/lib/branches";
import {
  INITIAL_FORM_ACTION_STATE,
  toFormActionState,
  type FormActionState,
} from "@/lib/forms";
import {
  parseServiceFormData,
  serviceFormSchema,
} from "@/features/services/schemas/service-form-schema";
import {
  type InlineServiceActionState,
  INITIAL_INLINE_SERVICE_ACTION_STATE,
} from "@/features/services/inline-service-action-state";
import type {
  ServiceInlineCreateResult,
  ServiceStatus,
} from "@/features/services/types";

type PersistedServiceRow = {
  id: string;
  branch_id: string;
  is_global: boolean;
  name: string;
  category: string | null;
  labor_price: number;
};

export async function createServiceAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const result = await upsertService(formData);

  if (!result.success) {
    return result.state;
  }

  revalidateServicePaths();
  redirect("/services");
}

export async function updateServiceAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const result = await upsertService(formData);

  if (!result.success) {
    return result.state;
  }

  revalidateServicePaths();
  redirect("/services");
}

export async function createInlineServiceAction(
  _prevState: InlineServiceActionState = INITIAL_INLINE_SERVICE_ACTION_STATE,
  formData: FormData,
): Promise<InlineServiceActionState> {
  const result = await upsertService(formData);

  if (!result.success) {
    return {
      status: "error",
      message: result.state.message,
      fieldErrors: result.state.fieldErrors,
    };
  }

  revalidateServicePaths();

  return {
    status: "success",
    message: `${result.service.label} was added to the service catalog.`,
    service: result.service,
  };
}

async function upsertService(
  formData: FormData,
): Promise<
  | { success: true; service: ServiceInlineCreateResult }
  | { success: false; state: FormActionState }
> {
  const parsed = serviceFormSchema.safeParse(parseServiceFormData(formData));

  if (!parsed.success) {
    return {
      success: false,
      state: toFormActionState(parsed.error),
    };
  }

  const values = parsed.data;
  const { branchScope, context, supabase } = await getBranchScopedServerClient("services:write");
  const canMarkGlobal = canMarkCatalogRecordGlobal(context.role);
  const canSelectOwningBranch = canSelectCatalogOwningBranch({
    role: context.role,
    accessibleBranchCount: branchScope.accessibleBranches.length,
  });
  const resolvedBranchId = resolveCatalogWriteBranchId({
    requestedBranchId: values.owningBranchId,
    writeBranchId: branchScope.writeBranchId,
    canSelectOwningBranch,
    accessibleBranchIds: branchScope.accessibleBranches.map((branch) => branch.id),
  });

  if (values.shareGlobally && !canMarkGlobal) {
    return {
      success: false,
      state: {
        status: "error",
        message: "Only owner and admin roles can share services globally.",
        fieldErrors: {
          shareGlobally: ["Only owner and admin roles can share services globally."],
        },
      },
    };
  }

  const { data: currentService, error: currentServiceError } = values.serviceId
    ? await supabase
        .from("services")
        .select("id, branch_id")
        .eq("id", values.serviceId)
        .maybeSingle()
    : { data: null, error: null };

  if (currentServiceError) {
    return { success: false, state: { status: "error", message: currentServiceError.message } };
  }

  if (
    currentService &&
    !branchScope.canAccessAllBranches &&
    currentService.branch_id !== branchScope.writeBranchId
  ) {
    return {
      success: false,
      state: {
        status: "error",
        message: "You can only edit services owned by your branch.",
      },
    };
  }

  const payload = {
    branch_id: resolvedBranchId,
    is_global: values.shareGlobally,
    name: values.name,
    category: normalizeNullable(values.category),
    description: normalizeNullable(values.description),
    labor_price: Number(values.laborPrice),
    estimated_duration_minutes: values.estimatedDurationMinutes
      ? Number(values.estimatedDurationMinutes)
      : null,
    status: values.status as ServiceStatus,
  };

  const operation = values.serviceId
      ? supabase
        .from("services")
        .update(payload)
        .eq("id", values.serviceId)
        .select("id, branch_id, is_global, name, category, labor_price")
        .single()
    : supabase
        .from("services")
        .insert(payload)
        .select("id, branch_id, is_global, name, category, labor_price")
        .single();

  const { data, error } = await operation;

  if (error) {
    return { success: false, state: { status: "error", message: error.message } };
  }

  const savedService = data as PersistedServiceRow;

  return {
    success: true,
    service: {
      id: savedService.id,
      label: savedService.name,
      category: savedService.category,
      unitPrice: savedService.labor_price,
    },
  };
}

function revalidateServicePaths() {
  revalidatePath("/job-orders");
  revalidatePath("/quotations");
  revalidatePath("/services");
}

function normalizeNullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
