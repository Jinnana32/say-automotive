import type { AppCapability } from "@/lib/auth/permissions";

export type NavigationGroup =
  | "Overview"
  | "Service Desk"
  | "Stock & Catalog"
  | "Billing"
  | "People"
  | "Insights"
  | "System";

export type NavigationIconName =
  | "dashboard"
  | "quick-access"
  | "customers"
  | "vehicles"
  | "quotations"
  | "documents"
  | "job-orders"
  | "inventory"
  | "products"
  | "services"
  | "suppliers"
  | "invoices"
  | "payments"
  | "pos"
  | "staff"
  | "attendance"
  | "payroll"
  | "reports"
  | "website"
  | "settings";

export const DASHBOARD_NAV_ITEMS: ReadonlyArray<{
  href: string;
  label: string;
  description: string;
  capability: AppCapability;
  requiredCapabilities?: readonly AppCapability[];
  group: NavigationGroup;
  iconName: NavigationIconName;
  showInSidebar?: boolean;
  showAsMobileShortcut?: boolean;
}> = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Operational health and current activity.",
    capability: "dashboard:view",
    group: "Overview",
    iconName: "dashboard",
  },
  {
    href: "/quick-access",
    label: "Quick Access",
    description: "Fast lookup for returning customers and vehicles.",
    capability: "vehicles:read",
    requiredCapabilities: ["vehicles:read", "customers:read"],
    group: "Overview",
    iconName: "quick-access",
    showInSidebar: false,
    showAsMobileShortcut: true,
  },
  {
    href: "/customers",
    label: "Customers",
    description: "Customer records and ownership.",
    capability: "customers:read",
    group: "Service Desk",
    iconName: "customers",
  },
  {
    href: "/vehicles",
    label: "Vehicles",
    description: "Vehicle records by customer.",
    capability: "vehicles:read",
    group: "Service Desk",
    iconName: "vehicles",
  },
  {
    href: "/quotations",
    label: "Quotations",
    description: "Estimates before operational work.",
    capability: "quotations:read",
    group: "Service Desk",
    iconName: "quotations",
  },
  {
    href: "/job-orders",
    label: "Job Orders",
    description: "Live workshop execution.",
    capability: "job_orders:read",
    group: "Service Desk",
    iconName: "job-orders",
  },
  {
    href: "/inventory",
    label: "Inventory",
    description: "Stock balances and ledger.",
    capability: "inventory:read",
    group: "Stock & Catalog",
    iconName: "inventory",
  },
  {
    href: "/products",
    label: "Products",
    description: "Product master data.",
    capability: "products:read",
    group: "Stock & Catalog",
    iconName: "products",
  },
  {
    href: "/services",
    label: "Services",
    description: "Labor and service catalog.",
    capability: "services:read",
    group: "Stock & Catalog",
    iconName: "services",
  },
  {
    href: "/suppliers",
    label: "Suppliers",
    description: "Supplier directory.",
    capability: "suppliers:read",
    group: "Stock & Catalog",
    iconName: "suppliers",
  },
  {
    href: "/invoices",
    label: "Invoices",
    description: "Billing and balances.",
    capability: "invoices:read",
    group: "Billing",
    iconName: "invoices",
  },
  {
    href: "/payments",
    label: "Payments",
    description: "Collections and history.",
    capability: "payments:read",
    group: "Billing",
    iconName: "payments",
  },
  {
    href: "/pos",
    label: "Point of Sale",
    description: "Direct retail sales.",
    capability: "pos:read",
    group: "Billing",
    iconName: "pos",
  },
  {
    href: "/staff",
    label: "Staff",
    description: "Personnel records.",
    capability: "staff:read",
    group: "People",
    iconName: "staff",
  },
  {
    href: "/attendance",
    label: "Attendance",
    description: "Timekeeping and presence.",
    capability: "attendance:read",
    group: "People",
    iconName: "attendance",
  },
  {
    href: "/payroll",
    label: "Payroll",
    description: "Compensation setup and payroll periods.",
    capability: "payroll:read",
    group: "People",
    iconName: "payroll",
  },
  {
    href: "/reports",
    label: "Reports",
    description: "Trends and summaries.",
    capability: "reports:read",
    group: "Insights",
    iconName: "reports",
  },
  {
    href: "/documents/blank-preview",
    label: "Blank Document",
    description: "Preview the reusable document template.",
    capability: "settings:write",
    group: "System",
    iconName: "documents",
  },
  {
    href: "/settings/website",
    label: "Website",
    description: "Public website content and lead intake.",
    capability: "settings:read",
    group: "System",
    iconName: "website",
  },
  {
    href: "/settings/timekeeping",
    label: "Timekeeping",
    description: "Attendance calendar and shop timekeeping rules.",
    capability: "settings:read",
    group: "System",
    iconName: "attendance",
  },
  {
    href: "/settings/vehicle-lookups",
    label: "Vehicle lookups",
    description: "Internal make, model, and option references.",
    capability: "settings:read",
    group: "System",
    iconName: "vehicles",
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Business rules and preferences.",
    capability: "settings:read",
    group: "System",
    iconName: "settings",
  },
];

export function navigationItemMatchesPath(href: string, pathname: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function resolveActiveNavigationItem<
  TItem extends {
    href: string;
  },
>(items: readonly TItem[], pathname: string) {
  const matchedItems = items.filter((item) => navigationItemMatchesPath(item.href, pathname));

  if (matchedItems.length === 0) {
    return items[0];
  }

  return matchedItems.reduce((mostSpecific, item) =>
    item.href.length > mostSpecific.href.length ? item : mostSpecific,
  );
}
