"use client";

import { useActionState } from "react";

import { FieldError, FormStatusMessage } from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { useFormValues } from "@/lib/use-form-values";
import { signInAction } from "@/features/auth/actions/auth-actions";

export function LoginForm() {
  const [state, formAction] = useActionState(signInAction, INITIAL_FORM_ACTION_STATE);
  const { values, updateFormValue } = useFormValues({
    email: "",
    password: "",
  });

  return (
    <form action={formAction} className="grid gap-5">
      <FormStatusMessage message={state.message} />

      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" value={values.email} onChange={(event) => updateFormValue("email", event.target.value)} />
        <FieldError errors={state.fieldErrors} name="email" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" value={values.password} onChange={(event) => updateFormValue("password", event.target.value)} />
        <FieldError errors={state.fieldErrors} name="password" />
      </div>

      <SubmitButton pendingLabel="Signing in..." className="w-full">
        Sign in
      </SubmitButton>
    </form>
  );
}
