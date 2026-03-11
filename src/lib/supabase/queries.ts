import { createServerSupabaseClient } from "./server";
import { getCurrentUser } from "./auth";
import type { Database } from "./database.types";

// ============================================================
// 型エイリアス
// ============================================================

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type CertificateRow = Database["public"]["Tables"]["certificates"]["Row"];
type AttendanceRow = Database["public"]["Tables"]["attendances"]["Row"];
type BillingBatchRow = Database["public"]["Tables"]["billing_batches"]["Row"];
type MonthlyWageRow = Database["public"]["Tables"]["monthly_wages"]["Row"];
type AlertRow = Database["public"]["Tables"]["alerts"]["Row"];
type OfficeRow = Database["public"]["Tables"]["offices"]["Row"];

// ============================================================
// 共通ヘルパー
// ============================================================

export async function getOfficeId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user?.office_id) throw new Error("Office not found");
  return user.office_id;
}

// ============================================================
// 利用者
// ============================================================

export type ClientWithCertificate = {
  id: string;
  client_number: string | null;
  family_name: string;
  given_name: string;
  family_name_kana: string | null;
  given_name_kana: string | null;
  birth_date: string;
  gender: string | null;
  disability_type: string | null;
  support_category: number | null;
  status: string;
  enrollment_date: string | null;
  termination_date: string | null;
  postal_code: string | null;
  address: string | null;
  phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  notes: string | null;
  certificate: {
    id: string;
    certificate_number: string;
    decision_start_date: string;
    decision_end_date: string;
    monthly_days_limit: number;
    income_category: string;
    copay_limit: number;
    municipality_code: string;
    is_copay_limit_manager: boolean;
  } | null;
};

function toClientWithCert(
  c: ClientRow,
  cert: CertificateRow | undefined
): ClientWithCertificate {
  return {
    id: c.id,
    client_number: c.client_number,
    family_name: c.family_name,
    given_name: c.given_name,
    family_name_kana: c.family_name_kana,
    given_name_kana: c.given_name_kana,
    birth_date: c.birth_date,
    gender: c.gender,
    disability_type: c.disability_type,
    support_category: c.support_category,
    status: c.status,
    enrollment_date: c.enrollment_date,
    termination_date: c.termination_date,
    postal_code: c.postal_code,
    address: c.address,
    phone: c.phone,
    emergency_contact_name: c.emergency_contact_name,
    emergency_contact_phone: c.emergency_contact_phone,
    emergency_contact_relation: c.emergency_contact_relation,
    notes: c.notes,
    certificate: cert
      ? {
          id: cert.id,
          certificate_number: cert.certificate_number,
          decision_start_date: cert.decision_start_date,
          decision_end_date: cert.decision_end_date,
          monthly_days_limit: cert.monthly_days_limit,
          income_category: cert.income_category,
          copay_limit: cert.copay_limit,
          municipality_code: cert.municipality_code,
          is_copay_limit_manager: cert.is_copay_limit_manager,
        }
      : null,
  };
}

export async function getClients(): Promise<ClientWithCertificate[]> {
  const officeId = await getOfficeId();
  const supabase = await createServerSupabaseClient();

  const { data: clients, error } = await supabase
    .from("clients")
    .select("*")
    .eq("office_id", officeId)
    .is("deleted_at", null)
    .order("client_number", { ascending: true })
    .returns<ClientRow[]>();

  if (error) throw error;
  if (!clients?.length) return [];

  const clientIds = clients.map((c) => c.id);
  const { data: certs } = await supabase
    .from("certificates")
    .select("*")
    .in("client_id", clientIds)
    .eq("is_current", true)
    .returns<CertificateRow[]>();

  const certMap = new Map(certs?.map((c) => [c.client_id, c]) ?? []);

  return clients.map((c) => toClientWithCert(c, certMap.get(c.id)));
}

export async function getClientById(
  clientId: string
): Promise<ClientWithCertificate | null> {
  const officeId = await getOfficeId();
  const supabase = await createServerSupabaseClient();

  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .eq("office_id", officeId)
    .is("deleted_at", null)
    .returns<ClientRow[]>()
    .single();

  if (error || !client) return null;

  const { data: cert } = await supabase
    .from("certificates")
    .select("*")
    .eq("client_id", client.id)
    .eq("is_current", true)
    .returns<CertificateRow[]>()
    .single();

  return toClientWithCert(client, cert ?? undefined);
}

