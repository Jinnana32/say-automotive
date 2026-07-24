const MECHANIC_LOGIN_DOMAIN = "sayautocare.com";

export function slugifyStaffLoginName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^-+|-+$/g, "");
}

export function buildMechanicLoginEmailCandidates(firstName: string, lastName: string) {
  const first = slugifyStaffLoginName(firstName);
  const last = slugifyStaffLoginName(lastName);

  if (!last) {
    return [];
  }

  const candidates = [`${last}@${MECHANIC_LOGIN_DOMAIN}`];

  if (first) {
    candidates.push(`${first}.${last}@${MECHANIC_LOGIN_DOMAIN}`);

    for (let suffix = 2; suffix <= 10; suffix += 1) {
      candidates.push(`${first}.${last}${suffix}@${MECHANIC_LOGIN_DOMAIN}`);
    }
  }

  return candidates;
}

export function buildMechanicTemporaryPassword(lastName: string, currentYear = new Date().getFullYear()) {
  const last = slugifyStaffLoginName(lastName);

  if (!last) {
    return null;
  }

  return `${last}@${currentYear}`;
}

export function pickAvailableMechanicLoginEmail(
  firstName: string,
  lastName: string,
  takenEmails: ReadonlySet<string>,
) {
  const normalizedTaken = new Set(
    [...takenEmails].map((email) => email.trim().toLowerCase()),
  );

  for (const candidate of buildMechanicLoginEmailCandidates(firstName, lastName)) {
    if (!normalizedTaken.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  return null;
}

export function normalizePortalLoginEmail(value: string) {
  return value.trim().toLowerCase();
}
