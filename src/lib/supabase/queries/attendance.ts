import { getOfficeId } from "./common";
import { createServerSupabaseClient } from "../server";
import type { Database } from "../database.types";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type AttendanceRow = Database["public"]["Tables"]["attendances"]["Row"];

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
