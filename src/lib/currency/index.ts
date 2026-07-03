export const APP_MONEY_DECIMAL_PLACES = 4;
export const PRINT_MONEY_DECIMAL_PLACES = 4;
export const UI_MONEY_DISPLAY_DECIMAL_PLACES = 2;
export const MONEY_INPUT_STEP = "0.01";

const phpUiFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: UI_MONEY_DISPLAY_DECIMAL_PLACES,
});

const phpUiNumberFormatter = new Intl.NumberFormat("en-PH", {
  minimumFractionDigits: 0,
  maximumFractionDigits: UI_MONEY_DISPLAY_DECIMAL_PLACES,
});

const phpPrintFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: PRINT_MONEY_DECIMAL_PLACES,
  maximumFractionDigits: PRINT_MONEY_DECIMAL_PLACES,
});

const phpPrintNumberFormatter = new Intl.NumberFormat("en-PH", {
  minimumFractionDigits: PRINT_MONEY_DECIMAL_PLACES,
  maximumFractionDigits: PRINT_MONEY_DECIMAL_PLACES,
});

export function roundCurrency(value: number) {
  return Number(value.toFixed(APP_MONEY_DECIMAL_PLACES));
}

function roundCurrencyForDisplay(value: number) {
  return Number(roundCurrency(value).toFixed(UI_MONEY_DISPLAY_DECIMAL_PLACES));
}

function trimTrailingZeros(value: number, maxDecimals: number) {
  const raw = value.toFixed(maxDecimals);

  if (!raw.includes(".")) {
    return raw;
  }

  return raw.replace(/0+$/, "").replace(/\.$/, "");
}

export function parseMoneyInput(
  value: string,
  decimalPlaces = APP_MONEY_DECIMAL_PLACES,
) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (!/^(?:\d+|\d*\.\d+|\d+\.)$/.test(trimmed)) {
    return null;
  }

  const [, fractional = ""] = trimmed.split(".");

  if (fractional.length > decimalPlaces) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isNonNegativeMoneyInput(
  value: string,
  decimalPlaces = APP_MONEY_DECIMAL_PLACES,
) {
  const parsed = parseMoneyInput(value, decimalPlaces);
  return parsed !== null && parsed >= 0;
}

export function isPositiveMoneyInput(
  value: string,
  decimalPlaces = APP_MONEY_DECIMAL_PLACES,
) {
  const parsed = parseMoneyInput(value, decimalPlaces);
  return parsed !== null && parsed > 0;
}

export function formatCurrencyForUI(value: number) {
  const rounded = roundCurrencyForDisplay(value);

  if (Number.isInteger(rounded)) {
    return phpUiFormatter.format(rounded);
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: UI_MONEY_DISPLAY_DECIMAL_PLACES,
    maximumFractionDigits: UI_MONEY_DISPLAY_DECIMAL_PLACES,
  }).format(rounded);
}

export function formatCurrency(value: number) {
  return formatCurrencyForUI(value);
}

export function formatCurrencyNumber(value: number) {
  const rounded = roundCurrencyForDisplay(value);

  if (Number.isInteger(rounded)) {
    return phpUiNumberFormatter.format(rounded);
  }

  return new Intl.NumberFormat("en-PH", {
    minimumFractionDigits: UI_MONEY_DISPLAY_DECIMAL_PLACES,
    maximumFractionDigits: UI_MONEY_DISPLAY_DECIMAL_PLACES,
  }).format(rounded);
}

export function formatNumberForInput(
  value: number,
  options?: {
    emptyZero?: boolean;
    maxDecimals?: number;
  },
) {
  const maxDecimals = options?.maxDecimals ?? APP_MONEY_DECIMAL_PLACES;
  const rounded = roundCurrency(value);
  const normalized = Number(rounded.toFixed(maxDecimals));

  if (normalized === 0) {
    return options?.emptyZero ? "" : "0";
  }

  return trimTrailingZeros(normalized, maxDecimals);
}

export function formatMoneyInputValue(
  value: number,
  options?: {
    emptyZero?: boolean;
    maxDecimals?: number;
  },
) {
  return formatNumberForInput(value, options);
}

export function formatCurrencyForPrint(value: number) {
  return phpPrintFormatter.format(Number(value.toFixed(PRINT_MONEY_DECIMAL_PLACES)));
}

export function formatPrintCurrency(value: number) {
  return formatCurrencyForPrint(value);
}

export function formatPrintCurrencyNumber(value: number) {
  return phpPrintNumberFormatter.format(
    Number(value.toFixed(PRINT_MONEY_DECIMAL_PLACES)),
  );
}
