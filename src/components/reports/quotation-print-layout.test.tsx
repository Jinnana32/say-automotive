import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { QuotationPrintLayout } from "@/components/reports/quotation-print-layout";
import type { QuotationPrintDocument } from "@/features/quotations/types";

vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    unoptimized: _unoptimized,
    ...props
  }: Record<string, unknown>) => <img {...props} />,
}));

const documentFixture: QuotationPrintDocument = {
  quotation: {
    id: "quotation-1",
    quotationNumber: "QT-MAIN-0001",
    branchId: "branch-main",
    customerId: "customer-1",
    customerName: "Louise Suresca",
    vehicleId: "vehicle-1",
    vehicleLabel: "Toyota Vios",
    status: "draft",
    subtotal: 1790,
    discount: 0,
    tax: 0,
    totalAmount: 1790,
    createdAt: "2026-05-20T08:00:00.000Z",
    approvedAt: null,
    customerContactNumber: "09171234567",
    customerAddress: "Quezon City",
    vehicleMake: "Toyota",
    vehicleModel: "Vios",
    vehicleYear: 2020,
    vehiclePlateNumber: "ABC1234",
    vehicleVin: "VIN123",
    natureOfRepair: "Oil change and brake inspection.",
    inspectionNotes: null,
    preparedByName: "Nia Grace Ariete",
    preparedByTitle: "Admin",
    items: [
      {
        id: "item-1",
        lineNumber: 1,
        itemType: "product",
        productId: "product-1",
        serviceId: null,
        description: "Engine Oil",
        quantity: 1,
        unitLabel: "bottle",
        unitPrice: 790,
        total: 790,
      },
      {
        id: "item-2",
        lineNumber: 2,
        itemType: "service",
        productId: null,
        serviceId: "service-1",
        description: "Brake Inspection",
        quantity: 1,
        unitLabel: null,
        unitPrice: 1000,
        total: 1000,
      },
    ],
    jobOrderId: null,
    jobOrderNumber: null,
  },
  businessProfile: {
    businessName: "SAY Auto Care Center",
    businessLogoUrl: null,
    businessVatRegistrationNo: "123-456-789-000",
    businessContact: "09171234567",
    businessEmail: "hello@sayautocare.com",
    businessAddress: "Quezon City",
  },
  customerSnapshot: {
    companyName: null,
    email: "louise@example.com",
  },
  vehicleSnapshot: {
    color: "Silver",
    mileage: 25000,
  },
  validUntil: "2026-05-27T08:00:00.000Z",
};

