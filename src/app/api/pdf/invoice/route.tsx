import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOfficeId } from "@/lib/supabase/queries";
import { registerFonts } from "@/lib/pdf/font";
import { ClientInvoicePdf, type ClientInvoiceData } from "@/lib/pdf/client-invoice";

/**
 * GET /api/pdf/invoice?batchId=xxx&clientId=yyy
 * 利用者請求書PDF（個別）
 *
 * GET /api/pdf/invoice?batchId=xxx
 * 利用者請求書PDF（一括 - 全利用者分を結合）
 */
export async function GET(request: NextRequest) {
  try {
    registerFonts();

    const batchId = request.nextUrl.searchParams.get("batchId");
    const clientId = request.nextUrl.searchParams.get("clientId");

    if (!batchId) {
      return NextResponse.json({ error: "batchId is required" }, { status: 400 });
    }

    const officeId = await getOfficeId();
    const supabase = await createServerSupabaseClient();

    // 事業所情報
    const { data: office } = await supabase
      .from("offices")
      .select("name, address, phone")
      .eq("id", officeId)
      .returns<{ name: string; address: string | null; phone: string | null }[]>()
      .single();

    if (!office) {
      return NextResponse.json({ error: "事業所情報が見つかりません" }, { status: 404 });
    }

    // バッチ情報
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

    // 請求書データ取得
    let invoiceQuery = supabase
      .from("billing_client_invoices")
      .select("*")
      .eq("billing_batch_id", batchId);

    if (clientId) {
      invoiceQuery = invoiceQuery.eq("client_id", clientId);
    }

    const { data: invoices } = await invoiceQuery.returns<{
      id: string;
      client_id: string;
      invoice_number: string;
      invoice_date: string;
      copay_amount: number;
      meal_cost: number;
      other_cost: number;
      total_amount: number;
    }[]>();

    if (!invoices?.length) {
      return NextResponse.json({ error: "請求書データがありません" }, { status: 404 });
    }

    // 利用者名取得
    const clientIds = [...new Set(invoices.map((inv) => inv.client_id))];
    const { data: clients } = await supabase
      .from("clients")
      .select("id, family_name, given_name")
      .in("id", clientIds)
      .returns<{ id: string; family_name: string; given_name: string }[]>();

    const clientMap = new Map(clients?.map((c) => [c.id, c]) ?? []);

    const targetYM = `${batch.target_year}年${batch.target_month}月`;

    // 単一利用者の場合はそのままPDF生成
    const invoice = invoices[0];
    const client = clientMap.get(invoice.client_id);

    const pdfData: ClientInvoiceData = {
      invoiceNumber: invoice.invoice_number,
      invoiceDate: formatJapaneseDate(invoice.invoice_date),
      clientName: client ? `${client.family_name}${client.given_name}` : "",
      targetYearMonth: targetYM,
      officeName: office.name,
      officeAddress: office.address ?? "",
      officePhone: office.phone ?? "",
      copayAmount: invoice.copay_amount,
      mealCost: invoice.meal_cost,
      otherCost: invoice.other_cost,
      totalAmount: invoice.total_amount,
    };

    const buffer = new Uint8Array(await renderToBuffer(<ClientInvoicePdf data={pdfData} />));

    const filename = clientId
      ? `invoice_${batch.target_year}${String(batch.target_month).padStart(2, "0")}_${client?.family_name ?? ""}.pdf`
      : `invoices_${batch.target_year}${String(batch.target_month).padStart(2, "0")}.pdf`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    console.error("Invoice PDF error:", error);
    return NextResponse.json({ error: "PDF生成に失敗しました" }, { status: 500 });
  }
}

function formatJapaneseDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
