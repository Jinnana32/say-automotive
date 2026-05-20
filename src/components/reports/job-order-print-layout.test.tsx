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
    allowReleaseWithBalance: false,
    requireFullPaymentBeforeRelease: true,
    requireInvoiceBeforeJobCompletion: false,
    requireInvoiceBeforeVehicleRelease: false,
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
    canUpdateStatus: true,
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
  it("keeps short job orders on one page when the closing sections still fit", () => {
    const { container } = render(<JobOrderPrintLayout document={documentFixture} />);

    expect(container.querySelectorAll(".print-page")).toHaveLength(1);
    expect(screen.getByText("Prepared by:")).toBeInTheDocument();
    expect(screen.getByText("Nia Grace Ariete")).toBeInTheDocument();
    expect(screen.getByText("Service Advisor")).toBeInTheDocument();
  });

  it("renders grouped checklist-style work items with checkbox indicators", () => {
    render(<JobOrderPrintLayout document={documentFixture} />);

    expect(screen.getByText("Services / Labor")).toBeInTheDocument();
    expect(screen.getByText("Parts / Products")).toBeInTheDocument();
    expect(screen.queryByText("Type")).not.toBeInTheDocument();
    expect(screen.queryByText(/Checklist:/)).not.toBeInTheDocument();
    expect(screen.getAllByText("☐").length).toBeGreaterThan(0);
    expect(screen.getByText("☑")).toBeInTheDocument();
  });

  it("hides optional narrative blocks when the values are empty or dash-only", () => {
    const sparseDocument: JobOrderPrintDocument = {
      ...documentFixture,
      jobOrder: {
        ...documentFixture.jobOrder,
        customerConcern: "   ",
        inspectionNotes: "—",
        diagnosis: "-",
        workPerformed: null,
      },
    };

    render(<JobOrderPrintLayout document={sparseDocument} />);

    expect(screen.queryByText("Customer Concern")).not.toBeInTheDocument();
    expect(screen.queryByText("Inspection Notes")).not.toBeInTheDocument();
    expect(screen.queryByText("Diagnosis")).not.toBeInTheDocument();
    expect(screen.queryByText("Work Performed")).not.toBeInTheDocument();
  });

  it("does not repeat work items on page 2 when the work list already fits on page 1", () => {
    const splitDocument: JobOrderPrintDocument = {
      ...documentFixture,
      jobOrder: {
        ...documentFixture.jobOrder,
        customerConcern: null,
        inspectionNotes: null,
        diagnosis: null,
        workPerformed: null,
        mechanics: Array.from({ length: 5 }, (_, index) => ({
          id: `assignment-${index + 1}`,
          staffId: `staff-${index + 1}`,
          fullName: `Mechanic ${index + 1}`,
          taskDescription: `Task ${index + 1}`,
          startedAt: "2026-05-20T09:00:00.000Z",
          completedAt: null,
        })),
        items: Array.from({ length: 6 }, (_, index) => ({
          id: `product-item-${index + 1}`,
          sourceQuotationItemId: null,
          lineNumber: index + 1,
          itemType: "product",
          productId: `product-${index + 1}`,
          serviceId: null,
          description: `Part ${index + 1} with a slightly longer description for print pagination coverage`,
          quantity: 1,
          unitPrice: 800 + index * 100,
          total: 800 + index * 100,
          isAdditional: false,
          approvalStatus: "approved",
          usageStatus: "used",
          checklistCompleted: index % 2 === 0,
          checklistCheckedAt: index % 2 === 0 ? "2026-05-20T10:00:00.000Z" : null,
          checklistCheckedByStaffId: index % 2 === 0 ? "staff-1" : null,
          checklistCheckedByName: index % 2 === 0 ? "Alex Mechanic" : null,
          approvedAt: "2026-05-20T08:30:00.000Z",
          rejectedAt: null,
          inventoryTracking: {
            hasStockRecord: true,
            quantityOnHand: 20,
            availableQuantity: 14,
            reorderLevel: 2,
            shelfLocation: "A-02",
            isLowStock: false,
            usedQuantity: 1,
            returnedQuantity: 0,
            netUsedQuantity: 1,
            remainingUsageQuantity: 0,
            usageHistory: [],
          },
        })),
      },
    };

    const { container } = render(<JobOrderPrintLayout document={splitDocument} />);

    expect(container.querySelectorAll(".print-page").length).toBeGreaterThan(1);
    expect(screen.getAllByText("WORK ITEMS")).toHaveLength(1);
    expect(screen.getAllByText("PARTS USAGE").length).toBeGreaterThan(0);
  });

  it("renders explicit print pages with a footer on each page for longer job orders", () => {
    const longDocument: JobOrderPrintDocument = {
      ...documentFixture,
      jobOrder: {
        ...documentFixture.jobOrder,
        mechanics: Array.from({ length: 3 }, (_, index) => ({
          id: `assignment-${index + 1}`,
          staffId: `staff-${index + 1}`,
          fullName: `Mechanic ${index + 1}`,
          taskDescription: `Task ${index + 1}`,
          startedAt: "2026-05-20T09:00:00.000Z",
          completedAt: null,
        })),
        items: Array.from({ length: 14 }, (_, index) => ({
          id: `item-${index + 1}`,
          sourceQuotationItemId: null,
          lineNumber: index + 1,
          itemType: index % 3 === 0 ? "product" : index % 2 === 0 ? "labor" : "service",
          productId: index % 3 === 0 ? `product-${index + 1}` : null,
          serviceId: index % 3 === 0 ? null : `service-${index + 1}`,
          description: `Extended work item ${index + 1} with enough text to force taller print rows and pagination behavior`,
          quantity: 1,
          unitPrice: 500 + index * 100,
          total: 500 + index * 100,
          isAdditional: index > 8,
          approvalStatus: index > 10 ? "pending" : "approved",
          usageStatus: index % 3 === 0 ? "used" : "planned",
          checklistCompleted: index % 2 === 0,
          checklistCheckedAt: index % 2 === 0 ? "2026-05-20T10:00:00.000Z" : null,
          checklistCheckedByStaffId: index % 2 === 0 ? "staff-1" : null,
          checklistCheckedByName: index % 2 === 0 ? "Alex Mechanic" : null,
          approvedAt: index > 10 ? null : "2026-05-20T08:30:00.000Z",
          rejectedAt: null,
          inventoryTracking:
            index % 3 === 0
              ? {
                  hasStockRecord: true,
                  quantityOnHand: 10,
                  availableQuantity: 8,
                  reorderLevel: 2,
                  shelfLocation: "A-02",
                  isLowStock: false,
                  usedQuantity: 1,
                  returnedQuantity: 0,
                  netUsedQuantity: 1,
                  remainingUsageQuantity: 0,
                  usageHistory: [],
                }
              : null,
        })),
      },
    };

    const { container } = render(<JobOrderPrintLayout document={longDocument} />);
    const pageCount = container.querySelectorAll(".print-page").length;

    expect(pageCount).toBeGreaterThan(1);
    expect(container.querySelectorAll(".print-document-footer").length).toBe(pageCount);
    expect(screen.getAllByRole("heading", { name: "Job Order" }).length).toBeGreaterThan(1);
  });
});
