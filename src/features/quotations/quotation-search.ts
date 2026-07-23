function escapeSearchTerm(value: string) {
  return value.replaceAll(",", "\\,");
}

export function buildQuotationSearchOrConditions(params: {
  search: string;
  customerIds?: string[];
  vehicleIds?: string[];
}) {
  const trimmedSearch = params.search.trim();

  if (!trimmedSearch) {
    return null;
  }

  const escapedSearch = escapeSearchTerm(trimmedSearch);
  const pattern = `%${escapedSearch}%`;
  const conditions = [
    `quotation_number.ilike.${pattern}`,
    `customer_name_snapshot.ilike.${pattern}`,
    `vehicle_plate_number_snapshot.ilike.${pattern}`,
    `vehicle_make_snapshot.ilike.${pattern}`,
    `vehicle_model_snapshot.ilike.${pattern}`,
  ];
  const customerIds = [...new Set(params.customerIds ?? [])];
  const vehicleIds = [...new Set(params.vehicleIds ?? [])];

  if (customerIds.length > 0) {
    conditions.push(`customer_id.in.(${customerIds.join(",")})`);
  }

  if (vehicleIds.length > 0) {
    conditions.push(`vehicle_id.in.(${vehicleIds.join(",")})`);
  }

  return conditions.join(",");
}
