import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ServiceHistoryLedger } from "@/features/service-history/components/service-history-ledger";
import type { ServiceHistoryEntry } from "@/features/service-history/types";

describe("ServiceHistoryLedger", () => {
  it("pins in-progress work above completed visits and lists each service task", () => {
    render(
      <ServiceHistoryLedger
        entries={[
          buildEntry({
            id: "done",
            jobOrderId: "done",
            jobOrderNumber: "JO-0094",
            phase: "history",
            status: "released",
            mileageIn: 48200,
            services: [task("oil", "Engine Oil & Filter Replacement")],
          }),
          buildEntry({
            id: "open",
            jobOrderId: "open",
            jobOrderNumber: "JO-0102",
            phase: "active",
            status: "in_progress",
            serviceDate: "2026-06-02T00:00:00.000+08:00",
            services: [task("brake", "Brake Inspection")],
          }),
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "In progress" })).toBeInTheDocument();
    expect(screen.getByText("JO-0102")).toBeInTheDocument();
    expect(screen.getByText("Engine Oil & Filter Replacement")).toBeInTheDocument();
    expect(screen.getByText("48,200 km")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Completed" })).toBeInTheDocument();
  });

  it("filters visits by task name and opens the row details", () => {
    render(
      <ServiceHistoryLedger
        entries={[
          buildEntry({
            jobOrderNumber: "JO-0097",
            diagnosis: "Worn plugs",
            services: [task("plugs", "Spark Plugs Replacement")],
          }),
          buildEntry({
            id: "oil-job",
            jobOrderId: "oil-job",
            jobOrderNumber: "JO-0094",
            services: [task("oil", "Engine Oil & Filter Replacement")],
          }),
        ]}
      />,
    );

    fireEvent.change(screen.getByRole("searchbox", { name: "Search service tasks" }), {
      target: { value: "spark" },
    });

    expect(screen.getByText("Spark Plugs Replacement")).toBeInTheDocument();
    expect(screen.queryByText("Engine Oil & Filter Replacement")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show details for JO-0097" }));

    expect(screen.getByText("Worn plugs")).toBeInTheDocument();
  });
});

function task(id: string, label: string): ServiceHistoryEntry["services"][number] {
  return {
    id,
    itemType: "service",
    label,
    quantity: 1,
    amount: 900,
    isAdditional: false,
    usageSource: "fallback",
  };
}

function buildEntry(overrides: Partial<ServiceHistoryEntry> = {}): ServiceHistoryEntry {
  return {
    id: "jo-1",
    vehicleId: "veh-1",
    vehicleLabel: "Toyota Vios",
    customerId: "cust-1",
    jobOrderId: "jo-1",
    jobOrderNumber: "JO-0001",
    status: "released",
    phase: "history",
    isHistorical: false,
    serviceDate: "2026-05-08T00:00:00.000+08:00",
    createdAt: "2026-05-08T00:00:00.000+08:00",
    startedAt: null,
    completedAt: null,
    releasedAt: null,
    customerConcern: null,
    inspectionNotes: null,
    diagnosis: null,
    workPerformed: null,
    mileageIn: null,
    mileageOut: null,
    services: [],
    partsUsed: [],
    rejectedExtras: [],
    mechanics: [],
    invoice: null,
    quotation: null,
    totalAmount: 1500,
    paymentMethod: null,
    ...overrides,
  };
}
