"use server";

import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit";
import { getDefaultBranch } from "@/lib/branches";
import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { toFormActionState } from "@/lib/forms";
import { normalizeIpAddress } from "@/lib/network/request-ip";
import {
  attendanceAccessSettingsSchema,
  attendanceAllowedIpSchema,
  parseAttendanceAccessSettingsFormData,
  parseAttendanceAllowedIpFormData,
} from "@/features/attendance/schemas/attendance-settings-schema";
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

export async function updateAttendanceAccessSettingsAction(
  _prevState: TimekeepingActionState = INITIAL_TIMEKEEPING_ACTION_STATE,
  formData: FormData,
): Promise<TimekeepingActionState> {
  const parsed = attendanceAccessSettingsSchema.safeParse(
    parseAttendanceAccessSettingsFormData(formData),
  );

  if (!parsed.success) {
    return {
      ...toFormActionState(parsed.error),
      status: "error",
    };
  }

  const [{ context, supabase }, defaultBranch] = await Promise.all([
    getAuthorizedSupabaseServerClient("settings:write"),
    getDefaultBranch(),
  ]);
  const branchId = context.branchId ?? defaultBranch.id;
  const { data: currentSettings, error: currentSettingsError } = await supabase
    .from("business_settings")
    .select("*")
    .eq("branch_id", branchId)
    .single();

  if (currentSettingsError) {
    return {
      status: "error",
      message: currentSettingsError.message,
    };
  }

  const payload = {
    require_shop_ip_for_mechanic_attendance:
      parsed.data.requireShopIpForMechanicAttendance,
    allow_dtr_amendments: parsed.data.allowDtrAmendments,
    allow_attendance_admin_override: parsed.data.allowAttendanceAdminOverride,
  };

  const { error } = await supabase
    .from("business_settings")
    .update(payload)
    .eq("branch_id", branchId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  await writeAuditLog(supabase, {
    action: "Updated mechanic attendance access rules",
    entityType: "business_settings",
    entityId: String(currentSettings.id),
    userId: context.userId,
    beforeData: {
      require_shop_ip_for_mechanic_attendance:
        currentSettings.require_shop_ip_for_mechanic_attendance,
      allow_dtr_amendments: currentSettings.allow_dtr_amendments,
      allow_attendance_admin_override:
        currentSettings.allow_attendance_admin_override,
    },
    afterData: payload,
  });

  revalidateTimekeepingPaths();

  return {
    status: "success",
    message: "Mechanic attendance settings saved.",
  };
}

export async function addAttendanceAllowedIpAction(
  _prevState: TimekeepingActionState = INITIAL_TIMEKEEPING_ACTION_STATE,
  formData: FormData,
): Promise<TimekeepingActionState> {
  const parsed = attendanceAllowedIpSchema.safeParse(
    parseAttendanceAllowedIpFormData(formData),
  );

  if (!parsed.success) {
    return {
      ...toFormActionState(parsed.error),
      status: "error",
    };
  }

  const [{ context, supabase }, defaultBranch] = await Promise.all([
    getAuthorizedSupabaseServerClient("settings:write"),
    getDefaultBranch(),
  ]);
  const branchId = context.branchId ?? defaultBranch.id;
  const normalizedIp = normalizeIpAddress(parsed.data.ipAddress);

  if (!normalizedIp) {
    return {
      status: "error",
      message: "Enter a valid public IP address.",
    };
  }

  const payload = {
    branch_id: branchId,
    ip_address: normalizedIp,
    label: normalizeNullable(parsed.data.label),
  };
  const { data: savedIp, error } = await supabase
    .from("attendance_allowed_ips")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return {
      status: "error",
      message:
        error.code === "23505"
          ? "That shop IP is already allowed."
          : error.message,
    };
  }

  await writeAuditLog(supabase, {
    action: `Added allowed attendance IP ${savedIp.ip_address}`,
    entityType: "attendance_allowed_ip",
    entityId: savedIp.id,
    userId: context.userId,
    afterData: savedIp,
  });

  revalidateTimekeepingPaths();

  return {
    status: "success",
    message: "Allowed shop IP added.",
  };
}

export async function deleteAttendanceAllowedIpAction(formData: FormData) {
  const allowedIpId = readString(formData, "allowedIpId");

  if (!allowedIpId) {
    return;
  }

  const [{ context, supabase }, defaultBranch] = await Promise.all([
    getAuthorizedSupabaseServerClient("settings:write"),
    getDefaultBranch(),
  ]);
  const branchId = context.branchId ?? defaultBranch.id;
  const { data: currentAllowedIp, error: currentAllowedIpError } = await supabase
    .from("attendance_allowed_ips")
    .select("*")
    .eq("id", allowedIpId)
    .eq("branch_id", branchId)
    .maybeSingle();

  if (currentAllowedIpError || !currentAllowedIp) {
    return;
  }

  const { error } = await supabase
    .from("attendance_allowed_ips")
    .delete()
    .eq("id", allowedIpId)
    .eq("branch_id", branchId);

  if (!error) {
    await writeAuditLog(supabase, {
      action: `Deleted allowed attendance IP ${currentAllowedIp.ip_address}`,
      entityType: "attendance_allowed_ip",
      entityId: currentAllowedIp.id,
      userId: context.userId,
      beforeData: currentAllowedIp,
    });

    revalidateTimekeepingPaths();
  }
}

function revalidateTimekeepingPaths() {
  revalidatePath("/settings");
  revalidatePath("/settings/timekeeping");
  revalidatePath("/attendance");
  revalidatePath("/attendance/amendments");
  revalidatePath("/payroll");
  revalidatePath("/portal/attendance");
  revalidatePath("/portal/amendments");
}

function normalizeNullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
