"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getBranchScopedServerClient } from "@/lib/branches";
import { INITIAL_FORM_ACTION_STATE, toFormActionState, type FormActionState } from "@/lib/forms";
import {
  inventoryMovementSchema,
  markInventoryStockDamagedSchema,
  parseInventoryMovementFormData,
  parseMarkInventoryStockDamagedFormData,
  parseReceiveInventoryStockFormData,
  parseReconcileInventoryStockFormData,
  parseUpdateInventoryStockSettingsFormData,
  receiveInventoryStockSchema,
  reconcileInventoryStockSchema,
  updateInventoryStockSettingsSchema,
} from "@/features/inventory/schemas/inventory-forms";

export async function submitInventoryMovementAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = inventoryMovementSchema.safeParse(parseInventoryMovementFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const { branchScope, context, supabase } = await getBranchScopedServerClient("inventory:write");
  const quantity = Number(parsed.data.quantity);
  const sharedPayload = {
    p_branch_id: branchScope.selectedBranchId ?? branchScope.writeBranchId,
    p_product_id: parsed.data.productId,
    p_notes: parsed.data.notes || null,
    p_created_by: context.userId,
  };

  const operation =
    parsed.data.movementMode === "recount"
      ? supabase.rpc("reconcile_inventory_stock", {
          ...sharedPayload,
          p_counted_quantity: quantity,
        })
      : parsed.data.movementMode === "damaged"
        ? supabase.rpc("mark_inventory_stock_damaged", {
            ...sharedPayload,
            p_quantity: quantity,
          })
        : supabase.rpc("receive_inventory_stock", {
            ...sharedPayload,
            p_quantity: quantity,
          });

  const { error } = await operation;

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidateInventoryPaths();
  redirect("/inventory");
}

export async function receiveInventoryStockAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = receiveInventoryStockSchema.safeParse(
    parseReceiveInventoryStockFormData(formData),
  );

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const { branchScope, context, supabase } = await getBranchScopedServerClient("inventory:write");
  const { error } = await supabase.rpc("receive_inventory_stock", {
    p_branch_id: branchScope.selectedBranchId ?? branchScope.writeBranchId,
    p_product_id: parsed.data.productId,
    p_quantity: Number(parsed.data.quantity),
    p_notes: parsed.data.notes || null,
    p_created_by: context.userId,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidateInventoryPaths();
  redirect("/inventory");
}

export async function reconcileInventoryStockAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = reconcileInventoryStockSchema.safeParse(
    parseReconcileInventoryStockFormData(formData),
  );

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const { branchScope, context, supabase } = await getBranchScopedServerClient("inventory:write");
  const { error } = await supabase.rpc("reconcile_inventory_stock", {
    p_branch_id: branchScope.selectedBranchId ?? branchScope.writeBranchId,
    p_product_id: parsed.data.productId,
    p_counted_quantity: Number(parsed.data.countedQuantity),
    p_notes: parsed.data.notes || null,
    p_created_by: context.userId,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidateInventoryPaths();
  redirect("/inventory");
}

export async function markInventoryStockDamagedAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = markInventoryStockDamagedSchema.safeParse(
    parseMarkInventoryStockDamagedFormData(formData),
  );

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const { branchScope, context, supabase } = await getBranchScopedServerClient("inventory:write");
  const { error } = await supabase.rpc("mark_inventory_stock_damaged", {
    p_branch_id: branchScope.selectedBranchId ?? branchScope.writeBranchId,
    p_product_id: parsed.data.productId,
    p_quantity: Number(parsed.data.quantity),
    p_notes: parsed.data.notes || null,
    p_created_by: context.userId,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidateInventoryPaths();
  redirect("/inventory");
}

export async function updateInventoryStockSettingsAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = updateInventoryStockSettingsSchema.safeParse(
    parseUpdateInventoryStockSettingsFormData(formData),
  );

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const { branchScope, supabase } = await getBranchScopedServerClient("inventory:write");
  const { error } = await supabase.rpc("update_inventory_stock_settings", {
    p_branch_id: branchScope.selectedBranchId ?? branchScope.writeBranchId,
    p_product_id: parsed.data.productId,
    p_reorder_level: parsed.data.reorderLevel ? Number(parsed.data.reorderLevel) : null,
    p_shelf_location: parsed.data.shelfLocation || null,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidateInventoryPaths();
  redirect("/inventory");
}

function revalidateInventoryPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
  revalidatePath("/job-orders");
  revalidatePath("/pos");
}
