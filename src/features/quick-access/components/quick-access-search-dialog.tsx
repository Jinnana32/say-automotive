"use client";

import { ArrowLeft, CarFront, Search, UserRound } from "lucide-react";
import { useState } from "react";

import { ModalDialog } from "@/components/shared/modal-dialog";
import { Button } from "@/components/ui/button";
import { QuickAccessCustomerLookupForm } from "@/features/quick-access/components/quick-access-customer-lookup-form";
import { QuickAccessPlateLookupForm } from "@/features/quick-access/components/quick-access-plate-lookup-form";
import { cn } from "@/lib/utils";

type QuickAccessSearchMode = "choose" | "vehicle" | "customer";

export function QuickAccessSearchDialog({
  initialPlate,
  initialCustomerLastName,
}: {
  initialPlate: string;
  initialCustomerLastName: string;
}) {
  return (
    <ModalDialog
      title="Start quick lookup"
      description="Choose the search path that best matches what the customer gives you first."
      size="lg"
      trigger={({ openDialog }) => (
        <Button
          type="button"
          variant="bluePrimary"
          size="pill"
          onClick={openDialog}
          className="fixed bottom-6 right-6 z-40 shadow-2xl shadow-slate-950/25"
        >
          <Search className="size-4" />
          Find record
        </Button>
      )}
    >
      {({ closeDialog }) => (
        <QuickAccessSearchDialogBody
          closeDialog={closeDialog}
          initialPlate={initialPlate}
          initialCustomerLastName={initialCustomerLastName}
        />
      )}
    </ModalDialog>
  );
}

function QuickAccessSearchDialogBody({
  closeDialog,
  initialPlate,
  initialCustomerLastName,
}: {
  closeDialog: () => void;
  initialPlate: string;
  initialCustomerLastName: string;
}) {
  const [mode, setMode] = useState<QuickAccessSearchMode>("choose");

  return (
    <div className="space-y-5">
      {mode === "choose" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <SearchModeButton
            title="Vehicle lookup"
            description="Use a plate number or camera scan when the vehicle is already in front of the shop."
            icon={CarFront}
            onClick={() => setMode("vehicle")}
          />
          <SearchModeButton
            title="Customer lookup"
            description="Search by last name when the customer is at the counter and the plate is not ready yet."
            icon={UserRound}
            onClick={() => setMode("customer")}
          />
        </div>
      ) : null}

      {mode === "vehicle" ? (
        <div className="space-y-4">
          <SearchModeHeader
            title="Vehicle lookup"
            description="Scan the plate or enter it manually to bring up the most relevant service record."
            onBack={() => setMode("choose")}
          />
          <QuickAccessPlateLookupForm
            initialPlate={initialPlate}
            onLookupSubmitted={closeDialog}
          />
        </div>
      ) : null}

      {mode === "customer" ? (
        <div className="space-y-4">
          <SearchModeHeader
            title="Customer lookup"
            description="Enter the customer&apos;s last name to review linked vehicles and recent work quickly."
            onBack={() => setMode("choose")}
          />
          <QuickAccessCustomerLookupForm
            initialLastName={initialCustomerLastName}
            onLookupSubmitted={closeDialog}
          />
        </div>
      ) : null}
    </div>
  );
}

function SearchModeButton({
  title,
  description,
  icon: Icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-3xl border border-border/70 bg-background px-5 py-5 text-left shadow-sm transition-colors hover:bg-muted/35",
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <p className="mt-4 text-base font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </button>
  );
}

function SearchModeHeader({
  title,
  description,
  onBack,
}: {
  title: string;
  description: string;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/70 pb-4 md:flex-row md:items-start md:justify-between">
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onBack}>
        <ArrowLeft className="size-4" />
        Change search type
      </Button>
    </div>
  );
}
