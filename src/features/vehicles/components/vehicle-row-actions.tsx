"use client";

import { Pencil, Trash2 } from "lucide-react";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { IconActionButton, IconActionLink } from "@/components/shared/icon-action";
import { deleteVehicleAction } from "@/features/vehicles/actions/vehicle-actions";

export function VehicleRowActions({
  vehicleId,
  vehicleLabel,
}: {
  vehicleId: string;
  vehicleLabel: string;
}) {
  return (
    <div className="flex justify-end gap-1">
      <IconActionLink
        href={`/vehicles/${vehicleId}/edit`}
        label={`Edit ${vehicleLabel}`}
        icon={Pencil}
      />
      <ConfirmActionDialog
        title={`Delete ${vehicleLabel}?`}
        description="This vehicle will be removed permanently if it is not already used in workshop records."
        confirmLabel="Delete vehicle"
        cancelLabel="Keep vehicle"
        action={deleteVehicleAction}
        fields={[{ name: "vehicleId", value: vehicleId }]}
        trigger={({ openDialog }) => (
          <IconActionButton
            type="button"
            label={`Delete ${vehicleLabel}`}
            icon={Trash2}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={openDialog}
          />
        )}
      />
    </div>
  );
}
