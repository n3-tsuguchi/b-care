import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOfficeId } from "@/lib/supabase/queries";

type CheckResult = {
  severity: "error" | "warning" | "info";
  clientId?: string;
  clientName?: string;
  message: string;
  field?: string;
};

type BillingDetailRow = {
  id: string;
  billing_batch_id: string;
  client_id: string;
  certificate_id: string;
  municipality_code: string;
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

type CertificateRow = {
  id: string;
  client_id: string;
  certificate_number: string;
  municipality_code: string;
  decision_start_date: string;
  decision_end_date: string;
  monthly_days_limit: number;
  income_category: string;
  copay_limit: number;
  is_current: boolean;
};

type BatchRow = {
  id: string;
  office_id: string;
  target_year: number;
  target_month: number;
  status: string;
  total_units: number;
  total_amount: number;
  total_copay: number;
};

type ClientRow = {
  id: string;
  family_name: string;
  given_name: string;
  client_number: string | null;
  status: string;
};

/**
 * POST /api/billing/ai-check - 請求データAIチェック
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
      .select("id, office_id, target_year, target_month, status, total_units, total_amount, total_copay")
      .eq("id", batchId)
      .eq("office_id", officeId)
      .returns<BatchRow[]>()
      .single();

    if (!batch) {
      return NextResponse.json({ error: "請求バッチが見つかりません" }, { status: 404 });
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
      .select("id, family_name, given_name, client_number, status")
      .in("id", clientIds)
      .returns<ClientRow[]>();

    const clientMap = new Map((clients ?? []).map((c) => [c.id, c]));

    const certIds = details.map((d) => d.certificate_id);
    const { data: certificates } = await supabase
      .from("certificates")
      .select("*")
      .in("id", certIds)
      .returns<CertificateRow[]>();

    const certMap = new Map((certificates ?? []).map((c) => [c.id, c]));

    const results: CheckResult[] = [];

    for (const detail of details) {
      const client = clientMap.get(detail.client_id);
      const cert = certMap.get(detail.certificate_id);
      const clientName = client ? `${client.family_name}${client.given_name}` : "不明";

      // チェック1: 受給者証の有効期限
      if (cert) {
        const endDate = cert.decision_end_date;
        const lastDay = new Date(batch.target_year, batch.target_month, 0).getDate();
        const targetMonthEnd = `${batch.target_year}-${String(batch.target_month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

        if (endDate < targetMonthEnd) {
          results.push({
            severity: "error",
            clientId: detail.client_id,
            clientName,
            message: `受給者証の有効期限（${endDate}）がサービス提供月内に切れています`,
            field: "certificate",
          });
        }

        const endDateObj = new Date(endDate);
        const targetEndObj = new Date(targetMonthEnd);
        const diffDays = Math.floor((endDateObj.getTime() - targetEndObj.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 0 && diffDays <= 30) {
          results.push({
            severity: "warning",
            clientId: detail.client_id,
            clientName,
            message: `受給者証の有効期限が${diffDays}日後に迫っています（${endDate}）`,
            field: "certificate",
          });
        }
      } else {
        results.push({
          severity: "error",
          clientId: detail.client_id,
          clientName,
          message: "受給者証が見つかりません",
          field: "certificate",
        });
      }

      // チェック2: 月間日数上限
      if (cert && detail.service_days > cert.monthly_days_limit) {
        results.push({
          severity: "error",
          clientId: detail.client_id,
          clientName,
          message: `サービス提供日数（${detail.service_days}日）が月間上限（${cert.monthly_days_limit}日）を超えています`,
          field: "service_days",
        });
      }

      // チェック3: 利用者ステータス
      if (client?.status !== "active") {
        results.push({
          severity: "error",
          clientId: detail.client_id,
          clientName,
          message: `利用者ステータスが「${client?.status ?? "不明"}」です`,
          field: "client_status",
        });
      }

      // チェック4: 請求金額の妥当性
      if (detail.total_amount <= 0) {
        results.push({
          severity: "error",
          clientId: detail.client_id,
          clientName,
          message: "請求金額が0円以下です",
          field: "total_amount",
        });
      }

      // チェック5: 利用者負担額
      if (cert) {
        if (detail.copay_amount > cert.copay_limit) {
          results.push({
            severity: "error",
            clientId: detail.client_id,
            clientName,
            message: `利用者負担額（${detail.copay_amount}円）が上限額（${cert.copay_limit}円）を超えています`,
            field: "copay",
          });
        }
        if (cert.income_category === "seikatsu_hogo" && detail.copay_amount > 0) {
          results.push({
            severity: "error",
            clientId: detail.client_id,
            clientName,
            message: "生活保護受給者に利用者負担が発生しています",
            field: "copay",
          });
        }
      }

      // チェック6: サービス提供日数の妥当性
      if (detail.service_days > 25) {
        results.push({
          severity: "warning",
          clientId: detail.client_id,
          clientName,
          message: `サービス提供日数（${detail.service_days}日）が25日を超えています`,
          field: "service_days",
        });
      }

      // チェック7: 単位数の整合性
      const expectedTotal = detail.base_units + detail.addition_units - detail.subtraction_units;
      if (detail.total_units !== expectedTotal) {
        results.push({
          severity: "error",
          clientId: detail.client_id,
          clientName,
          message: `合計単位数（${detail.total_units}）が基本+加算-減算（${expectedTotal}）と一致しません`,
          field: "units",
        });
      }
    }

    // チェック8: バッチ合計の整合性
    const totalDetailsAmount = details.reduce((s, d) => s + d.total_amount, 0);
    if (batch.total_amount !== totalDetailsAmount) {
      results.push({
        severity: "error",
        message: `バッチ合計金額（${batch.total_amount}円）と明細合計（${totalDetailsAmount}円）が一致しません`,
        field: "batch_total",
      });
    }

    // チェック9: 前月比較
    const prevMonth = batch.target_month === 1 ? 12 : batch.target_month - 1;
    const prevYear = batch.target_month === 1 ? batch.target_year - 1 : batch.target_year;

    const { data: prevBatch } = await supabase
      .from("billing_batches")
      .select("total_amount")
      .eq("office_id", officeId)
      .eq("target_year", prevYear)
      .eq("target_month", prevMonth)
      .returns<{ total_amount: number }[]>()
      .single();

    if (prevBatch && prevBatch.total_amount > 0) {
      const changeRate = Math.abs((batch.total_amount - prevBatch.total_amount) / prevBatch.total_amount);
      if (changeRate > 0.3) {
        results.push({
          severity: "warning",
          message: `前月比で請求金額が${Math.round(changeRate * 100)}%変動しています`,
          field: "trend",
        });
      }
    }

    const errorCount = results.filter((r) => r.severity === "error").length;
    const warningCount = results.filter((r) => r.severity === "warning").length;
    const newStatus = errorCount === 0 ? "checked" : "draft";

    await supabase
      .from("billing_batches")
      .update({
        ai_check_result: {
          checkedAt: new Date().toISOString(),
          errorCount,
          warningCount,
          infoCount: results.filter((r) => r.severity === "info").length,
          results,
        },
        ai_checked_at: new Date().toISOString(),
        status: newStatus,
      })
      .eq("id", batchId);

    return NextResponse.json({ status: newStatus, errorCount, warningCount, results });
  } catch (error) {
    console.error("AI check error:", error);
    return NextResponse.json({ error: "AIチェックに失敗しました" }, { status: 500 });
  }
}
