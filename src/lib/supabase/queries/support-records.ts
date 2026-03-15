import { getOfficeId } from "./common";
import { createServerSupabaseClient } from "../server";

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
