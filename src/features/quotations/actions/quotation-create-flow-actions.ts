"use server";

import { revalidatePath } from "next/cache";

import { mapCustomerRowToOption } from "@/features/customers/mappers";
import {
  customerFormSchema,
  deriveCustomerDisplayName,
} from "@/features/customers/schemas/customer-form-schema";
import type { CustomerFormValues, CustomerOption } from "@/features/customers/types";
import { getBranchScopedServerClient } from "@/lib/branches";
import { toFormActionState } from "@/lib/forms";
import {
  vehicleFormSchema,
} from "@/features/vehicles/schemas/vehicle-form-schema";
import type { VehicleFormValues } from "@/features/vehicles/types";
import type { QuotationVehicleOption } from "@/features/quotations/types";

type QuotationCreateFlowActionState<TData> = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  data?: TData;
};

export type QuotationQuickCustomerActionState = QuotationCreateFlowActionState<CustomerOption>;
export type QuotationQuickVehicleActionState = QuotationCreateFlowActionState<QuotationVehicleOption>;

const INITIAL_QUOTATION_CREATE_FLOW_ACTION_STATE = {
  status: "idle",
} as const satisfies QuotationCreateFlowActionState<never>;

export async function quickCreateCustomerForQuotationAction(
  _prevState: QuotationQuickCustomerActionState = INITIAL_QUOTATION_CREATE_FLOW_ACTION_STATE,
  formData: FormData,
): Promise<QuotationQuickCustomerActionState> {
  const parsed = customerFormSchema.safeParse(parseQuickCustomerFormData(formData));

  if (!parsed.success) {
    return {
      ...toFormActionState(parsed.error),
      status: "error",
    };
  }

  const values = parsed.data;
  const { branchScope, supabase } = await getBranchScopedServerClient("customers:write");
  const payload = {
    branch_id: branchScope.writeBranchId,
    customer_type: values.customerType,
    display_name: deriveCustomerDisplayName(values),
    first_name: values.firstName || null,
    last_name: values.lastName || null,
    company_name: values.companyName || null,
    contact_number: values.contactNumber || null,
    contact_number_secondary: values.contactNumberSecondary || null,
    email: values.email || null,
    address: values.address || null,
    notes: values.notes || null,
    status: values.status,
  };

  const { data, error } = await supabase
    .from("customers")
    .insert(payload)
    .select("id, display_name")
    .single();

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/customers");
  revalidatePath("/quotations");
  revalidatePath("/quotations/new");

  return {
    status: "success",
    message: `${data.display_name} is ready for quotation intake.`,
    data: mapCustomerRowToOption(data),
  };
}

export async function quickCreateVehicleForQuotationAction(
  _prevState: QuotationQuickVehicleActionState = INITIAL_QUOTATION_CREATE_FLOW_ACTION_STATE,
  formData: FormData,
): Promise<QuotationQuickVehicleActionState> {
  const parsed = vehicleFormSchema.safeParse(parseQuickVehicleFormData(formData));

  if (!parsed.success) {
    return {
      ...toFormActionState(parsed.error),
      status: "error",
    };
  }

  const values = parsed.data;
  const { branchScope, supabase } = await getBranchScopedServerClient("vehicles:write");
  const normalizedPlateNumber = normalizeNullableUpper(values.plateNumber);
  const normalizedVin = normalizeNullableUpper(values.vin);

  const [plateConflict, vinConflict] = await Promise.all([
    normalizedPlateNumber
      ? supabase
          .from("vehicles")
          .select("id")
          .eq("branch_id", branchScope.writeBranchId)
          .eq("plate_number", normalizedPlateNumber)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    normalizedVin
      ? supabase
          .from("vehicles")
          .select("id")
          .eq("branch_id", branchScope.writeBranchId)
          .eq("vin", normalizedVin)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (plateConflict.error) {
    return {
      status: "error",
      message: plateConflict.error.message,
    };
  }

  if (vinConflict.error) {
    return {
      status: "error",
      message: vinConflict.error.message,
    };
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
    branch_id: branchScope.writeBranchId,
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

  const { data, error } = await supabase
    .from("vehicles")
    .insert(payload)
    .select("id, customer_id, make, model, year, plate_number")
    .single();

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/vehicles");
  revalidatePath(`/customers/${data.customer_id}`);
  revalidatePath("/quotations");
  revalidatePath("/quotations/new");

  return {
    status: "success",
    message: `${data.make} ${data.model} is ready for quotation intake.`,
    data: mapVehicleRowToQuotationOption(data),
  };
}

function parseQuickCustomerFormData(formData: FormData): CustomerFormValues {
  return {
    customerType: readString(formData, "customerType") as CustomerFormValues["customerType"],
    firstName: readString(formData, "firstName"),
    lastName: readString(formData, "lastName"),
    companyName: readString(formData, "companyName"),
    contactNumber: readString(formData, "contactNumber"),
    contactNumberSecondary: readString(formData, "contactNumberSecondary"),
    email: readString(formData, "email"),
    address: readString(formData, "address"),
    notes: readString(formData, "notes"),
    status: "active",
  };
}

function parseQuickVehicleFormData(formData: FormData): VehicleFormValues {
  return {
    customerId: readString(formData, "customerId"),
    make: readString(formData, "make"),
    model: readString(formData, "model"),
    year: readString(formData, "year"),
    transmission: readString(formData, "transmission"),
    mileage: readString(formData, "mileage"),
    plateNumber: readString(formData, "plateNumber"),
    vin: readString(formData, "vin"),
    engineSize: readString(formData, "engineSize"),
    variant: readString(formData, "variant"),
    fuelType: readString(formData, "fuelType"),
    color: readString(formData, "color"),
    status: "active",
  };
}

function mapVehicleRowToQuotationOption(row: {
  id: string;
  customer_id: string;
  make: string;
  model: string;
  year: number | null;
  plate_number: string | null;
}): QuotationVehicleOption {
  const platePart = row.plate_number ? ` · ${row.plate_number}` : "";
  const yearPart = row.year ? ` (${row.year})` : "";

  return {
    id: row.id,
    customerId: row.customer_id,
    label: `${row.make} ${row.model}${yearPart}${platePart}`,
  };
}

function normalizeNullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeNullableUpper(value: string) {
  const trimmed = value.trim().toUpperCase();
  return trimmed ? trimmed : null;
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
