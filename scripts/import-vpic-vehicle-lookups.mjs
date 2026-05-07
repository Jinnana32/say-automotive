#!/usr/bin/env node

import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const VPIC_BASE_URL = "https://vpic.nhtsa.dot.gov/api/vehicles";
const DEFAULT_OUTPUT_PATH = new URL("../supabase/seed/vpic-ph-vehicle-lookups.json", import.meta.url);

const PH_BRANDS = [
  { name: "Toyota", aliases: ["toyota"] },
  { name: "Mitsubishi", aliases: ["mitsubishi"] },
  { name: "Honda", aliases: ["honda"] },
  { name: "Nissan", aliases: ["nissan"] },
  { name: "Suzuki", aliases: ["suzuki"] },
  { name: "Isuzu", aliases: ["isuzu"] },
  { name: "Ford", aliases: ["ford"] },
  { name: "Hyundai", aliases: ["hyundai"] },
  { name: "Kia", aliases: ["kia"] },
  { name: "Mazda", aliases: ["mazda"] },
  { name: "Chevrolet", aliases: ["chevrolet"] },
  { name: "Subaru", aliases: ["subaru"] },
  { name: "Geely", aliases: ["geely"] },
  { name: "Chery", aliases: ["chery", "chery automobile"] },
  { name: "GAC", aliases: ["gac", "guangzhou automobile", "guangzhou automobile group"] },
  { name: "MG", aliases: ["mg", "morris garages"] },
  { name: "BYD", aliases: ["byd", "build your dreams"] },
  { name: "Foton", aliases: ["foton", "beiqi foton"] },
  { name: "JMC", aliases: ["jmc", "jiangling"] },
  { name: "Peugeot", aliases: ["peugeot"] },
  { name: "Volkswagen", aliases: ["volkswagen"] },
];

const ROAD_VEHICLE_TYPES = [
  "car",
  "truck",
  "multipurpose passenger vehicle",
];

const args = new Set(process.argv.slice(2));
const shouldApply = args.has("--apply");
const outputArg = [...args].find((arg) => arg.startsWith("--output="));
const outputUrl = outputArg
  ? new URL(outputArg.slice("--output=".length), `file://${process.cwd()}/`)
  : DEFAULT_OUTPUT_PATH;

const allMakes = await fetchJson(`${VPIC_BASE_URL}/GetAllMakes?format=json`);
const unmatchedBrands = [];
const matchedMakes = PH_BRANDS.flatMap((brand) => {
  const match = findMakeMatch(allMakes.Results ?? [], brand);

  if (!match) {
    console.warn(`No vPIC match found for brand: ${brand.name}`);
    unmatchedBrands.push(brand.name);
    return [];
  }

  return [
    {
      name: brand.name,
      sourceId: String(match.Make_ID),
      sourceName: match.Make_Name,
    },
  ];
});

const catalog = {
  generated_at: new Date().toISOString(),
  source: "nhtsa_vpic",
  filters: {
    vehicle_types: ROAD_VEHICLE_TYPES,
  },
  unmatched_brands: unmatchedBrands,
  makes: [],
};

for (const make of matchedMakes) {
  const modelMap = new Map();

  for (const vehicleType of ROAD_VEHICLE_TYPES) {
    const response = await fetchJson(
      `${VPIC_BASE_URL}/GetModelsForMakeIdYear/makeId/${make.sourceId}/vehicletype/${encodeURIComponent(vehicleType)}?format=json`,
    );

    for (const item of response.Results ?? []) {
      const modelName = String(item.Model_Name ?? "").trim();

      if (!modelName) {
        continue;
      }

      const key = normalize(modelName);

      if (!modelMap.has(key)) {
        modelMap.set(key, {
          name: modelName,
          source_id: item.Model_ID ? String(item.Model_ID) : null,
        });
      }
    }
  }

  const models = [...modelMap.values()].sort((left, right) => left.name.localeCompare(right.name));

  catalog.makes.push({
    name: make.name,
    source_id: make.sourceId,
    source_name: make.sourceName,
    models,
  });
}

await BunOrNodeWriteFile(outputUrl, JSON.stringify(catalog, null, 2));
console.log(`Vehicle lookup seed written to ${outputUrl.pathname}`);

if (shouldApply) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for --apply.",
    );
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  for (const make of catalog.makes) {
    const makePayload = {
      name: make.name,
      name_key: toKey(make.name),
      external_source: "nhtsa_vpic",
      external_source_id: make.source_id,
      is_seeded: true,
      sort_order: 0,
      status: "active",
    };

    const { data: insertedMake, error: makeError } = await supabase
      .from("vehicle_makes")
      .upsert(makePayload, { onConflict: "name_key" })
      .select("id")
      .single();

    if (makeError) {
      throw makeError;
    }

    for (const model of make.models) {
      const modelPayload = {
        make_id: insertedMake.id,
        name: model.name,
        name_key: toKey(model.name),
        external_source: "nhtsa_vpic",
        external_source_id: model.source_id,
        is_seeded: true,
        sort_order: 0,
        status: "active",
      };

      const { error: modelError } = await supabase
        .from("vehicle_models")
        .upsert(modelPayload, { onConflict: "make_id,name_key" });

      if (modelError) {
        throw modelError;
      }
    }
  }

  console.log("Vehicle makes and models were applied to Supabase.");
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function findMakeMatch(allMakes, brand) {
  const exactMatch = allMakes.find((item) => {
    const normalizedName = normalize(item.Make_Name ?? "");
    return brand.aliases.some((alias) => normalizedName === normalize(alias));
  });

  if (exactMatch) {
    return exactMatch;
  }

  return allMakes.find((item) => {
    const normalizedName = normalize(item.Make_Name ?? "");
    return brand.aliases.some((alias) => normalizedName.includes(normalize(alias)));
  });
}

function normalize(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ");
}

function toKey(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function BunOrNodeWriteFile(url, contents) {
  const { writeFile, mkdir } = await import("node:fs/promises");
  const { dirname } = await import("node:path");
  await mkdir(dirname(url.pathname), { recursive: true });
  await writeFile(url, contents, "utf8");
}