// ============================================================
// 出席
// ============================================================

export type AttendanceRecord = {
  id: string;
  client_id: string;
  client_number: string | null;
  family_name: string;
  given_name: string;
  status: string;
  check_in_time: string | null;
  check_out_time: string | null;
  pickup_outbound: boolean;
  pickup_inbound: boolean;
  meal_provided: boolean;
};

export async function getAttendanceByDate(
  date: string
): Promise<AttendanceRecord[]> {
  const officeId = await getOfficeId();
  const supabase = await createServerSupabaseClient();

  const { data: attendances } = await supabase
    .from("attendances")
    .select("*")
    .eq("office_id", officeId)
    .eq("attendance_date", date)
    .returns<AttendanceRow[]>();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, client_number, family_name, given_name")
    .eq("office_id", officeId)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("client_number", { ascending: true })
    .returns<Pick<ClientRow, "id" | "client_number" | "family_name" | "given_name">[]>();

  if (!clients?.length) return [];

  const attendanceMap = new Map(
    attendances?.map((a) => [a.client_id, a]) ?? []
  );

  return clients.map((c) => {
    const a = attendanceMap.get(c.id);
    return {
      id: a?.id ?? "",
      client_id: c.id,
      client_number: c.client_number,
      family_name: c.family_name,
      given_name: c.given_name,
      status: a?.status ?? "",
      check_in_time: a?.check_in_time ?? null,
      check_out_time: a?.check_out_time ?? null,
      pickup_outbound: a?.pickup_outbound ?? false,
      pickup_inbound: a?.pickup_inbound ?? false,
      meal_provided: a?.meal_provided ?? false,
    };
  });
}

export type DailyAttendanceStats = {
  date: string;
  present: number;
  absent: number;
  late: number;
};

export async function getRecentAttendanceStats(
  days: number = 5
): Promise<DailyAttendanceStats[]> {
  const officeId = await getOfficeId();
  const supabase = await createServerSupabaseClient();

  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data } = await supabase
    .from("attendances")
    .select("attendance_date, status")
    .eq("office_id", officeId)
    .gte("attendance_date", startDate)
    .lte("attendance_date", endDate)
    .returns<Pick<AttendanceRow, "attendance_date" | "status">[]>();

  if (!data?.length) return [];

  const grouped = new Map<
    string,
    { present: number; absent: number; late: number }
  >();
  for (const row of data) {
    const entry = grouped.get(row.attendance_date) ?? {
      present: 0,
      absent: 0,
      late: 0,
    };
    if (row.status === "present") entry.present++;
    else if (row.status === "absent") entry.absent++;
    else if (row.status === "late") entry.late++;
    grouped.set(row.attendance_date, entry);
  }

  return Array.from(grouped.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ============================================================
// 請求バッチ
// ============================================================

export type BillingBatch = {
  id: string;
  target_year: number;
  target_month: number;
  status: string;
  total_units: number;
  total_amount: number;
  total_copay: number;
  submitted_at: string | null;
  paid_at: string | null;
  paid_amount: number | null;
};

export async function getBillingBatches(): Promise<BillingBatch[]> {
  const officeId = await getOfficeId();
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("billing_batches")
    .select(
      "id, target_year, target_month, status, total_units, total_amount, total_copay, submitted_at, paid_at, paid_amount"
    )
    .eq("office_id", officeId)
    .order("target_year", { ascending: false })
    .order("target_month", { ascending: false })
    .returns<BillingBatch[]>();

  if (error) throw error;
  return data ?? [];
}

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

// ============================================================
// アラート
// ============================================================

export type AlertItem = {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  due_date: string | null;
  created_at: string;
};

export async function getAlerts(): Promise<AlertItem[]> {
  const officeId = await getOfficeId();
  const supabase = await createServerSupabaseClient();

  const { data: alerts } = await supabase
    .from("alerts")
    .select("*")
    .eq("office_id", officeId)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(10)
    .returns<AlertRow[]>();

  if (alerts?.length) {
    return alerts.map((a) => ({
      id: a.id,
      type: a.alert_type,
      severity: a.severity,
      title: a.title,
      message: a.message,
      due_date: a.due_date,
      created_at: a.created_at,
    }));
  }

  // アラートテーブルが空の場合、受給者証期限から動的に生成
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data: expiringCerts } = await supabase
    .from("certificates")
    .select("id, client_id, decision_end_date")
    .eq("is_current", true)
    .lte("decision_end_date", thirtyDaysLater)
    .returns<Pick<CertificateRow, "id" | "client_id" | "decision_end_date">[]>();

  if (!expiringCerts?.length) return [];

  const certClientIds = expiringCerts.map((c) => c.client_id);
  const { data: certClients } = await supabase
    .from("clients")
    .select("id, family_name, given_name")
    .in("id", certClientIds)
    .returns<Pick<ClientRow, "id" | "family_name" | "given_name">[]>();

  const clientNameMap = new Map(
    certClients?.map((c) => [c.id, c]) ?? []
  );

  return expiringCerts.map((cert) => {
    const client = clientNameMap.get(cert.client_id);
    return {
      id: cert.id,
      type: "cert_expiry",
      severity: "critical",
      title: "受給者証期限切れ間近",
      message: `${client?.family_name ?? ""}${client?.given_name ?? ""}さんの受給者証が${cert.decision_end_date}に期限切れとなります。`,
      due_date: cert.decision_end_date,
      created_at: new Date().toISOString(),
    };
  });
}

