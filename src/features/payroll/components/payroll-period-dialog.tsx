"use client";

import { useState } from "react";
import { CalendarRange } from "lucide-react";

import { ModalDialog } from "@/components/shared/modal-dialog";
import { Button } from "@/components/ui/button";
import { PayrollPeriodForm } from "@/features/payroll/components/payroll-period-form";
import { buildDefaultPayrollPeriodFormValues } from "@/features/payroll/utils";

export function PayrollPeriodDialog() {
  const [dialogInstance, setDialogInstance] = useState(0);

  return (
    <ModalDialog
      title="New payroll period"
      description="Create the coverage window that attendance and compensation readiness will be reviewed against."
      size="lg"
      trigger={({ openDialog }) => (
        <Button
          type="button"
          onClick={() => {
            setDialogInstance((currentValue) => currentValue + 1);
            openDialog();
          }}
        >
          <CalendarRange className="mr-2 size-4" />
          New payroll period
        </Button>
      )}
    >
      {({ closeDialog }) => (
        <PayrollPeriodForm
          key={dialogInstance}
          closeDialog={closeDialog}
          initialValues={buildDefaultPayrollPeriodFormValues()}
        />
      )}
    </ModalDialog>
  );
}
