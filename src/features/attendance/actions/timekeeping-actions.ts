"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit";
import { getBranchScopedServerClient } from "@/lib/branches";
import { toFormActionState } from "@/lib/forms";
import { isPublicIpAddress, normalizeIpAddress } from "@/lib/network/request-ip";
import {
  attendanceAccessSettingsSchema,
  attendanceAllowedIpSchema,
  parseAttendanceAccessSettingsFormData,
  parseAttendanceAllowedIpFormData,
} from "@/features/attendance/schemas/attendance-settings-schema";
import {
  branchHolidaySchema,
  parsePhilippineHolidayImportFormData,
  parseBranchHolidayFormData,
  philippineHolidayImportSchema,
} from "@/features/attendance/schemas/branch-holiday-schema";
import {
  parseStaffLeaveFormData,
  staffLeaveSchema,
} from "@/features/attendance/schemas/staff-leave-schema";
import type { TimekeepingActionState } from "@/features/attendance/types";
import {
  getPhilippineHolidaySuggestionsForYear,
  isPhilippineHolidaySuggestionImportable,
} from "@/features/attendance/philippine-holidays";
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
  const { branchScope, context, supabase } = await getBranchScopedServerClient("settings:write");
  const branchId = branchScope.writeBranchId;
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
      message: "A branch calendar date already exists for that date.",
    };
  }

  const payload = {
    branch_id: branchId,
    holiday_date: values.holidayDate,
    label: values.label.trim(),
    holiday_kind: values.holidayKind,
    pay_treatment: values.payTreatment,
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
    message: "Branch calendar date saved.",
  };
}

export async function deleteBranchHolidayAction(formData: FormData) {
  const holidayId = readString(formData, "holidayId");

  if (!holidayId) {
    redirectTimekeepingFeedback({ tab: "holidays", error: "Invalid calendar date request." });
  }

  const { branchScope, context, supabase } = await getBranchScopedServerClient("settings:write");
  const branchId = branchScope.writeBranchId;
  const { data: currentHoliday, error: currentHolidayError } = await supabase
    .from("branch_holidays")
    .select("*")
    .eq("id", holidayId)
    .eq("branch_id", branchId)
    .maybeSingle();

  if (currentHolidayError) {
    redirectTimekeepingFeedback({ tab: "holidays", error: currentHolidayError.message });
  }

  if (!currentHoliday) {
    redirectTimekeepingFeedback({ tab: "holidays", error: "Branch calendar date not found." });
  }

  const { data: deletedHoliday, error } = await supabase
    .from("branch_holidays")
    .delete()
    .eq("id", holidayId)
    .eq("branch_id", branchId)
    .select("id")
    .maybeSingle();

  if (error) {
    redirectTimekeepingFeedback({ tab: "holidays", error: error.message });
  }

  if (!deletedHoliday) {
    redirectTimekeepingFeedback({
      tab: "holidays",
      error: "Branch calendar date could not be deleted.",
    });
  }

  await writeAuditLog(supabase, {
    action: `Deleted branch holiday ${currentHoliday.label}`,
    entityType: "branch_holiday",
    entityId: currentHoliday.id,
    userId: context.userId,
    beforeData: currentHoliday,
  });

  revalidateTimekeepingPaths();
  redirectTimekeepingFeedback({ tab: "holidays" });
}

