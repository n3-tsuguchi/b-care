import { getOfficeId } from "./common";
import { createServerSupabaseClient } from "../server";
import type { Database } from "../database.types";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type CertificateRow = Database["public"]["Tables"]["certificates"]["Row"];
type AlertRow = Database["public"]["Tables"]["alerts"]["Row"];

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
