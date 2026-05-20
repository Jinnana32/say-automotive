"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { applyBranchFilter, getBranchScopedServerClient } from "@/lib/branches";
import { INITIAL_FORM_ACTION_STATE, toFormActionState, type FormActionState } from "@/lib/forms";
import {
  customerFormSchema,
  deriveCustomerDisplayName,
  parseCustomerFormData,
} from "@/features/customers/schemas/customer-form-schema";

export async function createCustomerAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  return saveCustomer(formData);
}

export async function updateCustomerAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  return saveCustomer(formData);
}

export async function deleteCustomerAction(formData: FormData) {
  const customerId = readFormDataString(formData, "customerId");

  if (!customerId) {
    redirect("/customers?error=Invalid customer request.");
  }

  const { branchScope, supabase } = await getBranchScopedServerClient("customers:write");
  const { data: customer, error: customerError } = await applyBranchFilter(
    supabase.from("customers").select("id, display_name, branch_id"),
    branchScope.selectedBranchId,
  )
    .eq("id", customerId)
    .maybeSingle();

  if (customerError) {
    redirect(`/customers?error=${encodeURIComponent(customerError.message)}`);
  }

  if (!customer) {
    redirect("/customers?error=Customer record not found.");
  }

  const { error } = await applyBranchFilter(
    supabase.from("customers").delete(),
    branchScope.selectedBranchId,
  ).eq("id", customerId);

  if (error) {
    redirect(`/customers?error=${encodeURIComponent(toCustomerDeleteErrorMessage(error.message))}`);
  }

  revalidatePath("/customers");
  revalidatePath("/vehicles");
  redirect("/customers");
}

async function saveCustomer(formData: FormData): Promise<FormActionState> {
  const parsed = customerFormSchema.safeParse(parseCustomerFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const values = parsed.data;
  const { branchScope, supabase } = await getBranchScopedServerClient("customers:write");
  const branchId = values.customerId
    ? await getExistingCustomerBranchId(supabase, branchScope.selectedBranchId, values.customerId)
    : branchScope.writeBranchId;
  const payload = {
    branch_id: branchId,
    customer_type: values.customerType,
    display_name: deriveCustomerDisplayName(values),
    first_name: values.firstName || null,
    last_name: values.lastName || null,
    company_name: values.companyName || null,
    contact_number: values.contactNumber || null,
    email: values.email || null,
    address: values.address || null,
    notes: values.notes || null,
    status: values.status,
  };

  const operation = values.customerId
    ? applyBranchFilter(
        supabase.from("customers").update(payload),
        branchScope.selectedBranchId,
      )
        .eq("id", values.customerId)
        .select("id")
        .single()
    : supabase.from("customers").insert(payload).select("id").single();

  const { data, error } = await operation;

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/customers");
  if (data?.id) {
    revalidatePath(`/customers/${data.id}`);
  }
  revalidatePath("/vehicles");

  redirect(values.customerId ? `/customers/${values.customerId}` : `/customers/${data.id}`);
}

function readFormDataString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function toCustomerDeleteErrorMessage(message: string) {
  if (
    message.includes("violates foreign key constraint") ||
    message.includes("update or delete on table")
  ) {
    return "This customer cannot be deleted because it is already linked to vehicles or operational records.";
  }

  return message;
}

async function getExistingCustomerBranchId(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  selectedBranchId: string | null,
  customerId: string,
) {
  const { data, error } = await applyBranchFilter(
    supabase.from("customers").select("branch_id"),
    selectedBranchId,
  )
    .eq("id", customerId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.branch_id) {
    throw new Error("Customer record does not exist.");
  }

  return data.branch_id;
}
