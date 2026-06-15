export type SettingsDocumentSequenceKey =
  | "quotation"
  | "job_order"
  | "invoice"
  | "sale";

export type SettingsDocumentSequence = {
  key: SettingsDocumentSequenceKey;
  label: string;
  prefix: string;
  padding: number;
  lastValue: number;
};

export type BusinessSettingsValues = {
  businessName: string;
  businessLogoUrl: string | null;
  businessAddress: string;
  businessContact: string;
  businessEmail: string;
  businessVatRegistrationNo: string;
  receiptFooter: string;
  defaultTaxRate: string;
  allowGlobalProductCatalog: boolean;
  allowGlobalServiceCatalog: boolean;
  allowPartialPayments: boolean;
  requireInvoiceBeforeJobCompletion: boolean;
  requireInvoiceBeforeVehicleRelease: boolean;
  allowReleaseWithBalance: boolean;
  requireFullPaymentBeforeRelease: boolean;
  requireAdditionalItemPreApproval: boolean;
  enableBarcodeSupport: boolean;
  enableShelfLocation: boolean;
  payrollStandardDailyHours: string;
  payrollHolidayPremiumRate: string;
};

export type BusinessBranding = {
  businessName: string;
  businessLogoUrl: string | null;
};

export type SettingsPageData = {
  branchName: string;
  settings: BusinessSettingsValues;
  documentSequences: SettingsDocumentSequence[];
};
