"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useRouter } from "next/navigation";

import { FieldError, FormStatusMessage } from "@/components/shared/form-status";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { SubmitButton } from "@/components/shared/submit-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { importPhilippineHolidaySuggestionsAction } from "@/features/attendance/actions/timekeeping-actions";
import {
  buildPhilippineHolidaySuggestionRows,
  formatPhilippineHolidaySuggestionPayTreatmentLabel,
  formatPhilippineHolidaySuggestionTypeLabel,
  getPhilippineHolidayImportYears,
} from "@/features/attendance/philippine-holidays";
import type {
  BranchHolidayPayTreatment,
  BranchHolidaySummary,
  PhilippineHolidaySuggestionRow,
} from "@/features/attendance/types";
import {
  BRANCH_HOLIDAY_PAY_TREATMENT_OPTIONS,
  INITIAL_TIMEKEEPING_ACTION_STATE,
} from "@/features/attendance/utils";
import { formatDate, getBusinessNow } from "@/lib/dates";

export function PhilippineHolidayImportDialog({
  existingHolidays,
  triggerLabel = "Import PH Holidays",
}: {
  existingHolidays: BranchHolidaySummary[];
  triggerLabel?: string;
}) {
  const [dialogInstance, setDialogInstance] = useState(0);
  const currentYear = getBusinessNow().year;

  return (
    <ModalDialog
      title="Import Philippine Official Holidays"
      description="Select official Philippine holidays to add to this branch calendar. Review each date before importing and update pay treatment where needed."
      size="xl"
      trigger={({ openDialog }) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setDialogInstance((currentValue) => currentValue + 1);
            openDialog();
          }}
        >
          <Download className="mr-2 size-4" />
          {triggerLabel}
        </Button>
      )}
    >
      {({ closeDialog }) => (
        <PhilippineHolidayImportForm
          key={dialogInstance}
          closeDialog={closeDialog}
          currentYear={currentYear}
          existingHolidays={existingHolidays}
        />
      )}
    </ModalDialog>
  );
}

