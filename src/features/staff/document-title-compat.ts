export function isMissingStaffDocumentTitleColumnError(
  error: { message?: string | null } | null | undefined,
) {
  return error?.message?.includes("column staff.document_title does not exist") ?? false;
}
