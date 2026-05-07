export type VehicleStatus = "active" | "inactive";
export type VehicleLookupType = "transmission" | "fuel_type" | "color";

export type VehicleListItem = {
  id: string;
  customerId: string;
  customerName: string;
  make: string;
  model: string;
  year: number | null;
  plateNumber: string | null;
  vin: string | null;
  mileage: number | null;
  transmission: string | null;
  engineSize: string | null;
  variant: string | null;
  fuelType: string | null;
  color: string | null;
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
};

export type VehicleDetail = VehicleListItem;

export type VehicleFormValues = {
  vehicleId?: string;
  customerId: string;
  make: string;
  model: string;
  year: string;
  transmission: string;
  mileage: string;
  plateNumber: string;
  vin: string;
  engineSize: string;
  variant: string;
  fuelType: string;
  color: string;
  status: VehicleStatus;
};

export type VehicleMakeItem = {
  id: string;
  name: string;
  externalSource: string | null;
  externalSourceId: string | null;
  isSeeded: boolean;
  sortOrder: number;
  status: VehicleStatus;
  modelCount: number;
};

export type VehicleModelItem = {
  id: string;
  makeId: string;
  makeName: string;
  name: string;
  externalSource: string | null;
  externalSourceId: string | null;
  isSeeded: boolean;
  sortOrder: number;
  status: VehicleStatus;
};

export type VehicleLookupOptionItem = {
  id: string;
  lookupType: VehicleLookupType;
  label: string;
  sortOrder: number;
  status: VehicleStatus;
};

export type VehicleLookupOptionGroup = {
  lookupType: VehicleLookupType;
  label: string;
  items: VehicleLookupOptionItem[];
};

export type VehicleFormLookupData = {
  makes: Array<{ id: string; name: string }>;
  models: Array<{ id: string; makeId: string; makeName: string; name: string }>;
  transmissions: string[];
  fuelTypes: string[];
  colors: string[];
};

export type VehicleLookupPageData = {
  summary: {
    activeMakes: number;
    activeModels: number;
    transmissionOptions: number;
    fuelTypeOptions: number;
    colorOptions: number;
  };
  makes: VehicleMakeItem[];
  models: VehicleModelItem[];
  optionGroups: VehicleLookupOptionGroup[];
};
