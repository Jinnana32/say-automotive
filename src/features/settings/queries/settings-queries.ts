import type { TableRow } from "@/types/database";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { getDefaultBranch } from "@/lib/branches";
import { buildBusinessLogoUrl } from "@/lib/storage";
import {
  mapBusinessSettingsRowToValues,
  mapDocumentSequenceRowToItem,
} from "@/features/settings/mappers";
import type { BusinessBranding, SettingsPageData } from "@/features/settings/types";

type BusinessSettingsRow = TableRow<"business_settings">;
type DocumentSequenceRow = TableRow<"document_sequences">;

export async function getBusinessBranding(branchId?: string | null): Promise<BusinessBranding> {
  const branch = branchId ? { id: branchId } : await getDefaultBranch();
  const { supabase } = await getAuthorizedSupabaseServerClient("settings:read");
  const { data, error } = await supabase
    .from("business_settings")
    .select("business_name, business_logo_path, updated_at")
    .eq("branch_id", branch.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Business settings are not configured for the default branch.");
  }

  return {
    businessName: data.business_name,
    businessLogoUrl: buildBusinessLogoUrl(data.business_logo_path, data.updated_at),
  };
}

export async function getSettingsPageData(): Promise<SettingsPageData> {
  const branch = await getDefaultBranch();
  const { supabase } = await getAuthorizedSupabaseServerClient("settings:read");
  const [
    { data: settings, error: settingsError },
    { data: documentSequences, error: documentSequenceError },
  ] = await Promise.all([
    supabase
      .from("business_settings")
      .select("*")
      .eq("branch_id", branch.id)
      .maybeSingle(),
    supabase
      .from("document_sequences")
      .select("*")
      .in("key", ["quotation", "job_order", "invoice", "sale"])
      .order("key", { ascending: true }),
  ]);

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  if (documentSequenceError) {
    throw new Error(documentSequenceError.message);
  }

  if (!settings) {
    throw new Error("Business settings are not configured for the default branch.");
  }

  return {
    branchName: branch.name,
    settings: mapBusinessSettingsRowToValues(settings as BusinessSettingsRow),
    documentSequences: ((documentSequences ?? []) as DocumentSequenceRow[]).map(
      mapDocumentSequenceRowToItem,
    ),
  };
}
