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
  allowPartialPayments: boolean;
  allowReleaseWithBalance: boolean;
  requireFullPaymentBeforeRelease: boolean;
  requireAdditionalItemPreApproval: boolean;
  enableBarcodeSupport: boolean;
  enableShelfLocation: boolean;
};

export type SettingsAuditEntry = {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
};

export type SettingsPageData = {
  branchName: string;
  settings: BusinessSettingsValues;
  documentSequences: SettingsDocumentSequence[];
  recentAuditEntries: SettingsAuditEntry[];
};
