import { describe, expect, it } from "vitest";

import {
  APP_MONEY_DECIMAL_PLACES,
  formatCurrency,
  formatCurrencyForPrint,
  formatCurrencyForUI,
  formatCurrencyNumber,
  formatMoneyInputValue,
  formatNumberForInput,
  formatPrintCurrency,
  formatPrintCurrencyNumber,
  isNonNegativeMoneyInput,
  isPositiveMoneyInput,
  parseMoneyInput,
  PRINT_MONEY_DECIMAL_PLACES,
  roundCurrency,
} from "@/lib/currency";

describe("currency helpers", () => {
  it("formats UI money without unnecessary decimals", () => {
    expect(formatCurrencyForUI(180)).toBe("₱180");
    expect(formatCurrency(180.5)).toBe("₱180.50");
    expect(formatCurrency(180.25)).toBe("₱180.25");
    expect(formatCurrencyNumber(1250)).toBe("1,250");
    expect(formatCurrencyNumber(1250.5)).toBe("1,250.50");
  });

  it("formats print money with four decimals", () => {
    expect(APP_MONEY_DECIMAL_PLACES).toBe(4);
    expect(PRINT_MONEY_DECIMAL_PLACES).toBe(4);
    expect(formatCurrencyForPrint(180)).toBe("₱180.0000");
    expect(formatPrintCurrency(180)).toBe("₱180.0000");
    expect(formatPrintCurrencyNumber(5200.25)).toBe("5,200.2500");
  });

  it("rounds internal values to four decimals", () => {
    expect(roundCurrency(1.23456)).toBe(1.2346);
  });

  it("serializes editable input values without forced trailing zeros", () => {
    expect(formatNumberForInput(0)).toBe("0");
    expect(formatNumberForInput(0, { emptyZero: true })).toBe("");
    expect(formatNumberForInput(180)).toBe("180");
    expect(formatNumberForInput(180.5)).toBe("180.5");
    expect(formatNumberForInput(180.25)).toBe("180.25");
    expect(formatNumberForInput(1.2)).toBe("1.2");
    expect(formatMoneyInputValue(1.2)).toBe("1.2");
  });

  it("caps noisy payment-style values to two decimals for input display", () => {
    expect(formatNumberForInput(0.000022233232, { maxDecimals: 2 })).toBe("0");
    expect(formatNumberForInput(180.5678, { maxDecimals: 2 })).toBe("180.57");
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
