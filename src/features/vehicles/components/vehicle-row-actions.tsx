"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import {
  TableRowActionsMenu,
  TableRowActionsMenuButton,
  TableRowActionsMenuLink,
} from "@/components/shared/table-row-actions-menu";
import { deleteVehicleAction } from "@/features/vehicles/actions/vehicle-actions";

export function VehicleRowActions({
  vehicleId,
  vehicleLabel,
}: {
  vehicleId: string;
  vehicleLabel: string;
}) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <>
      <TableRowActionsMenu label={`Vehicle actions for ${vehicleLabel}`}>
        <TableRowActionsMenuLink href={`/vehicles/${vehicleId}/edit`} label="Edit vehicle" icon={Pencil} />
        <TableRowActionsMenuButton
          label="Delete vehicle"
          icon={Trash2}
          tone="destructive"
          onSelect={() => setIsDeleteOpen(true)}
        />
      </TableRowActionsMenu>
      <ConfirmActionDialog
        title={`Delete ${vehicleLabel}?`}
        description="This vehicle will be removed permanently if it is not already used in workshop records."
        confirmLabel="Delete vehicle"
        cancelLabel="Keep vehicle"
        action={deleteVehicleAction}
        fields={[{ name: "vehicleId", value: vehicleId }]}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </>
  );
}
