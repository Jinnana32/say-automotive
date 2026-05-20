export const APP_MONEY_DECIMAL_PLACES = 4;
export const PRINT_MONEY_DECIMAL_PLACES = 4;
export const MONEY_INPUT_STEP = "0.0001";

const phpFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: APP_MONEY_DECIMAL_PLACES,
  maximumFractionDigits: APP_MONEY_DECIMAL_PLACES,
});

const phpNumberFormatter = new Intl.NumberFormat("en-PH", {
  minimumFractionDigits: APP_MONEY_DECIMAL_PLACES,
  maximumFractionDigits: APP_MONEY_DECIMAL_PLACES,
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

export function formatCurrency(value: number) {
  return phpFormatter.format(roundCurrency(value));
}

export function formatCurrencyNumber(value: number) {
  return phpNumberFormatter.format(roundCurrency(value));
}

export function formatMoneyInputValue(value: number) {
  return roundCurrency(value).toFixed(APP_MONEY_DECIMAL_PLACES);
}

export function formatPrintCurrency(value: number) {
  return phpPrintFormatter.format(Number(value.toFixed(PRINT_MONEY_DECIMAL_PLACES)));
}

export function formatPrintCurrencyNumber(value: number) {
  return phpPrintNumberFormatter.format(
    Number(value.toFixed(PRINT_MONEY_DECIMAL_PLACES)),
  );
}
