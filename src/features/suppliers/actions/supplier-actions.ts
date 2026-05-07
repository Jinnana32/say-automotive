"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { INITIAL_FORM_ACTION_STATE, toFormActionState, type FormActionState } from "@/lib/forms";
import { parseSupplierFormData, supplierFormSchema } from "@/features/suppliers/schemas/supplier-form-schema";

export async function createSupplierAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  return saveSupplier(formData);
}

export async function updateSupplierAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  return saveSupplier(formData);
}

async function saveSupplier(formData: FormData): Promise<FormActionState> {
  const parsed = supplierFormSchema.safeParse(parseSupplierFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const values = parsed.data;
  const { supabase } = await getAuthorizedSupabaseServerClient("suppliers:write");
  const payload = {
    supplier_name: values.supplierName,
    contact_person: normalizeNullable(values.contactPerson),
    contact_number: normalizeNullable(values.contactNumber),
    email: normalizeNullable(values.email),
    address: normalizeNullable(values.address),
    payment_terms: normalizeNullable(values.paymentTerms),
    notes: normalizeNullable(values.notes),
    status: values.status,
  };

  const operation = values.supplierId
    ? supabase.from("suppliers").update(payload).eq("id", values.supplierId).select("id").single()
    : supabase.from("suppliers").insert(payload).select("id").single();

  const { error } = await operation;

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/suppliers");
  revalidatePath("/products");
  redirect("/suppliers");
}

function normalizeNullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
