import type {
  QuotationFormItem,
  QuotationProductOption,
  QuotationServiceOption,
} from "@/features/quotations/types";
import { dedupeOptionsById } from "@/features/quotations/utils";

export type QuotationLineCatalogIssue = {
  key: string;
  lineNumber: number;
  itemType: "product" | "service";
  label: string;
  message: string;
};

export function isQuotationLineMissingCatalogLink(item: QuotationFormItem) {
  if (item.itemType === "product") {
    return !item.productId.trim();
  }

  if (item.itemType === "service") {
    return !item.serviceId.trim();
  }

  return false;
}

export function getQuotationLineCatalogDraftLabel(item: QuotationFormItem) {
  if (!isQuotationLineMissingCatalogLink(item)) {
    return undefined;
  }

  const description = item.description.trim();
  return description || undefined;
}

export function getQuotationLineCatalogIssues(items: QuotationFormItem[]): QuotationLineCatalogIssue[] {
  const issues: QuotationLineCatalogIssue[] = [];

  for (const [index, item] of items.entries()) {
    if (!isQuotationLineMissingCatalogLink(item)) {
      continue;
    }

    const lineNumber = index + 1;
    const label = item.description.trim() || `Line ${lineNumber}`;
    const typedHint = item.description.trim()
      ? `"${item.description.trim()}"`
      : "this line";

    if (item.itemType === "product") {
      issues.push({
        key: item.key,
        lineNumber,
        itemType: "product",
        label,
        message: `Line ${lineNumber}: ${typedHint} is not linked to a catalog product. Select a product from the list or use Create New Product.`,
      });
      continue;
    }

    if (item.itemType === "service") {
      issues.push({
        key: item.key,
        lineNumber,
        itemType: "service",
        label,
        message: `Line ${lineNumber}: ${typedHint} is not linked to a catalog service. Select a service from the list or use Create New Service.`,
      });
    }
  }

  return issues;
}

export function buildQuotationLineCatalogIssuesMessage(issues: QuotationLineCatalogIssue[]) {
  if (issues.length === 0) {
    return null;
  }

  if (issues.length === 1) {
    return issues[0].message;
  }

  return `Fix ${issues.length} line items that are not linked to the catalog before saving.`;
}

export function mergeQuotationCatalogIntoFormOptions(
  options: {
    products: QuotationProductOption[];
    services: QuotationServiceOption[];
  },
  lineItems: Array<Pick<QuotationFormItem, "itemType" | "productId" | "serviceId" | "description" | "unitPrice">>,
  fetched: {
    products: QuotationProductOption[];
    services: QuotationServiceOption[];
  },
) {
  const products = dedupeOptionsById([...options.products, ...fetched.products]);
  const services = dedupeOptionsById([...options.services, ...fetched.services]);

  for (const item of lineItems) {
    if (item.itemType === "product" && item.productId && !products.some((product) => product.id === item.productId)) {
      products.push({
        id: item.productId,
        label: item.description.trim() || "Linked product",
        sku: null,
        unitPrice: Number(item.unitPrice) || 0,
      });
    }

    if (item.itemType === "service" && item.serviceId && !services.some((service) => service.id === item.serviceId)) {
      services.push({
        id: item.serviceId,
        label: item.description.trim() || "Linked service",
        category: null,
        unitPrice: Number(item.unitPrice) || 0,
      });
    }
  }

  return {
    products,
    services,
  };
}
