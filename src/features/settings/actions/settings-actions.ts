"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { writeAuditLog } from "@/lib/audit";
import { getBranchScopedServerClient } from "@/lib/branches";
import {
  INITIAL_FORM_ACTION_STATE,
  toFormActionState,
  type FormActionState,
} from "@/lib/forms";
import {
  BUSINESS_ASSETS_BUCKET,
  buildBusinessLogoObjectKey,
} from "@/lib/constants/storage";
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

  const { branchScope, context, supabase } = await getBranchScopedServerClient("settings:write");
  const branchId = branchScope.writeBranchId;
  const { data: currentSettings, error: currentError } = await supabase
    .from("business_settings")
    .select("*")
    .eq("branch_id", branchId)
    .single();

  if (currentError) {
    return { status: "error", message: currentError.message };
  }

  const businessLogoFile = readFile(formData, "businessLogo");
  let businessLogoPath = currentSettings.business_logo_path as string | null;

  if (businessLogoFile) {
    const fileValidationError = validateBusinessLogoFile(businessLogoFile);

    if (fileValidationError) {
      return { status: "error", message: fileValidationError };
    }

    const uploadPath = buildBusinessLogoObjectKey(branchId, businessLogoFile.name);
    const { error: uploadError } = await supabase.storage
      .from(BUSINESS_ASSETS_BUCKET)
      .upload(uploadPath, businessLogoFile, {
        contentType: businessLogoFile.type,
        upsert: true,
      });

    if (uploadError) {
      return { status: "error", message: uploadError.message };
    }

    businessLogoPath = uploadPath;
  }

  const payload = {
    business_name: parsed.data.businessName,
    business_logo_path: businessLogoPath,
    business_address: normalizeNullable(parsed.data.businessAddress),
    business_contact: normalizeNullable(parsed.data.businessContact),
    business_email: normalizeNullable(parsed.data.businessEmail),
    business_vat_registration_no: normalizeNullable(parsed.data.businessVatRegistrationNo),
    receipt_footer: normalizeNullable(parsed.data.receiptFooter),
    default_tax_rate: Number(parsed.data.defaultTaxRate),
  };

  const { error } = await supabase
    .from("business_settings")
    .update(payload)
    .eq("branch_id", branchId);

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
      business_logo_path: currentSettings.business_logo_path,
      business_address: currentSettings.business_address,
      business_contact: currentSettings.business_contact,
      business_email: currentSettings.business_email,
      business_vat_registration_no: currentSettings.business_vat_registration_no,
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

  const { branchScope, context, supabase } = await getBranchScopedServerClient("settings:write");
  const branchId = branchScope.writeBranchId;
  const { data: currentSettings, error: currentError } = await supabase
    .from("business_settings")
    .select("*")
    .eq("branch_id", branchId)
    .single();

  if (currentError) {
    return { status: "error", message: currentError.message };
  }

  const payload = {
    allow_partial_payments: parsed.data.allowPartialPayments,
    require_invoice_before_job_completion:
      parsed.data.requireInvoiceBeforeJobCompletion,
    require_invoice_before_vehicle_release:
      parsed.data.requireInvoiceBeforeVehicleRelease,
    allow_release_with_balance: parsed.data.allowReleaseWithBalance,
    require_full_payment_before_release: parsed.data.requireFullPaymentBeforeRelease,
    require_additional_item_preapproval: parsed.data.requireAdditionalItemPreApproval,
    enable_barcode_support: parsed.data.enableBarcodeSupport,
    enable_shelf_location: parsed.data.enableShelfLocation,
  };

  const { error } = await supabase
    .from("business_settings")
    .update(payload)
    .eq("branch_id", branchId);

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
      require_invoice_before_job_completion:
        currentSettings.require_invoice_before_job_completion,
      require_invoice_before_vehicle_release:
        currentSettings.require_invoice_before_vehicle_release,
      allow_release_with_balance: currentSettings.allow_release_with_balance,
      require_full_payment_before_release:
        currentSettings.require_full_payment_before_release,
      require_additional_item_preapproval:
        currentSettings.require_additional_item_preapproval,
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

  const { branchScope, context, supabase } = await getBranchScopedServerClient("settings:write");
  const branchId = branchScope.writeBranchId;
  const { data: currentSequence, error: currentError } = await supabase
    .from("document_sequences")
    .select("*")
    .eq("key", parsed.data.key)
    .eq("branch_id", branchId)
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
    .eq("key", parsed.data.key)
    .eq("branch_id", branchId);

  if (error) {
    return { status: "error", message: error.message };
  }

  await writeAuditLog(supabase, {
    action: `Updated document sequence: ${parsed.data.key}`,
    entityType: "document_sequence",
    userId: context.userId,
    beforeData: {
      key: currentSequence.key,
      branch_id: currentSequence.branch_id,
      prefix: currentSequence.prefix,
      padding: currentSequence.padding,
      last_value: currentSequence.last_value,
    },
    afterData: {
      key: parsed.data.key,
      branch_id: branchId,
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

function readFile(formData: FormData, key: string) {
  const value = formData.get(key);

  return value instanceof File && value.size > 0 ? value : null;
}

function validateBusinessLogoFile(file: File) {
  if (!file.type.startsWith("image/")) {
    return "Upload a PNG, JPG, WebP, or SVG logo image.";
  }

  if (file.size > 2 * 1024 * 1024) {
    return "Logo file must be 2 MB or smaller.";
  }

  return null;
}
