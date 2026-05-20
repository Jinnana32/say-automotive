"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
  const { supabase } = await getBranchScopedServerClient("services:write");

  const payload = {
    branch_id: null,
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
        .select("id, name, category, labor_price")
        .single()
    : supabase
        .from("services")
        .insert(payload)
        .select("id, name, category, labor_price")
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
