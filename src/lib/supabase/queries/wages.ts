import { getOfficeId } from "./common";
import { createServerSupabaseClient } from "../server";
import type { Database } from "../database.types";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type MonthlyWageRow = Database["public"]["Tables"]["monthly_wages"]["Row"];

// ============================================================
// 工賃
// ============================================================

export type MonthlyWageEntry = {
  id: string;
  client_id: string;
  client_number: string | null;
  family_name: string;
  given_name: string;
  working_days: number;
  total_hours: number;
  base_wage: number;
  piece_wage: number;
  adjustment: number;
  total_wage: number;
  status: string;
};

export type WageSummary = {
  year: number;
  month: number;
  totalRevenue: number;
  totalExpense: number;
  distributable: number;
  clientWages: MonthlyWageEntry[];
};

export async function getWageData(
  year: number,
  month: number
): Promise<WageSummary> {
  const officeId = await getOfficeId();
  const supabase = await createServerSupabaseClient();

  const { data: revenues } = await supabase
    .from("production_revenues")
    .select("amount")
    .eq("office_id", officeId)
    .eq("fiscal_year", year)
    .eq("month", month)
    .returns<{ amount: number }[]>();

  const { data: expenses } = await supabase
    .from("production_expenses")
    .select("amount")
    .eq("office_id", officeId)
    .eq("fiscal_year", year)
    .eq("month", month)
    .returns<{ amount: number }[]>();

  const totalRevenue =
    revenues?.reduce((sum, r) => sum + (r.amount ?? 0), 0) ?? 0;
  const totalExpense =
    expenses?.reduce((sum, e) => sum + (e.amount ?? 0), 0) ?? 0;

  const { data: wages } = await supabase
    .from("monthly_wages")
    .select("*")
    .eq("office_id", officeId)
    .eq("fiscal_year", year)
    .eq("month", month)
    .returns<MonthlyWageRow[]>();

  const clientIds = wages?.map((w) => w.client_id) ?? [];
  let clientMap = new Map<
    string,
    { client_number: string | null; family_name: string; given_name: string }
  >();

  if (clientIds.length > 0) {
    const { data: clients } = await supabase
      .from("clients")
      .select("id, client_number, family_name, given_name")
      .in("id", clientIds)
      .returns<Pick<ClientRow, "id" | "client_number" | "family_name" | "given_name">[]>();

    clientMap = new Map(
      clients?.map((c) => [
        c.id,
        {
          client_number: c.client_number,
          family_name: c.family_name,
          given_name: c.given_name,
        },
      ]) ?? []
    );
  }

  const clientWages: MonthlyWageEntry[] = (wages ?? []).map((w) => {
    const client = clientMap.get(w.client_id);
    return {
      id: w.id,
      client_id: w.client_id,
      client_number: client?.client_number ?? null,
      family_name: client?.family_name ?? "",
      given_name: client?.given_name ?? "",
      working_days: w.working_days,
      total_hours: w.total_hours,
      base_wage: w.base_wage,
      piece_wage: w.piece_wage,
      adjustment: w.adjustment,
      total_wage: w.total_wage,
      status: w.status,
    };
  });

  return {
    year,
    month,
    totalRevenue,
    totalExpense,
    distributable: totalRevenue - totalExpense,
    clientWages,
  };
}

export type MonthlyWageTrendItem = {
  month: string;
  avg: number;
};

export async function getMonthlyWageTrend(
  months: number = 5
): Promise<MonthlyWageTrendItem[]> {
  const officeId = await getOfficeId();
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("monthly_wages")
    .select("fiscal_year, month, total_wage")
    .eq("office_id", officeId)
    .eq("status", "confirmed")
    .returns<Pick<MonthlyWageRow, "fiscal_year" | "month" | "total_wage">[]>();

  if (!data?.length) return [];

  const monthlyTotals = new Map<string, { total: number; count: number }>();
  for (const w of data) {
    const key = `${w.fiscal_year}-${String(w.month).padStart(2, "0")}`;
    const entry = monthlyTotals.get(key) ?? { total: 0, count: 0 };
    entry.total += w.total_wage;
    entry.count += 1;
    monthlyTotals.set(key, entry);
  }

  return Array.from(monthlyTotals.entries())
    .map(([month, { total, count }]) => ({
      month,
      avg: count > 0 ? Math.round(total / count) : 0,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-months);
}

// ============================================================
// 平均工賃月額（年度リアルタイム）
// ============================================================

export type AvgWageMonthly = {
  fiscalYear: number;
  monthsElapsed: number;
  totalWagePaid: number;
  avgDailyUsers: number;
  currentAvgWageMonthly: number;
  monthlyBreakdown: { month: number; totalWage: number; userCount: number; avg: number }[];
};

export async function getAvgWageMonthly(
  fiscalYear: number
): Promise<AvgWageMonthly | null> {
  const officeId = await getOfficeId();
  const supabase = await createServerSupabaseClient();

  const { data: wages } = await supabase
    .from("monthly_wages")
    .select("fiscal_year, month, total_wage, client_id")
    .eq("office_id", officeId)
    .eq("fiscal_year", fiscalYear)
    .returns<{ fiscal_year: number; month: number; total_wage: number; client_id: string }[]>();

  if (!wages?.length) return null;

  // 月別集計
  const monthMap = new Map<number, { total: number; clients: Set<string> }>();
  for (const w of wages) {
    const entry = monthMap.get(w.month) ?? { total: 0, clients: new Set<string>() };
    entry.total += w.total_wage;
    entry.clients.add(w.client_id);
    monthMap.set(w.month, entry);
  }

  const monthlyBreakdown = Array.from(monthMap.entries())
    .map(([month, { total, clients }]) => ({
      month,
      totalWage: total,
      userCount: clients.size,
      avg: clients.size > 0 ? Math.round(total / clients.size) : 0,
    }))
    .sort((a, b) => a.month - b.month);

  const monthsElapsed = monthlyBreakdown.length;
  const totalWagePaid = monthlyBreakdown.reduce((s, m) => s + m.totalWage, 0);
  const avgDailyUsers =
    monthsElapsed > 0
      ? monthlyBreakdown.reduce((s, m) => s + m.userCount, 0) / monthsElapsed
      : 0;
  const currentAvgWageMonthly =
    avgDailyUsers > 0 && monthsElapsed > 0
      ? Math.round(totalWagePaid / avgDailyUsers / monthsElapsed)
      : 0;

  return {
    fiscalYear,
    monthsElapsed,
    totalWagePaid,
    avgDailyUsers,
    currentAvgWageMonthly,
    monthlyBreakdown,
  };
}
