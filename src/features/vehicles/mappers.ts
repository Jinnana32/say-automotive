import type { TableRow } from "@/types/database";

import type { VehicleDetail, VehicleFormValues, VehicleListItem } from "@/features/vehicles/types";

type VehicleRow = TableRow<"vehicles">;

export function mapVehicleRowToListItem(
  row: VehicleRow,
  customerName: string,
): VehicleListItem {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName,
    make: row.make,
    model: row.model,
    year: row.year,
    plateNumber: row.plate_number,
    vin: row.vin,
    mileage: row.mileage,
    transmission: row.transmission,
    engineSize: row.engine,
    variant: row.variant,
    fuelType: row.fuel_type,
    color: row.color,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapVehicleDetail(row: VehicleRow, customerName: string): VehicleDetail {
  return mapVehicleRowToListItem(row, customerName);
}

export function mapVehicleDetailToFormValues(vehicle: VehicleDetail): VehicleFormValues {
  return {
    vehicleId: vehicle.id,
    customerId: vehicle.customerId,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year ? String(vehicle.year) : "",
    transmission: vehicle.transmission ?? "",
    mileage: vehicle.mileage ? String(vehicle.mileage) : "",
    plateNumber: vehicle.plateNumber ?? "",
    vin: vehicle.vin ?? "",
    engineSize: vehicle.engineSize ?? "",
    variant: vehicle.variant ?? "",
    fuelType: vehicle.fuelType ?? "",
    color: vehicle.color ?? "",
    status: vehicle.status,
  };
}
