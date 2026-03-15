import { getOfficeId } from "./common";
import { createServerSupabaseClient } from "../server";

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