describe("QuotationPrintLayout", () => {
  it("renders the approval section with the simplified reference layout", () => {
    render(<QuotationPrintLayout document={documentFixture} mode="full" />);

    expect(screen.getByText("APPROVAL")).toBeInTheDocument();
    expect(
      screen.getByText(
        "I have read and agree to the terms and conditions stated above and authorize SAY Auto Care to proceed with the listed services.",
      ),
    ).toBeInTheDocument();

    expect(screen.getByText("Customer Signature:")).toBeInTheDocument();
    expect(screen.getByText("Name:")).toBeInTheDocument();
    expect(screen.getByText("Date:")).toBeInTheDocument();

    expect(screen.queryByText("Printed Name:")).not.toBeInTheDocument();
    expect(screen.queryByText("Adviser Signature:")).not.toBeInTheDocument();
    expect(screen.queryByText("Role:")).not.toBeInTheDocument();

    const preparedByBlock = screen.getByText("Prepared By:").parentElement;

    expect(preparedByBlock).not.toBeNull();

    const preparedByContent = within(preparedByBlock as HTMLElement);

    expect(preparedByContent.getByText("Nia Grace Ariete")).toBeInTheDocument();
    expect(preparedByContent.getByText("Admin")).toBeInTheDocument();
  });

  it("keeps the closing sections on page 1 for medium quotations when they still fit", () => {
    const mediumDocument: QuotationPrintDocument = {
      ...documentFixture,
      quotation: {
        ...documentFixture.quotation,
        natureOfRepair: null,
        items: [
          {
            id: "item-1",
            lineNumber: 1,
            itemType: "product",
            productId: "product-1",
            serviceId: null,
            description: "Fully synthetic engine oil",
            quantity: 1,
            unitLabel: "bottle",
            unitPrice: 790,
            total: 790,
          },
          {
            id: "item-2",
            lineNumber: 2,
            itemType: "product",
            productId: "product-2",
            serviceId: null,
            description: "Oil filter",
            quantity: 1,
            unitLabel: "pc",
            unitPrice: 420,
            total: 420,
          },
          {
            id: "item-3",
            lineNumber: 3,
            itemType: "service",
            productId: null,
            serviceId: "service-1",
            description: "Brake inspection and cleaning",
            quantity: 1,
            unitLabel: null,
            unitPrice: 1000,
            total: 1000,
          },
          {
            id: "item-4",
            lineNumber: 4,
            itemType: "service",
            productId: null,
            serviceId: "service-2",
            description: "Battery terminal cleaning",
            quantity: 1,
            unitLabel: null,
            unitPrice: 350,
            total: 350,
          },
          {
            id: "item-5",
            lineNumber: 5,
            itemType: "labor",
            productId: null,
            serviceId: null,
            description: "General preventive maintenance labor",
            quantity: 1,
            unitLabel: null,
            unitPrice: 600,
            total: 600,
          },
        ],
      },
    };

    const { container } = render(
      <QuotationPrintLayout document={mediumDocument} mode="full" />,
    );

    expect(container.querySelectorAll(".print-page")).toHaveLength(1);
    expect(screen.getByText("TERMS & CONDITIONS")).toBeInTheDocument();
    expect(screen.getByText("QUOTATION SUMMARY")).toBeInTheDocument();
    expect(screen.getByText("APPROVAL")).toBeInTheDocument();
  });

  it("splits long quotations into explicit print pages with a footer on every page", () => {
    const longDocument: QuotationPrintDocument = {
      ...documentFixture,
      quotation: {
        ...documentFixture.quotation,
        items: Array.from({ length: 18 }, (_, index) => ({
          id: `item-${index + 1}`,
          lineNumber: index + 1,
          itemType: index < 9 ? "product" : "service",
          productId: index < 9 ? `product-${index + 1}` : null,
          serviceId: index >= 9 ? `service-${index + 1}` : null,
          description:
            index < 9
              ? `Performance part line ${index + 1} with additional fitment notes to simulate a longer printed row`
              : `Labor operation ${index + 1} with extended diagnostic detail for pagination`,
          quantity: 1,
          unitLabel: index < 9 ? "pc" : null,
          unitPrice: 500 + index * 10,
          total: 500 + index * 10,
        })),
      },
    };

    const { container } = render(
      <QuotationPrintLayout document={longDocument} mode="full" />,
    );

    expect(container.querySelectorAll(".print-page").length).toBeGreaterThan(1);
    const pageCount = container.querySelectorAll(".print-page").length;

    expect(
      container.querySelectorAll(".print-document-footer").length,
    ).toBe(pageCount);
    expect(
      screen.getAllByRole("heading", { name: "Quotation" }).length,
    ).toBeGreaterThan(1);
  });

  it("uses conservative pagination for labor mode so the closing section stays on a footer-safe page", () => {
    const laborDocument: QuotationPrintDocument = {
      ...documentFixture,
      quotation: {
        ...documentFixture.quotation,
        items: Array.from({ length: 12 }, (_, index) => ({
          id: `labor-item-${index + 1}`,
          lineNumber: index + 1,
          itemType: "service",
          productId: null,
          serviceId: `service-${index + 1}`,
          description: `Labor operation ${index + 1} with extended diagnostic explanation to simulate taller service rows in print mode`,
          quantity: 1,
          unitLabel: null,
          unitPrice: 900 + index * 25,
          total: 900 + index * 25,
        })),
      },
    };

    const { container } = render(
      <QuotationPrintLayout document={laborDocument} mode="labor" />,
    );

    const pageCount = container.querySelectorAll(".print-page").length;

    expect(pageCount).toBeGreaterThan(1);
    expect(
      container.querySelectorAll(".print-document-footer").length,
    ).toBe(pageCount);
    expect(screen.getByText("APPROVAL")).toBeInTheDocument();
    expect(screen.getByText("Prepared By:")).toBeInTheDocument();
  });
});
