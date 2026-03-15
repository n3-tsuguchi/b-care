import { describe, it, expect } from "vitest";
import {
  getRoundingFn,
  calculateAttendanceHours,
  aggregateClientStats,
  calculateClientWage,
  calculateAllWages,
  calculateWageSummary,
  calculateMonthlySummary,
  type WageRuleSettings,
  type AttendanceForWage,
} from "../wages";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRules(overrides: Partial<WageRuleSettings> = {}): WageRuleSettings {
  return {
    calculationMethod: "hourly",
    baseHourlyRate: 250,
    baseDailyRate: 2000,
    roundingMethod: "floor",
    ...overrides,
  };
}

function makeAttendance(overrides: Partial<AttendanceForWage> = {}): AttendanceForWage {
  return {
    clientId: "c1",
    attendanceDate: "2025-04-01",
    serviceHours: null,
    checkInTime: "09:00",
    checkOutTime: "16:00",
    pieceAmount: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// getRoundingFn
// ---------------------------------------------------------------------------
describe("getRoundingFn", () => {
  it("returns Math.floor for 'floor'", () => {
    expect(getRoundingFn("floor")(1.9)).toBe(1);
  });

  it("returns Math.ceil for 'ceil'", () => {
    expect(getRoundingFn("ceil")(1.1)).toBe(2);
  });

  it("returns Math.round for 'round'", () => {
    expect(getRoundingFn("round")(1.5)).toBe(2);
    expect(getRoundingFn("round")(1.4)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// calculateAttendanceHours
// ---------------------------------------------------------------------------
describe("calculateAttendanceHours", () => {
  it("uses serviceHours when available", () => {
    expect(
      calculateAttendanceHours({
        serviceHours: 4.5,
        checkInTime: "09:00",
        checkOutTime: "16:00",
      })
    ).toBe(4.5);
  });

  it("computes from check-in/out minus 1 hour break", () => {
    // 09:00 ~ 16:00 = 7 hours - 1 break = 6
    expect(
      calculateAttendanceHours({
        serviceHours: null,
        checkInTime: "09:00",
        checkOutTime: "16:00",
      })
    ).toBe(6);
  });

  it("handles partial hours", () => {
    // 09:00 ~ 14:30 = 5.5 hours - 1 = 4.5
    expect(
      calculateAttendanceHours({
        serviceHours: null,
        checkInTime: "09:00",
        checkOutTime: "14:30",
      })
    ).toBe(4.5);
  });

  it("returns 0 for very short shifts (negative after break)", () => {
    // 09:00 ~ 09:30 = 0.5 hours - 1 = -0.5 → clamped to 0
    expect(
      calculateAttendanceHours({
        serviceHours: null,
        checkInTime: "09:00",
        checkOutTime: "09:30",
      })
    ).toBe(0);
  });

  it("defaults to 6 hours when no data", () => {
    expect(
      calculateAttendanceHours({
        serviceHours: null,
        checkInTime: null,
        checkOutTime: null,
      })
    ).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// aggregateClientStats
// ---------------------------------------------------------------------------
describe("aggregateClientStats", () => {
  it("aggregates multiple records for same client", () => {
    const attendances = [
      makeAttendance({ clientId: "c1", pieceAmount: 100 }),
      makeAttendance({ clientId: "c1", pieceAmount: 200 }),
    ];
    const stats = aggregateClientStats(attendances);
    const c1 = stats.get("c1")!;

    expect(c1.days).toBe(2);
    expect(c1.hours).toBe(12); // 6 hours * 2
    expect(c1.pieceWage).toBe(300);
  });

  it("separates different clients", () => {
    const attendances = [
      makeAttendance({ clientId: "c1" }),
      makeAttendance({ clientId: "c2" }),
    ];
    const stats = aggregateClientStats(attendances);

    expect(stats.size).toBe(2);
    expect(stats.get("c1")!.days).toBe(1);
    expect(stats.get("c2")!.days).toBe(1);
  });

  it("returns empty map for empty input", () => {
    expect(aggregateClientStats([]).size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// calculateClientWage
// ---------------------------------------------------------------------------
describe("calculateClientWage", () => {
  it("calculates hourly wage", () => {
    const result = calculateClientWage(
      "c1",
      { days: 20, hours: 100, pieceWage: 500 },
      makeRules({ calculationMethod: "hourly", baseHourlyRate: 250 })
    );
    expect(result.baseWage).toBe(25000); // 100h * 250
    expect(result.pieceWage).toBe(500);
    expect(result.totalWage).toBe(25500);
  });

  it("calculates daily wage", () => {
    const result = calculateClientWage(
      "c1",
      { days: 20, hours: 100, pieceWage: 0 },
      makeRules({ calculationMethod: "daily", baseDailyRate: 2000 })
    );
    expect(result.baseWage).toBe(40000); // 20d * 2000
  });

  it("applies rounding method", () => {
    const result = calculateClientWage(
      "c1",
      { days: 3, hours: 7.7, pieceWage: 0 },
      makeRules({ calculationMethod: "hourly", baseHourlyRate: 333, roundingMethod: "ceil" })
    );
    // 7.7 * 333 = 2564.1 → ceil = 2565
    expect(result.baseWage).toBe(Math.ceil(7.7 * 333));
  });
});

// ---------------------------------------------------------------------------
// calculateAllWages
// ---------------------------------------------------------------------------
describe("calculateAllWages", () => {
  it("processes all clients from raw attendance data", () => {
    const attendances = [
      makeAttendance({ clientId: "c1" }),
      makeAttendance({ clientId: "c1" }),
      makeAttendance({ clientId: "c2" }),
    ];
    const wages = calculateAllWages(attendances, makeRules());

    expect(wages).toHaveLength(2);
    const c1 = wages.find((w) => w.clientId === "c1")!;
    const c2 = wages.find((w) => w.clientId === "c2")!;
    expect(c1.workingDays).toBe(2);
    expect(c2.workingDays).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// calculateWageSummary
// ---------------------------------------------------------------------------
describe("calculateWageSummary", () => {
  it("computes totals and averages", () => {
    const wages = calculateAllWages(
      [
        makeAttendance({ clientId: "c1" }),
        makeAttendance({ clientId: "c2" }),
      ],
      makeRules()
    );
    const summary = calculateWageSummary(wages);

    expect(summary.clientCount).toBe(2);
    expect(summary.totalWagePaid).toBe(wages[0].totalWage + wages[1].totalWage);
    expect(summary.avgWagePerPerson).toBe(
      Math.round(summary.totalWagePaid / 2)
    );
  });

  it("handles empty array", () => {
    const summary = calculateWageSummary([]);
    expect(summary).toEqual({ totalWagePaid: 0, avgWagePerPerson: 0, clientCount: 0 });
  });
});

// ---------------------------------------------------------------------------
// calculateMonthlySummary
// ---------------------------------------------------------------------------
describe("calculateMonthlySummary", () => {
  it("combines wage summary with production data", () => {
    const wages = calculateAllWages(
      [makeAttendance({ clientId: "c1" })],
      makeRules()
    );
    const result = calculateMonthlySummary(
      wages,
      500000, // revenue
      200000, // expense
      ["2025-04-01", "2025-04-01", "2025-04-02"] // attendance dates
    );

    expect(result.totalProductionRevenue).toBe(500000);
    expect(result.totalProductionExpense).toBe(200000);
    expect(result.distributableAmount).toBe(300000);
    expect(result.avgDailyUsers).toBe(1.5); // 3 records / 2 unique dates
  });
});
