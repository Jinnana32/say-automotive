import type { TableRow } from "@/types/database";

import type {
  BusinessSettingsValues,
  SettingsAuditEntry,
  SettingsDocumentSequence,
  SettingsDocumentSequenceKey,
} from "@/features/settings/types";
import { buildBusinessLogoUrl } from "@/lib/storage";

type BusinessSettingsRow = TableRow<"business_settings">;
type DocumentSequenceRow = TableRow<"document_sequences">;
type AuditLogRow = Pick<TableRow<"audit_logs">, "id" | "action" | "entity_type" | "created_at">;

const DOCUMENT_SEQUENCE_LABELS: Record<SettingsDocumentSequenceKey, string> = {
  quotation: "Quotation numbers",
  job_order: "Job order numbers",
  invoice: "Invoice numbers",
  sale: "POS sale numbers",
};

export function mapBusinessSettingsRowToValues(
  row: BusinessSettingsRow,
): BusinessSettingsValues {
  return {
    businessName: row.business_name,
    businessLogoUrl: buildBusinessLogoUrl(row.business_logo_path),
    businessAddress: row.business_address ?? "",
    businessContact: row.business_contact ?? "",
    businessEmail: row.business_email ?? "",
    businessVatRegistrationNo: row.business_vat_registration_no ?? "",
    receiptFooter: row.receipt_footer ?? "",
    defaultTaxRate: String(row.default_tax_rate),
    allowPartialPayments: row.allow_partial_payments,
    allowReleaseWithBalance: row.allow_release_with_balance,
    requireFullPaymentBeforeRelease: row.require_full_payment_before_release,
    requireAdditionalItemPreApproval: row.require_additional_item_preapproval,
    enableBarcodeSupport: row.enable_barcode_support,
    enableShelfLocation: row.enable_shelf_location,
  };
}

export function mapDocumentSequenceRowToItem(
  row: DocumentSequenceRow,
): SettingsDocumentSequence {
  return {
    key: row.key as SettingsDocumentSequenceKey,
    label: DOCUMENT_SEQUENCE_LABELS[row.key as SettingsDocumentSequenceKey] ?? row.key,
    prefix: row.prefix,
    padding: row.padding,
    lastValue: Number(row.last_value),
  };
}

export function mapAuditLogRowToEntry(row: AuditLogRow): SettingsAuditEntry {
  return {
    id: row.id,
    action: row.action,
    entityType: row.entity_type,
    createdAt: row.created_at,
  };
}
