import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database";

export async function writeAuditLog(
  supabase: SupabaseClient<Database>,
  params: {
    action: string;
    entityType: string;
    entityId?: string | null;
    beforeData?: Record<string, unknown> | null;
    afterData?: Record<string, unknown> | null;
    userId?: string | null;
  },
) {
  const payload: Database["public"]["Tables"]["audit_logs"]["Insert"] = {
    user_id: params.userId ?? null,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    before_data: (params.beforeData ?? null) as Json | null,
    after_data: (params.afterData ?? null) as Json | null,
  };

  const { error } = await supabase.from("audit_logs").insert(payload);

  if (error) {
    console.error("Failed to write audit log", error.message);
  }
}
