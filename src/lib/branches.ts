import { cache } from "react";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export const getDefaultBranch = cache(async () => {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("branches")
    .select("id, code, name")
    .eq("is_default", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Default branch is not configured.");
  }

  return data;
});
