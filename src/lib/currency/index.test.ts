import { describe, expect, it } from "vitest";

import {
  APP_MONEY_DECIMAL_PLACES,
  formatCurrency,
  formatCurrencyNumber,
  formatMoneyInputValue,
  formatPrintCurrency,
  formatPrintCurrencyNumber,
  isNonNegativeMoneyInput,
  isPositiveMoneyInput,
  parseMoneyInput,
  PRINT_MONEY_DECIMAL_PLACES,
  roundCurrency,
} from "@/lib/currency";

describe("currency helpers", () => {
  it("formats app money with two decimals and print money with four", () => {
    expect(APP_MONEY_DECIMAL_PLACES).toBe(2);
    expect(PRINT_MONEY_DECIMAL_PLACES).toBe(4);
    expect(formatCurrency(180)).toBe("₱180.00");
    expect(formatCurrencyNumber(5200.25)).toBe("5,200.25");
    expect(formatPrintCurrency(180)).toBe("₱180.0000");
    expect(formatPrintCurrencyNumber(5200.25)).toBe("5,200.2500");
  });

  it("rounds and serializes app money values to two decimals", () => {
    expect(roundCurrency(1.23456)).toBe(1.23);
    expect(formatMoneyInputValue(1.2)).toBe("1.20");
  });

  it("validates app money inputs at up to two decimal places by default", () => {
    expect(parseMoneyInput("180.12")).toBe(180.12);
    expect(parseMoneyInput(".5")).toBe(0.5);
    expect(parseMoneyInput("1.234")).toBeNull();
    expect(parseMoneyInput("1e3")).toBeNull();
    expect(isNonNegativeMoneyInput("0.00")).toBe(true);
    expect(isPositiveMoneyInput("0.00")).toBe(false);
    expect(isPositiveMoneyInput("0.01")).toBe(true);
  });

  it("supports four-decimal validation for print/export-specific precision paths", () => {
    expect(parseMoneyInput("180.1234", PRINT_MONEY_DECIMAL_PLACES)).toBe(180.1234);
    expect(isNonNegativeMoneyInput("0.0000", PRINT_MONEY_DECIMAL_PLACES)).toBe(true);
    expect(isPositiveMoneyInput("0.0001", PRINT_MONEY_DECIMAL_PLACES)).toBe(true);
  });
});
