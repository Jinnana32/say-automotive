"use server";

import { redirect } from "next/navigation";

import {
  INITIAL_FORM_ACTION_STATE,
  toFormActionState,
  type FormActionState,
} from "@/lib/forms";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  parseSignInFormData,
  signInSchema,
} from "@/features/auth/schemas/sign-in-schema";

export async function signInAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = signInSchema.safeParse(parseSignInFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  const signedInUserId = data.user?.id;

  if (!signedInUserId) {
    redirect("/dashboard");
  }

  const { data: staff, error: staffError } = await supabase
    .from("staff")
    .select("role")
    .eq("linked_user_id", signedInUserId)
    .maybeSingle();

  if (staffError) {
    return {
      status: "error",
      message: staffError.message,
    };
  }

  redirect(staff?.role === "mechanic" ? "/portal/attendance" : "/dashboard");
}

export async function signOutAction() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
