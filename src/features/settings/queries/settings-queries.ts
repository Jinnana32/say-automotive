import type { TableRow } from "@/types/database";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { getDefaultBranch } from "@/lib/branches";
import {
  mapAuditLogRowToEntry,
  mapBusinessSettingsRowToValues,
  mapDocumentSequenceRowToItem,
} from "@/features/settings/mappers";
import type { SettingsPageData } from "@/features/settings/types";

type BusinessSettingsRow = TableRow<"business_settings">;
type DocumentSequenceRow = TableRow<"document_sequences">;
type AuditLogRow = Pick<TableRow<"audit_logs">, "id" | "action" | "entity_type" | "created_at">;

export async function getSettingsPageData(): Promise<SettingsPageData> {
  const branch = await getDefaultBranch();
  const { supabase } = await getAuthorizedSupabaseServerClient("settings:read");
  const [
    { data: settings, error: settingsError },
    { data: documentSequences, error: documentSequenceError },
    { data: auditLogs, error: auditLogsError },
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
    supabase
      .from("audit_logs")
      .select("id, action, entity_type, created_at")
      .in("entity_type", ["business_settings", "document_sequence"])
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  if (documentSequenceError) {
    throw new Error(documentSequenceError.message);
  }

  if (auditLogsError) {
    throw new Error(auditLogsError.message);
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
    recentAuditEntries: ((auditLogs ?? []) as AuditLogRow[]).map(mapAuditLogRowToEntry),
  };
}
