/**
 * Billing domain - pure calculation functions (no DB calls)
 *
 * Extracts the business logic from /api/billing/route.ts so it can be
 * unit-tested and reused independently of the HTTP / Supabase layers.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single addition (加算) setting with its master data merged in. */
export type AdditionSetting = {
  code: string;
  name: string;
  /** Units defined in the addition master (千分率 for percentage type). */
  units: number;
  /** "per_day" | "per_month" | "percentage" */
  calculationType: string;
};

/** Inputs needed to calculate billing for one client. */
export type ClientBillingInput = {
  /** Base service units per attendance day. */
  baseUnitsPerDay: number;
  /** Actual attendance days in the month. */
  serviceDays: number;
  /** Monthly days limit from the certificate (受給者証). */
  monthlyDaysLimit: number;
  /** Office-level addition settings applicable this month. */
  additionSettings: AdditionSetting[];
  /** Regional unit price (地域区分単価), e.g. 10.0 yen. */
  unitPrice: number;
  /** Income category from the certificate, e.g. "seikatsu_hogo". */
  incomeCategory: string;
  /** Monthly copay limit (上限月額) from the certificate. */
  copayLimit: number;
};

/** Computed addition detail for one addition on one client. */
export type AdditionDetail = {
  code: string;
  name: string;
  units: number;
  days: number;
};

/** Result of calculating billing for a single client. */
export type ClientBillingResult = {
  /** Capped service days (min of actual days and monthly limit). */
  serviceDays: number;
  /** Base units = baseUnitsPerDay * serviceDays. */
  baseUnits: number;
  /** Sum of all addition units. */
  additionUnits: number;
  /** Per-addition breakdown. */
  additions: AdditionDetail[];
  /** baseUnits + additionUnits. */
  totalUnits: number;
  /** floor(totalUnits * unitPrice). */
  totalAmount: number;
  /** Copay (利用者負担額). 0 for seikatsu_hogo, else min(10%, copayLimit). */
  copayAmount: number;
  /** totalAmount - copayAmount. */
  publicExpense: number;
  /** "Y" if copay was capped by the limit, "N" otherwise. */
  copayLimitResult: "Y" | "N";
};

/** Batch totals across all clients. */
export type BatchTotals = {
  totalUnits: number;
  totalAmount: number;
  totalCopay: number;
  clientCount: number;
};

// ---------------------------------------------------------------------------
// Pure calculation functions
// ---------------------------------------------------------------------------

/**
 * Calculate billing for a single client.
 *
 * This is a pure function: given deterministic inputs it always returns
 * the same result with no side effects.
 */
export function calculateClientBilling(
  input: ClientBillingInput
): ClientBillingResult {
  const {
    baseUnitsPerDay,
    serviceDays: rawDays,
    monthlyDaysLimit,
    additionSettings,
    unitPrice,
    incomeCategory,
    copayLimit,
  } = input;

  const serviceDays = Math.min(rawDays, monthlyDaysLimit);
  const baseUnits = baseUnitsPerDay * serviceDays;

  let additionUnits = 0;
  const additions: AdditionDetail[] = [];

  for (const setting of additionSettings) {
    let addUnits = 0;
    let addDays = serviceDays;

    if (setting.calculationType === "per_day") {
      addUnits = setting.units * serviceDays;
    } else if (setting.calculationType === "per_month") {
      addUnits = setting.units;
      addDays = 1;
    } else if (setting.calculationType === "percentage") {
      addUnits = Math.floor(baseUnits * (setting.units / 1000));
      addDays = serviceDays;
    }

    if (addUnits > 0) {
      additionUnits += addUnits;
      additions.push({
        code: setting.code,
        name: setting.name,
        units: addUnits,
        days: addDays,
      });
    }
  }

  const totalUnits = baseUnits + additionUnits;
  const totalAmount = Math.floor(totalUnits * unitPrice);

  let copayAmount: number;
  if (incomeCategory === "seikatsu_hogo") {
    copayAmount = 0;
  } else {
    const tenPercent = Math.floor(totalAmount * 0.1);
    copayAmount = Math.min(tenPercent, copayLimit);
  }

  const publicExpense = totalAmount - copayAmount;
  const copayLimitResult: "Y" | "N" =
    copayAmount < Math.floor(totalAmount * 0.1) ? "Y" : "N";

  return {
    serviceDays,
    baseUnits,
    additionUnits,
    additions,
    totalUnits,
    totalAmount,
    copayAmount,
    publicExpense,
    copayLimitResult,
  };
}

/**
 * Sum up an array of per-client billing results into batch totals.
 */
export function calculateBatchTotals(
  details: ClientBillingResult[]
): BatchTotals {
  let totalUnits = 0;
  let totalAmount = 0;
  let totalCopay = 0;

  for (const d of details) {
    totalUnits += d.totalUnits;
    totalAmount += d.totalAmount;
    totalCopay += d.copayAmount;
  }

  return {
    totalUnits,
    totalAmount,
    totalCopay,
    clientCount: details.length,
  };
}
