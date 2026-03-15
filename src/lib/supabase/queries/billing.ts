import { getOfficeId } from "./common";
import { createServerSupabaseClient } from "../server";

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
