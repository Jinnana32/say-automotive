"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { IconActionButton } from "@/components/shared/icon-action";
import { FieldError, FormStatusMessage } from "@/components/shared/form-status";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  deletePayrollAdjustmentAction,
  upsertPayrollAdjustmentAction,
} from "@/features/payroll/actions/payroll-actions";
import type { PayrollPeriodItemSummary } from "@/features/payroll/types";
import { INITIAL_PAYROLL_FORM_ACTION_STATE } from "@/features/payroll/utils";
import { formatCurrency } from "@/lib/currency";
import { useFormValues } from "@/lib/use-form-values";

export function PayrollPeriodItemAdjustmentsDialog({
  item,
}: {
  item: PayrollPeriodItemSummary;
}) {
  const router = useRouter();
  const [dialogInstance, setDialogInstance] = useState(0);
  const [state, formAction] = useActionState(
    upsertPayrollAdjustmentAction,
    INITIAL_PAYROLL_FORM_ACTION_STATE,
  );
  const { values, updateFormValue } = useFormValues<{
    payrollPeriodId: string;
    payrollPeriodItemId: string;
    adjustmentType: "addition" | "deduction";
    label: string;
    amount: string;
    notes: string;
  }>({
    payrollPeriodId: item.payrollPeriodId,
    payrollPeriodItemId: item.id,
    adjustmentType: "deduction",
    label: "",
    amount: "",
    notes: "",
  });

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    updateFormValue("adjustmentType", "deduction");
    updateFormValue("label", "");
    updateFormValue("amount", "");
    updateFormValue("notes", "");
    router.refresh();
  }, [router, state.status, updateFormValue]);

  return (
    <ModalDialog
      title="Adjust payroll row"
      description={`Review computed payout details for ${item.fullName} and add manual additions or deductions before printing.`}
      size="lg"
      trigger={({ openDialog }) => (
        <IconActionButton
          label={`Adjust payroll row for ${item.fullName}`}
          icon={Pencil}
          onClick={() => {
            setDialogInstance((currentValue) => currentValue + 1);
            openDialog();
          }}
        />
      )}
    >
      {({ closeDialog }) => (
        <div key={dialogInstance} className="space-y-6">
          <section className="grid gap-4 rounded-2xl border border-border/70 bg-muted/15 px-4 py-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Computed payout</p>
              <p className="text-2xl font-semibold text-foreground">{formatCurrency(item.computedPay)}</p>
              <p className="text-sm text-muted-foreground">
                Base {formatCurrency(item.basePay)}
                {item.lateDeductionAmount > 0 ? ` · Late -${formatCurrency(item.lateDeductionAmount)}` : ""}
                {item.holidayPremiumPay > 0 ? ` · Holiday +${formatCurrency(item.holidayPremiumPay)}` : ""}
                {item.overtimePay > 0 ? ` · OT +${formatCurrency(item.overtimePay)}` : ""}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Current net payout</p>
              <p className="text-2xl font-semibold text-foreground">{formatCurrency(item.netPay)}</p>
              <p className="text-sm text-muted-foreground">
                Additions {formatCurrency(item.manualAdditionsTotal)} · Deductions {formatCurrency(item.manualDeductionsTotal)}
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-foreground">Manual adjustments</h3>
                <p className="text-sm text-muted-foreground">
                  Add SSS, Pag-IBIG, bonuses, cash advances, or one-off corrections here.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {item.adjustments.length > 0 ? (
                item.adjustments.map((adjustment) => (
                  <div
                    key={adjustment.id}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 px-4 py-3"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{adjustment.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {adjustment.adjustmentType === "addition" ? "Addition" : "Deduction"} · {formatCurrency(adjustment.amount)}
                      </p>
                      {adjustment.notes ? (
                        <p className="text-sm text-muted-foreground">{adjustment.notes}</p>
                      ) : null}
                    </div>
                    <ConfirmActionDialog
                      title="Delete payroll adjustment"
                      description={`Remove ${adjustment.label} from ${item.fullName}'s payroll row?`}
                      action={deletePayrollAdjustmentAction}
                      fields={[
                        { name: "adjustmentId", value: adjustment.id },
                        { name: "payrollPeriodId", value: item.payrollPeriodId },
                      ]}
                      confirmLabel="Delete adjustment"
                      trigger={({ openDialog }) => (
                        <IconActionButton
                          label={`Delete ${adjustment.label}`}
                          icon={Trash2}
                          tone="destructive"
                          onClick={openDialog}
                        />
                      )}
                    />
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 px-4 py-5 text-sm text-muted-foreground">
                  No manual adjustments yet.
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-border/70 bg-muted/10 px-4 py-4">
            <div>
              <h3 className="font-semibold text-foreground">Add adjustment</h3>
              <p className="text-sm text-muted-foreground">
                New adjustments immediately update the payroll cut totals after save.
              </p>
            </div>

            <form action={formAction} className="space-y-4">
              <input type="hidden" name="payrollPeriodId" value={item.payrollPeriodId} />
              <input type="hidden" name="payrollPeriodItemId" value={item.id} />

              <FormStatusMessage message={state.message} />

              <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)_160px]">
                <div className="space-y-2">
                  <Label htmlFor={`adjustmentType-${item.id}`} required>Type</Label>
                  <select
                    id={`adjustmentType-${item.id}`}
                    name="adjustmentType"
                    value={values.adjustmentType}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onChange={(event) =>
                      updateFormValue("adjustmentType", event.target.value as "addition" | "deduction")
                    }
                  >
                    <option value="deduction">Deduction</option>
                    <option value="addition">Addition</option>
                  </select>
                  <FieldError errors={state.fieldErrors} name="adjustmentType" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`adjustmentLabel-${item.id}`} required>Label</Label>
                  <Input
                    id={`adjustmentLabel-${item.id}`}
                    name="label"
                    value={values.label}
                    onChange={(event) => updateFormValue("label", event.target.value)}
                    placeholder="SSS, Pag-IBIG, bonus, cash advance"
                  />
                  <FieldError errors={state.fieldErrors} name="label" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`adjustmentAmount-${item.id}`} required>Amount</Label>
                  <Input
                    id={`adjustmentAmount-${item.id}`}
                    name="amount"
                    inputMode="decimal"
                    value={values.amount}
                    onChange={(event) => updateFormValue("amount", event.target.value)}
                    placeholder="0.00"
                  />
                  <FieldError errors={state.fieldErrors} name="amount" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`adjustmentNotes-${item.id}`} optional>Notes</Label>
                <Textarea
                  id={`adjustmentNotes-${item.id}`}
                  name="notes"
                  value={values.notes}
                  onChange={(event) => updateFormValue("notes", event.target.value)}
                  placeholder="Optional reason or supporting note"
                />
                <FieldError errors={state.fieldErrors} name="notes" />
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Close
                </Button>
                <SubmitButton pendingLabel="Saving adjustment...">Save adjustment</SubmitButton>
              </div>
            </form>
          </section>
        </div>
      )}
    </ModalDialog>
  );
}
