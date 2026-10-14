export type WorkshopLineItemType = "product" | "service" | "labor";

export function formatWorkshopLineItemType(itemType: WorkshopLineItemType) {
  switch (itemType) {
    case "product":
      return "Parts";
    case "service":
    case "labor":
      return "Labor";
  }
}
