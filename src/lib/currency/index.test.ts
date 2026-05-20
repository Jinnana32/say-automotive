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
  it("formats app and print money with four decimals", () => {
    expect(APP_MONEY_DECIMAL_PLACES).toBe(4);
    expect(PRINT_MONEY_DECIMAL_PLACES).toBe(4);
    expect(formatCurrency(180)).toBe("₱180.0000");
    expect(formatCurrencyNumber(5200.25)).toBe("5,200.2500");
    expect(formatPrintCurrency(180)).toBe("₱180.0000");
    expect(formatPrintCurrencyNumber(5200.25)).toBe("5,200.2500");
  });

  it("rounds and serializes app money values to four decimals", () => {
    expect(roundCurrency(1.23456)).toBe(1.2346);
    expect(formatMoneyInputValue(1.2)).toBe("1.2000");
  });

  it("validates app money inputs at up to four decimal places by default", () => {
    expect(parseMoneyInput("180.1234")).toBe(180.1234);
    expect(parseMoneyInput(".5")).toBe(0.5);
    expect(parseMoneyInput("1.23456")).toBeNull();
    expect(parseMoneyInput("1e3")).toBeNull();
    expect(isNonNegativeMoneyInput("0.0000")).toBe(true);
    expect(isPositiveMoneyInput("0.0000")).toBe(false);
    expect(isPositiveMoneyInput("0.0001")).toBe(true);
  });

  it("supports explicit four-decimal validation paths", () => {
    expect(parseMoneyInput("180.1234", PRINT_MONEY_DECIMAL_PLACES)).toBe(180.1234);
    expect(isNonNegativeMoneyInput("0.0000", PRINT_MONEY_DECIMAL_PLACES)).toBe(true);
    expect(isPositiveMoneyInput("0.0001", PRINT_MONEY_DECIMAL_PLACES)).toBe(true);
  });
});