// ============================================================
// 設定
// ============================================================

export type OfficeSettings = {
  office_number: string;
  name: string;
  service_type: string;
  staffing_ratio: string;
  capacity: number;
  postal_code: string | null;
  address: string | null;
  phone: string | null;
  fax: string | null;
};

export async function getOfficeSettings(): Promise<OfficeSettings | null> {
  const officeId = await getOfficeId();
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("offices")
    .select(
      "office_number, name, service_type, staffing_ratio, capacity, postal_code, address, phone, fax"
    )
    .eq("id", officeId)
    .returns<OfficeSettings[]>()
    .single();

  if (error) return null;
  return data;
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

// ============================================================
// 支援記録 (Phase 2)
// ============================================================

export type SupportRecord = {
  id: string;
  office_id: string;
  client_id: string;
  attendance_id: string | null;
  record_date: string;
  record_content: string;
  health_status: string | null;
  mood: string | null;
  work_performance: string | null;
  special_notes: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
  // joined
  family_name?: string;
  given_name?: string;
  client_number?: string | null;
};

export async function getSupportRecordsByDate(date: string): Promise<SupportRecord[]> {
  const officeId = await getOfficeId();
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("support_records")
    .select("*")
    .eq("office_id", officeId)
    .eq("record_date", date)
    .returns<SupportRecord[]>();

  if (!data?.length) {
    // 該当日の出席者情報を取得して空レコードを返す
    const { data: attendances } = await supabase
      .from("attendances")
      .select("id, client_id, status")
      .eq("office_id", officeId)
      .eq("attendance_date", date)
      .in("status", ["present", "late", "early_leave"])
      .returns<{ id: string; client_id: string; status: string }[]>();

    if (!attendances?.length) return [];

    const clientIds = attendances.map((a) => a.client_id);
    const { data: clients } = await supabase
      .from("clients")
      .select("id, family_name, given_name, client_number")
      .in("id", clientIds)
      .is("deleted_at", null)
      .returns<{ id: string; family_name: string; given_name: string; client_number: string | null }[]>();

    const clientMap = new Map(clients?.map((c) => [c.id, c]) ?? []);

    return attendances.map((a) => {
      const c = clientMap.get(a.client_id);
      return {
        id: "",
        office_id: officeId,
        client_id: a.client_id,
        attendance_id: a.id,
        record_date: date,
        record_content: "",
        health_status: null,
        mood: null,
        work_performance: null,
        special_notes: null,
        recorded_by: null,
        created_at: "",
        updated_at: "",
        family_name: c?.family_name ?? "",
        given_name: c?.given_name ?? "",
        client_number: c?.client_number ?? null,
      };
    });
  }

  // 既存データに利用者名を付与
  const clientIds = data.map((r) => r.client_id);
  const { data: clients } = await supabase
    .from("clients")
    .select("id, family_name, given_name, client_number")
    .in("id", clientIds)
    .returns<{ id: string; family_name: string; given_name: string; client_number: string | null }[]>();

  const clientMap = new Map(clients?.map((c) => [c.id, c]) ?? []);

  return data.map((r) => {
    const c = clientMap.get(r.client_id);
    return {
      ...r,
      family_name: c?.family_name ?? "",
      given_name: c?.given_name ?? "",
      client_number: c?.client_number ?? null,
    };
  });
}

// ============================================================
// 個別支援計画 (Phase 2)
// ============================================================

export type SupportPlan = {
  id: string;
  office_id: string;
  client_id: string;
  plan_number: number;
  plan_start_date: string;
  plan_end_date: string;
  long_term_goal: string | null;
  short_term_goal: string | null;
  support_policy: string | null;
  status: string;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  family_name?: string;
  given_name?: string;
  client_number?: string | null;
  goals?: SupportPlanGoal[];
};

export type SupportPlanGoal = {
  id: string;
  plan_id: string;
  goal_category: string;
  goal_description: string;
  support_content: string | null;
  achievement_criteria: string | null;
  sort_order: number;
  status: string;
  achieved_at: string | null;
};

export type SupportPlanReview = {
  id: string;
  plan_id: string;
  review_date: string;
  review_type: string;
  overall_evaluation: string | null;
  achievements: string | null;
  challenges: string | null;
  next_steps: string | null;
  reviewer_id: string | null;
};

export async function getSupportPlans(): Promise<SupportPlan[]> {
  const officeId = await getOfficeId();
  const supabase = await createServerSupabaseClient();

  const { data: plans } = await supabase
    .from("individual_support_plans")
    .select("*")
    .eq("office_id", officeId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .returns<SupportPlan[]>();

  if (!plans?.length) return [];

  const clientIds = [...new Set(plans.map((p) => p.client_id))];
  const { data: clients } = await supabase
    .from("clients")
    .select("id, family_name, given_name, client_number")
    .in("id", clientIds)
    .returns<{ id: string; family_name: string; given_name: string; client_number: string | null }[]>();

  const clientMap = new Map(clients?.map((c) => [c.id, c]) ?? []);

  return plans.map((p) => {
    const c = clientMap.get(p.client_id);
    return {
      ...p,
      family_name: c?.family_name ?? "",
      given_name: c?.given_name ?? "",
      client_number: c?.client_number ?? null,
    };
  });
}

export async function getSupportPlanDetail(planId: string): Promise<SupportPlan | null> {
  const officeId = await getOfficeId();
  const supabase = await createServerSupabaseClient();

  const { data: plan } = await supabase
    .from("individual_support_plans")
    .select("*")
    .eq("id", planId)
    .eq("office_id", officeId)
    .is("deleted_at", null)
    .returns<SupportPlan[]>()
    .single();

  if (!plan) return null;

  const { data: goals } = await supabase
    .from("support_plan_goals")
    .select("*")
    .eq("plan_id", planId)
    .order("sort_order", { ascending: true })
    .returns<SupportPlanGoal[]>();

  const { data: client } = await supabase
    .from("clients")
    .select("family_name, given_name, client_number")
    .eq("id", plan.client_id)
    .returns<{ family_name: string; given_name: string; client_number: string | null }[]>()
    .single();

  return {
    ...plan,
    goals: goals ?? [],
    family_name: client?.family_name ?? "",
    given_name: client?.given_name ?? "",
    client_number: client?.client_number ?? null,
  };
}

export async function getActiveClientsForPlan(): Promise<{ id: string; family_name: string; given_name: string; client_number: string | null }[]> {
  const officeId = await getOfficeId();
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("clients")
    .select("id, family_name, given_name, client_number")
    .eq("office_id", officeId)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("client_number", { ascending: true })
    .returns<{ id: string; family_name: string; given_name: string; client_number: string | null }[]>();

  return data ?? [];
}
