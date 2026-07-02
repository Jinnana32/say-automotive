"use client";

import Link from "next/link";
import { useState } from "react";
import { useActionState } from "react";
import { Trash2 } from "lucide-react";

import {
  FieldError,
  FormRequiredFieldsNote,
  FormStatusMessage,
  fieldAriaProps,
  fieldControlClassName,
  fieldErrorId,
  formSelectClassName,
} from "@/components/shared/form-status";
import { AddEntryButton } from "@/components/shared/add-entry-button";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createHistoricalServiceRecordAction } from "@/features/historical-service/actions/create-historical-service-record-action";
import {
  serializeHistoricalServiceItems,
} from "@/features/historical-service/schemas/historical-service-form-schema";
import type { HistoricalServiceFormItem } from "@/features/historical-service/types";
import { createHistoricalServiceItem } from "@/features/historical-service/utils";
import { formatCurrencyNumber, MONEY_INPUT_STEP } from "@/lib/currency";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";

export function HistoricalServiceForm({
  vehicleId,
  vehicleLabel,
  maxServiceDate,
  showSavedMessage = false,
}: {
  vehicleId: string;
  vehicleLabel: string;
  maxServiceDate: string;
  showSavedMessage?: boolean;
}) {
  const [state, formAction] = useActionState(
    createHistoricalServiceRecordAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const [serviceDate, setServiceDate] = useState("");
  const [workPerformed, setWorkPerformed] = useState("");
  const [customerConcern, setCustomerConcern] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [mileageIn, setMileageIn] = useState("");
  const [mileageOut, setMileageOut] = useState("");
  const [items, setItems] = useState<HistoricalServiceFormItem[]>([]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <input type="hidden" name="itemsJson" value={serializeHistoricalServiceItems(items)} />

      {showSavedMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Past service record saved. Add another visit below or return to the vehicle profile.
        </div>
      ) : null}

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Visit details</CardTitle>
          <CardDescription>
            Record what was done on {vehicleLabel}. This creates a completed historical job order for
            service history only — no inventory, billing, or payment workflow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormRequiredFieldsNote />
          <FormStatusMessage message={state.message} />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="serviceDate" required>
                Service date
              </Label>
              <Input
                id="serviceDate"
                name="serviceDate"
                type="date"
                value={serviceDate}
                max={maxServiceDate}
                onChange={(event) => setServiceDate(event.target.value)}
                className={fieldControlClassName(state.fieldErrors, "serviceDate")}
                {...fieldAriaProps({
                  errors: state.fieldErrors,
                  name: "serviceDate",
                  required: true,
                  errorId: fieldErrorId("serviceDate"),
                })}
              />
              <FieldError
                errors={state.fieldErrors}
                name="serviceDate"
                id={fieldErrorId("serviceDate")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workPerformed">Work performed</Label>
            <Textarea
              id="workPerformed"
              name="workPerformed"
              value={workPerformed}
              onChange={(event) => setWorkPerformed(event.target.value)}
              rows={4}
              placeholder="Describe the service visit, repairs, or maintenance performed."
              className={fieldControlClassName(state.fieldErrors, "workPerformed")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "workPerformed",
                errorId: fieldErrorId("workPerformed"),
              })}
            />
            <FieldError
              errors={state.fieldErrors}
              name="workPerformed"
              id={fieldErrorId("workPerformed")}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerConcern">Customer concern</Label>
              <Textarea
                id="customerConcern"
                name="customerConcern"
                value={customerConcern}
                onChange={(event) => setCustomerConcern(event.target.value)}
                rows={3}
                className={fieldControlClassName(state.fieldErrors, "customerConcern")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Textarea
                id="diagnosis"
                name="diagnosis"
                value={diagnosis}
                onChange={(event) => setDiagnosis(event.target.value)}
                rows={3}
                className={fieldControlClassName(state.fieldErrors, "diagnosis")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inspectionNotes">Inspection notes</Label>
            <Textarea
              id="inspectionNotes"
              name="inspectionNotes"
              value={inspectionNotes}
              onChange={(event) => setInspectionNotes(event.target.value)}
              rows={3}
              className={fieldControlClassName(state.fieldErrors, "inspectionNotes")}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mileageIn">Mileage in (km)</Label>
              <Input
                id="mileageIn"
                name="mileageIn"
                inputMode="numeric"
                value={mileageIn}
                onChange={(event) => setMileageIn(event.target.value)}
                className={fieldControlClassName(state.fieldErrors, "mileageIn")}
              />
              <FieldError errors={state.fieldErrors} name="mileageIn" id={fieldErrorId("mileageIn")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mileageOut">Mileage out (km)</Label>
              <Input
                id="mileageOut"
                name="mileageOut"
                inputMode="numeric"
                value={mileageOut}
                onChange={(event) => setMileageOut(event.target.value)}
                className={fieldControlClassName(state.fieldErrors, "mileageOut")}
              />
              <FieldError errors={state.fieldErrors} name="mileageOut" id={fieldErrorId("mileageOut")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>Line items</CardTitle>
            <CardDescription>
              Optional labor or service lines for reference. Amounts are stored for history only.
            </CardDescription>
          </div>
          <AddEntryButton
            type="button"
            onClick={() => setItems((current) => [...current, createHistoricalServiceItem()])}
          >
            Add line
          </AddEntryButton>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No line items yet. Use work performed above, or add labor/service lines.
            </p>
          ) : (
            items.map((item, index) => (
              <div
                key={item.key}
                className="grid gap-4 rounded-xl border border-border/70 p-4 md:grid-cols-[140px_1fr_100px_120px_auto]"
              >
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select
                    value={item.itemType}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((entry) =>
                          entry.key === item.key
                            ? {
                                ...entry,
                                itemType: event.target.value as HistoricalServiceFormItem["itemType"],
                              }
                            : entry,
                        ),
                      )
                    }
                    className={formSelectClassName(state.fieldErrors, `items.${index}.itemType`)}
                  >
                    <option value="labor">Labor</option>
                    <option value="service">Service</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={item.description}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((entry) =>
                          entry.key === item.key
                            ? { ...entry, description: event.target.value }
                            : entry,
                        ),
                      )
                    }
                    placeholder="e.g. Change oil and filter"
                  />
                  <FieldError
                    errors={state.fieldErrors}
                    name={`items.${index}.description`}
                    id={fieldErrorId(`items.${index}.description`)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Qty</Label>
                  <Input
                    inputMode="decimal"
                    value={item.quantity}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((entry) =>
                          entry.key === item.key
                            ? { ...entry, quantity: event.target.value }
                            : entry,
                        ),
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit price</Label>
                  <Input
                    inputMode="decimal"
                    step={MONEY_INPUT_STEP}
                    value={item.unitPrice}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((entry) =>
                          entry.key === item.key
                            ? { ...entry, unitPrice: event.target.value }
                            : entry,
                        ),
                      )
                    }
                  />
                </div>
                <div className="flex items-end justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove line item ${index + 1}`}
                    onClick={() =>
                      setItems((current) => current.filter((entry) => entry.key !== item.key))
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="md:col-span-5 text-sm text-muted-foreground">
                  Line total:{" "}
                  {formatCurrencyNumber(
                    Number(item.quantity || 0) * Number(item.unitPrice || 0),
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>Save past service</SubmitButton>
        <SubmitButton name="addAnother" value="true" variant="outline">
          Save and add another
        </SubmitButton>
        <Button asChild variant="ghost">
          <Link href={`/vehicles/${vehicleId}`}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
