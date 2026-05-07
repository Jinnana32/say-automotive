import { z } from "zod";

import type { VehicleLookupType } from "@/features/vehicles/types";

export const vehicleMakeFormSchema = z.object({
  name: z.string().trim().min(1, "Make name is required."),
  sortOrder: z
    .string()
    .trim()
    .refine((value) => !value || Number.isInteger(Number(value)), "Sort order must be a whole number."),
});

export const vehicleModelFormSchema = z.object({
  makeId: z.string().uuid("Select a vehicle make."),
  name: z.string().trim().min(1, "Model name is required."),
  sortOrder: z
    .string()
    .trim()
    .refine((value) => !value || Number.isInteger(Number(value)), "Sort order must be a whole number."),
});

export const vehicleLookupOptionFormSchema = z.object({
  lookupType: z.enum(["transmission", "fuel_type", "color"] satisfies [VehicleLookupType, ...VehicleLookupType[]]),
  label: z.string().trim().min(1, "Option label is required."),
  sortOrder: z
    .string()
    .trim()
    .refine((value) => !value || Number.isInteger(Number(value)), "Sort order must be a whole number."),
});

export function parseVehicleMakeFormData(formData: FormData) {
  return {
    name: readString(formData, "name"),
    sortOrder: readString(formData, "sortOrder"),
  };
}

export function parseVehicleModelFormData(formData: FormData) {
  return {
    makeId: readString(formData, "makeId"),
    name: readString(formData, "name"),
    sortOrder: readString(formData, "sortOrder"),
  };
}

export function parseVehicleLookupOptionFormData(formData: FormData) {
  return {
    lookupType: readString(formData, "lookupType") as VehicleLookupType,
    label: readString(formData, "label"),
    sortOrder: readString(formData, "sortOrder"),
  };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
