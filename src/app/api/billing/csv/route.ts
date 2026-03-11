import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOfficeId } from "@/lib/supabase/queries";

type BillingDetailRow = {
  id: string;
  client_id: string;
  certificate_id: string;
  service_code: string;
  service_days: number;
  base_units: number;
  addition_units: number;
  subtraction_units: number;
  total_units: number;
  unit_price: number;
  total_amount: number;
  public_expense: number;
  copay_amount: number;
  copay_limit_result: string | null;
  copay_after_limit: number;
  pickup_outbound_days: number;
  pickup_inbound_days: number;
  meal_provision_days: number;
};

type ClientRow = {
  id: string;
  client_number: string | null;
  family_name: string;
  given_name: string;
  family_name_kana: string | null;
  given_name_kana: string | null;
  birth_date: string;
  gender: string | null;
};

type CertRow = {
  id: string;
  certificate_number: string;
  municipality_code: string;
  income_category: string;
  copay_limit: number;
};

/**
 * POST /api/billing/csv - 国保連提出用CSV出力
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
      .select("id, office_id, target_year, target_month, total_units, total_amount, total_copay")
      .eq("id", batchId)
      .eq("office_id", officeId)
      .returns<{ id: string; office_id: string; target_year: number; target_month: number; total_units: number; total_amount: number; total_copay: number }[]>()
      .single();

    if (!batch) {
      return NextResponse.json({ error: "請求バッチが見つかりません" }, { status: 404 });
    }

    const { data: office } = await supabase
      .from("offices")
      .select("office_number, name")
      .eq("id", officeId)
      .returns<{ office_number: string; name: string }[]>()
      .single();

    if (!office) {
      return NextResponse.json({ error: "事業所情報が見つかりません" }, { status: 404 });
    }

    const { data: details } = await supabase
      .from("billing_details")
      .select("*")
      .eq("billing_batch_id", batchId)
      .returns<BillingDetailRow[]>();

    if (!details?.length) {
      return NextResponse.json({ error: "請求明細がありません" }, { status: 400 });
    }

    const clientIds = details.map((d) => d.client_id);
    const { data: clients } = await supabase
      .from("clients")
      .select("id, client_number, family_name, given_name, family_name_kana, given_name_kana, birth_date, gender")
      .in("id", clientIds)
      .returns<ClientRow[]>();

    const clientMap = new Map((clients ?? []).map((c) => [c.id, c]));

    const certIds = details.map((d) => d.certificate_id);
    const { data: certificates } = await supabase
      .from("certificates")
      .select("id, certificate_number, municipality_code, income_category, copay_limit")
      .in("id", certIds)
      .returns<CertRow[]>();

    const certMap = new Map((certificates ?? []).map((c) => [c.id, c]));

    // CSV生成
    const csvLines: string[] = [];
    const targetYM = `${batch.target_year}${String(batch.target_month).padStart(2, "0")}`;

    // ヘッダーレコード
    csvLines.push(
      [
        "1",
        office.office_number,
        office.name,
        targetYM,
        String(details.length),
        String(batch.total_units),
        String(batch.total_amount),
        String(batch.total_copay),
        new Date().toISOString().split("T")[0].replace(/-/g, ""),
      ].join(",")
    );

    const incomeCategoryCode: Record<string, string> = {
      seikatsu_hogo: "01",
      low_income: "02",
      general_1: "03",
      general_2: "04",
    };

    // 明細レコード
    for (const detail of details) {
      const client = clientMap.get(detail.client_id);
      const cert = certMap.get(detail.certificate_id);
      if (!client || !cert) continue;

      csvLines.push(
        [
          "2",
          cert.municipality_code,
          office.office_number,
          cert.certificate_number,
          `${client.family_name}${client.given_name}`,
          `${client.family_name_kana ?? ""}${client.given_name_kana ?? ""}`,
          client.birth_date?.replace(/-/g, "") ?? "",
          client.gender === "male" ? "1" : client.gender === "female" ? "2" : "9",
          incomeCategoryCode[cert.income_category] ?? "03",
          String(cert.copay_limit),
          targetYM,
          detail.service_code,
          String(detail.service_days),
          String(detail.base_units),
          String(detail.addition_units),
          String(detail.subtraction_units),
          String(detail.total_units),
          detail.unit_price.toString(),
          String(detail.total_amount),
          String(detail.public_expense),
          String(detail.copay_amount),
          detail.copay_limit_result ?? "",
          String(detail.copay_after_limit),
          String(detail.pickup_outbound_days),
          String(detail.pickup_inbound_days),
          String(detail.meal_provision_days),
        ].join(",")
      );
    }

    // トレーラレコード
    csvLines.push(
      [
        "9",
        String(details.length),
        String(batch.total_units),
        String(batch.total_amount),
        String(batch.total_copay),
      ].join(",")
    );

    const csv = csvLines.join("\n");

    // ステータス更新
    await supabase
      .from("billing_batches")
      .update({ status: "exported", exported_at: new Date().toISOString() })
      .eq("id", batchId);

    const bom = "\uFEFF";
    return new NextResponse(bom + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="billing_${office.office_number}_${targetYM}.csv"`,
      },
    });
  } catch (error) {
    console.error("CSV export error:", error);
    return NextResponse.json({ error: "CSV出力に失敗しました" }, { status: 500 });
  }
}