export async function importPhilippineHolidaySuggestionsAction(
  _prevState: TimekeepingActionState = INITIAL_TIMEKEEPING_ACTION_STATE,
  formData: FormData,
): Promise<TimekeepingActionState> {
  const parsed = philippineHolidayImportSchema.safeParse(
    parsePhilippineHolidayImportFormData(formData),
  );

  if (!parsed.success) {
    return {
      ...toFormActionState(parsed.error),
      status: "error",
    };
  }

  const { year, selections } = parsed.data;
  const suggestions = getPhilippineHolidaySuggestionsForYear(year);

  if (suggestions.length === 0) {
    return {
      status: "error",
      message: `No official Philippine holiday suggestions are stored for ${year} yet.`,
    };
  }

  const suggestionById = new Map(suggestions.map((suggestion) => [suggestion.id, suggestion]));
  const normalizedSelections = Array.from(
    new Map(selections.map((selection) => [selection.suggestionId, selection])).values(),
  );
  const selectedSuggestions: Array<{
    suggestionId: string;
    payTreatment: "unpaid" | "paid_regular_day" | "custom";
    suggestion: ReturnType<typeof getPhilippineHolidaySuggestionsForYear>[number] & {
      importable: true;
      holidayKind: NonNullable<ReturnType<typeof getPhilippineHolidaySuggestionsForYear>[number]["holidayKind"]>;
      defaultPayTreatment: NonNullable<ReturnType<typeof getPhilippineHolidaySuggestionsForYear>[number]["defaultPayTreatment"]>;
    };
  }> = [];

  for (const selection of normalizedSelections) {
    const suggestion = suggestionById.get(selection.suggestionId);

    if (!suggestion || !isPhilippineHolidaySuggestionImportable(suggestion)) {
      continue;
    }

    selectedSuggestions.push({
      ...selection,
      suggestion,
    });
  }

  if (selectedSuggestions.length === 0) {
    return {
      status: "error",
      message: "Select at least one importable holiday to continue.",
    };
  }

  const { branchScope, context, supabase } = await getBranchScopedServerClient("settings:write");
  const branchId = branchScope.writeBranchId;
  const selectedDates = Array.from(
    new Set(selectedSuggestions.map(({ suggestion }) => suggestion.holidayDate)),
  );
  const { data: existingHolidayData, error: existingHolidayError } = await supabase
    .from("branch_holidays")
    .select("*")
    .eq("branch_id", branchId)
    .in("holiday_date", selectedDates);

  if (existingHolidayError) {
    return {
      status: "error",
      message: existingHolidayError.message,
    };
  }

  const existingDates = new Set((existingHolidayData ?? []).map((holiday) => holiday.holiday_date));
  const payloads = selectedSuggestions
    .filter(({ suggestion }) => !existingDates.has(suggestion.holidayDate))
    .map(({ suggestion, payTreatment }) => ({
      branch_id: branchId,
      holiday_date: suggestion.holidayDate,
      label: suggestion.label,
      holiday_kind: suggestion.holidayKind,
      pay_treatment: payTreatment,
      notes: normalizeNullable(suggestion.notes ?? ""),
    }));

  if (payloads.length === 0) {
    return {
      status: "success",
      message: "No new holidays were imported. The selected dates already exist in this branch calendar.",
    };
  }

  const { data: insertedHolidays, error: insertError } = await supabase
    .from("branch_holidays")
    .insert(payloads)
    .select("*");

  if (insertError) {
    return {
      status: "error",
      message: insertError.message,
    };
  }

  for (const insertedHoliday of insertedHolidays ?? []) {
    await writeAuditLog(supabase, {
      action: `Imported Philippine holiday ${insertedHoliday.label}`,
      entityType: "branch_holiday",
      entityId: insertedHoliday.id,
      userId: context.userId,
      afterData: insertedHoliday,
    });
  }

  revalidateTimekeepingPaths();

  const skippedCount = selectedSuggestions.length - payloads.length;

  return {
    status: "success",
    message:
      skippedCount > 0
        ? `Imported ${payloads.length} holiday${payloads.length === 1 ? "" : "s"} and skipped ${skippedCount} already-added date${skippedCount === 1 ? "" : "s"}.`
        : `Imported ${payloads.length} holiday${payloads.length === 1 ? "" : "s"}.`,
  };
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
  const { branchScope, context, supabase } = await getBranchScopedServerClient("settings:write");
  const branchId = branchScope.writeBranchId;
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
    redirectAttendanceFeedback({ tab: "leave", error: "Invalid leave entry request." });
  }

  const { branchScope, context, supabase } = await getBranchScopedServerClient("settings:write");
  const branchId = branchScope.writeBranchId;
  const { data: currentLeaveEntry, error: currentLeaveError } = await supabase
    .from("staff_leave_entries")
    .select("*")
    .eq("id", leaveEntryId)
    .eq("branch_id", branchId)
    .maybeSingle();

  if (currentLeaveError) {
    redirectAttendanceFeedback({ tab: "leave", error: currentLeaveError.message });
  }

  if (!currentLeaveEntry) {
    redirectAttendanceFeedback({ tab: "leave", error: "Approved leave entry not found." });
  }

  const { data: deletedLeaveEntry, error } = await supabase
    .from("staff_leave_entries")
    .delete()
    .eq("id", leaveEntryId)
    .eq("branch_id", branchId)
    .select("id")
    .maybeSingle();

  if (error) {
    redirectAttendanceFeedback({ tab: "leave", error: error.message });
  }

  if (!deletedLeaveEntry) {
    redirectAttendanceFeedback({
      tab: "leave",
      error: "Approved leave entry could not be deleted.",
    });
  }

  await writeAuditLog(supabase, {
    action: "Deleted approved leave entry",
    entityType: "staff_leave_entry",
    entityId: currentLeaveEntry.id,
    userId: context.userId,
    beforeData: currentLeaveEntry,
  });

  revalidateTimekeepingPaths();
  redirectAttendanceFeedback({ tab: "leave" });
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

  const { branchScope, context, supabase } = await getBranchScopedServerClient("settings:write");
  const branchId = branchScope.writeBranchId;
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

  const { branchScope, context, supabase } = await getBranchScopedServerClient("settings:write");
  const branchId = branchScope.writeBranchId;
  const normalizedIp = normalizeIpAddress(parsed.data.ipAddress);

  if (!normalizedIp) {
    return {
      status: "error",
      message: "Enter a valid public IP address.",
    };
  }

  if (!isPublicIpAddress(normalizedIp)) {
    return {
      status: "error",
      message:
        "Enter the shop's public internet IP address. Local Wi-Fi IPs like 192.168.x.x will not work for attendance validation.",
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
    redirectTimekeepingFeedback({ error: "Invalid allowed IP request." });
  }

  const { branchScope, context, supabase } = await getBranchScopedServerClient("settings:write");
  const branchId = branchScope.writeBranchId;
  const { data: currentAllowedIp, error: currentAllowedIpError } = await supabase
    .from("attendance_allowed_ips")
    .select("*")
    .eq("id", allowedIpId)
    .eq("branch_id", branchId)
    .maybeSingle();

  if (currentAllowedIpError) {
    redirectTimekeepingFeedback({ error: currentAllowedIpError.message });
  }

  if (!currentAllowedIp) {
    redirectTimekeepingFeedback({ error: "Allowed shop IP not found." });
  }

  const { data: deletedAllowedIp, error } = await supabase
    .from("attendance_allowed_ips")
    .delete()
    .eq("id", allowedIpId)
    .eq("branch_id", branchId)
    .select("id")
    .maybeSingle();

  if (error) {
    redirectTimekeepingFeedback({ error: error.message });
  }

  if (!deletedAllowedIp) {
    redirectTimekeepingFeedback({ error: "Allowed shop IP could not be removed." });
  }

  await writeAuditLog(supabase, {
    action: `Deleted allowed attendance IP ${currentAllowedIp.ip_address}`,
    entityType: "attendance_allowed_ip",
    entityId: currentAllowedIp.id,
    userId: context.userId,
    beforeData: currentAllowedIp,
  });

  revalidateTimekeepingPaths();
  redirectTimekeepingFeedback({});
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

function redirectTimekeepingFeedback(params: { tab?: string; error?: string }): never {
  const search = new URLSearchParams();

  if (params.tab && params.tab !== "access") {
    search.set("tab", params.tab);
  }

  if (params.error) {
    search.set("error", params.error);
  }

  const query = search.toString();
  redirect(`/settings/timekeeping${query ? `?${query}` : ""}`);
}

function redirectAttendanceFeedback(params: { tab?: string; error?: string }): never {
  const search = new URLSearchParams();

  if (params.tab) {
    search.set("tab", params.tab);
  }

  if (params.error) {
    search.set("error", params.error);
  }

  const query = search.toString();
  redirect(`/attendance${query ? `?${query}` : ""}`);
}
