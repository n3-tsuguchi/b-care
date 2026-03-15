import { getOfficeId } from "./common";
import { createServerSupabaseClient } from "../server";
import type { Database } from "../database.types";

type AttendanceRow = Database["public"]["Tables"]["attendances"]["Row"];
type BillingBatchRow = Database["public"]["Tables"]["billing_batches"]["Row"];
type MonthlyWageRow = Database["public"]["Tables"]["monthly_wages"]["Row"];
type OfficeRow = Database["public"]["Tables"]["offices"]["Row"];

// ============================================================
// ダッシュボード統計
// ============================================================

export type DashboardStats = {
  billing: {
    currentMonth: number;
    previousMonth: number;
    changePercent: number;
  };
  attendance: {
    today: number;
    capacity: number;
    monthlyRate: number;
  };
  wage: {
    currentMonth: number;
    avgPerPerson: number;
  };
  clients: {
    active: number;
    new: number;
  };
  supportPlans: {
    active: number;
    expiringSoon: number;
    needsReview: number;
  };
  certificates: {
    expiringSoon: { clientName: string; endDate: string }[];
  };
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const officeId = await getOfficeId();
  const supabase = await createServerSupabaseClient();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const todayStr = now.toISOString().split("T")[0];
  const monthStart = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;

  // 事業所情報（定員取得）
  const { data: office } = await supabase
    .from("offices")
    .select("capacity")
    .eq("id", officeId)
    .returns<Pick<OfficeRow, "capacity">[]>()
    .single();
  const capacity = office?.capacity ?? 20;

  // 請求データ（今月・先月）
  const { data: currentBilling } = await supabase
    .from("billing_batches")
    .select("total_amount")
    .eq("office_id", officeId)
    .eq("target_year", currentYear)
    .eq("target_month", currentMonth)
    .returns<Pick<BillingBatchRow, "total_amount">[]>()
    .single();

  const { data: prevBilling } = await supabase
    .from("billing_batches")
    .select("total_amount")
    .eq("office_id", officeId)
    .eq("target_year", prevYear)
    .eq("target_month", prevMonth)
    .returns<Pick<BillingBatchRow, "total_amount">[]>()
    .single();

  const currentBillingAmount = currentBilling?.total_amount ?? 0;
  const prevBillingAmount = prevBilling?.total_amount ?? 0;
  const changePercent =
    prevBillingAmount > 0
      ? Math.round(
          ((currentBillingAmount - prevBillingAmount) / prevBillingAmount) *
            1000
        ) / 10
      : 0;

  // 本日の出席
  const { data: todayAttendance } = await supabase
    .from("attendances")
    .select("status")
    .eq("office_id", officeId)
    .eq("attendance_date", todayStr)
    .returns<Pick<AttendanceRow, "status">[]>();

  const todayPresent =
    todayAttendance?.filter((a) =>
      ["present", "late", "early_leave"].includes(a.status)
    ).length ?? 0;

  // 月間出席率
  const { data: monthAttendances } = await supabase
    .from("attendances")
    .select("status")
    .eq("office_id", officeId)
    .gte("attendance_date", monthStart)
    .lte("attendance_date", todayStr)
    .returns<Pick<AttendanceRow, "status">[]>();

  const monthTotal = monthAttendances?.length ?? 0;
  const monthPresent =
    monthAttendances?.filter((a) =>
      ["present", "late", "early_leave"].includes(a.status)
    ).length ?? 0;
  const monthlyRate =
    monthTotal > 0 ? Math.round((monthPresent / monthTotal) * 1000) / 10 : 0;

  // 工賃（今月）
  const { data: currentWages } = await supabase
    .from("monthly_wages")
    .select("total_wage")
    .eq("office_id", officeId)
    .eq("fiscal_year", currentYear)
    .eq("month", currentMonth)
    .returns<Pick<MonthlyWageRow, "total_wage">[]>();

  const wageTotal =
    currentWages?.reduce((s, w) => s + w.total_wage, 0) ?? 0;
  const wageCount = currentWages?.length ?? 0;
  const avgPerPerson = wageCount > 0 ? Math.round(wageTotal / wageCount) : 0;

  // 利用者数
  const { count: activeCount } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("office_id", officeId)
    .eq("status", "active")
    .is("deleted_at", null);

  const { count: newCount } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("office_id", officeId)
    .eq("status", "active")
    .is("deleted_at", null)
    .gte("enrollment_date", monthStart);

  // 支援計画（Phase 2）
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { count: activePlans } = await supabase
    .from("individual_support_plans")
    .select("id", { count: "exact", head: true })
    .eq("office_id", officeId)
    .eq("status", "active")
    .is("deleted_at", null);

  const { count: expiringSoonPlans } = await supabase
    .from("individual_support_plans")
    .select("id", { count: "exact", head: true })
    .eq("office_id", officeId)
    .eq("status", "active")
    .is("deleted_at", null)
    .lte("plan_end_date", thirtyDaysLater);

  const { count: draftPlans } = await supabase
    .from("individual_support_plans")
    .select("id", { count: "exact", head: true })
    .eq("office_id", officeId)
    .eq("status", "draft")
    .is("deleted_at", null);

  // 受給者証期限切れ間近
  const { data: expiringCerts } = await supabase
    .from("certificates")
    .select("decision_end_date, client_id")
    .eq("is_current", true)
    .lte("decision_end_date", thirtyDaysLater)
    .gte("decision_end_date", todayStr)
    .returns<{ decision_end_date: string; client_id: string }[]>();

  let certWarnings: { clientName: string; endDate: string }[] = [];
  if (expiringCerts?.length) {
    const certClientIds = expiringCerts.map((c) => c.client_id);
    const { data: certClients } = await supabase
      .from("clients")
      .select("id, family_name, given_name")
      .in("id", certClientIds)
      .eq("office_id", officeId)
      .returns<{ id: string; family_name: string; given_name: string }[]>();

    const nameMap = new Map(certClients?.map((c) => [c.id, `${c.family_name}${c.given_name}`]) ?? []);
    certWarnings = expiringCerts
      .filter((c) => nameMap.has(c.client_id))
      .map((c) => ({ clientName: nameMap.get(c.client_id)!, endDate: c.decision_end_date }));
  }

  return {
    billing: {
      currentMonth: currentBillingAmount,
      previousMonth: prevBillingAmount,
      changePercent,
    },
    attendance: {
      today: todayPresent,
      capacity,
      monthlyRate,
    },
    wage: {
      currentMonth: wageTotal,
      avgPerPerson,
    },
    clients: {
      active: activeCount ?? 0,
      new: newCount ?? 0,
    },
    supportPlans: {
      active: activePlans ?? 0,
      expiringSoon: expiringSoonPlans ?? 0,
      needsReview: draftPlans ?? 0,
    },
    certificates: {
      expiringSoon: certWarnings,
    },
  };
}
