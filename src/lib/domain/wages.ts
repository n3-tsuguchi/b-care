/**
 * Wages domain - pure calculation functions (no DB calls)
 *
 * Extracts the business logic from /api/wages/route.ts so it can be
 * unit-tested and reused independently of the HTTP / Supabase layers.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RoundingMethod = "floor" | "ceil" | "round";
export type CalculationMethod = "hourly" | "daily" | "mixed";

/** Wage rule settings for the office/fiscal year. */
export type WageRuleSettings = {
  calculationMethod: CalculationMethod;
  baseHourlyRate: number;
  baseDailyRate: number;
  roundingMethod: RoundingMethod;
};

/** A single attendance record with the fields needed for wage calc. */
export type AttendanceForWage = {
  clientId: string;
  attendanceDate: string;
  /** service_hours if pre-calculated, otherwise null. */
  serviceHours: number | null;
  /** HH:MM format or null. */
  checkInTime: string | null;
  /** HH:MM format or null. */
  checkOutTime: string | null;
  /** Sum of piece-work amounts for this attendance. */
  pieceAmount: number;
};

/** Aggregated stats for one client before wage calculation. */
export type ClientWorkStats = {
  days: number;
  hours: number;
  pieceWage: number;
};

/** Calculated wage result for one client. */
export type ClientWageResult = {
  clientId: string;
  workingDays: number;
  totalHours: number;
  baseWage: number;
  pieceWage: number;
  totalWage: number;
};

/** Summary totals across all clients. */
export type WageSummary = {
  totalWagePaid: number;
  avgWagePerPerson: number;
  clientCount: number;
};

/** Monthly summary with production data. */
export type MonthlySummary = {
  totalProductionRevenue: number;
  totalProductionExpense: number;
  distributableAmount: number;
  totalWagePaid: number;
  avgWagePerPerson: number;
  avgDailyUsers: number;
};

// ---------------------------------------------------------------------------
// Pure calculation functions
// ---------------------------------------------------------------------------

/**
 * Return a rounding function based on the method name.
 */
export function getRoundingFn(method: RoundingMethod): (v: number) => number {
  if (method === "ceil") return Math.ceil;
  if (method === "round") return Math.round;
  return Math.floor;
}

/**
 * Calculate effective working hours from a single attendance record.
 * - Uses serviceHours if available.
 * - Otherwise computes from check-in/check-out minus 1 hour break.
 * - Falls back to 6 hours default.
 */
export function calculateAttendanceHours(att: {
  serviceHours: number | null;
  checkInTime: string | null;
  checkOutTime: string | null;
}): number {
  if (att.serviceHours != null) {
    return Number(att.serviceHours);
  }
  if (att.checkInTime && att.checkOutTime) {
    const [inH, inM] = att.checkInTime.split(":").map(Number);
    const [outH, outM] = att.checkOutTime.split(":").map(Number);
    const hours = (outH * 60 + outM - (inH * 60 + inM)) / 60;
    return Math.max(0, hours - 1); // 休憩1時間差引
  }
  return 6; // デフォルト6時間
}

/**
 * Aggregate attendance records into per-client work stats.
 */
export function aggregateClientStats(
  attendances: AttendanceForWage[]
): Map<string, ClientWorkStats> {
  const stats = new Map<string, ClientWorkStats>();

  for (const att of attendances) {
    const s = stats.get(att.clientId) ?? { days: 0, hours: 0, pieceWage: 0 };
    s.days += 1;
    s.hours += calculateAttendanceHours(att);
    s.pieceWage += att.pieceAmount;
    stats.set(att.clientId, s);
  }

  return stats;
}

/**
 * Calculate wage for a single client given their work stats and wage rules.
 */
export function calculateClientWage(
  clientId: string,
  stats: ClientWorkStats,
  rules: WageRuleSettings
): ClientWageResult {
  const roundFn = getRoundingFn(rules.roundingMethod);

  let baseWage: number;
  if (rules.calculationMethod === "daily") {
    baseWage = roundFn(stats.days * rules.baseDailyRate);
  } else {
    // hourly or mixed
    baseWage = roundFn(stats.hours * rules.baseHourlyRate);
  }

  const pieceWage = roundFn(stats.pieceWage);
  const totalWage = baseWage + pieceWage;

  return {
    clientId,
    workingDays: stats.days,
    totalHours: Math.round(stats.hours * 100) / 100,
    baseWage,
    pieceWage,
    totalWage,
  };
}

/**
 * Calculate wages for all clients from raw attendance data.
 * This is the main entry point that combines aggregation + calculation.
 */
export function calculateAllWages(
  attendances: AttendanceForWage[],
  rules: WageRuleSettings
): ClientWageResult[] {
  const clientStats = aggregateClientStats(attendances);

  return Array.from(clientStats.entries()).map(([clientId, stats]) =>
    calculateClientWage(clientId, stats, rules)
  );
}

/**
 * Compute a wage summary from calculated wage results.
 */
export function calculateWageSummary(
  wages: ClientWageResult[]
): WageSummary {
  const totalWagePaid = wages.reduce((sum, w) => sum + w.totalWage, 0);
  const avgWagePerPerson =
    wages.length > 0 ? Math.round(totalWagePaid / wages.length) : 0;

  return {
    totalWagePaid,
    avgWagePerPerson,
    clientCount: wages.length,
  };
}

/**
 * Build monthly summary combining wages with production revenue/expense data.
 *
 * @param wages - calculated wage results
 * @param totalRevenue - sum of production_revenues for the month
 * @param totalExpense - sum of production_expenses for the month
 * @param attendances - raw attendances (used for avg daily users)
 */
export function calculateMonthlySummary(
  wages: ClientWageResult[],
  totalRevenue: number,
  totalExpense: number,
  attendanceDates: string[]
): MonthlySummary {
  const wageSummary = calculateWageSummary(wages);

  const uniqueDates = new Set(attendanceDates);
  const avgDailyUsers =
    uniqueDates.size > 0
      ? Math.round((attendanceDates.length / uniqueDates.size) * 100) / 100
      : 0;

  return {
    totalProductionRevenue: totalRevenue,
    totalProductionExpense: totalExpense,
    distributableAmount: totalRevenue - totalExpense,
    totalWagePaid: wageSummary.totalWagePaid,
    avgWagePerPerson: wageSummary.avgWagePerPerson,
    avgDailyUsers,
  };
}
