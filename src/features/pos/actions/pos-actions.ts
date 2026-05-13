"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  completePosSaleSchema,
  parseCompletePosSaleFormData,
} from "@/features/pos/schemas/pos-form-schema";
import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { getDefaultBranch } from "@/lib/branches";
import { getBusinessNow } from "@/lib/dates";
import { INITIAL_FORM_ACTION_STATE, toFormActionState, type FormActionState } from "@/lib/forms";

export async function completePosSaleAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = completePosSaleSchema.safeParse(parseCompletePosSaleFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const [branch, { context, supabase }] = await Promise.all([
    getDefaultBranch(),
    getAuthorizedSupabaseServerClient("pos:write"),
  ]);
  const { data, error } = await supabase.rpc("complete_pos_sale", {
    p_branch_id: branch.id,
    p_items: parsed.data.items,
    p_customer_id: parsed.data.customerId ?? null,
    p_discount: Number(parsed.data.discount),
    p_payment_amount: Number(parsed.data.paymentAmount),
    p_payment_method: parsed.data.paymentMethod,
    p_reference_number: parsed.data.referenceNumber || null,
    p_notes: parsed.data.notes || null,
    p_cashier_user_id: context.userId,
    p_invoice_date: getBusinessNow().toISODate() ?? new Date().toISOString().slice(0, 10),
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/pos");
  revalidatePath("/invoices");
  revalidatePath("/payments");
  redirect(`/invoices/${data}`);
}
