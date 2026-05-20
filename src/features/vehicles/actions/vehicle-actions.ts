"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { applyBranchFilter, getBranchScopedServerClient } from "@/lib/branches";
import { INITIAL_FORM_ACTION_STATE, toFormActionState, type FormActionState } from "@/lib/forms";
import {
  parseVehicleFormData,
  vehicleFormSchema,
} from "@/features/vehicles/schemas/vehicle-form-schema";

export async function createVehicleAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  return saveVehicle(formData);
}

export async function updateVehicleAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  return saveVehicle(formData);
}

export async function deleteVehicleAction(formData: FormData) {
  const vehicleId = readFormDataString(formData, "vehicleId");

  if (!vehicleId) {
    redirect("/vehicles?error=Invalid vehicle request.");
  }

  const { branchScope, supabase } = await getBranchScopedServerClient("vehicles:write");
  const { data: vehicle, error: vehicleError } = await applyBranchFilter(
    supabase
    .from("vehicles")
    .select("id, customer_id, make, model, plate_number"),
    branchScope.selectedBranchId,
  )
    .eq("id", vehicleId)
    .maybeSingle();

  if (vehicleError) {
    redirect(`/vehicles?error=${encodeURIComponent(vehicleError.message)}`);
  }

  if (!vehicle) {
    redirect("/vehicles?error=Vehicle record not found.");
  }

  const { error } = await applyBranchFilter(
    supabase.from("vehicles").delete(),
    branchScope.selectedBranchId,
  ).eq("id", vehicleId);

  if (error) {
    redirect(`/vehicles?error=${encodeURIComponent(toVehicleDeleteErrorMessage(error.message))}`);
  }

  revalidatePath("/vehicles");
  revalidatePath(`/customers/${vehicle.customer_id}`);
  redirect("/vehicles");
}

async function saveVehicle(formData: FormData): Promise<FormActionState> {
  const parsed = vehicleFormSchema.safeParse(parseVehicleFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const values = parsed.data;
  const { branchScope, supabase } = await getBranchScopedServerClient("vehicles:write");
  const branchId = values.vehicleId
    ? await getExistingVehicleBranchId(supabase, branchScope.selectedBranchId, values.vehicleId)
    : branchScope.writeBranchId;
  const normalizedPlateNumber = normalizeNullableUpper(values.plateNumber);
  const normalizedVin = normalizeNullableUpper(values.vin);
  const existingVehicleId = values.vehicleId ?? null;

  const [plateConflict, vinConflict] = await Promise.all([
    normalizedPlateNumber
      ? getVehicleConflictByField(
          supabase,
          branchId,
          "plate_number",
          normalizedPlateNumber,
          existingVehicleId,
        )
      : Promise.resolve({ data: null, error: null }),
    normalizedVin
      ? getVehicleConflictByField(
          supabase,
          branchId,
          "vin",
          normalizedVin,
          existingVehicleId,
        )
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (plateConflict.error) {
    return { status: "error", message: plateConflict.error.message };
  }

  if (vinConflict.error) {
    return { status: "error", message: vinConflict.error.message };
  }

  if (plateConflict.data) {
    return {
      status: "error",
      message: "A vehicle with this plate number already exists.",
      fieldErrors: {
        plateNumber: ["A vehicle with this plate number already exists."],
      },
    };
  }

  if (vinConflict.data) {
    return {
      status: "error",
      message: "A vehicle with this VIN already exists.",
      fieldErrors: {
        vin: ["A vehicle with this VIN already exists."],
      },
    };
  }

  const payload = {
    branch_id: branchId,
    customer_id: values.customerId,
    make: values.make,
    model: values.model,
    year: values.year ? Number(values.year) : null,
    transmission: normalizeNullable(values.transmission),
    mileage: values.mileage ? Number(values.mileage) : null,
    plate_number: normalizedPlateNumber,
    vin: normalizedVin,
    engine: normalizeNullable(values.engineSize),
    variant: normalizeNullable(values.variant),
    fuel_type: normalizeNullable(values.fuelType),
    color: normalizeNullable(values.color),
    status: values.status,
  };

  const operation = values.vehicleId
    ? applyBranchFilter(
        supabase.from("vehicles").update(payload),
        branchScope.selectedBranchId,
      )
        .eq("id", values.vehicleId)
        .select("id, customer_id")
        .single()
    : supabase.from("vehicles").insert(payload).select("id, customer_id").single();

  const { data, error } = await operation;

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/vehicles");
  if (data?.customer_id) {
    revalidatePath(`/customers/${data.customer_id}`);
  }

  redirect(values.vehicleId ? `/customers/${data.customer_id}` : `/customers/${data.customer_id}`);
}

function normalizeNullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeNullableUpper(value: string) {
  const trimmed = value.trim().toUpperCase();
  return trimmed ? trimmed : null;
}

function getVehicleConflictByField(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  branchId: string,
  field: "plate_number" | "vin",
  value: string,
  vehicleId: string | null,
) {
  let query = supabase.from("vehicles").select("id").eq("branch_id", branchId).eq(field, value);

  if (vehicleId) {
    query = query.neq("id", vehicleId);
  }

  return query.maybeSingle();
}

function readFormDataString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function toVehicleDeleteErrorMessage(message: string) {
  if (
    message.includes("violates foreign key constraint") ||
    message.includes("update or delete on table")
  ) {
    return "This vehicle cannot be deleted because it is already used in operational records.";
  }

  return message;
}

async function getExistingVehicleBranchId(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  selectedBranchId: string | null,
  vehicleId: string,
) {
  const { data, error } = await applyBranchFilter(
    supabase.from("vehicles").select("branch_id"),
    selectedBranchId,
  )
    .eq("id", vehicleId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.branch_id) {
    throw new Error("Vehicle record does not exist.");
  }

  return data.branch_id;
}
