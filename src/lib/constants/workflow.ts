export const WORKSHOP_WORKFLOW = [
  "Customer",
  "Vehicle",
  "Quotation",
  "Job Order",
  "Inventory Usage",
  "Invoice",
  "Payment",
  "Release",
  "Service History",
] as const;

export const IMPLEMENTATION_PHASES = [
  {
    name: "Phase 0",
    focus: "Scaffold the platform, source structure, shared libraries, and migration baseline.",
    statusLabel: "Complete",
    statusVariant: "success" as const,
  },
  {
    name: "Phase 1",
    focus: "Master data modules for customers, vehicles, staff, products, services, and suppliers.",
    statusLabel: "Complete",
    statusVariant: "success" as const,
  },
  {
    name: "Phase 2",
    focus: "Quotation approval flow and automatic job order creation.",
    statusLabel: "Complete",
    statusVariant: "success" as const,
  },
  {
    name: "Phase 3",
    focus: "Job order execution, mechanic assignment, approvals, and service history.",
    statusLabel: "Complete",
    statusVariant: "success" as const,
  },
  {
    name: "Phase 4",
    focus: "Inventory transactions, billing, payment rules, release, and POS.",
    statusLabel: "Complete",
    statusVariant: "success" as const,
  },
  {
    name: "Phase 5",
    focus: "Inventory administration polish, reporting, settings, permissions, and launch hardening.",
    statusLabel: "In progress",
    statusVariant: "warning" as const,
  },
  {
    name: "Phase 6",
    focus: "UAT, production hardening, seeded data, deployment readiness, and final handoff.",
    statusLabel: "Queued",
    statusVariant: "outline" as const,
  },
] as const;
