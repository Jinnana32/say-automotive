"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

import {
  FieldError,
  FormStatusMessage,
  fieldAriaProps,
  fieldControlClassName,
  fieldErrorId,
} from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { useFormValues } from "@/lib/use-form-values";
import { signInAction } from "@/features/auth/actions/auth-actions";

export function LoginForm() {
  const [state, formAction] = useActionState(signInAction, INITIAL_FORM_ACTION_STATE);
  const [showPassword, setShowPassword] = useState(false);
  const { values, updateFormValue } = useFormValues({
    email: "",
    password: "",
  });

  return (
    <form action={formAction} className="grid gap-5">
      <FormStatusMessage message={state.message} />

      <div className="grid gap-2.5">
        <Label
          htmlFor="email"
          required
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
        >
          Email
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="Enter your email"
            value={values.email}
            onChange={(event) => updateFormValue("email", event.target.value)}
            className={fieldControlClassName(
              state.fieldErrors,
              "email",
              "h-12 rounded-xl border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-brand-red focus-visible:ring-brand-red/20",
            )}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "email",
              required: true,
              errorId: fieldErrorId("email"),
            })}
          />
        </div>
        <FieldError errors={state.fieldErrors} name="email" id={fieldErrorId("email")} />
      </div>

      <div className="grid gap-2.5">
        <Label
          htmlFor="password"
          required
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
        >
          Password
        </Label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={values.password}
            onChange={(event) => updateFormValue("password", event.target.value)}
            className={fieldControlClassName(
              state.fieldErrors,
              "password",
              "h-12 rounded-xl border-slate-300 bg-white pl-11 pr-12 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-brand-red focus-visible:ring-brand-red/20",
            )}
            {...fieldAriaProps({
              errors: state.fieldErrors,
              name: "password",
              required: true,
              errorId: fieldErrorId("password"),
            })}
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-3 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/20"
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <FieldError errors={state.fieldErrors} name="password" id={fieldErrorId("password")} />
      </div>

      <SubmitButton
        pendingLabel="Logging in..."
        variant="yellowPrimary"
        className="mt-1 h-12 w-full rounded-xl text-sm font-semibold uppercase tracking-[0.18em]"
      >
        Log in
      </SubmitButton>
    </form>
  );
}
