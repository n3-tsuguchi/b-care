import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOfficeId } from "@/lib/supabase/queries";

type BillingDetailForInvoice = {
  client_id: string;
  copay_amount: number;
  meal_provision_days: number;
};

type InvoiceRow = {
  id: string;
  billing_batch_id: string;
  client_id: string;
  invoice_number: string;
  invoice_date: string;
  copay_amount: number;
  meal_cost: number;
  other_cost: number;
  total_amount: number;
  status: string;
  paid_at: string | null;
  receipt_number: string | null;
};

/**
 * POST /api/billing/invoices - 利用者請求書を一括生成
 */
export async function POST(request: NextRequest) {
  try {
    const { batchId } = await request.json();
    if (!batchId) {
      return NextResponse.json({ error: "batchId is required" }, { status: 400 });
    }

    const officeId = await getOfficeId();
    const supabase = await createServerSupabaseClient();

    const { data: batch } = await supabase
      .from("billing_batches")
      .select("id, target_year, target_month")
      .eq("id", batchId)
      .eq("office_id", officeId)
      .returns<{ id: string; target_year: number; target_month: number }[]>()
      .single();

    if (!batch) {
      return NextResponse.json({ error: "請求バッチが見つかりません" }, { status: 404 });
    }

    const { data: details } = await supabase
      .from("billing_details")
      .select("client_id, copay_amount, meal_provision_days")
      .eq("billing_batch_id", batchId)
      .returns<BillingDetailForInvoice[]>();

    if (!details?.length) {
      return NextResponse.json({ error: "請求明細がありません" }, { status: 400 });
    }

    // 既存の請求書を削除
    await supabase
      .from("billing_client_invoices")
      .delete()
      .eq("billing_batch_id", batchId);

    const invoiceDate = new Date().toISOString().split("T")[0];
    const mealCostPerDay = 300;

    const invoices = details.map((detail, index) => {
      const invoiceNumber = `INV-${batch.target_year}${String(batch.target_month).padStart(2, "0")}-${String(index + 1).padStart(4, "0")}`;
      const mealCost = detail.meal_provision_days * mealCostPerDay;

      return {
        billing_batch_id: batchId,
        client_id: detail.client_id,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        copay_amount: detail.copay_amount,
        meal_cost: mealCost,
        other_cost: 0,
        total_amount: detail.copay_amount + mealCost,
        status: "issued" as const,
      };
    });

    const { error } = await supabase
      .from("billing_client_invoices")
      .insert(invoices);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "利用者請求書を生成しました",
      count: invoices.length,
      totalAmount: invoices.reduce((s, inv) => s + inv.total_amount, 0),
    });
  } catch (error) {
    console.error("Invoice generation error:", error);
    return NextResponse.json({ error: "利用者請求書の生成に失敗しました" }, { status: 500 });
  }
}

/**
 * GET /api/billing/invoices?batchId=xxx - 利用者請求書一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const batchId = request.nextUrl.searchParams.get("batchId");
    if (!batchId) {
      return NextResponse.json({ error: "batchId is required" }, { status: 400 });
    }

    const officeId = await getOfficeId();
    const supabase = await createServerSupabaseClient();

    const { data: batch } = await supabase
      .from("billing_batches")
      .select("id")
      .eq("id", batchId)
      .eq("office_id", officeId)
      .returns<{ id: string }[]>()
      .single();

    if (!batch) {
      return NextResponse.json({ error: "請求バッチが見つかりません" }, { status: 404 });
    }

    const { data: invoices } = await supabase
      .from("billing_client_invoices")
      .select("*")
      .eq("billing_batch_id", batchId)
      .returns<InvoiceRow[]>();

    if (!invoices?.length) {
      return NextResponse.json([]);
    }

    const clientIds = invoices.map((inv) => inv.client_id);
    const { data: clients } = await supabase
      .from("clients")
      .select("id, family_name, given_name, client_number")
      .in("id", clientIds)
      .returns<{ id: string; family_name: string; given_name: string; client_number: string | null }[]>();

    const clientMap = new Map((clients ?? []).map((c) => [c.id, c]));

    const enriched = invoices.map((inv) => {
      const client = clientMap.get(inv.client_id);
      return {
        ...inv,
        client_name: client ? `${client.family_name}${client.given_name}` : "",
        client_number: client?.client_number ?? "",
      };
    });

    return NextResponse.json(enriched);
  } catch {
    return NextResponse.json({ error: "請求書の取得に失敗しました" }, { status: 500 });
  }
}
