import type { InvoiceStatus, PaymentMethod } from "@/features/invoices/types";

export type PosCustomerOption = {
  id: string;
  label: string;
};

export type PosProductOption = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  imageUrl: string | null;
  unitLabel: string;
  sellingPrice: number;
  availableQuantity: number;
  reorderLevel: number | null;
  shelfLocation: string | null;
  hasStockRecord: boolean;
  isLowStock: boolean;
};

export type PosTerminalConfig = {
  branchId: string;
  branchCode: string;
  branchName: string;
  businessName: string;
  defaultTaxRate: number;
  allowPartialPayments: boolean;
  enableBarcodeSupport: boolean;
  receiptFooter: string | null;
};

export type PosTerminalData = {
  config: PosTerminalConfig;
  customers: PosCustomerOption[];
  products: PosProductOption[];
  permissions: {
    canCreateProducts: boolean;
  };
};

export type PosCartItem = {
  productId: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  unitLabel: string;
  unitPrice: number;
  availableQuantity: number;
  quantity: number;
  shelfLocation: string | null;
  hasStockRecord: boolean;
  isLowStock: boolean;
};

export type PosSerializedItem = {
  productId: string;
  quantity: number;
};

export type PosRecentSaleItem = {
  id: string;
  saleNumber: string;
  customerName: string;
  totalAmount: number;
  invoiceId: string | null;
  invoiceNumber: string | null;
  invoiceStatus: InvoiceStatus | null;
  paymentMethod: PaymentMethod | null;
  createdAt: string;
};
