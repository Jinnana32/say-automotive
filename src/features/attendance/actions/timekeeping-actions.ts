"use server";

import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit";
import { getDefaultBranch } from "@/lib/branches";
import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { toFormActionState } from "@/lib/forms";
import {
  branchHolidaySchema,
  parseBranchHolidayFormData,
} from "@/features/attendance/schemas/branch-holiday-schema";
import {
  parseStaffLeaveFormData,
  staffLeaveSchema,
} from "@/features/attendance/schemas/staff-leave-schema";
import type { TimekeepingActionState } from "@/features/attendance/types";
import { INITIAL_TIMEKEEPING_ACTION_STATE } from "@/features/attendance/utils";

export async function upsertBranchHolidayAction(
  _prevState: TimekeepingActionState = INITIAL_TIMEKEEPING_ACTION_STATE,
  formData: FormData,
): Promise<TimekeepingActionState> {
  const parsed = branchHolidaySchema.safeParse(parseBranchHolidayFormData(formData));

  if (!parsed.success) {
    return {
      ...toFormActionState(parsed.error),
      status: "error",
    };
  }

  const values = parsed.data;
  const [{ context, supabase }, defaultBranch] = await Promise.all([
    getAuthorizedSupabaseServerClient("settings:write"),
    getDefaultBranch(),
  ]);
  const branchId = context.branchId ?? defaultBranch.id;
  let duplicateQuery = supabase
    .from("branch_holidays")
    .select("id")
    .eq("branch_id", branchId)
    .eq("holiday_date", values.holidayDate);

  if (values.holidayId) {
    duplicateQuery = duplicateQuery.neq("id", values.holidayId);
  }

  const { data: duplicateHoliday, error: duplicateError } = await duplicateQuery.maybeSingle();

  if (duplicateError) {
    return {
      status: "error",
      message: duplicateError.message,
    };
  }

  if (duplicateHoliday) {
    return {
      status: "error",
      message: "A branch holiday already exists for that date.",
    };
  }

  const payload = {
    branch_id: branchId,
    holiday_date: values.holidayDate,
    label: values.label.trim(),
    holiday_kind: values.holidayKind,
    notes: normalizeNullable(values.notes),
  };

  if (values.holidayId) {
    const { data: currentHoliday, error: currentHolidayError } = await supabase
      .from("branch_holidays")
      .select("*")
      .eq("id", values.holidayId)
      .eq("branch_id", branchId)
      .maybeSingle();

    if (currentHolidayError) {
      return {
        status: "error",
        message: currentHolidayError.message,
      };
    }

    if (!currentHoliday) {
      return {
        status: "error",
        message: "Branch holiday not found.",
      };
    }

    const { data: savedHoliday, error } = await supabase
      .from("branch_holidays")
      .update(payload)
      .eq("id", values.holidayId)
      .select("*")
      .single();

    if (error) {
      return {
        status: "error",
        message: error.message,
      };
    }

    await writeAuditLog(supabase, {
      action: `Updated branch holiday ${savedHoliday.label}`,
      entityType: "branch_holiday",
      entityId: savedHoliday.id,
      userId: context.userId,
      beforeData: currentHoliday,
      afterData: savedHoliday,
    });
  } else {
    const { data: savedHoliday, error } = await supabase
      .from("branch_holidays")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return {
        status: "error",
        message: error.message,
      };
    }

    await writeAuditLog(supabase, {
      action: `Created branch holiday ${savedHoliday.label}`,
      entityType: "branch_holiday",
      entityId: savedHoliday.id,
      userId: context.userId,
      afterData: savedHoliday,
    });
  }

  revalidateTimekeepingPaths();

  return {
    status: "success",
    message: "Branch holiday saved.",
  };
}

export async function deleteBranchHolidayAction(formData: FormData) {
  const holidayId = readString(formData, "holidayId");

  if (!holidayId) {
    return;
  }

  const [{ context, supabase }, defaultBranch] = await Promise.all([
    getAuthorizedSupabaseServerClient("settings:write"),
    getDefaultBranch(),
  ]);
  const branchId = context.branchId ?? defaultBranch.id;
  const { data: currentHoliday, error: currentHolidayError } = await supabase
    .from("branch_holidays")
    .select("*")
    .eq("id", holidayId)
    .eq("branch_id", branchId)
    .maybeSingle();

  if (currentHolidayError || !currentHoliday) {
    return;
  }

  const { error } = await supabase
    .from("branch_holidays")
    .delete()
    .eq("id", holidayId)
    .eq("branch_id", branchId);

  if (!error) {
    await writeAuditLog(supabase, {
      action: `Deleted branch holiday ${currentHoliday.label}`,
      entityType: "branch_holiday",
      entityId: currentHoliday.id,
      userId: context.userId,
      beforeData: currentHoliday,
    });

    revalidateTimekeepingPaths();
  }
}

