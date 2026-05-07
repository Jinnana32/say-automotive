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
  | "customers"
  | "vehicles"
  | "quotations"
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
  | "reports"
  | "settings";

export const DASHBOARD_NAV_ITEMS: ReadonlyArray<{
  href: string;
  label: string;
  description: string;
  capability: AppCapability;
  group: NavigationGroup;
  iconName: NavigationIconName;
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
    href: "/reports",
    label: "Reports",
    description: "Trends and summaries.",
    capability: "reports:read",
    group: "Insights",
    iconName: "reports",
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
