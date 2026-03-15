import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOfficeId } from "@/lib/supabase/queries";

type AttendanceRow = {
  client_id: string;
  status: string;
  pickup_outbound: boolean;
  pickup_inbound: boolean;
  meal_provided: boolean;
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
  is_copay_limit_manager: boolean;
};

type AdditionMasterRow = {
  addition_code: string;
  addition_name: string;
  units: number | null;
  calculation_type: string;
};

type OfficeAdditionRow = {
  addition_code: string;
  tier: string | null;
  parameters: unknown;
};

/**
 * POST /api/billing - 請求データ作成
 */
export async function POST(request: NextRequest) {
  try {
    const { year, month } = await request.json();
    if (!year || !month || typeof year !== "number" || typeof month !== "number" || month < 1 || month > 12 || year < 2000 || year > 2100) {
      return NextResponse.json(
        { error: "valid year (2000-2100) and month (1-12) are required" },
        { status: 400 }
      );
    }

    const officeId = await getOfficeId();
    const supabase = await createServerSupabaseClient();

    // 1. 既存の下書きバッチがあれば削除
    const { data: existingBatch } = await supabase
      .from("billing_batches")
      .select("id, status")
      .eq("office_id", officeId)
      .eq("target_year", year)
      .eq("target_month", month)
      .eq("billing_type", "normal")
      .returns<{ id: string; status: string }[]>()
      .single();

    if (existingBatch && existingBatch.status !== "draft") {
      return NextResponse.json(
        { error: "この月の請求データは既に確定済みです。返戻処理を利用してください。" },
        { status: 409 }
      );
    }

    if (existingBatch) {
      await supabase
        .from("billing_details")
        .delete()
        .eq("billing_batch_id", existingBatch.id);
      await supabase
        .from("billing_batches")
        .delete()
        .eq("id", existingBatch.id);
    }

    // 2. 事業所情報を取得
    const { data: office } = await supabase
      .from("offices")
      .select("office_number, service_type, staffing_ratio, capacity")
      .eq("id", officeId)
      .returns<{ office_number: string; service_type: string; staffing_ratio: string; capacity: number }[]>()
      .single();

    if (!office) {
      return NextResponse.json({ error: "事業所情報が見つかりません" }, { status: 404 });
    }

    // 3. サービスコードマスタから基本単位を取得
    const { data: serviceCodeMaster } = await supabase
      .from("service_code_masters")
      .select("service_code, units")
      .eq("service_type", office.service_type)
      .eq("staffing_ratio", office.staffing_ratio)
      .lte("effective_from", `${year}-${String(month).padStart(2, "0")}-01`)
      .order("effective_from", { ascending: false })
      .limit(1)
      .returns<{ service_code: string; units: number }[]>()
      .single();

    const baseServiceCode = serviceCodeMaster?.service_code ?? "611111";
    const baseUnitsPerDay = serviceCodeMaster?.units ?? 566;

    // 4. 地域区分の単価を取得
    const { data: unitPriceMaster } = await supabase
      .from("unit_price_masters")
      .select("unit_price")
      .lte("effective_from", `${year}-${String(month).padStart(2, "0")}-01`)
      .order("effective_from", { ascending: false })
      .limit(1)
      .returns<{ unit_price: number }[]>()
      .single();

    const unitPrice = Number(unitPriceMaster?.unit_price ?? 10.0);

    // 5. 有効な加算設定を取得
    const { data: officeAdditions } = await supabase
      .from("office_additions")
      .select("addition_code, tier, parameters")
      .eq("office_id", officeId)
      .eq("fiscal_year", year)
      .eq("is_enabled", true)
      .returns<OfficeAdditionRow[]>();

    const additionCodes = (officeAdditions ?? []).map((a) => a.addition_code);
    let additionMasterMap = new Map<string, { units: number; calculation_type: string; addition_name: string }>();

    if (additionCodes.length > 0) {
      const { data: additionMasters } = await supabase
        .from("addition_masters")
        .select("addition_code, addition_name, units, calculation_type")
        .in("addition_code", additionCodes)
        .lte("effective_from", `${year}-${String(month).padStart(2, "0")}-01`)
        .order("effective_from", { ascending: false })
        .returns<AdditionMasterRow[]>();

      additionMasterMap = new Map(
        (additionMasters ?? []).map((m) => [
          m.addition_code,
          { units: m.units ?? 0, calculation_type: m.calculation_type, addition_name: m.addition_name },
        ])
      );
    }

    // 6. 対象月の出席データを利用者ごとに集計
    const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const { data: attendances } = await supabase
      .from("attendances")
      .select("client_id, status, pickup_outbound, pickup_inbound, meal_provided")
      .eq("office_id", officeId)
      .gte("attendance_date", monthStart)
      .lte("attendance_date", monthEnd)
      .in("status", ["present", "late", "early_leave"])
      .returns<AttendanceRow[]>();

    if (!attendances?.length) {
      return NextResponse.json(
        { error: "対象月の出席データがありません" },
        { status: 400 }
      );
    }

    const clientAttendance = new Map<
      string,
      { days: number; pickupOut: number; pickupIn: number; meals: number }
    >();

    for (const att of attendances) {
      const stats = clientAttendance.get(att.client_id) ?? {
        days: 0, pickupOut: 0, pickupIn: 0, meals: 0,
      };
      stats.days += 1;
      if (att.pickup_outbound) stats.pickupOut += 1;
      if (att.pickup_inbound) stats.pickupIn += 1;
      if (att.meal_provided) stats.meals += 1;
      clientAttendance.set(att.client_id, stats);
    }

    // 7. 利用者と受給者証情報を取得
    const clientIds = Array.from(clientAttendance.keys());

    const { data: certificates } = await supabase
      .from("certificates")
      .select("*")
      .in("client_id", clientIds)
      .eq("is_current", true)
      .returns<CertificateRow[]>();

    const certMap = new Map((certificates ?? []).map((c) => [c.client_id, c]));

    // 7.5. 事前バリデーション
    type ValidationWarning = {
      severity: "error" | "warning";
      clientId: string;
      clientName?: string;
      message: string;
    };
    const validationWarnings: ValidationWarning[] = [];

    // 利用者名取得
    const { data: clientsInfo } = await supabase
      .from("clients")
      .select("id, family_name, given_name, status")
      .in("id", clientIds)
      .returns<{ id: string; family_name: string; given_name: string; status: string }[]>();

    const clientNameMap = new Map(
      (clientsInfo ?? []).map((c) => [c.id, `${c.family_name}${c.given_name}`])
    );
    const clientStatusMap = new Map(
      (clientsInfo ?? []).map((c) => [c.id, c.status])
    );

    const targetMonthEnd = monthEnd;

    for (const [clientId, stats] of clientAttendance) {
      const clientName = clientNameMap.get(clientId) ?? "不明";
      const cert = certMap.get(clientId);

      // 受給者証なし
      if (!cert) {
        validationWarnings.push({
          severity: "error",
          clientId,
          clientName,
          message: "有効な受給者証がありません。この利用者は請求対象から除外されます。",
        });
        continue;
      }

      // 受給者証の有効期限チェック
      if (cert.decision_end_date < targetMonthEnd) {
        validationWarnings.push({
          severity: "error",
          clientId,
          clientName,
          message: `受給者証の有効期限（${cert.decision_end_date}）がサービス提供月内に切れています`,
        });
      } else {
        const endDateObj = new Date(cert.decision_end_date);
        const targetEndObj = new Date(targetMonthEnd);
        const diffDays = Math.floor((endDateObj.getTime() - targetEndObj.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) {
          validationWarnings.push({
            severity: "warning",
            clientId,
            clientName,
            message: `受給者証の有効期限が${diffDays}日後に迫っています（${cert.decision_end_date}）`,
          });
        }
      }

      // 月間日数上限チェック
      if (stats.days > cert.monthly_days_limit) {
        validationWarnings.push({
          severity: "warning",
          clientId,
          clientName,
          message: `出席日数（${stats.days}日）が月間上限（${cert.monthly_days_limit}日）を超えています。上限日数で請求されます。`,
        });
      }

      // 利用者ステータスチェック
      const status = clientStatusMap.get(clientId);
      if (status !== "active") {
        validationWarnings.push({
          severity: "warning",
          clientId,
          clientName,
          message: `利用者ステータスが「${status ?? "不明"}」です`,
        });
      }
    }

    // 8. 請求バッチ作成
    const { data: batch, error: batchError } = await supabase
      .from("billing_batches")
      .insert({
        office_id: officeId,
        target_year: year,
        target_month: month,
        billing_type: "normal",
        status: "draft",
        total_units: 0,
        total_amount: 0,
        total_copay: 0,
      })
      .select("id")
      .returns<{ id: string }[]>()
      .single();

    if (batchError || !batch) {
      return NextResponse.json({ error: "請求バッチの作成に失敗しました" }, { status: 500 });
    }

    // 9. 利用者ごとの請求明細を作成
    type ClientAddition = { code: string; name: string; units: number; days: number };
    const billingDetails: Array<{
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
      copay_limit_result: string;
      copay_after_limit: number;
      pickup_outbound_days: number;
      pickup_inbound_days: number;
      meal_provision_days: number;
      _additions: ClientAddition[];
    }> = [];

    let batchTotalUnits = 0;
    let batchTotalAmount = 0;
    let batchTotalCopay = 0;

    for (const [clientId, stats] of clientAttendance) {
      const cert = certMap.get(clientId);
      if (!cert) continue;

      const baseUnits = baseUnitsPerDay * stats.days;
      let additionUnits = 0;
      const clientAdditions: ClientAddition[] = [];

      for (const oa of officeAdditions ?? []) {
        const master = additionMasterMap.get(oa.addition_code);
        if (!master) continue;

        let addUnits = 0;
        let addDays = stats.days;

        if (master.calculation_type === "per_day") {
          addUnits = master.units * stats.days;
        } else if (master.calculation_type === "per_month") {
          addUnits = master.units;
          addDays = 1;
        } else if (master.calculation_type === "percentage") {
          addUnits = Math.floor(baseUnits * (master.units / 1000));
          addDays = stats.days;
        }

        if (addUnits > 0) {
          additionUnits += addUnits;
          clientAdditions.push({
            code: oa.addition_code,
            name: master.addition_name,
            units: addUnits,
            days: addDays,
          });
        }
      }

      const totalUnits = baseUnits + additionUnits;
      const totalAmount = Math.floor(totalUnits * unitPrice);

      let copayAmount: number;
      if (cert.income_category === "seikatsu_hogo") {
        copayAmount = 0;
      } else {
        const tenPercent = Math.floor(totalAmount * 0.1);
        copayAmount = Math.min(tenPercent, cert.copay_limit);
      }
      const publicExpense = totalAmount - copayAmount;
      const serviceDays = Math.min(stats.days, cert.monthly_days_limit);

      billingDetails.push({
        billing_batch_id: batch.id,
        client_id: clientId,
        certificate_id: cert.id,
        municipality_code: cert.municipality_code,
        service_code: baseServiceCode,
        service_days: serviceDays,
        base_units: baseUnits,
        addition_units: additionUnits,
        subtraction_units: 0,
        total_units: totalUnits,
        unit_price: unitPrice,
        total_amount: totalAmount,
        public_expense: publicExpense,
        copay_amount: copayAmount,
        copay_limit_result: copayAmount < Math.floor(totalAmount * 0.1) ? "Y" : "N",
        copay_after_limit: copayAmount,
        pickup_outbound_days: stats.pickupOut,
        pickup_inbound_days: stats.pickupIn,
        meal_provision_days: stats.meals,
        _additions: clientAdditions,
      });

      batchTotalUnits += totalUnits;
      batchTotalAmount += totalAmount;
      batchTotalCopay += copayAmount;
    }

    // 請求明細を保存
    const detailsToInsert = billingDetails.map(({ _additions, ...rest }) => rest);
    const { data: insertedDetails, error: detailError } = await supabase
      .from("billing_details")
      .insert(detailsToInsert)
      .select("id, client_id")
      .returns<{ id: string; client_id: string }[]>();

    if (detailError) {
      await supabase.from("billing_batches").delete().eq("id", batch.id);
      return NextResponse.json({ error: "請求明細の作成に失敗しました" }, { status: 500 });
    }

    // 加算明細を保存
    if (insertedDetails) {
      const detailIdMap = new Map(insertedDetails.map((d) => [d.client_id, d.id]));
      const additionDetailsBulk: Array<{
        billing_detail_id: string;
        addition_code: string;
        addition_name: string;
        units: number;
        days_or_times: number;
      }> = [];

      for (const detail of billingDetails) {
        const detailId = detailIdMap.get(detail.client_id);
        if (!detailId || !detail._additions?.length) continue;

        for (const add of detail._additions) {
          additionDetailsBulk.push({
            billing_detail_id: detailId,
            addition_code: add.code,
            addition_name: add.name,
            units: add.units,
            days_or_times: add.days,
          });
        }
      }

      if (additionDetailsBulk.length > 0) {
        await supabase.from("billing_addition_details").insert(additionDetailsBulk);
      }
    }

    // バッチ合計を更新
    await supabase
      .from("billing_batches")
      .update({
        total_units: batchTotalUnits,
        total_amount: batchTotalAmount,
        total_copay: batchTotalCopay,
      })
      .eq("id", batch.id);

    return NextResponse.json({
      message: "請求データを作成しました",
      batchId: batch.id,
      clientCount: billingDetails.length,
      totalUnits: batchTotalUnits,
      totalAmount: batchTotalAmount,
      totalCopay: batchTotalCopay,
      validationWarnings,
    });
  } catch (error) {
    console.error("Billing creation error:", error);
    return NextResponse.json(
      { error: "請求データの作成に失敗しました" },
      { status: 500 }
    );
  }
}
