"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { writeAuditLog } from "@/lib/audit";
import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { INITIAL_FORM_ACTION_STATE, toFormActionState, type FormActionState } from "@/lib/forms";
import {
  parseVehicleLookupOptionFormData,
  parseVehicleMakeFormData,
  parseVehicleModelFormData,
  vehicleLookupOptionFormSchema,
  vehicleMakeFormSchema,
  vehicleModelFormSchema,
} from "@/features/vehicles/schemas/vehicle-lookup-schemas";
import type { VehicleLookupType, VehicleStatus } from "@/features/vehicles/types";

const LOOKUPS_PATH = "/settings/vehicle-lookups";

export async function createVehicleMakeAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = vehicleMakeFormSchema.safeParse(parseVehicleMakeFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const { context, supabase } = await getAuthorizedSupabaseServerClient("settings:write");
  const payload = {
    name: parsed.data.name.trim(),
    name_key: toLookupKey(parsed.data.name),
    sort_order: parsed.data.sortOrder ? Number(parsed.data.sortOrder) : 0,
    status: "active" as const,
  };

  const { data, error } = await supabase.from("vehicle_makes").insert(payload).select("*").single();

  if (error) {
    return { status: "error", message: toDuplicateMessage(error.message, "vehicle make") };
  }

  await writeAuditLog(supabase, {
    action: `Created vehicle make: ${payload.name}`,
    entityType: "vehicle_make",
    entityId: data.id,
    userId: context.userId,
    afterData: payload,
  });

  revalidateVehicleLookupPaths();
  redirect(LOOKUPS_PATH);
}

export async function createVehicleModelAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = vehicleModelFormSchema.safeParse(parseVehicleModelFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const { context, supabase } = await getAuthorizedSupabaseServerClient("settings:write");
  const payload = {
    make_id: parsed.data.makeId,
    name: parsed.data.name.trim(),
    name_key: toLookupKey(parsed.data.name),
    sort_order: parsed.data.sortOrder ? Number(parsed.data.sortOrder) : 0,
    status: "active" as const,
  };

  const { data, error } = await supabase.from("vehicle_models").insert(payload).select("*").single();

  if (error) {
    return { status: "error", message: toDuplicateMessage(error.message, "vehicle model") };
  }

  await writeAuditLog(supabase, {
    action: `Created vehicle model: ${payload.name}`,
    entityType: "vehicle_model",
    entityId: data.id,
    userId: context.userId,
    afterData: payload,
  });

  revalidateVehicleLookupPaths();
  redirect(LOOKUPS_PATH);
}

export async function createVehicleLookupOptionAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = vehicleLookupOptionFormSchema.safeParse(parseVehicleLookupOptionFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const { context, supabase } = await getAuthorizedSupabaseServerClient("settings:write");
  const payload = {
    lookup_type: parsed.data.lookupType,
    label: parsed.data.label.trim(),
    value_key: toLookupKey(parsed.data.label),
    sort_order: parsed.data.sortOrder ? Number(parsed.data.sortOrder) : 0,
    status: "active" as const,
  };

  const { data, error } = await supabase
    .from("vehicle_lookup_options")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return { status: "error", message: toDuplicateMessage(error.message, "lookup option") };
  }

  await writeAuditLog(supabase, {
    action: `Created vehicle lookup option: ${payload.label}`,
    entityType: "vehicle_lookup_option",
    entityId: data.id,
    userId: context.userId,
    afterData: payload,
  });

  revalidateVehicleLookupPaths();
  redirect(LOOKUPS_PATH);
}

export async function updateVehicleMakeStatusAction(formData: FormData) {
  await updateRecordStatus({
    formData,
    table: "vehicle_makes",
    entityType: "vehicle_make",
    idField: "makeId",
  });
}

export async function updateVehicleModelStatusAction(formData: FormData) {
  await updateRecordStatus({
    formData,
    table: "vehicle_models",
    entityType: "vehicle_model",
    idField: "modelId",
  });
}

export async function updateVehicleLookupOptionStatusAction(formData: FormData) {
  await updateRecordStatus({
    formData,
    table: "vehicle_lookup_options",
    entityType: "vehicle_lookup_option",
    idField: "optionId",
  });
}

async function updateRecordStatus({
  formData,
  table,
  entityType,
  idField,
}: {
  formData: FormData;
  table: "vehicle_makes" | "vehicle_models" | "vehicle_lookup_options";
  entityType: string;
  idField: string;
}) {
  const id = readString(formData, idField);
  const nextStatus = readString(formData, "status") as VehicleStatus;

  if (!id || !nextStatus) {
    redirect(LOOKUPS_PATH);
  }

  const { context, supabase } = await getAuthorizedSupabaseServerClient("settings:write");
  const { data: current, error: currentError } = await supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .single();

  if (currentError) {
    redirect(LOOKUPS_PATH);
  }

  const { error } = await supabase.from(table).update({ status: nextStatus }).eq("id", id);

  if (error) {
    redirect(LOOKUPS_PATH);
  }

  await writeAuditLog(supabase, {
    action: `Updated ${entityType} status`,
    entityType,
    entityId: id,
    userId: context.userId,
    beforeData: current,
    afterData: { ...current, status: nextStatus },
  });

  revalidateVehicleLookupPaths();
  redirect(LOOKUPS_PATH);
}

function revalidateVehicleLookupPaths() {
  revalidatePath("/settings");
  revalidatePath(LOOKUPS_PATH);
  revalidatePath("/vehicles");
  revalidatePath("/vehicles/new");
}

function toLookupKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toDuplicateMessage(message: string, label: string) {
  if (message.includes("duplicate key") || message.includes("unique constraint")) {
    return `This ${label} already exists.`;
  }

  return message;
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