export async function upsertStaffLeaveEntryAction(
  _prevState: TimekeepingActionState = INITIAL_TIMEKEEPING_ACTION_STATE,
  formData: FormData,
): Promise<TimekeepingActionState> {
  const parsed = staffLeaveSchema.safeParse(parseStaffLeaveFormData(formData));

  if (!parsed.success) {
    return {
      ...toFormActionState(parsed.error),
      status: "error",
    };
  }

  const values = parsed.data;
  const [{ context, supabase }, defaultBranch] = await Promise.all([
    getAuthorizedSupabaseServerClient("settings:write"),
    getDefaultBranch(),
  ]);
  const branchId = context.branchId ?? defaultBranch.id;
  let overlapQuery = supabase
    .from("staff_leave_entries")
    .select("id")
    .eq("branch_id", branchId)
    .eq("staff_id", values.staffId)
    .lte("start_date", values.endDate)
    .gte("end_date", values.startDate);

  if (values.leaveEntryId) {
    overlapQuery = overlapQuery.neq("id", values.leaveEntryId);
  }

  const { data: overlappingEntry, error: overlapError } = await overlapQuery.maybeSingle();

  if (overlapError) {
    return {
      status: "error",
      message: overlapError.message,
    };
  }

  if (overlappingEntry) {
    return {
      status: "error",
      message: "This staff member already has approved leave covering part of that date range.",
    };
  }

  const payload = {
    branch_id: branchId,
    staff_id: values.staffId,
    start_date: values.startDate,
    end_date: values.endDate,
    leave_type: values.leaveType,
    notes: normalizeNullable(values.notes),
  };

  if (values.leaveEntryId) {
    const { data: currentLeaveEntry, error: currentLeaveError } = await supabase
      .from("staff_leave_entries")
      .select("*")
      .eq("id", values.leaveEntryId)
      .eq("branch_id", branchId)
      .maybeSingle();

    if (currentLeaveError) {
      return {
        status: "error",
        message: currentLeaveError.message,
      };
    }

    if (!currentLeaveEntry) {
      return {
        status: "error",
        message: "Approved leave entry not found.",
      };
    }

    const { data: savedLeaveEntry, error } = await supabase
      .from("staff_leave_entries")
      .update(payload)
      .eq("id", values.leaveEntryId)
      .select("*")
      .single();

    if (error) {
      return {
        status: "error",
        message: error.message,
      };
    }

    await writeAuditLog(supabase, {
      action: "Updated approved leave entry",
      entityType: "staff_leave_entry",
      entityId: savedLeaveEntry.id,
      userId: context.userId,
      beforeData: currentLeaveEntry,
      afterData: savedLeaveEntry,
    });
  } else {
    const { data: savedLeaveEntry, error } = await supabase
      .from("staff_leave_entries")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return {
        status: "error",
        message: error.message,
      };
    }

    await writeAuditLog(supabase, {
      action: "Created approved leave entry",
      entityType: "staff_leave_entry",
      entityId: savedLeaveEntry.id,
      userId: context.userId,
      afterData: savedLeaveEntry,
    });
  }

  revalidateTimekeepingPaths();

  return {
    status: "success",
    message: "Approved leave saved.",
  };
}

export async function deleteStaffLeaveEntryAction(formData: FormData) {
  const leaveEntryId = readString(formData, "leaveEntryId");

  if (!leaveEntryId) {
    return;
  }

  const [{ context, supabase }, defaultBranch] = await Promise.all([
    getAuthorizedSupabaseServerClient("settings:write"),
    getDefaultBranch(),
  ]);
  const branchId = context.branchId ?? defaultBranch.id;
  const { data: currentLeaveEntry, error: currentLeaveError } = await supabase
    .from("staff_leave_entries")
    .select("*")
    .eq("id", leaveEntryId)
    .eq("branch_id", branchId)
    .maybeSingle();

  if (currentLeaveError || !currentLeaveEntry) {
    return;
  }

  const { error } = await supabase
    .from("staff_leave_entries")
    .delete()
    .eq("id", leaveEntryId)
    .eq("branch_id", branchId);

  if (!error) {
    await writeAuditLog(supabase, {
      action: "Deleted approved leave entry",
      entityType: "staff_leave_entry",
      entityId: currentLeaveEntry.id,
      userId: context.userId,
      beforeData: currentLeaveEntry,
    });

    revalidateTimekeepingPaths();
  }
}

function revalidateTimekeepingPaths() {
  revalidatePath("/settings");
  revalidatePath("/settings/timekeeping");
  revalidatePath("/attendance");
  revalidatePath("/payroll");
}

function normalizeNullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
