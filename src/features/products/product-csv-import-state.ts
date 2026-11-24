export type ProductCsvImportRowResult = {
  rowNumber: number;
  name: string;
  status: "created" | "skipped" | "failed";
  message: string;
};

export type ProductCsvImportState = {
  status: "idle" | "success" | "error";
  message: string;
  createdCount: number;
  skippedCount: number;
  failedCount: number;
  results: ProductCsvImportRowResult[];
};

export const INITIAL_PRODUCT_CSV_IMPORT_STATE: ProductCsvImportState = {
  status: "idle",
  message: "",
  createdCount: 0,
  skippedCount: 0,
  failedCount: 0,
  results: [],
};
