import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { JobOrderPrintLayout } from "@/components/reports/job-order-print-layout";
import type { JobOrderPrintDocument } from "@/features/job-orders/types";

vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    unoptimized: _unoptimized,
    ...props
  }: Record<string, unknown>) => <img {...props} />,
}));

const documentFixture: JobOrderPrintDocument = {
  jobOrder: {
    id: "job-order-1",
    jobOrderNumber: "JO-MAIN-0001",
    quotationId: "quotation-1",
    quotationNumber: "QT-MAIN-0001",
    customerId: "customer-1",
    customerName: "Louise Suresca",
    vehicleId: "vehicle-1",
    vehicleLabel: "Toyota Vios",
    status: "in_progress",
    createdAt: "2026-05-20T08:00:00.000Z",
    startedAt: "2026-05-20T09:00:00.000Z",
    completedAt: null,
    releasedAt: null,
    assignedMechanicCount: 1,
    billableTotal: 2700,
    pendingApprovalCount: 0,
    pendingApprovalTotal: 0,
    mileageIn: 25000,
    mileageOut: null,
    customerConcern: "Brake noise",
    inspectionNotes: "Inspect pads and rotors.",
    diagnosis: "Front pads worn out.",
    workPerformed: "Replace front pads and test drive.",
    invoiceId: null,
    invoiceNumber: null,
    invoiceStatus: null,
    invoiceTotalAmount: null,
    invoicePaidAmount: null,
    invoiceBalance: null,
    rejectedAdditionalTotal: 300,
    canEditDetails: true,
    canEditItems: true,
    canAssignMechanics: true,
    canAddAdditionalItems: true,
    canResolveAdditionalItems: true,
    canUpdateChecklist: true,
    canGenerateInvoice: false,
    canReleaseVehicle: false,
    availableNextStatuses: ["waiting_for_parts", "waiting_for_customer_approval", "completed", "cancelled"],
    mechanics: [
      {
        id: "assignment-1",
        staffId: "staff-1",
        fullName: "Alex Mechanic",
        taskDescription: "Brake service",
        startedAt: "2026-05-20T09:00:00.000Z",
        completedAt: null,
      },
    ],
    items: [
      {
        id: "item-1",
        sourceQuotationItemId: null,
        lineNumber: 1,
        itemType: "service",
        productId: null,
        serviceId: "service-1",
        description: "Brake inspection",
        quantity: 1,
        unitPrice: 700,
        total: 700,
        isAdditional: false,
        approvalStatus: "not_required",
        usageStatus: "planned",
        checklistCompleted: false,
        checklistCheckedAt: null,
        checklistCheckedByStaffId: null,
        checklistCheckedByName: null,
        approvedAt: null,
        rejectedAt: null,
        inventoryTracking: null,
      },
      {
        id: "item-2",
        sourceQuotationItemId: null,
        lineNumber: 2,
        itemType: "product",
        productId: "product-1",
        serviceId: null,
        description: "Front brake pads",
        quantity: 1,
        unitPrice: 2000,
        total: 2000,
        isAdditional: false,
        approvalStatus: "approved",
        usageStatus: "used",
        checklistCompleted: true,
        checklistCheckedAt: "2026-05-20T10:00:00.000Z",
        checklistCheckedByStaffId: "staff-1",
        checklistCheckedByName: "Alex Mechanic",
        approvedAt: "2026-05-20T08:30:00.000Z",
        rejectedAt: null,
        inventoryTracking: {
          hasStockRecord: true,
          quantityOnHand: 6,
          availableQuantity: 5,
          reorderLevel: 2,
          shelfLocation: "A-02",
          isLowStock: false,
          usedQuantity: 1,
          returnedQuantity: 0,
          netUsedQuantity: 1,
          remainingUsageQuantity: 0,
          usageHistory: [],
        },
      },
      {
        id: "item-3",
        sourceQuotationItemId: null,
        lineNumber: 3,
        itemType: "labor",
        productId: null,
        serviceId: null,
        description: "Extra polishing",
        quantity: 1,
        unitPrice: 300,
        total: 300,
        isAdditional: true,
        approvalStatus: "rejected",
        usageStatus: "cancelled",
        checklistCompleted: false,
        checklistCheckedAt: null,
        checklistCheckedByStaffId: null,
        checklistCheckedByName: null,
        approvedAt: null,
        rejectedAt: "2026-05-20T11:00:00.000Z",
        inventoryTracking: null,
      },
    ],
    customerContactNumber: "09171234567",
    customerAddress: "Quezon City",
    vehicleMake: "Toyota",
    vehicleModel: "Vios",
    vehicleYear: 2020,
    vehiclePlateNumber: "ABC1234",
    vehicleVin: "VIN123",
    preparedByName: "Nia Grace Ariete",
    preparedByTitle: "Service Advisor",
  },
  businessProfile: {
    businessName: "SAY Auto Care Center",
    businessLogoUrl: null,
    businessVatRegistrationNo: "123-456-789-000",
    businessContact: "09171234567",
    businessEmail: "hello@sayautocare.com",
    businessAddress: "Quezon City",
  },
};

describe("JobOrderPrintLayout", () => {
  it("renders grouped checklist-style work items with checkbox indicators", () => {
    render(<JobOrderPrintLayout document={documentFixture} />);

    expect(screen.getByText("Services / Labor")).toBeInTheDocument();
    expect(screen.getByText("Parts / Products")).toBeInTheDocument();
    expect(screen.getByText("Checklist: Open")).toBeInTheDocument();
    expect(screen.getByText("Checklist: Completed")).toBeInTheDocument();
    expect(screen.getByText("Checklist: Rejected")).toBeInTheDocument();
    expect(screen.getAllByText("☐").length).toBeGreaterThan(0);
    expect(screen.getByText("☑")).toBeInTheDocument();
  });
});
