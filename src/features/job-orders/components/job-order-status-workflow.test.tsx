import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { JobOrderStatusWorkflow } from "@/features/job-orders/components/job-order-status-workflow";
import type { JobOrderDetail, JobOrderStatus } from "@/features/job-orders/types";

vi.mock("@/features/job-orders/actions/job-order-actions", () => ({
  updateJobOrderStatusAction: vi.fn(),
}));

vi.mock("@/features/invoices/actions/invoice-actions", () => ({
  releaseJobOrderVehicleAction: vi.fn(),
}));

function buildJobOrder(
  status: JobOrderStatus,
  overrides: Partial<JobOrderDetail> = {},
): JobOrderDetail {
  return {
    id: "job-order-1",
    jobOrderNumber: "JO-MAIN-0001",
    quotationId: null,
    quotationNumber: null,
    customerId: "customer-1",
    customerName: "Louise Suresca",
    vehicleId: "vehicle-1",
    vehicleLabel: "2019 Toyota Vios",
    status,
    createdAt: "2026-05-20T00:00:00.000Z",
    startedAt: "2026-05-20T01:00:00.000Z",
    completedAt: status === "completed" || status === "ready_for_billing" || status === "paid"
      ? "2026-05-20T04:00:00.000Z"
      : null,
    releasedAt: status === "released" ? "2026-05-20T05:00:00.000Z" : null,
    isHistorical: false,
    serviceDate: null,
    historicalRecordedAt: null,
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
    canReleaseVehicle: status === "completed" || status === "ready_for_billing" || status === "paid",
    canDelete: false,
    availableNextStatuses:
      status === "pending"
        ? ["in_progress", "cancelled"]
        : status === "in_progress" ||
            status === "waiting_for_parts" ||
            status === "waiting_for_customer_approval"
          ? ["completed", "cancelled"]
          : [],
    ...overrides,
  };
}

describe("JobOrderStatusWorkflow", () => {
  it("shows Start Job for pending records", () => {
    render(
      <JobOrderStatusWorkflow
        jobOrder={buildJobOrder("pending")}
        redirectTab="overview"
      />,
    );

    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Start Job/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Cancel Job/i }),
    ).not.toBeInTheDocument();
  });

  it("shows Mark Completed and Cancel Job for in-progress records", () => {
    render(
      <JobOrderStatusWorkflow
        jobOrder={buildJobOrder("in_progress")}
        redirectTab="overview"
      />,
    );

    expect(
      screen.getByRole("button", { name: /Mark Completed/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Cancel Job/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Release Vehicle/i }),
    ).not.toBeInTheDocument();
  });

  it("maps legacy waiting statuses to the simplified in-progress actions", () => {
    render(
      <JobOrderStatusWorkflow
        jobOrder={buildJobOrder("waiting_for_parts")}
        redirectTab="overview"
      />,
    );

    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.queryByText("Waiting for Parts")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Mark Completed/i }),
    ).toBeInTheDocument();
  });

  it("shows Release Vehicle for completed-stage records and opens a small confirmation dialog", async () => {
    const user = userEvent.setup();

    render(
      <JobOrderStatusWorkflow
        jobOrder={buildJobOrder("completed")}
        redirectTab="overview"
      />,
    );

    await user.click(screen.getByRole("button", { name: /Release Vehicle/i }));

    const dialog = screen.getByRole("dialog");

    expect(screen.getByText(/Release JO-MAIN-0001\?/i)).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: /^Release Vehicle$/i }),
    ).toBeInTheDocument();
  });

  it("shows terminal copy without action buttons for released and cancelled records", () => {
    const { rerender } = render(
      <JobOrderStatusWorkflow
        jobOrder={buildJobOrder("released", { canReleaseVehicle: false })}
        redirectTab="overview"
      />,
    );

    expect(screen.getByText("Vehicle released.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Release Vehicle/i }),
    ).not.toBeInTheDocument();

    rerender(
      <JobOrderStatusWorkflow
        jobOrder={buildJobOrder("cancelled", { canUpdateStatus: false })}
        redirectTab="overview"
      />,
    );

    expect(screen.getByText("Job cancelled.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Start Job|Mark Completed|Cancel Job/i }),
    ).not.toBeInTheDocument();
  });
});
