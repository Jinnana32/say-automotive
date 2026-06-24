"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  FieldError,
  FormStatusMessage,
  fieldAriaProps,
  fieldControlClassName,
  fieldErrorId,
} from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { reviewDtrAmendmentAction } from "@/features/attendance/actions/mechanic-portal-actions";
import type { DtrAmendmentReviewFormValues, DtrAmendmentSummary } from "@/features/attendance/types";
import { INITIAL_TIMEKEEPING_ACTION_STATE } from "@/features/attendance/utils";
import { formatDateTime } from "@/lib/dates";
import { useFormValues } from "@/lib/use-form-values";

export function DtrAmendmentReviewForm({
  amendment,
  closeDialog,
}: {
  amendment: DtrAmendmentSummary;
  closeDialog: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    reviewDtrAmendmentAction,
    INITIAL_TIMEKEEPING_ACTION_STATE,
  );
  const { values, updateFormValue } = useFormValues<DtrAmendmentReviewFormValues>({
    amendmentId: amendment.id,
    decision: "approved",
    finalTime: amendment.finalTimestamp
      ? new Date(amendment.finalTimestamp).toLocaleTimeString("en-CA", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Asia/Manila",
        })
      : new Date(amendment.requestedTimestamp).toLocaleTimeString("en-CA", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Asia/Manila",
        }),
    adminNote: amendment.adminNote ?? "",
  });

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    closeDialog();
    router.refresh();
  }, [closeDialog, router, state.status]);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="amendmentId" value={values.amendmentId} />

      <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">{amendment.staffName}</p>
        <p>Requested {formatDateTime(amendment.requestedTimestamp)}</p>
        <p className="mt-2 text-foreground">{amendment.reason}</p>
      </div>

      <FormStatusMessage message={state.status === "error" ? state.message : undefined} />

      <div className="space-y-2">
        <Label
          htmlFor={`reviewFinalTime-${amendment.id}`}
          required={values.decision === "approved"}
        >
          Approved final time
        </Label>
        <Input
          id={`reviewFinalTime-${amendment.id}`}
          type="time"
          name="finalTime"
          value={values.finalTime}
          onChange={(event) => updateFormValue("finalTime", event.target.value)}
          disabled={values.decision === "rejected"}
          className={fieldControlClassName(state.fieldErrors, "finalTime")}
          {...fieldAriaProps({
            errors: state.fieldErrors,
            name: "finalTime",
            required: values.decision === "approved",
            errorId: fieldErrorId("finalTime"),
          })}
        />
        <FieldError errors={state.fieldErrors} name="finalTime" id={fieldErrorId("finalTime")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`reviewAdminNote-${amendment.id}`}>Admin note</Label>
        <Textarea
          id={`reviewAdminNote-${amendment.id}`}
          name="adminNote"
          value={values.adminNote}
          className={fieldControlClassName(state.fieldErrors, "adminNote")}
          {...fieldAriaProps({
            errors: state.fieldErrors,
            name: "adminNote",
            required: false,
            errorId: fieldErrorId("adminNote"),
          })}
          onChange={(event) => updateFormValue("adminNote", event.target.value)}
          placeholder="Optional note for the mechanic or payroll reviewer."
        />
        <FieldError errors={state.fieldErrors} name="adminNote" id={fieldErrorId("adminNote")} />
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={closeDialog}>
          Cancel
        </Button>
        <SubmitButton
          name="decision"
          value="rejected"
          variant="outline"
          pendingLabel="Saving..."
          onClick={() => updateFormValue("decision", "rejected")}
        >
          Reject
        </SubmitButton>
        <SubmitButton
          name="decision"
          value="approved"
          pendingLabel="Approving..."
          onClick={() => updateFormValue("decision", "approved")}
        >
          Approve amendment
        </SubmitButton>
      </div>
    </form>
  );
}
