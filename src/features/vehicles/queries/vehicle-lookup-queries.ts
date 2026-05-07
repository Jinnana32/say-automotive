import type { TableRow } from "@/types/database";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import type {
  VehicleFormLookupData,
  VehicleLookupOptionGroup,
  VehicleLookupPageData,
  VehicleLookupType,
  VehicleMakeItem,
  VehicleModelItem,
} from "@/features/vehicles/types";

type VehicleMakeRow = TableRow<"vehicle_makes">;
type VehicleModelRow = TableRow<"vehicle_models">;
type VehicleLookupOptionRow = TableRow<"vehicle_lookup_options">;

const LOOKUP_LABELS: Record<VehicleLookupType, string> = {
  transmission: "Transmission options",
  fuel_type: "Fuel type options",
  color: "Color options",
};

export async function getVehicleFormLookupData(): Promise<VehicleFormLookupData> {
  const { supabase } = await getAuthorizedSupabaseServerClient("vehicles:read");
  const [makesResult, modelsResult, optionsResult] = await Promise.all([
    supabase
      .from("vehicle_makes")
      .select("id, name")
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("vehicle_models")
      .select("id, make_id, name, vehicle_makes!inner(name)")
      .eq("status", "active")
      .eq("vehicle_makes.status", "active")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("vehicle_lookup_options")
      .select("lookup_type, label")
      .eq("status", "active")
      .order("lookup_type", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("label", { ascending: true }),
  ]);

  if (makesResult.error) {
    throw new Error(makesResult.error.message);
  }

  if (modelsResult.error) {
    throw new Error(modelsResult.error.message);
  }

  if (optionsResult.error) {
    throw new Error(optionsResult.error.message);
  }

  const makes = ((makesResult.data ?? []) as Array<Pick<VehicleMakeRow, "id" | "name">>).map((item) => ({
    id: item.id,
    name: item.name,
  }));

  const models = (modelsResult.data ?? []).map((item) => ({
    id: item.id as string,
    makeId: item.make_id as string,
    name: item.name as string,
    makeName: Array.isArray(item.vehicle_makes)
      ? String(item.vehicle_makes[0]?.name ?? "")
      : String((item.vehicle_makes as { name?: string } | null)?.name ?? ""),
  }));

  const options = ((optionsResult.data ?? []) as Array<Pick<VehicleLookupOptionRow, "lookup_type" | "label">>);

  return {
    makes,
    models,
    transmissions: options.filter((item) => item.lookup_type === "transmission").map((item) => item.label),
    fuelTypes: options.filter((item) => item.lookup_type === "fuel_type").map((item) => item.label),
    colors: options.filter((item) => item.lookup_type === "color").map((item) => item.label),
  };
}

export async function getVehicleLookupPageData(): Promise<VehicleLookupPageData> {
  const { supabase } = await getAuthorizedSupabaseServerClient("settings:read");
  const [makesResult, modelsResult, optionsResult] = await Promise.all([
    supabase
      .from("vehicle_makes")
      .select("*")
      .order("status", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("vehicle_models")
      .select("*, vehicle_makes!inner(name)")
      .order("status", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("vehicle_lookup_options")
      .select("*")
      .order("lookup_type", { ascending: true })
      .order("status", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("label", { ascending: true }),
  ]);

  if (makesResult.error) {
    throw new Error(makesResult.error.message);
  }

  if (modelsResult.error) {
    throw new Error(modelsResult.error.message);
  }

  if (optionsResult.error) {
    throw new Error(optionsResult.error.message);
  }

  const makes = (makesResult.data ?? []) as VehicleMakeRow[];
  const models = (modelsResult.data ?? []) as Array<VehicleModelRow & { vehicle_makes?: { name?: string } | { name?: string }[] | null }>;
  const options = (optionsResult.data ?? []) as VehicleLookupOptionRow[];

  const activeModelCounts = models.reduce<Map<string, number>>((counts, item) => {
    if (item.status !== "active") {
      return counts;
    }

    counts.set(item.make_id, (counts.get(item.make_id) ?? 0) + 1);
    return counts;
  }, new Map());

  const mappedMakes: VehicleMakeItem[] = makes.map((item) => ({
    id: item.id,
    name: item.name,
    externalSource: item.external_source,
    externalSourceId: item.external_source_id,
    isSeeded: item.is_seeded,
    sortOrder: item.sort_order,
    status: item.status,
    modelCount: activeModelCounts.get(item.id) ?? 0,
  }));

  const mappedModels: VehicleModelItem[] = models.map((item) => ({
    id: item.id,
    makeId: item.make_id,
    makeName: Array.isArray(item.vehicle_makes)
      ? String(item.vehicle_makes[0]?.name ?? "")
      : String(item.vehicle_makes?.name ?? ""),
    name: item.name,
    externalSource: item.external_source,
    externalSourceId: item.external_source_id,
    isSeeded: item.is_seeded,
    sortOrder: item.sort_order,
    status: item.status,
  }));

  const optionGroups: VehicleLookupOptionGroup[] = (["transmission", "fuel_type", "color"] as VehicleLookupType[]).map((lookupType) => ({
    lookupType,
    label: LOOKUP_LABELS[lookupType],
    items: options
      .filter((item) => item.lookup_type === lookupType)
      .map((item) => ({
        id: item.id,
        lookupType,
        label: item.label,
        sortOrder: item.sort_order,
        status: item.status,
      })),
  }));

  return {
    summary: {
      activeMakes: mappedMakes.filter((item) => item.status === "active").length,
      activeModels: mappedModels.filter((item) => item.status === "active").length,
      transmissionOptions:
        optionGroups.find((item) => item.lookupType === "transmission")?.items.filter((item) => item.status === "active").length ?? 0,
      fuelTypeOptions:
        optionGroups.find((item) => item.lookupType === "fuel_type")?.items.filter((item) => item.status === "active").length ?? 0,
      colorOptions:
        optionGroups.find((item) => item.lookupType === "color")?.items.filter((item) => item.status === "active").length ?? 0,
    },
    makes: mappedMakes,
    models: mappedModels,
    optionGroups,
  };
}
