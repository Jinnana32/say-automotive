/**
 * Split free-form document body text into page-sized chunks that fit a measured
 * body height. Prefer breaks at newlines, then spaces, then hard cut.
 */
export function paginatePlainText(
  text: string,
  measureHeight: (chunk: string) => number,
  maxHeight: number,
): string[] {
  const source = text.replace(/\r\n/g, "\n");
  if (!source.trim()) {
    return [source];
  }

  if (maxHeight <= 0) {
    return [source];
  }

  if (measureHeight(source) <= maxHeight) {
    return [source];
  }

  const pages: string[] = [];
  let remaining = source;

  while (remaining.length > 0) {
    if (measureHeight(remaining) <= maxHeight) {
      pages.push(remaining);
      break;
    }

    const fitLength = findMaxFittingLength(remaining, measureHeight, maxHeight);
    if (fitLength <= 0) {
      // Guarantees progress even if a single glyph somehow overflows.
      const forced = Math.max(1, Math.floor(remaining.length / 2));
      pages.push(remaining.slice(0, forced));
      remaining = remaining.slice(forced);
      continue;
    }

    const breakAt = findPreferredBreak(remaining, fitLength);
    pages.push(remaining.slice(0, breakAt).replace(/[ \t]+$/g, ""));
    remaining = remaining.slice(breakAt).replace(/^[ \t]+/g, "").replace(/^\n/, "");
  }

  return pages.length > 0 ? pages : [""];
}

function findMaxFittingLength(
  text: string,
  measureHeight: (chunk: string) => number,
  maxHeight: number,
) {
  let low = 1;
  let high = text.length;
  let best = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (measureHeight(text.slice(0, mid)) <= maxHeight) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return best;
}

function findPreferredBreak(text: string, maxLength: number) {
  const windowStart = Math.floor(maxLength * 0.7);
  const candidate = text.slice(windowStart, maxLength);

  const newlineOffset = candidate.lastIndexOf("\n");
  if (newlineOffset >= 0) {
    return windowStart + newlineOffset + 1;
  }

  const spaceOffset = Math.max(
    candidate.lastIndexOf(" "),
    candidate.lastIndexOf("\t"),
  );
  if (spaceOffset >= 0) {
    return windowStart + spaceOffset + 1;
  }

  return maxLength;
}
