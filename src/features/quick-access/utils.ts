export function normalizeQuickAccessPlate(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function looksLikeQuickAccessPlateLookup(value: string) {
  const normalized = normalizeQuickAccessPlate(value);

  if (!normalized) {
    return false;
  }

  return /\d/.test(normalized);
}

export function resolveQuickAccessQuery(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return {
      plateQuery: "",
      customerLastNameQuery: "",
    };
  }

  if (looksLikeQuickAccessPlateLookup(trimmedValue)) {
    return {
      plateQuery: normalizeQuickAccessPlate(trimmedValue),
      customerLastNameQuery: "",
    };
  }

  return {
    plateQuery: "",
    customerLastNameQuery: trimmedValue,
  };
}

export function extractPlateCandidatesFromTextBlocks(textBlocks: string[]) {
  const candidates = new Set<string>();

  for (const block of textBlocks) {
    const normalizedBlock = normalizeQuickAccessPlate(block);

    if (isLikelyPlateCandidate(normalizedBlock)) {
      candidates.add(normalizedBlock);
    }

    const tokens = block
      .toUpperCase()
      .split(/[^A-Z0-9]+/)
      .map((token) => normalizeQuickAccessPlate(token))
      .filter(Boolean);

    for (let startIndex = 0; startIndex < tokens.length; startIndex += 1) {
      for (let width = 1; width <= 3; width += 1) {
        const candidate = tokens.slice(startIndex, startIndex + width).join("");

        if (isLikelyPlateCandidate(candidate)) {
          candidates.add(candidate);
        }
      }
    }
  }

  return [...candidates].sort((left, right) => scorePlateCandidate(right) - scorePlateCandidate(left));
}

export function getQuickAccessPlateTokens(value: string) {
  const normalizedValue = normalizeQuickAccessPlate(value);

  return [
    ...(normalizedValue.match(/[A-Z]{2,}/g) ?? []),
    ...(normalizedValue.match(/\d{2,}/g) ?? []),
  ];
}

export function isPossiblePlateMatch(plateNumber: string | null, query: string) {
  const normalizedPlate = normalizeQuickAccessPlate(plateNumber ?? "");
  const normalizedQuery = normalizeQuickAccessPlate(query);

  if (!normalizedPlate || !normalizedQuery) {
    return false;
  }

  if (normalizedPlate === normalizedQuery) {
    return true;
  }

  if (normalizedPlate.includes(normalizedQuery) || normalizedQuery.includes(normalizedPlate)) {
    return true;
  }

  const tokens = getQuickAccessPlateTokens(normalizedQuery);

  if (tokens.length === 0) {
    return false;
  }

  return tokens.every((token) => normalizedPlate.includes(token));
}

function isLikelyPlateCandidate(value: string) {
  return value.length >= 5 && value.length <= 8 && /[A-Z]/.test(value) && /\d/.test(value);
}

function scorePlateCandidate(value: string) {
  let score = 0;

  if (/^[A-Z]{3}\d{4}$/.test(value)) {
    score += 8;
  } else if (/^[A-Z]{3}\d{3}$/.test(value)) {
    score += 7;
  } else if (/^[A-Z]{2}\d{4}$/.test(value)) {
    score += 6;
  } else if (/^\d{3,4}[A-Z]{2,3}$/.test(value)) {
    score += 5;
  }

  if (value.length === 6 || value.length === 7) {
    score += 2;
  }

  if (/[A-Z]/.test(value) && /\d/.test(value)) {
    score += 1;
  }

  return score;
}
