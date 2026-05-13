"use client";

import { Pencil, Trash2 } from "lucide-react";

import {
  TableRowActionsMenu,
  TableRowActionsMenuConfirm,
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
  return (
    <TableRowActionsMenu label={`Vehicle actions for ${vehicleLabel}`}>
      <TableRowActionsMenuLink href={`/vehicles/${vehicleId}/edit`} label="Edit vehicle" icon={Pencil} />
      <TableRowActionsMenuConfirm
        label="Delete vehicle"
        title={`Delete ${vehicleLabel}?`}
        description="This vehicle will be removed permanently if it is not already used in workshop records."
        confirmLabel="Delete vehicle"
        cancelLabel="Keep vehicle"
        action={deleteVehicleAction}
        fields={[{ name: "vehicleId", value: vehicleId }]}
        icon={Trash2}
      />
    </TableRowActionsMenu>
  );
}