function PhilippineHolidayImportForm({
  closeDialog,
  currentYear,
  existingHolidays,
}: {
  closeDialog: () => void;
  currentYear: number;
  existingHolidays: BranchHolidaySummary[];
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    importPhilippineHolidaySuggestionsAction,
    INITIAL_TIMEKEEPING_ACTION_STATE,
  );
  const yearOptions = useMemo(
    () => getPhilippineHolidayImportYears(currentYear),
    [currentYear],
  );
  const initialYear = yearOptions.includes(currentYear) ? currentYear : yearOptions[0] ?? currentYear;
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const rows = useMemo(
    () => buildPhilippineHolidaySuggestionRows({
      year: selectedYear,
      existingHolidays,
    }),
    [existingHolidays, selectedYear],
  );
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<string[]>(() =>
    rows.filter((row) => row.selectedByDefault).map((row) => row.id),
  );
  const [payTreatmentOverrides, setPayTreatmentOverrides] = useState<
    Record<string, BranchHolidayPayTreatment>
  >(() => buildInitialPayTreatmentMap(rows));

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    closeDialog();
    router.refresh();
  }, [closeDialog, router, state.status]);

  const selectedSuggestionsPayload = JSON.stringify(
    selectedSuggestionIds.map((suggestionId) => ({
      suggestionId,
      payTreatment: payTreatmentOverrides[suggestionId],
    })),
  );
  const selectableRowCount = rows.filter((row) => row.selectable).length;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="year" value={selectedYear} />
      <input type="hidden" name="selectedSuggestions" value={selectedSuggestionsPayload} />

      <FormStatusMessage message={state.status === "error" ? state.message : undefined} />

      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="space-y-2">
          <Label htmlFor="philippineHolidayYear" required>Year</Label>
          <NativeSelect
            id="philippineHolidayYear"
            value={String(selectedYear)}
            onChange={(event) => {
              const nextYear = Number(event.target.value);
              const nextRows = buildPhilippineHolidaySuggestionRows({
                year: nextYear,
                existingHolidays,
              });

              setSelectedYear(nextYear);
              setSelectedSuggestionIds(
                nextRows.filter((row) => row.selectedByDefault).map((row) => row.id),
              );
              setPayTreatmentOverrides(buildInitialPayTreatmentMap(nextRows));
            }}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          <p>
            Official holidays are suggested for convenience. Please review before importing because government holiday proclamations can change.
          </p>
          <p className="mt-2">
            Eid holidays are usually confirmed by separate proclamation and may be added later once official dates are declared.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/10 px-5 py-10 text-center text-sm text-muted-foreground">
          No official Philippine holiday suggestions are stored for {selectedYear} yet.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
            <p>
              {selectedSuggestionIds.length} selected
              {selectableRowCount > 0 ? ` out of ${selectableRowCount} importable suggestion${selectableRowCount === 1 ? "" : "s"}` : ""}
            </p>
            <p>Special working days stay unselected because they do not create non-working branch calendar dates.</p>
          </div>

          <div className="overflow-hidden rounded-[1.25rem] border border-border/70">
            <div className="overflow-x-auto">
              <Table className="min-w-[980px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Select</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Holiday</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Default pay treatment</TableHead>
                    <TableHead>Already added?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const checked = selectedSuggestionIds.includes(row.id);
                    const currentPayTreatment = payTreatmentOverrides[row.id];

                    return (
                      <TableRow key={row.id}>
                        <TableCell className="align-top">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!row.selectable}
                            className="mt-1 size-4 rounded border-slate-300 text-[#0B1F4D] focus:ring-[#0B1F4D]/25 disabled:cursor-not-allowed disabled:opacity-50"
                            onChange={(event) =>
                              setSelectedSuggestionIds((currentIds) =>
                                event.target.checked
                                  ? [...currentIds, row.id]
                                  : currentIds.filter((id) => id !== row.id),
                              )
                            }
                            aria-label={`Select ${row.label}`}
                          />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(row.holidayDate)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{row.label}</p>
                            {row.notes?.trim() ? (
                              <p className="text-xs text-muted-foreground">{row.notes}</p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge tone={row.officialType === "regular_holiday" ? "success" : "neutral"}>
                            {formatPhilippineHolidaySuggestionTypeLabel(row.officialType)}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="min-w-[220px]">
                          {row.selectable && currentPayTreatment ? (
                            <NativeSelect
                              value={currentPayTreatment}
                              onChange={(event) =>
                                setPayTreatmentOverrides((currentValues) => ({
                                  ...currentValues,
                                  [row.id]: event.target.value as BranchHolidayPayTreatment,
                                }))
                              }
                            >
                              {BRANCH_HOLIDAY_PAY_TREATMENT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </NativeSelect>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {formatPhilippineHolidaySuggestionPayTreatmentLabel(row)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.alreadyAdded ? (
                            <StatusBadge tone="neutral">Already added</StatusBadge>
                          ) : row.selectable ? (
                            <StatusBadge tone="success">Ready to import</StatusBadge>
                          ) : (
                            <StatusBadge tone="warning">Review only</StatusBadge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      <FieldError errors={state.fieldErrors} name="selections" />

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={closeDialog}>
          Cancel
        </Button>
        <SubmitButton
          pendingLabel="Importing..."
          disabled={rows.length === 0 || selectedSuggestionIds.length === 0}
        >
          Import selected holidays
        </SubmitButton>
      </div>
    </form>
  );
}

function buildInitialPayTreatmentMap(rows: PhilippineHolidaySuggestionRow[]) {
  return Object.fromEntries(
    rows.flatMap((row) =>
      row.defaultPayTreatment
        ? [[row.id, row.defaultPayTreatment as BranchHolidayPayTreatment]]
        : [],
    ),
  ) as Record<string, BranchHolidayPayTreatment>;
}
