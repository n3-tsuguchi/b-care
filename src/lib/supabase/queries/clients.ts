import { createServerSupabaseClient } from "../server";
import { getOfficeId } from "./common";
import type { Database } from "../database.types";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type CertificateRow = Database["public"]["Tables"]["certificates"]["Row"];

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
