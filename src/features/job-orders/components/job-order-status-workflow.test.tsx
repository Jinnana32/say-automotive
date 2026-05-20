import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { JobOrderStatusWorkflow } from "@/features/job-orders/components/job-order-status-workflow";
import type { JobOrderDetail } from "@/features/job-orders/types";

vi.mock("@/features/job-orders/actions/job-order-actions", () => ({
  updateJobOrderStatusAction: vi.fn(),
}));

vi.mock("@/features/invoices/actions/invoice-actions", () => ({
  releaseJobOrderVehicleAction: vi.fn(),
}));

const baseJobOrder: JobOrderDetail = {
  id: "job-order-1",
  jobOrderNumber: "JO-MAIN-0001",
  quotationId: null,
  quotationNumber: null,
  customerId: "customer-1",
  customerName: "Louise Suresca",
  vehicleId: "vehicle-1",
  vehicleLabel: "2019 Toyota Vios",
  status: "in_progress",
  createdAt: "2026-05-20T00:00:00.000Z",
  startedAt: "2026-05-20T01:00:00.000Z",
  completedAt: null,
  releasedAt: null,
  assignedMechanicCount: 1,
  billableTotal: 2400,
  pendingApprovalCount: 0,
  pendingApprovalTotal: 0,
  mileageIn: 12000,
  mileageOut: null,
  customerConcern: null,
  inspectionNotes: null,
  diagnosis: null,
  workPerformed: null,
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
  items: [],
  mechanics: [],
  rejectedAdditionalTotal: 0,
  canEditDetails: true,
  canEditItems: true,
  canAssignMechanics: true,
  canAddAdditionalItems: true,
  canResolveAdditionalItems: true,
  canUpdateChecklist: true,
  canUpdateStatus: true,
  canGenerateInvoice: false,
  canReleaseVehicle: true,
  availableNextStatuses: [
    "waiting_for_parts",
    "waiting_for_customer_approval",
    "completed",
    "cancelled",
  ],
};

describe("JobOrderStatusWorkflow", () => {
  it("renders a compact trigger with the available status summary", () => {
    render(<JobOrderStatusWorkflow jobOrder={baseJobOrder} redirectTab="overview" />);

    expect(screen.getByText("Status workflow")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Available now: Waiting for Parts, Waiting for Customer Approval, Completed, Released, Cancelled\./i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Change status/i }),
    ).toBeEnabled();
  });

  it("opens the modal workflow without showing ready for billing as a selectable choice", async () => {
    const user = userEvent.setup();

    render(<JobOrderStatusWorkflow jobOrder={baseJobOrder} redirectTab="overview" />);

    await user.click(screen.getByRole("button", { name: /Change status/i }));

    expect(screen.getByText("Update job order status")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Current In Progress/i })).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(screen.getByRole("button", { name: /Completed/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Released/i })).toBeEnabled();
    expect(screen.queryByRole("button", { name: /Ready for Billing/i })).not.toBeInTheDocument();
  });

  it("shows inline confirmation content when an available status is clicked", async () => {
    const user = userEvent.setup();

    render(<JobOrderStatusWorkflow jobOrder={baseJobOrder} redirectTab="overview" />);

    await user.click(screen.getByRole("button", { name: /Change status/i }));
    await user.click(screen.getByRole("button", { name: /Completed/i }));

    expect(screen.getByText("Target")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Move to Completed/i }),
    ).toBeInTheDocument();
  });
});
