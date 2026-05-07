"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { writeAuditLog } from "@/lib/audit";
import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { getDefaultBranch } from "@/lib/branches";
import {
  INITIAL_FORM_ACTION_STATE,
  toFormActionState,
  type FormActionState,
} from "@/lib/forms";
import {
  businessProfileSettingsSchema,
  documentSequenceSettingsSchema,
  operationalRulesSettingsSchema,
  parseBusinessProfileSettingsFormData,
  parseDocumentSequenceSettingsFormData,
  parseOperationalRulesSettingsFormData,
} from "@/features/settings/schemas/settings-forms";

export async function updateBusinessProfileSettingsAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = businessProfileSettingsSchema.safeParse(
    parseBusinessProfileSettingsFormData(formData),
  );

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const [branch, { context, supabase }] = await Promise.all([
    getDefaultBranch(),
    getAuthorizedSupabaseServerClient("settings:write"),
  ]);
  const { data: currentSettings, error: currentError } = await supabase
    .from("business_settings")
    .select("*")
    .eq("branch_id", branch.id)
    .single();

  if (currentError) {
    return { status: "error", message: currentError.message };
  }

  const payload = {
    business_name: parsed.data.businessName,
    business_address: normalizeNullable(parsed.data.businessAddress),
    business_contact: normalizeNullable(parsed.data.businessContact),
    receipt_footer: normalizeNullable(parsed.data.receiptFooter),
    default_tax_rate: Number(parsed.data.defaultTaxRate),
  };

  const { error } = await supabase
    .from("business_settings")
    .update(payload)
    .eq("branch_id", branch.id);

  if (error) {
    return { status: "error", message: error.message };
  }

  await writeAuditLog(supabase, {
    action: "Updated business profile settings",
    entityType: "business_settings",
    entityId: String(currentSettings.id),
    userId: context.userId,
    beforeData: {
      business_name: currentSettings.business_name,
      business_address: currentSettings.business_address,
      business_contact: currentSettings.business_contact,
      receipt_footer: currentSettings.receipt_footer,
      default_tax_rate: currentSettings.default_tax_rate,
    },
    afterData: payload,
  });

  revalidateSettingsPaths();
  redirect("/settings");
}

export async function updateOperationalRulesSettingsAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = operationalRulesSettingsSchema.safeParse(
    parseOperationalRulesSettingsFormData(formData),
  );

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const [branch, { context, supabase }] = await Promise.all([
    getDefaultBranch(),
    getAuthorizedSupabaseServerClient("settings:write"),
  ]);
  const { data: currentSettings, error: currentError } = await supabase
    .from("business_settings")
    .select("*")
    .eq("branch_id", branch.id)
    .single();

  if (currentError) {
    return { status: "error", message: currentError.message };
  }

  const payload = {
    allow_partial_payments: parsed.data.allowPartialPayments,
    allow_release_with_balance: parsed.data.allowReleaseWithBalance,
    require_full_payment_before_release: parsed.data.requireFullPaymentBeforeRelease,
    enable_barcode_support: parsed.data.enableBarcodeSupport,
    enable_shelf_location: parsed.data.enableShelfLocation,
  };

  const { error } = await supabase
    .from("business_settings")
    .update(payload)
    .eq("branch_id", branch.id);

  if (error) {
    return { status: "error", message: error.message };
  }

  await writeAuditLog(supabase, {
    action: "Updated operational rules",
    entityType: "business_settings",
    entityId: String(currentSettings.id),
    userId: context.userId,
    beforeData: {
      allow_partial_payments: currentSettings.allow_partial_payments,
      allow_release_with_balance: currentSettings.allow_release_with_balance,
      require_full_payment_before_release:
        currentSettings.require_full_payment_before_release,
      enable_barcode_support: currentSettings.enable_barcode_support,
      enable_shelf_location: currentSettings.enable_shelf_location,
    },
    afterData: payload,
  });

  revalidateSettingsPaths();
  redirect("/settings");
}

export async function updateDocumentSequenceSettingsAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = documentSequenceSettingsSchema.safeParse(
    parseDocumentSequenceSettingsFormData(formData),
  );

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const { context, supabase } = await getAuthorizedSupabaseServerClient("settings:write");
  const { data: currentSequence, error: currentError } = await supabase
    .from("document_sequences")
    .select("*")
    .eq("key", parsed.data.key)
    .single();

  if (currentError) {
    return { status: "error", message: currentError.message };
  }

  const payload = {
    prefix: parsed.data.prefix.trim(),
    padding: Number(parsed.data.padding),
    last_value: Number(parsed.data.lastValue),
  };

  const { error } = await supabase
    .from("document_sequences")
    .update(payload)
    .eq("key", parsed.data.key);

  if (error) {
    return { status: "error", message: error.message };
  }

  await writeAuditLog(supabase, {
    action: `Updated document sequence: ${parsed.data.key}`,
    entityType: "document_sequence",
    userId: context.userId,
    beforeData: {
      key: currentSequence.key,
      prefix: currentSequence.prefix,
      padding: currentSequence.padding,
      last_value: currentSequence.last_value,
    },
    afterData: {
      key: parsed.data.key,
      ...payload,
    },
  });

  revalidateSettingsPaths();
  redirect("/settings");
}

function revalidateSettingsPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  revalidatePath("/reports");
  revalidatePath("/quotations");
  revalidatePath("/job-orders");
  revalidatePath("/invoices");
  revalidatePath("/payments");
  revalidatePath("/pos");
  revalidatePath("/inventory");
}

function normalizeNullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
