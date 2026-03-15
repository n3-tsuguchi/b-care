import { describe, it, expect } from "vitest";
import {
  calculateClientBilling,
  calculateBatchTotals,
  type ClientBillingInput,
  type AdditionSetting,
} from "../billing";

// ---------------------------------------------------------------------------
// Helper to build a default input (can override per-test)
// ---------------------------------------------------------------------------
function makeInput(overrides: Partial<ClientBillingInput> = {}): ClientBillingInput {
  return {
    baseUnitsPerDay: 566,
    serviceDays: 20,
    monthlyDaysLimit: 22,
    additionSettings: [],
    unitPrice: 10.0,
    incomeCategory: "ippan_1",
    copayLimit: 9300,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// calculateClientBilling
// ---------------------------------------------------------------------------
describe("calculateClientBilling", () => {
  it("calculates base units correctly", () => {
    const result = calculateClientBilling(makeInput());
    expect(result.serviceDays).toBe(20);
    expect(result.baseUnits).toBe(566 * 20); // 11320
    expect(result.additionUnits).toBe(0);
    expect(result.totalUnits).toBe(11320);
  });

  it("caps service days at monthlyDaysLimit", () => {
    const result = calculateClientBilling(
      makeInput({ serviceDays: 25, monthlyDaysLimit: 22 })
    );
    expect(result.serviceDays).toBe(22);
    expect(result.baseUnits).toBe(566 * 22);
  });

  it("does not cap when serviceDays <= limit", () => {
    const result = calculateClientBilling(
      makeInput({ serviceDays: 15, monthlyDaysLimit: 22 })
    );
    expect(result.serviceDays).toBe(15);
  });

  it("calculates totalAmount as floor(totalUnits * unitPrice)", () => {
    const result = calculateClientBilling(
      makeInput({ baseUnitsPerDay: 100, serviceDays: 3, unitPrice: 10.33 })
    );
    // totalUnits = 300, totalAmount = floor(300 * 10.33) = floor(3099) = 3099
    expect(result.totalAmount).toBe(Math.floor(300 * 10.33));
  });

  // --- Copay ---
  it("sets copay to 0 for seikatsu_hogo", () => {
    const result = calculateClientBilling(
      makeInput({ incomeCategory: "seikatsu_hogo" })
    );
    expect(result.copayAmount).toBe(0);
    expect(result.publicExpense).toBe(result.totalAmount);
  });

  it("caps copay at copayLimit", () => {
    // totalAmount = 566 * 20 * 10 = 113200, 10% = 11320 > 9300
    const result = calculateClientBilling(makeInput());
    expect(result.copayAmount).toBe(9300);
    expect(result.copayLimitResult).toBe("Y");
    expect(result.publicExpense).toBe(result.totalAmount - 9300);
  });

  it("uses 10% when below copayLimit", () => {
    // small amount so 10% < copayLimit
    const result = calculateClientBilling(
      makeInput({ baseUnitsPerDay: 50, serviceDays: 2, copayLimit: 9300 })
    );
    // totalAmount = floor(100 * 10) = 1000, 10% = 100
    expect(result.copayAmount).toBe(100);
    expect(result.copayLimitResult).toBe("N");
  });

  // --- Additions ---
  describe("addition calculations", () => {
    const perDayAddition: AdditionSetting = {
      code: "A001",
      name: "日額加算",
      units: 10,
      calculationType: "per_day",
    };

    const perMonthAddition: AdditionSetting = {
      code: "A002",
      name: "月額加算",
      units: 200,
      calculationType: "per_month",
    };

    const percentageAddition: AdditionSetting = {
      code: "A003",
      name: "割合加算",
      units: 100, // 100/1000 = 10%
      calculationType: "percentage",
    };

    it("calculates per_day addition", () => {
      const result = calculateClientBilling(
        makeInput({ serviceDays: 10, additionSettings: [perDayAddition] })
      );
      expect(result.additionUnits).toBe(10 * 10); // 100
      expect(result.additions).toHaveLength(1);
      expect(result.additions[0]).toEqual({
        code: "A001",
        name: "日額加算",
        units: 100,
        days: 10,
      });
    });

    it("calculates per_month addition", () => {
      const result = calculateClientBilling(
        makeInput({ serviceDays: 10, additionSettings: [perMonthAddition] })
      );
      expect(result.additionUnits).toBe(200);
      expect(result.additions[0].days).toBe(1);
    });

    it("calculates percentage addition", () => {
      const result = calculateClientBilling(
        makeInput({
          baseUnitsPerDay: 100,
          serviceDays: 10,
          additionSettings: [percentageAddition],
        })
      );
      // baseUnits = 1000, percentage = floor(1000 * 100/1000) = 100
      expect(result.additionUnits).toBe(100);
    });

    it("sums multiple additions", () => {
      const result = calculateClientBilling(
        makeInput({
          serviceDays: 10,
          additionSettings: [perDayAddition, perMonthAddition],
        })
      );
      expect(result.additionUnits).toBe(100 + 200);
      expect(result.additions).toHaveLength(2);
      expect(result.totalUnits).toBe(566 * 10 + 300);
    });
  });
});

// ---------------------------------------------------------------------------
// calculateBatchTotals
// ---------------------------------------------------------------------------
describe("calculateBatchTotals", () => {
  it("sums up multiple client results", () => {
    const clients = [
      calculateClientBilling(makeInput({ serviceDays: 10 })),
      calculateClientBilling(makeInput({ serviceDays: 15 })),
    ];
    const totals = calculateBatchTotals(clients);

    expect(totals.clientCount).toBe(2);
    expect(totals.totalUnits).toBe(clients[0].totalUnits + clients[1].totalUnits);
    expect(totals.totalAmount).toBe(clients[0].totalAmount + clients[1].totalAmount);
    expect(totals.totalCopay).toBe(clients[0].copayAmount + clients[1].copayAmount);
  });

  it("returns zeros for empty array", () => {
    const totals = calculateBatchTotals([]);
    expect(totals).toEqual({
      totalUnits: 0,
      totalAmount: 0,
      totalCopay: 0,
      clientCount: 0,
    });
  });
});
