#!/usr/bin/env node

import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.sql) {
  printUsage();
  process.exit(args.help ? 0 : 1);
}

const sqlText = await readTextFile(args.sql);
const csvText = args.csv ? await readTextFile(args.csv) : null;

const legacyData = parseLegacyDatabase(sqlText);
const csvCars = csvText ? parseCarsCsv(csvText) : [];

const importPlan = buildImportPlan({
  legacyData,
  csvCars,
  today: getTodayInManila(),
});

if (args.jsonOut) {
  await writeJsonFile(args.jsonOut, {
    generatedAt: new Date().toISOString(),
    summary: importPlan.summary,
    blockers: importPlan.blockers,
    samples: buildSampleReport(importPlan),
  });
}

printSummary(importPlan, {
  sqlPath: args.sql,
  csvPath: args.csv,
  jsonOut: args.jsonOut,
});

if (!args.apply) {
  console.log("\nDry run only. Re-run with --apply to import into Supabase.");
  process.exit(0);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const branch = await resolveTargetBranch(supabase, args.branchId);
const applyResult = await applyImportPlan({
  supabase,
  branchId: branch.id,
  importPlan,
});

console.log(
  [
    "",
    `Applied to branch: ${branch.name} (${branch.id})`,
    `Customers created: ${applyResult.customersCreated}`,
    `Customers matched existing: ${applyResult.customersMatched}`,
    `Vehicles created: ${applyResult.vehiclesCreated}`,
    `Vehicles matched existing: ${applyResult.vehiclesMatched}`,
    `Quotations created: ${applyResult.quotationsCreated}`,
    `Quotations matched existing: ${applyResult.quotationsMatched}`,
    `Historical job orders created: ${applyResult.jobOrdersCreated}`,
    `Historical job orders matched existing: ${applyResult.jobOrdersMatched}`,
    `Quotation links dropped due to duplicates: ${applyResult.quotationLinksDropped}`,
    `Vehicle owner reconciliations: ${applyResult.vehicleOwnerReconciliations}`,
  ].join("\n"),
);

function printUsage() {
  console.log(
    [
      "Usage:",
      "  node scripts/import-legacy-car-repair-db.mjs --sql /path/to/car_repair_db.sql [--csv /path/to/car_repair_db.csv] [--json-out /path/to/report.json] [--apply] [--branch-id <uuid>]",
      "",
      "What it does:",
      "  - Extracts legacy customers and vehicles from the old cars table",
      "  - Extracts quotations and quotation items into the current quotation shape",
      "  - Reinterprets legacy repairs as historical completed job orders",
      "  - Reports blockers and malformed rows before any write",
      "",
      "Default behavior is dry-run only.",
    ].join("\n"),
  );
}

function parseArgs(argv) {
  const parsed = {
    help: false,
    apply: false,
    sql: null,
    csv: null,
    jsonOut: null,
    branchId: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg === "--apply") {
      parsed.apply = true;
    } else if (arg === "--sql") {
      parsed.sql = argv[index + 1] ?? null;
      index += 1;
    } else if (arg === "--csv") {
      parsed.csv = argv[index + 1] ?? null;
      index += 1;
    } else if (arg === "--json-out") {
      parsed.jsonOut = argv[index + 1] ?? null;
      index += 1;
    } else if (arg === "--branch-id") {
      parsed.branchId = argv[index + 1] ?? null;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return parsed;
}

async function readTextFile(filePath) {
  const { readFile } = await import("node:fs/promises");
  return readFile(filePath, "utf8");
}

async function writeJsonFile(filePath, value) {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const { dirname } = await import("node:path");
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function parseLegacyDatabase(sqlText) {
  return {
    cars: extractTableRows(sqlText, "cars"),
    quotations: extractTableRows(sqlText, "quotations"),
    quotationItems: extractTableRows(sqlText, "quotation_items"),
    repairs: extractTableRows(sqlText, "repairs"),
  };
}

function extractTableRows(sqlText, tableName) {
  const escapedTableName = escapeRegExp(tableName);
  const regex = new RegExp(
    String.raw`INSERT INTO \`${escapedTableName}\` \(([\s\S]*?)\) VALUES\s*([\s\S]*?);`,
    "g",
  );

  const rows = [];

  for (const match of sqlText.matchAll(regex)) {
    const columns = match[1]
      .split(",")
      .map((column) => column.replace(/[`"' ]/g, "").trim())
      .filter(Boolean);

    const tupleRows = parseSqlInsertValues(match[2]);

    for (const tuple of tupleRows) {
      const row = {};
      columns.forEach((column, index) => {
        row[column] = tuple[index] ?? null;
      });
      rows.push(row);
    }
  }

  return rows;
}

function parseSqlInsertValues(valuesSql) {
  const rows = [];
  let index = 0;

  while (index < valuesSql.length) {
    const char = valuesSql[index];

    if (char !== "(") {
      index += 1;
      continue;
    }

    index += 1;
    const tuple = [];

    while (index < valuesSql.length) {
      while (/\s/.test(valuesSql[index] ?? "")) {
        index += 1;
      }

      let value;

      if (valuesSql[index] === "'") {
        ({ value, nextIndex: index } = readSqlString(valuesSql, index));
      } else {
        const start = index;
        while (
          index < valuesSql.length &&
          valuesSql[index] !== "," &&
          valuesSql[index] !== ")"
        ) {
          index += 1;
        }

        const rawValue = valuesSql.slice(start, index).trim();
        value = parseSqlScalar(rawValue);
      }

      tuple.push(value);

      while (/\s/.test(valuesSql[index] ?? "")) {
        index += 1;
      }

      if (valuesSql[index] === ",") {
        index += 1;
        continue;
      }

      if (valuesSql[index] === ")") {
        index += 1;
        break;
      }
    }

    rows.push(tuple);
  }

  return rows;
}

function readSqlString(source, startIndex) {
  let value = "";
  let index = startIndex + 1;

  while (index < source.length) {
    const char = source[index];

    if (char === "\\") {
      const next = source[index + 1] ?? "";
      value += decodeSqlEscape(next);
      index += 2;
      continue;
    }

    if (char === "'" && source[index + 1] === "'") {
      value += "'";
      index += 2;
      continue;
    }

    if (char === "'") {
      return { value, nextIndex: index + 1 };
    }

    value += char;
    index += 1;
  }

  return { value, nextIndex: index };
}

function decodeSqlEscape(char) {
  switch (char) {
    case "n":
      return "\n";
    case "r":
      return "\r";
    case "t":
      return "\t";
    case "0":
      return "\0";
    default:
      return char;
  }
}

function parseSqlScalar(rawValue) {
  if (!rawValue) {
    return "";
  }

  if (rawValue.toUpperCase() === "NULL") {
    return null;
  }

  if (/^-?\d+(\.\d+)?$/.test(rawValue)) {
    return Number(rawValue);
  }

  return rawValue;
}

function parseCarsCsv(csvText) {
  const rows = parseCsvRows(csvText);

  if (rows.length <= 1) {
    return [];
  }

  const [header, ...dataRows] = rows;
  return dataRows.map((row) => {
    const record = {};
    header.forEach((column, index) => {
      record[column] = row[index] ?? "";
    });
    return record;
  });
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        value += '"';
        index += 1;
        continue;
      }

      if (char === '"') {
        inQuotes = false;
        continue;
      }

      value += char;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(value);
      value = "";
      continue;
    }

    if (char === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value.replace(/\r$/, ""));
    rows.push(row);
  }

  return rows;
}

function buildImportPlan({ legacyData, csvCars, today }) {
  const blockers = [];
  const cars = legacyData.cars.length > 0 ? legacyData.cars : csvCars;
  const carsById = new Map(cars.map((car) => [Number(car.id), car]));
  const quotationItemsByQuotationId = groupBy(
    legacyData.quotationItems,
    (row) => Number(row.quotation_id),
  );

  if (csvCars.length > 0 && legacyData.cars.length > 0 && csvCars.length !== legacyData.cars.length) {
    blockers.push({
      level: "warning",
      type: "cars_csv_sql_count_mismatch",
      message: `CSV cars count (${csvCars.length}) does not match SQL cars count (${legacyData.cars.length}). SQL was used as the primary source.`,
    });
  }

  const customers = [];
  const customerIdByLegacyCarId = new Map();
  const vehicles = [];
  const vehicleIdByLegacyCarId = new Map();
  const customerByKey = new Map();

  for (const car of cars) {
    const normalized = normalizeLegacyCar(car, blockers);
    const customerKey = buildCustomerKey(normalized.customer);

    let customer = customerByKey.get(customerKey);
    if (!customer) {
      customer = {
        ...normalized.customer,
        legacyCarIds: [],
      };
      customerByKey.set(customerKey, customer);
      customers.push(customer);
    }

    customer.legacyCarIds.push(Number(car.id));
    customerIdByLegacyCarId.set(Number(car.id), customerKey);

    const vehicle = {
      ...normalized.vehicle,
      legacyCarId: Number(car.id),
      customerKey,
      lastServiceDate: cleanDate(car.last_service),
      legacyStatus: cleanText(car.status) ?? null,
    };

    vehicles.push(vehicle);
    vehicleIdByLegacyCarId.set(Number(car.id), vehicle.legacyCarId);
  }

  const repairQuotationCounts = countBy(
    legacyData.repairs.filter((repair) => Number(repair.quotation_id) > 0),
    (repair) => Number(repair.quotation_id),
  );
  const earliestRepairDateByQuotationId = getEarliestRepairDateByQuotationId(legacyData.repairs);

  const quotations = legacyData.quotations
    .map((quotation) =>
      normalizeLegacyQuotation({
        quotation,
        car: carsById.get(Number(quotation.car_id)),
        rawItems: quotationItemsByQuotationId.get(Number(quotation.id)) ?? [],
        hasHistoricalRepair: repairQuotationCounts.has(Number(quotation.id)),
        earliestHistoricalRepairDate:
          earliestRepairDateByQuotationId.get(Number(quotation.id)) ?? null,
        blockers,
      }),
    )
    .filter(Boolean)
    .sort(sortByDateAndId);

  const quotationByLegacyId = new Map(quotations.map((quotation) => [quotation.legacyId, quotation]));

  const jobOrders = legacyData.repairs
    .map((repair) =>
      normalizeLegacyRepair({
        repair,
        car: carsById.get(Number(repair.car_id)),
        quotation: quotationByLegacyId.get(Number(repair.quotation_id)) ?? null,
        quotationLinkCount: repairQuotationCounts.get(Number(repair.quotation_id)) ?? 0,
        blockers,
        today,
      }),
    )
    .filter(Boolean)
    .sort(sortByDateAndId);

  return {
    customers,
    vehicles,
    quotations,
    jobOrders,
    blockers,
    summary: {
      customers: customers.length,
      vehicles: vehicles.length,
      quotations: quotations.length,
      quotationItems: quotations.reduce((total, quotation) => total + quotation.items.length, 0),
      historicalJobOrders: jobOrders.length,
      historicalJobOrderItems: jobOrders.reduce((total, jobOrder) => total + jobOrder.items.length, 0),
      blockers: blockers.length,
    },
  };
}

function normalizeLegacyCar(car, blockers) {
  const ownerName = cleanText(car.owner) ?? `Legacy Customer ${car.id}`;
  const address = cleanText(car.address);
  const contactNumber = normalizePhone(car.mobile);
  const customerType = guessCustomerType(ownerName);
  const { firstName, lastName } = customerType === "individual" ? splitIndividualName(ownerName) : {
    firstName: null,
    lastName: null,
  };

  if (!cleanText(car.owner)) {
    blockers.push({
      level: "warning",
      type: "car_missing_owner",
      message: `Car ${car.id} is missing an owner name. A fallback customer name was generated.`,
      legacyCarId: Number(car.id),
    });
  }

  const make = cleanText(car.make) ?? "Unknown";
  const model = cleanText(car.model) ?? "Unknown";

  if (!cleanText(car.make) || !cleanText(car.model)) {
    blockers.push({
      level: "warning",
      type: "car_missing_make_or_model",
      message: `Car ${car.id} is missing make or model. The import will use "Unknown" where needed.`,
      legacyCarId: Number(car.id),
    });
  }

  return {
    customer: {
      displayName: ownerName,
      customerType,
      firstName,
      lastName,
      companyName: customerType === "individual" ? null : ownerName,
      contactNumber,
      address,
      notes: null,
      status: "active",
    },
    vehicle: {
      legacyCarId: Number(car.id),
      make,
      model,
      year: toOptionalInteger(car.year),
      mileage: toOptionalInteger(car.mileage),
      plateNumber: cleanPlateNumber(car.plate_number),
      vin: cleanVin(car.vin),
      color: cleanText(car.color),
      status: "active",
    },
  };
}

function normalizeLegacyQuotation({
  quotation,
  car,
  rawItems,
  hasHistoricalRepair,
  earliestHistoricalRepairDate,
  blockers,
}) {
  if (!car) {
    blockers.push({
      level: "error",
      type: "quotation_missing_car",
      message: `Quotation ${quotation.id} references missing car ${quotation.car_id} and was skipped.`,
      legacyQuotationId: Number(quotation.id),
    });
    return null;
  }

  const normalizedItems = normalizeLegacyLineItems({
    legacyItems: rawItems,
    sourceLabel: `quotation ${quotation.id}`,
    blockers,
  });

  const normalizedItemSubtotal = roundMoney(
    normalizedItems.reduce((sum, item) => sum + item.total, 0),
  );
  let legacySubtotal = roundMoney(
    toOptionalNumber(quotation.total_parts, 0) + toOptionalNumber(quotation.total_labor, 0),
  );
  let discount = roundMoney(toOptionalNumber(quotation.discount, 0));
  const tax = roundMoney(toOptionalNumber(quotation.vat, 0));
  const fallbackDescription =
    cleanText(quotation.nature_of_repair) ??
    `Imported legacy quotation #${quotation.id}`;
  const createdDate = cleanDate(quotation.date);
  const createdTimestamp = buildLegacyBusinessTimestamp(
    createdDate,
    quotation.created_at,
  );

  if (legacySubtotal <= 0 && normalizedItemSubtotal > 0) {
    legacySubtotal = normalizedItemSubtotal;
    blockers.push({
      level: "warning",
      type: "quotation_subtotal_inferred_from_items",
      message: `Quotation ${quotation.id} had zero header subtotal but usable line items totaling ${normalizedItemSubtotal}. The item subtotal will be imported instead.`,
      legacyQuotationId: Number(quotation.id),
    });
  }

  const items = reconcileLegacyItemsToSubtotal({
    legacySubtotal,
    items: normalizedItems,
    fallbackDescription,
    blockers,
    sourceType: "quotation",
    sourceId: Number(quotation.id),
  });

  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.total, 0));

  if (discount > subtotal) {
    blockers.push({
      level: "warning",
      type: "quotation_discount_capped",
      message: `Quotation ${quotation.id} discount (${discount}) exceeded subtotal (${subtotal}). The imported discount was capped to the subtotal to keep the quotation valid in the current system.`,
      legacyQuotationId: Number(quotation.id),
    });
    discount = subtotal;
  }

  const recomputedTotal = roundMoney(subtotal - discount + tax);
  const totalAmount = roundMoney(Math.max(0, recomputedTotal));
  if (recomputedTotal < 0) {
    blockers.push({
      level: "warning",
      type: "quotation_total_clamped",
      message: `Quotation ${quotation.id} recomputed to a negative total (${recomputedTotal}). The imported total was clamped to 0.`,
      legacyQuotationId: Number(quotation.id),
    });
  }
  const legacyGrandTotal = roundMoney(toOptionalNumber(quotation.grand_total, totalAmount));

  if (Math.abs(legacyGrandTotal - totalAmount) > 0.05) {
    blockers.push({
      level: "warning",
      type: "quotation_total_mismatch",
      message: `Quotation ${quotation.id} grand total (${legacyGrandTotal}) did not match the recomputed total (${totalAmount}). The recomputed total will be imported to satisfy current constraints.`,
      legacyQuotationId: Number(quotation.id),
    });
  }

  const legacyStatus = mapLegacyQuotationStatus(quotation.status);
  const status = hasHistoricalRepair ? "approved" : legacyStatus;

  if (hasHistoricalRepair && legacyStatus !== "approved") {
    blockers.push({
      level: "warning",
      type: "quotation_status_overridden_for_completed_work",
      message: `Quotation ${quotation.id} was linked to a historical repair, so it will be imported as approved instead of legacy status "${quotation.status}".`,
      legacyQuotationId: Number(quotation.id),
    });
  }

  const approvedTimestamp =
    status === "approved"
      ? legacyStatus === "approved"
        ? createdTimestamp
        : (earliestHistoricalRepairDate ? legacyDateToUtcIso(earliestHistoricalRepairDate) : null) ??
          createdTimestamp
      : null;
  const rejectedTimestamp =
    status === "rejected"
      ? createdTimestamp
      : null;

  return {
    legacyId: Number(quotation.id),
    legacyCarId: Number(quotation.car_id),
    customerKey: buildCustomerKey(normalizeLegacyCar(car, []).customer),
    vehicleLegacyCarId: Number(quotation.car_id),
    createdDate,
    createdTimestamp,
    approvedTimestamp,
    rejectedTimestamp,
    status,
    natureOfRepair: cleanText(quotation.nature_of_repair),
    subtotal,
    discount,
    tax,
    totalAmount,
    preparedBy: cleanText(quotation.prepared_by),
    customerNameSnapshot: cleanText(quotation.client_name) ?? cleanText(car.owner),
    customerContactSnapshot: normalizePhone(quotation.contact_number) ?? normalizePhone(car.mobile),
    customerAddressSnapshot: cleanText(quotation.address) ?? cleanText(car.address),
    vehicleMakeSnapshot: cleanText(car.make) ?? "Unknown",
    vehicleModelSnapshot: cleanText(car.model) ?? "Unknown",
    vehicleYearSnapshot: toOptionalInteger(car.year),
    vehiclePlateNumberSnapshot:
      cleanPlateNumber(quotation.plate_number) ?? cleanPlateNumber(car.plate_number),
    vehicleVinSnapshot: cleanVin(quotation.vin) ?? cleanVin(car.vin),
    items,
  };
}

function normalizeLegacyRepair({
  repair,
  car,
  quotation,
  quotationLinkCount,
  blockers,
  today,
}) {
  if (!car) {
    blockers.push({
      level: "error",
      type: "repair_missing_car",
      message: `Repair ${repair.id} references missing car ${repair.car_id} and was skipped.`,
      legacyRepairId: Number(repair.id),
    });
    return null;
  }

  const serviceDate = cleanDate(repair.date);
  if (!serviceDate) {
    blockers.push({
      level: "error",
      type: "repair_missing_date",
      message: `Repair ${repair.id} is missing a service date and was skipped.`,
      legacyRepairId: Number(repair.id),
    });
    return null;
  }

  if (serviceDate > today) {
    blockers.push({
      level: "warning",
      type: "repair_future_date",
      message: `Repair ${repair.id} has future service date ${serviceDate}. It was skipped because historical job orders cannot be in the future.`,
      legacyRepairId: Number(repair.id),
    });
    return null;
  }

  let items = quotation?.items.map((item) => ({ ...item })) ?? [];
  if (items.length === 0) {
    const fallbackAmount = roundMoney(toOptionalNumber(repair.cost, 0));
    const fallbackDescription =
      cleanText(repair.description) ?? `Imported legacy repair #${repair.id}`;

    if (fallbackAmount > 0) {
      items = [
        {
          itemType: "labor",
          description: fallbackDescription,
          quantity: 1,
          unitPrice: fallbackAmount,
          total: fallbackAmount,
          legacySource: "repair_fallback",
        },
      ];
      blockers.push({
        level: "warning",
        type: "repair_used_cost_fallback",
        message: `Repair ${repair.id} had no usable quotation items. A single fallback labor item was created from the repair cost.`,
        legacyRepairId: Number(repair.id),
      });
    }
  }

  const linkQuotation =
    quotation && quotationLinkCount === 1 ? quotation.legacyId : null;

  if (quotation && quotationLinkCount > 1) {
    blockers.push({
      level: "warning",
      type: "repair_duplicate_quotation_reference",
      message: `Repair ${repair.id} shares quotation ${quotation.legacyId} with other repair rows. The imported job order will not link directly to the quotation because the current schema allows only one job order per quotation.`,
      legacyRepairId: Number(repair.id),
      legacyQuotationId: quotation.legacyId,
    });
  }

  return {
    legacyId: Number(repair.id),
    legacyCarId: Number(repair.car_id),
    vehicleLegacyCarId: Number(repair.car_id),
    customerKey: buildCustomerKey(normalizeLegacyCar(car, []).customer),
    quotationLegacyId: linkQuotation,
    status: "completed",
    serviceDate,
    workPerformed: cleanText(repair.description) ?? null,
    customerConcern: quotation?.natureOfRepair ?? null,
    diagnosis: null,
    inspectionNotes: [
      "Imported from legacy repairs table.",
      cleanText(repair.type) ? `Legacy type: ${cleanText(repair.type)}.` : null,
      cleanText(repair.mechanic) ? `Legacy mechanic: ${cleanText(repair.mechanic)}.` : null,
    ]
      .filter(Boolean)
      .join(" "),
    items,
  };
}

function normalizeLegacyLineItems({ legacyItems, sourceLabel, blockers }) {
  const items = [];

  for (const legacyItem of legacyItems) {
    const description = cleanText(legacyItem.description);
    const itemType = mapLegacyItemType(legacyItem.item_type);
    const unitPrice = roundMoney(toOptionalNumber(legacyItem.unit_price, 0));
    let quantity = roundQuantity(toOptionalNumber(legacyItem.quantity, 0));

    if (!description) {
      blockers.push({
        level: "warning",
        type: "line_item_blank_description",
        message: `Skipped blank line item in ${sourceLabel}.`,
        legacyLineItemId: Number(legacyItem.id),
      });
      continue;
    }

    if (!itemType) {
      blockers.push({
        level: "warning",
        type: "line_item_unknown_type",
        message: `Skipped unknown line item type "${legacyItem.item_type}" in ${sourceLabel}.`,
        legacyLineItemId: Number(legacyItem.id),
      });
      continue;
    }

    if (quantity <= 0) {
      if (unitPrice > 0) {
        quantity = 1;
        blockers.push({
          level: "warning",
          type: "line_item_quantity_normalized",
          message: `Line item ${legacyItem.id} in ${sourceLabel} had quantity ${legacyItem.quantity}. It was normalized to quantity 1 because it has a positive unit price.`,
          legacyLineItemId: Number(legacyItem.id),
        });
      } else {
        blockers.push({
          level: "warning",
          type: "line_item_zero_quantity_skipped",
          message: `Skipped zero-value line item ${legacyItem.id} in ${sourceLabel}.`,
          legacyLineItemId: Number(legacyItem.id),
        });
        continue;
      }
    }

    items.push({
      itemType,
      description,
      quantity,
      unitPrice,
      total: roundMoney(quantity * unitPrice),
      legacySource: "quotation_item",
    });
  }

  return items;
}

function reconcileLegacyItemsToSubtotal({
  legacySubtotal,
  items,
  fallbackDescription,
  blockers,
  sourceType,
  sourceId,
}) {
  if (items.length === 0 && legacySubtotal > 0) {
    blockers.push({
      level: "warning",
      type: `${sourceType}_used_subtotal_fallback`,
      message: `${capitalize(sourceType)} ${sourceId} had no usable items. A single fallback service line was created from the legacy subtotal.`,
      [`legacy${capitalize(sourceType)}Id`]: sourceId,
    });

    return [
      {
        itemType: "service",
        description: fallbackDescription,
        quantity: 1,
        unitPrice: legacySubtotal,
        total: legacySubtotal,
        legacySource: "subtotal_fallback",
      },
    ];
  }

  if (items.length === 0) {
    return [];
  }

  const itemSubtotal = roundMoney(items.reduce((sum, item) => sum + item.total, 0));
  const delta = roundMoney(legacySubtotal - itemSubtotal);

  if (Math.abs(delta) <= 0.05) {
    return items;
  }

  if (delta > 0) {
    blockers.push({
      level: "warning",
      type: `${sourceType}_subtotal_adjustment`,
      message: `${capitalize(sourceType)} ${sourceId} subtotal differed from its item sum by ${delta}. A balancing service line was added.`,
      [`legacy${capitalize(sourceType)}Id`]: sourceId,
    });

    return [
      ...items,
      {
        itemType: "service",
        description: "Legacy import subtotal adjustment",
        quantity: 1,
        unitPrice: delta,
        total: delta,
        legacySource: "subtotal_adjustment",
      },
    ];
  }

  blockers.push({
    level: "warning",
    type: `${sourceType}_subtotal_rebuilt`,
    message: `${capitalize(sourceType)} ${sourceId} item totals exceeded the legacy subtotal. Detail lines were replaced with a single fallback service line to preserve the legacy subtotal safely.`,
    [`legacy${capitalize(sourceType)}Id`]: sourceId,
  });

  return [
    {
      itemType: "service",
      description: fallbackDescription,
      quantity: 1,
      unitPrice: legacySubtotal,
      total: legacySubtotal,
      legacySource: "subtotal_fallback",
    },
  ];
}

function buildCustomerKey(customer) {
  const name = normalizeKey(customer.displayName);
  const phone = normalizeKey(customer.contactNumber);
  const address = normalizeKey(customer.address);

  if (phone) {
    return `${name}|${phone}`;
  }

  if (address) {
    return `${name}|${address}`;
  }

  return name;
}

function mapLegacyQuotationStatus(status) {
  const normalized = normalizeKey(status);

  switch (normalized) {
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "pending":
    default:
      return "pending_approval";
  }
}

function mapLegacyItemType(itemType) {
  const normalized = normalizeKey(itemType);
  if (normalized === "part") {
    return "product";
  }
  if (normalized === "labor") {
    return "labor";
  }
  return null;
}

function guessCustomerType(name) {
  const normalized = normalizeKey(name);
  const companyPattern =
    /\b(inc|corp|corporation|hotel|authority|office|laboratory|land holding|philippines|nda|corporation|hotel|unipharma|zuri|company|corporate|hotel|holding|ports)\b/;

  return companyPattern.test(normalized) ? "company" : "individual";
}

function splitIndividualName(fullName) {
  const parts = String(fullName)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return { firstName: null, lastName: null };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: null };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1) ?? null,
  };
}

function cleanText(value) {
  if (value == null) {
    return null;
  }

  const normalized = String(value).trim();
  if (!normalized || normalized.toUpperCase() === "NULL") {
    return null;
  }

  return normalized.replace(/\s+/g, " ").trim();
}

function cleanDate(value) {
  const normalized = cleanText(value);
  if (!normalized) {
    return null;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null;
}

function cleanPlateNumber(value) {
  const normalized = cleanText(value);
  return normalized ? normalized.toUpperCase() : null;
}

function cleanVin(value) {
  const normalized = cleanText(value);
  if (!normalized) {
    return null;
  }

  const upper = normalized.toUpperCase();
  if (/^0+$/.test(upper)) {
    return null;
  }

  return upper;
}

function normalizePhone(value) {
  const normalized = cleanText(value);
  if (!normalized) {
    return null;
  }

  const digits = normalized.replace(/\D/g, "");
  if (!digits || /^0+$/.test(digits)) {
    return null;
  }

  return digits;
}

function toOptionalNumber(value, fallback = null) {
  if (value == null || value === "") {
    return fallback;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toOptionalInteger(value) {
  const numeric = toOptionalNumber(value, null);
  return numeric == null ? null : Math.trunc(numeric);
}

function roundMoney(value) {
  return Number(Number(value).toFixed(4));
}

function roundQuantity(value) {
  return Number(Number(value).toFixed(4));
}

function parseLegacyTimestampInManila(value) {
  const normalized = cleanText(value);
  if (!normalized) {
    return null;
  }

  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second = "00"] = match;
  return `${year}-${month}-${day}T${hour}:${minute}:${second}+08:00`;
}

function buildLegacyBusinessTimestamp(primaryDate, legacyTimestampValue) {
  const timestamp = parseLegacyTimestampInManila(legacyTimestampValue);
  if (!primaryDate) {
    return timestamp;
  }

  if (timestamp && timestamp.slice(0, 10) === primaryDate) {
    return timestamp;
  }

  return legacyDateToUtcIso(primaryDate);
}

function normalizeKey(value) {
  return cleanText(value)?.toLowerCase() ?? "";
}

function sortByDateAndId(left, right) {
  const leftDate = left.createdDate ?? left.serviceDate ?? "";
  const rightDate = right.createdDate ?? right.serviceDate ?? "";
  if (leftDate !== rightDate) {
    return leftDate.localeCompare(rightDate);
  }
  return Number(left.legacyId) - Number(right.legacyId);
}

function groupBy(items, keySelector) {
  const map = new Map();

  for (const item of items) {
    const key = keySelector(item);
    const group = map.get(key);
    if (group) {
      group.push(item);
    } else {
      map.set(key, [item]);
    }
  }

  return map;
}

function countBy(items, keySelector) {
  const map = new Map();

  for (const item of items) {
    const key = keySelector(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  return map;
}

function getEarliestRepairDateByQuotationId(repairs) {
  const map = new Map();

  for (const repair of repairs) {
    const quotationId = Number(repair.quotation_id);
    const repairDate = cleanDate(repair.date);

    if (quotationId <= 0 || !repairDate) {
      continue;
    }

    const existingDate = map.get(quotationId);
    if (!existingDate || repairDate < existingDate) {
      map.set(quotationId, repairDate);
    }
  }

  return map;
}

function capitalize(value) {
  return `${value[0]?.toUpperCase() ?? ""}${value.slice(1)}`;
}

function getTodayInManila() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
}

function legacyDateToUtcIso(date) {
  return `${date}T04:00:00.000Z`;
}

function buildSampleReport(importPlan) {
  return {
    customers: importPlan.customers.slice(0, 5),
    vehicles: importPlan.vehicles.slice(0, 5),
    quotations: importPlan.quotations.slice(0, 3),
    jobOrders: importPlan.jobOrders.slice(0, 3),
  };
}

function printSummary(importPlan, meta) {
  const groupedBlockers = groupBy(importPlan.blockers, (blocker) => blocker.type);

  console.log(
    [
      `SQL source: ${meta.sqlPath}`,
      meta.csvPath ? `CSV source: ${meta.csvPath}` : null,
      "",
      `Customers: ${importPlan.summary.customers}`,
      `Vehicles: ${importPlan.summary.vehicles}`,
      `Quotations: ${importPlan.summary.quotations}`,
      `Quotation items: ${importPlan.summary.quotationItems}`,
      `Historical job orders: ${importPlan.summary.historicalJobOrders}`,
      `Historical job order items: ${importPlan.summary.historicalJobOrderItems}`,
      `Blockers / warnings: ${importPlan.summary.blockers}`,
      meta.jsonOut ? `JSON report: ${meta.jsonOut}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  if (groupedBlockers.size === 0) {
    return;
  }

  console.log("\nTop blocker categories:");
  for (const [type, items] of groupedBlockers) {
    console.log(`- ${type}: ${items.length}`);
  }

  console.log("\nSample blocker messages:");
  for (const blocker of importPlan.blockers.slice(0, 10)) {
    console.log(`- [${blocker.level}] ${blocker.message}`);
  }
}

async function resolveTargetBranch(supabase, branchId) {
  if (branchId) {
    const { data, error } = await supabase
      .from("branches")
      .select("id, name")
      .eq("id", branchId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  const { data, error } = await supabase
    .from("branches")
    .select("id, name")
    .eq("is_default", true)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function applyImportPlan({ supabase, branchId, importPlan }) {
  const nowIso = new Date().toISOString();
  const customerIdByKey = new Map();
  const vehicleIdByLegacyCarId = new Map();
  const resolvedVehicleByLegacyCarId = new Map();
  const quotationIdByLegacyId = new Map();
  const quotationRecordByLegacyId = new Map();
  const usedQuotationIds = new Set();

  const result = {
    customersCreated: 0,
    customersMatched: 0,
    vehiclesCreated: 0,
    vehiclesMatched: 0,
    quotationsCreated: 0,
    quotationsMatched: 0,
    jobOrdersCreated: 0,
    jobOrdersMatched: 0,
    quotationLinksDropped: 0,
    vehicleOwnerReconciliations: 0,
  };

  const [existingCustomers, existingVehicles, existingQuotations, existingJobOrders] = await Promise.all([
    loadExistingCustomers(supabase, branchId),
    loadExistingVehicles(supabase, branchId),
    loadExistingQuotations(supabase, branchId),
    loadExistingHistoricalJobOrders(supabase, branchId),
  ]);

  for (const customer of importPlan.customers) {
    const existingCustomer = matchExistingCustomer(existingCustomers, customer);
    if (existingCustomer) {
      customerIdByKey.set(buildCustomerKey(customer), existingCustomer.id);
      result.customersMatched += 1;
      continue;
    }

    const insertPayload = {
      branch_id: branchId,
      customer_code: null,
      customer_type: customer.customerType,
      display_name: customer.displayName,
      first_name: customer.firstName,
      last_name: customer.lastName,
      company_name: customer.companyName,
      contact_number: customer.contactNumber,
      email: null,
      address: customer.address,
      notes: customer.notes,
      status: customer.status,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const { data, error } = await supabase
      .from("customers")
      .insert(insertPayload)
      .select("id, display_name, contact_number, address")
      .single();

    if (error) {
      throw error;
    }

    existingCustomers.push(data);
    customerIdByKey.set(buildCustomerKey(customer), data.id);
    result.customersCreated += 1;
  }

  for (const vehicle of importPlan.vehicles) {
    const customerId = customerIdByKey.get(vehicle.customerKey);
    if (!customerId) {
      throw new Error(`Missing customer match for legacy car ${vehicle.legacyCarId}.`);
    }

    const existingVehicle = matchExistingVehicle(existingVehicles, {
      customerId,
      vehicle,
    });

    if (existingVehicle) {
      vehicleIdByLegacyCarId.set(vehicle.legacyCarId, existingVehicle.id);
      resolvedVehicleByLegacyCarId.set(vehicle.legacyCarId, existingVehicle);
      result.vehiclesMatched += 1;
      continue;
    }

    const insertPayload = {
      branch_id: branchId,
      customer_id: customerId,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      transmission: null,
      mileage: vehicle.mileage,
      plate_number: vehicle.plateNumber,
      vin: vehicle.vin,
      engine: null,
      variant: null,
      fuel_type: null,
      color: vehicle.color,
      status: vehicle.status,
      created_at: vehicle.lastServiceDate ? legacyDateToUtcIso(vehicle.lastServiceDate) : nowIso,
      updated_at: nowIso,
    };

    const { data, error } = await supabase
      .from("vehicles")
      .insert(insertPayload)
      .select("id, customer_id, plate_number, vin, make, model, year")
      .single();

    if (error) {
      throw error;
    }

    existingVehicles.push(data);
    vehicleIdByLegacyCarId.set(vehicle.legacyCarId, data.id);
    resolvedVehicleByLegacyCarId.set(vehicle.legacyCarId, data);
    result.vehiclesCreated += 1;
  }

  for (const quotation of importPlan.quotations) {
    const requestedCustomerId = customerIdByKey.get(quotation.customerKey);
    const resolvedVehicle = resolvedVehicleByLegacyCarId.get(quotation.vehicleLegacyCarId);
    const customerId = resolvedVehicle?.customer_id ?? requestedCustomerId;
    const vehicleId = resolvedVehicle?.id ?? vehicleIdByLegacyCarId.get(quotation.vehicleLegacyCarId);

    if (!customerId || !vehicleId) {
      throw new Error(`Missing customer or vehicle mapping for legacy quotation ${quotation.legacyId}.`);
    }

    if (requestedCustomerId && resolvedVehicle && resolvedVehicle.customer_id !== requestedCustomerId) {
      result.vehicleOwnerReconciliations += 1;
    }

    const existingQuotation = matchExistingQuotation(existingQuotations, {
      customerId,
      vehicleId,
      quotation,
    });

    if (existingQuotation) {
      quotationIdByLegacyId.set(quotation.legacyId, existingQuotation.id);
      quotationRecordByLegacyId.set(quotation.legacyId, existingQuotation);
      result.quotationsMatched += 1;
      continue;
    }

    const quotationNumber = await getNextDocumentNumber(supabase, "quotation", branchId);
    const createdAt = quotation.createdTimestamp ?? nowIso;

    const quotationPayload = {
      quotation_number: quotationNumber,
      branch_id: branchId,
      customer_id: customerId,
      vehicle_id: vehicleId,
      nature_of_repair: quotation.natureOfRepair,
      inspection_notes: "Imported from legacy quotation record.",
      status: quotation.status,
      subtotal: quotation.subtotal,
      discount: quotation.discount,
      tax: quotation.tax,
      total_amount: quotation.totalAmount,
      customer_name_snapshot: quotation.customerNameSnapshot,
      customer_contact_snapshot: quotation.customerContactSnapshot,
      customer_address_snapshot: quotation.customerAddressSnapshot,
      vehicle_make_snapshot: quotation.vehicleMakeSnapshot,
      vehicle_model_snapshot: quotation.vehicleModelSnapshot,
      vehicle_year_snapshot: quotation.vehicleYearSnapshot,
      vehicle_plate_number_snapshot: quotation.vehiclePlateNumberSnapshot,
      vehicle_vin_snapshot: quotation.vehicleVinSnapshot,
      prepared_by_name_snapshot: quotation.preparedBy,
      prepared_by_title_snapshot: quotation.preparedBy ? "Legacy system record" : null,
      created_by: null,
      approved_at: quotation.approvedTimestamp,
      rejected_at: quotation.rejectedTimestamp,
      created_at: createdAt,
      updated_at: nowIso,
    };

    const { data: insertedQuotation, error: quotationError } = await supabase
      .from("quotations")
      .insert(quotationPayload)
      .select("id, customer_id, vehicle_id, created_at, total_amount, nature_of_repair")
      .single();

    if (quotationError) {
      throw quotationError;
    }

    const quotationItemsPayload = quotation.items.map((item, index) => ({
      quotation_id: insertedQuotation.id,
      line_number: index + 1,
      item_type: item.itemType,
      product_id: null,
      service_id: null,
      description: item.description,
      quantity: item.quantity,
      unit_label_snapshot: null,
      unit_price: item.unitPrice,
      total: item.total,
      created_at: createdAt,
      updated_at: nowIso,
    }));

    if (quotationItemsPayload.length > 0) {
      const { error: itemsError } = await supabase.from("quotation_items").insert(quotationItemsPayload);
      if (itemsError) {
        throw itemsError;
      }
    }

    existingQuotations.push({
      id: insertedQuotation.id,
      customer_id: customerId,
      vehicle_id: vehicleId,
      created_at: createdAt,
      total_amount: quotation.totalAmount,
      nature_of_repair: quotation.natureOfRepair,
    });
    quotationRecordByLegacyId.set(quotation.legacyId, {
      id: insertedQuotation.id,
      customer_id: customerId,
      vehicle_id: vehicleId,
      created_at: createdAt,
      total_amount: quotation.totalAmount,
      nature_of_repair: quotation.natureOfRepair,
    });
    quotationIdByLegacyId.set(quotation.legacyId, insertedQuotation.id);
    result.quotationsCreated += 1;
  }

  for (const jobOrder of importPlan.jobOrders) {
    const requestedCustomerId = customerIdByKey.get(jobOrder.customerKey);
    const resolvedVehicle = resolvedVehicleByLegacyCarId.get(jobOrder.vehicleLegacyCarId);
    const customerId = resolvedVehicle?.customer_id ?? requestedCustomerId;
    const vehicleId = resolvedVehicle?.id ?? vehicleIdByLegacyCarId.get(jobOrder.vehicleLegacyCarId);

    if (!customerId || !vehicleId) {
      throw new Error(`Missing customer or vehicle mapping for legacy repair ${jobOrder.legacyId}.`);
    }

    if (requestedCustomerId && resolvedVehicle && resolvedVehicle.customer_id !== requestedCustomerId) {
      result.vehicleOwnerReconciliations += 1;
    }

    const existingJobOrder = matchExistingHistoricalJobOrder(existingJobOrders, {
      vehicleId,
      jobOrder,
    });

    if (existingJobOrder) {
      if (existingJobOrder.quotation_id) {
        usedQuotationIds.add(existingJobOrder.quotation_id);
      }
      result.jobOrdersMatched += 1;
      continue;
    }

    const linkedQuotationRecord = jobOrder.quotationLegacyId
      ? quotationRecordByLegacyId.get(jobOrder.quotationLegacyId) ?? null
      : null;
    let quotationId = linkedQuotationRecord?.id ?? null;

    if (quotationId && usedQuotationIds.has(quotationId)) {
      quotationId = null;
      result.quotationLinksDropped += 1;
    }

    if (
      quotationId &&
      linkedQuotationRecord &&
      (linkedQuotationRecord.customer_id !== customerId ||
        linkedQuotationRecord.vehicle_id !== vehicleId)
    ) {
      quotationId = null;
      result.quotationLinksDropped += 1;
    }

    const jobOrderNumber = await getNextDocumentNumber(supabase, "job_order", branchId);
    const serviceTimestamp = legacyDateToUtcIso(jobOrder.serviceDate);

    const jobOrderPayload = {
      job_order_number: jobOrderNumber,
      quotation_id: quotationId,
      branch_id: branchId,
      customer_id: customerId,
      vehicle_id: vehicleId,
      status: "completed",
      mileage_in: null,
      mileage_out: null,
      customer_concern: jobOrder.customerConcern,
      inspection_notes: jobOrder.inspectionNotes,
      diagnosis: jobOrder.diagnosis,
      work_performed: jobOrder.workPerformed,
      started_at: serviceTimestamp,
      completed_at: serviceTimestamp,
      released_at: null,
      is_historical: true,
      service_date: jobOrder.serviceDate,
      historical_recorded_at: nowIso,
      created_by: null,
      created_at: serviceTimestamp,
      updated_at: nowIso,
    };

    const { data: insertedJobOrder, error: jobOrderError } = await supabase
      .from("job_orders")
      .insert(jobOrderPayload)
      .select("id, quotation_id, vehicle_id, service_date, work_performed, is_historical")
      .single();

    if (jobOrderError) {
      throw jobOrderError;
    }

    const itemPayloads = jobOrder.items.map((item, index) => ({
      job_order_id: insertedJobOrder.id,
      source_quotation_item_id: null,
      line_number: index + 1,
      item_type: item.itemType,
      product_id: null,
      service_id: null,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total: item.total,
      is_additional: false,
      approval_status: "not_required",
      usage_status: "planned",
      checklist_completed: false,
      checklist_checked_at: null,
      checklist_checked_by_staff_id: null,
      approved_at: null,
      rejected_at: null,
      created_at: serviceTimestamp,
      updated_at: nowIso,
    }));

    if (itemPayloads.length > 0) {
      const { error: itemError } = await supabase.from("job_order_items").insert(itemPayloads);
      if (itemError) {
        throw itemError;
      }
    }

    if (quotationId) {
      usedQuotationIds.add(quotationId);
    }

    existingJobOrders.push(insertedJobOrder);
    result.jobOrdersCreated += 1;
  }

  return result;
}

async function loadExistingCustomers(supabase, branchId) {
  const { data, error } = await supabase
    .from("customers")
    .select("id, display_name, contact_number, address")
    .eq("branch_id", branchId);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function loadExistingVehicles(supabase, branchId) {
  const { data, error } = await supabase
    .from("vehicles")
    .select("id, customer_id, plate_number, vin, make, model, year")
    .eq("branch_id", branchId);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function loadExistingQuotations(supabase, branchId) {
  const { data, error } = await supabase
    .from("quotations")
    .select("id, customer_id, vehicle_id, created_at, total_amount, nature_of_repair")
    .eq("branch_id", branchId);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function loadExistingHistoricalJobOrders(supabase, branchId) {
  const { data, error } = await supabase
    .from("job_orders")
    .select("id, quotation_id, vehicle_id, service_date, work_performed, is_historical")
    .eq("branch_id", branchId)
    .eq("is_historical", true);

  if (error) {
    throw error;
  }

  return data ?? [];
}

function matchExistingCustomer(existingCustomers, customer) {
  const customerKey = buildCustomerKey(customer);

  return (
    existingCustomers.find((existing) => {
      const existingKey = buildCustomerKey({
        displayName: existing.display_name,
        contactNumber: existing.contact_number,
        address: existing.address,
      });

      return existingKey === customerKey;
    }) ?? null
  );
}

function matchExistingVehicle(existingVehicles, { customerId, vehicle }) {
  const normalizedPlate = normalizeKey(vehicle.plateNumber);
  const normalizedVin = normalizeKey(vehicle.vin);

  return (
    existingVehicles.find((existing) => {
      if (normalizedVin && normalizeKey(existing.vin) === normalizedVin) {
        return true;
      }

      if (normalizedPlate && normalizeKey(existing.plate_number) === normalizedPlate) {
        return true;
      }

      return (
        existing.customer_id === customerId &&
        normalizeKey(existing.make) === normalizeKey(vehicle.make) &&
        normalizeKey(existing.model) === normalizeKey(vehicle.model) &&
        Number(existing.year ?? 0) === Number(vehicle.year ?? 0)
      );
    }) ?? null
  );
}

function matchExistingQuotation(existingQuotations, { customerId, vehicleId, quotation }) {
  return (
    existingQuotations.find((existing) => {
      const existingDate = String(existing.created_at).slice(0, 10);
      return (
        existing.customer_id === customerId &&
        existing.vehicle_id === vehicleId &&
        existingDate === quotation.createdDate &&
        roundMoney(existing.total_amount) === quotation.totalAmount &&
        normalizeKey(existing.nature_of_repair) === normalizeKey(quotation.natureOfRepair)
      );
    }) ?? null
  );
}

function matchExistingHistoricalJobOrder(existingJobOrders, { vehicleId, jobOrder }) {
  return (
    existingJobOrders.find((existing) => {
      return (
        existing.vehicle_id === vehicleId &&
        existing.service_date === jobOrder.serviceDate &&
        normalizeKey(existing.work_performed) === normalizeKey(jobOrder.workPerformed)
      );
    }) ?? null
  );
}

async function getNextDocumentNumber(supabase, key, branchId) {
  const { data, error } = await supabase.rpc("next_document_number", {
    p_key: key,
    p_branch_id: branchId,
  });

  if (error) {
    throw error;
  }

  return String(data);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
