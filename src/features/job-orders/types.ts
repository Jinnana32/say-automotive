export type JobOrderStatus =
  | "pending"
  | "in_progress"
  | "waiting_for_parts"
  | "waiting_for_customer_approval"
  | "completed"
  | "ready_for_billing"
  | "paid"
  | "released"
  | "cancelled";

export const JOB_ORDER_DETAIL_TABS = [
  "overview",
  "billing",
  "work-items",
  "parts-usage",
  "mechanics",
] as const;

export type JobOrderDetailTab = (typeof JOB_ORDER_DETAIL_TABS)[number];

export type JobOrderItemType = "product" | "service" | "labor";
export type JobOrderApprovalStatus = "not_required" | "pending" | "approved" | "rejected";
export type JobOrderUsageStatus = "planned" | "used" | "returned" | "cancelled";
export type JobOrderPartUsageType = "use" | "return";

export type JobOrderListItem = {
  id: string;
  jobOrderNumber: string;
  quotationId: string | null;
  quotationNumber: string | null;
  customerId: string;
  customerName: string;
  vehicleId: string;
  vehicleLabel: string;
  status: JobOrderStatus;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  releasedAt: string | null;
  assignedMechanicCount: number;
  billableTotal: number;
  pendingApprovalCount: number;
  pendingApprovalTotal: number;
};

export type JobOrderItemDetail = {
  id: string;
  sourceQuotationItemId: string | null;
  lineNumber: number;
  itemType: JobOrderItemType;
  productId: string | null;
  serviceId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  isAdditional: boolean;
  approvalStatus: JobOrderApprovalStatus;
  usageStatus: JobOrderUsageStatus;
  approvedAt: string | null;
  rejectedAt: string | null;
  inventoryTracking: JobOrderItemInventoryTracking | null;
};

export type JobOrderPartUsageEntry = {
  id: string;
  usageType: JobOrderPartUsageType;
  quantity: number;
  notes: string | null;
  createdAt: string;
  previousQuantity: number;
  newQuantity: number;
};

export type JobOrderItemInventoryTracking = {
  hasStockRecord: boolean;
  quantityOnHand: number | null;
  availableQuantity: number | null;
  reorderLevel: number | null;
  shelfLocation: string | null;
  isLowStock: boolean;
  usedQuantity: number;
  returnedQuantity: number;
  netUsedQuantity: number;
  remainingUsageQuantity: number;
  usageHistory: JobOrderPartUsageEntry[];
};

export type JobOrderMechanicAssignment = {
  id: string;
  staffId: string;
  fullName: string;
  taskDescription: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

export type JobOrderDetail = JobOrderListItem & {
  mileageIn: number | null;
  mileageOut: number | null;
  customerConcern: string | null;
  inspectionNotes: string | null;
  diagnosis: string | null;
  workPerformed: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
  invoiceStatus: "unpaid" | "partially_paid" | "paid" | "cancelled" | null;
  invoiceTotalAmount: number | null;
  invoicePaidAmount: number | null;
  invoiceBalance: number | null;
  items: JobOrderItemDetail[];
  mechanics: JobOrderMechanicAssignment[];
  rejectedAdditionalTotal: number;
  canEditDetails: boolean;
  canAssignMechanics: boolean;
  canAddAdditionalItems: boolean;
  canResolveAdditionalItems: boolean;
  canGenerateInvoice: boolean;
  canReleaseVehicle: boolean;
  availableNextStatuses: JobOrderStatus[];
};

export type JobOrderPrintDetail = JobOrderDetail & {
  customerContactNumber: string | null;
  customerAddress: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  vehiclePlateNumber: string | null;
  vehicleVin: string | null;
  preparedByName: string | null;
  preparedByTitle: string | null;
};

export type JobOrderPrintBusinessProfile = {
  businessName: string;
  businessContact: string | null;
  businessEmail: string | null;
  businessAddress: string | null;
};

export type JobOrderPrintDocument = {
  jobOrder: JobOrderPrintDetail;
  businessProfile: JobOrderPrintBusinessProfile;
};

export type JobOrderMechanicOption = {
  id: string;
  label: string;
};

export type JobOrderProductOption = {
  id: string;
  label: string;
  sku: string | null;
  unitPrice: number;
};

export type JobOrderServiceOption = {
  id: string;
  label: string;
  category: string | null;
  unitPrice: number;
};

export type JobOrderFormOptions = {
  mechanics: JobOrderMechanicOption[];
  products: JobOrderProductOption[];
  services: JobOrderServiceOption[];
};

export type JobOrderDetailsFormValues = {
  jobOrderId: string;
  mileageIn: string;
  mileageOut: string;
  customerConcern: string;
  inspectionNotes: string;
  diagnosis: string;
  workPerformed: string;
};

export type JobOrderMechanicAssignmentFormValues = {
  jobOrderId: string;
  staffId: string;
  taskDescription: string;
};

export type JobOrderAdditionalItemFormValues = {
  jobOrderId: string;
  itemType: JobOrderItemType;
  productId: string;
  serviceId: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

export type JobOrderPartUsageFormValues = {
  jobOrderId: string;
  jobOrderItemId: string;
  quantity: string;
  notes: string;
};
