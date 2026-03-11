/**
 * PDF帳票テスト用ダミーデータ投入スクリプト
 *
 * 使い方: npx tsx scripts/seed-dummy.ts
 *
 * 前提: サインアップ済みのユーザーが1つ以上存在し、
 *       organization / office が作成されていること
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// .env.local を手動で読み込み
const envPath = resolve(import.meta.dirname ?? __dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx < 0) continue;
  const key = trimmed.slice(0, eqIdx);
  const val = trimmed.slice(eqIdx + 1);
  process.env[key] = val;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("=== ダミーデータ投入開始 ===\n");

  // 1. 既存の事業所を取得
  const { data: offices, error: offErr } = await supabase
    .from("offices")
    .select("id, organization_id, office_number, name")
    .limit(1);

  if (offErr || !offices?.length) {
    console.error(
      "事業所が見つかりません。先にサインアップしてください。",
      offErr
    );
    process.exit(1);
  }

  const office = offices[0];
  const officeId = office.id;
  const orgId = office.organization_id;
  console.log(`事業所: ${office.name} (${office.office_number})`);

  // 事業所情報を更新（住所・電話を設定）
  await supabase
    .from("offices")
    .update({
      address: "大阪府東大阪市花園東町1-2-3",
      phone: "06-1234-5678",
      fax: "06-1234-5679",
    })
    .eq("id", officeId);
  console.log("事業所情報を更新しました\n");

  // 2. 作業種別マスタ
  console.log("--- 作業種別マスタ ---");
  const workTypes = [
    { office_id: officeId, name: "内職（封入作業）", unit_type: "hourly", unit_price: 250, sort_order: 1, is_active: true },
    { office_id: officeId, name: "清掃業務", unit_type: "hourly", unit_price: 300, sort_order: 2, is_active: true },
    { office_id: officeId, name: "パン製造", unit_type: "daily", unit_price: 800, sort_order: 3, is_active: true },
    { office_id: officeId, name: "データ入力", unit_type: "piece", unit_price: 5, sort_order: 4, is_active: true },
  ];

  // 既存データ削除
  await supabase.from("work_types").delete().eq("office_id", officeId);
  const { data: insertedWorkTypes } = await supabase
    .from("work_types")
    .insert(workTypes)
    .select("id, name");
  console.log(`  ${insertedWorkTypes?.length ?? 0}件 投入\n`);

  // 3. 利用者（5名）
  console.log("--- 利用者 ---");
  const clientsData = [
    {
      office_id: officeId,
      client_number: "001",
      family_name: "田中",
      given_name: "太郎",
      family_name_kana: "タナカ",
      given_name_kana: "タロウ",
      birth_date: "1985-03-15",
      gender: "male",
      disability_type: "intellectual",
      postal_code: "577-0001",
      address: "大阪府東大阪市荒本1-1-1",
      phone: "090-1111-1111",
      status: "active",
      enrollment_date: "2023-04-01",
      bank_name: "三菱UFJ銀行",
      bank_branch: "東大阪支店",
      bank_account_type: "ordinary",
      bank_account_number: "1234567",
      bank_account_holder: "タナカ タロウ",
    },
    {
      office_id: officeId,
      client_number: "002",
      family_name: "佐藤",
      given_name: "花子",
      family_name_kana: "サトウ",
      given_name_kana: "ハナコ",
      birth_date: "1990-07-22",
      gender: "female",
      disability_type: "mental",
      postal_code: "577-0002",
      address: "大阪府東大阪市長堂2-2-2",
      phone: "090-2222-2222",
      status: "active",
      enrollment_date: "2023-06-01",
      bank_name: "ゆうちょ銀行",
      bank_branch: "〇三八",
      bank_account_type: "ordinary",
      bank_account_number: "2345678",
      bank_account_holder: "サトウ ハナコ",
    },
    {
      office_id: officeId,
      client_number: "003",
      family_name: "鈴木",
      given_name: "一郎",
      family_name_kana: "スズキ",
      given_name_kana: "イチロウ",
      birth_date: "1978-11-03",
      gender: "male",
      disability_type: "physical",
      disability_grade: "3級",
      postal_code: "577-0003",
      address: "大阪府東大阪市小若江3-3-3",
      phone: "090-3333-3333",
      status: "active",
      enrollment_date: "2024-01-15",
      bank_name: "りそな銀行",
      bank_branch: "花園支店",
      bank_account_type: "ordinary",
      bank_account_number: "3456789",
      bank_account_holder: "スズキ イチロウ",
    },
    {
      office_id: officeId,
      client_number: "004",
      family_name: "山田",
      given_name: "美咲",
      family_name_kana: "ヤマダ",
      given_name_kana: "ミサキ",
      birth_date: "1995-01-20",
      gender: "female",
      disability_type: "developmental",
      postal_code: "577-0004",
      address: "大阪府東大阪市御厨4-4-4",
      phone: "090-4444-4444",
      status: "active",
      enrollment_date: "2024-04-01",
      bank_name: "三井住友銀行",
      bank_branch: "東大阪支店",
      bank_account_type: "ordinary",
      bank_account_number: "4567890",
      bank_account_holder: "ヤマダ ミサキ",
    },
    {
      office_id: officeId,
      client_number: "005",
      family_name: "高橋",
      given_name: "健太",
      family_name_kana: "タカハシ",
      given_name_kana: "ケンタ",
      birth_date: "1988-09-10",
      gender: "male",
      disability_type: "mental",
      postal_code: "577-0005",
      address: "大阪府東大阪市永和5-5-5",
      phone: "090-5555-5555",
      status: "active",
      enrollment_date: "2024-09-01",
      bank_name: "関西みらい銀行",
      bank_branch: "布施支店",
      bank_account_type: "ordinary",
      bank_account_number: "5678901",
      bank_account_holder: "タカハシ ケンタ",
    },
  ];

  // 既存利用者を削除（関連テーブルもカスケード前提、なければ手動削除）
  const { data: existingClients } = await supabase
    .from("clients")
    .select("id")
    .eq("office_id", officeId);

  if (existingClients?.length) {
    const ids = existingClients.map((c) => c.id);
    await supabase.from("billing_addition_details").delete().in(
      "billing_detail_id",
      (
        await supabase
          .from("billing_details")
          .select("id")
          .in("client_id", ids)
      ).data?.map((d) => d.id) ?? []
    );
    await supabase.from("billing_client_invoices").delete().in("client_id", ids);
    await supabase.from("billing_details").delete().in("client_id", ids);
    await supabase.from("monthly_wages").delete().in("client_id", ids);
    await supabase.from("attendance_work_details").delete().in(
      "attendance_id",
      (
        await supabase.from("attendances").select("id").in("client_id", ids)
      ).data?.map((a) => a.id) ?? []
    );
    await supabase.from("attendances").delete().in("client_id", ids);
    await supabase.from("certificates").delete().in("client_id", ids);
    await supabase.from("contracts").delete().in("client_id", ids);
    await supabase.from("clients").delete().eq("office_id", officeId);
  }
  await supabase.from("billing_batches").delete().eq("office_id", officeId);
  await supabase.from("monthly_wage_summaries").delete().eq("office_id", officeId);
  await supabase.from("production_revenues").delete().eq("office_id", officeId);
  await supabase.from("production_expenses").delete().eq("office_id", officeId);

  const { data: clients } = await supabase
    .from("clients")
    .insert(clientsData)
    .select("id, client_number, family_name, given_name");

  if (!clients?.length) {
    console.error("利用者の投入に失敗しました");
    process.exit(1);
  }
  console.log(`  ${clients.length}名 投入`);

  // 4. 受給者証
  console.log("--- 受給者証 ---");
  const certData = clients.map((c, i) => ({
    client_id: c.id,
    certificate_number: `27200${String(i + 1).padStart(5, "0")}`,
    municipality_code: "27227", // 東大阪市
    municipality_name: "東大阪市",
    service_type: "B_type",
    decision_start_date: "2025-04-01",
    decision_end_date: "2027-03-31",
    monthly_days_limit: 23,
    income_category: i === 0 ? "general_1" : "low_income",
    copay_limit: i === 0 ? 9300 : 0,
    is_copay_limit_manager: true,
    is_current: true,
  }));

  await supabase.from("certificates").insert(certData);
  console.log(`  ${certData.length}件 投入\n`);

  // 5. 出席データ（2026年2月分 - 20営業日分）
  console.log("--- 出席データ（2026年2月分） ---");
  const year = 2026;
  const month = 2;
  const attendances: {
    office_id: string;
    client_id: string;
    attendance_date: string;
    status: string;
    check_in_time: string;
    check_out_time: string;
    pickup_outbound: boolean;
    pickup_inbound: boolean;
    meal_provided: boolean;
    service_hours: number;
  }[] = [];

  // 2026年2月の平日を取得
  const workDays: string[] = [];
  for (let d = 1; d <= 28; d++) {
    const date = new Date(year, month - 1, d);
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) {
      workDays.push(`${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
  }

  for (const client of clients) {
    for (const dateStr of workDays) {
      // 80%の確率で出席
      const rand = Math.random();
      if (rand > 0.8) continue;

      const isLate = rand > 0.7;
      const checkIn = isLate ? "10:30:00" : "09:00:00";
      const checkOut = "16:00:00";
      const hours = isLate ? 5.0 : 6.0;

      // 送迎: 60%の確率
      const pickupOut = Math.random() > 0.4;
      const pickupIn = Math.random() > 0.4;

      attendances.push({
        office_id: officeId,
        client_id: client.id,
        attendance_date: dateStr,
        status: isLate ? "late" : "present",
        check_in_time: checkIn,
        check_out_time: checkOut,
        pickup_outbound: pickupOut,
        pickup_inbound: pickupIn,
        meal_provided: true,
        service_hours: hours,
      });
    }
  }

  await supabase.from("attendances").insert(attendances);
  console.log(`  ${attendances.length}件 投入\n`);

  // 6. 生産活動収入・経費（2026年2月）
  console.log("--- 生産活動収支 ---");
  const wt = insertedWorkTypes ?? [];
  if (wt.length > 0) {
    await supabase.from("production_revenues").insert([
      { office_id: officeId, work_type_id: wt[0].id, fiscal_year: 2025, month: 2, description: "封入作業 A社", amount: 180000, tax_amount: 18000 },
      { office_id: officeId, work_type_id: wt[1].id, fiscal_year: 2025, month: 2, description: "清掃業務 B社", amount: 120000, tax_amount: 12000 },
      { office_id: officeId, work_type_id: wt[2].id, fiscal_year: 2025, month: 2, description: "パン販売", amount: 85000, tax_amount: 0 },
    ]);
    await supabase.from("production_expenses").insert([
      { office_id: officeId, work_type_id: wt[2].id, fiscal_year: 2025, month: 2, category: "material", description: "パン材料費", amount: 25000, tax_amount: 2500 },
      { office_id: officeId, fiscal_year: 2025, month: 2, category: "utility", description: "光熱費（按分）", amount: 15000, tax_amount: 1500 },
    ]);
    console.log("  収入3件、経費2件 投入\n");
  }

  // 7. 月次工賃データ（2026年2月）
  console.log("--- 月次工賃 ---");
  const wageData = clients.map((c) => {
    // 出席日数を集計
    const clientAtt = attendances.filter((a) => a.client_id === c.id);
    const workingDays = clientAtt.length;
    const totalHours = clientAtt.reduce((s, a) => s + a.service_hours, 0);
    const baseWage = Math.round(totalHours * 250); // 時給250円
    const pieceWage = Math.round(Math.random() * 2000);
    const totalWage = baseWage + pieceWage;

    return {
      office_id: officeId,
      client_id: c.id,
      fiscal_year: 2025,
      month: 2,
      working_days: workingDays,
      total_hours: totalHours,
      base_wage: baseWage,
      piece_wage: pieceWage,
      adjustment: 0,
      total_wage: totalWage,
      status: "confirmed",
    };
  });

  await supabase.from("monthly_wages").insert(wageData);
  const totalWagePaid = wageData.reduce((s, w) => s + w.total_wage, 0);
  console.log(`  ${wageData.length}名分 投入 (合計: ¥${totalWagePaid.toLocaleString()})\n`);

  // 8. システムマスタ（サービスコード、加算）
  console.log("--- システムマスタ ---");

  // サービスコードマスタ（B型 サービス費I 7.5:1 定員21-40）
  const { count: scCount } = await supabase
    .from("service_code_masters")
    .select("id", { count: "exact", head: true });

  if (!scCount) {
    await supabase.from("service_code_masters").insert([
      {
        revision_year: 2024,
        service_code: "A61111",
        service_name: "就労継続支援B型サービス費(I) 7.5:1 定員21-40人",
        service_type: "type_1",
        staffing_ratio: "7.5_to_1",
        capacity_range: "21-40",
        wage_tier: "1man_ijo",
        units: 702,
        effective_from: "2024-04-01",
      },
    ]);
    console.log("  サービスコード投入");
  } else {
    console.log("  サービスコード: 既存データあり");
  }

  // 単位単価マスタ
  const { count: upCount } = await supabase
    .from("unit_price_masters")
    .select("id", { count: "exact", head: true });

  if (!upCount) {
    await supabase.from("unit_price_masters").insert([
      { revision_year: 2024, area_code: "06", area_name: "6級地", unit_price: 10.27, effective_from: "2024-04-01" },
    ]);
    console.log("  単位単価投入");
  } else {
    console.log("  単位単価: 既存データあり");
  }

  // 加算マスタ
  const { count: amCount } = await supabase
    .from("addition_masters")
    .select("id", { count: "exact", head: true });

  if (!amCount) {
    await supabase.from("addition_masters").insert([
      { revision_year: 2024, addition_code: "pickup", addition_name: "送迎加算", calculation_type: "per_day", units: 21, effective_from: "2024-04-01" },
      { revision_year: 2024, addition_code: "meal", addition_name: "食事提供体制加算", calculation_type: "per_day", units: 30, effective_from: "2024-04-01" },
    ]);
    console.log("  加算マスタ投入");
  } else {
    console.log("  加算マスタ: 既存データあり");
  }

  // 事業所加算設定
  await supabase.from("office_additions").delete().eq("office_id", officeId);
  await supabase.from("office_additions").insert([
    { office_id: officeId, fiscal_year: 2025, addition_code: "pickup", is_enabled: true },
    { office_id: officeId, fiscal_year: 2025, addition_code: "meal", is_enabled: true },
  ]);
  console.log("  事業所加算設定 投入\n");

  // 9. 請求バッチ + 明細 + 利用者請求書（2026年2月分）
  console.log("--- 請求データ（2026年2月分） ---");
  const unitPrice = 10.27; // 6級地
  const baseUnits = 702;

  let batchTotalUnits = 0;
  let batchTotalAmount = 0;
  let batchTotalCopay = 0;

  const billingDetails: {
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
  }[] = [];

  // 先にバッチを作成
  const { data: batch } = await supabase
    .from("billing_batches")
    .insert({
      office_id: officeId,
      target_year: year,
      target_month: month,
      billing_type: "normal",
      status: "exported",
      total_units: 0,
      total_amount: 0,
      total_copay: 0,
      exported_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (!batch) {
    console.error("請求バッチの作成に失敗");
    process.exit(1);
  }

  // 各利用者の受給者証取得
  const { data: certs } = await supabase
    .from("certificates")
    .select("id, client_id, certificate_number, municipality_code, income_category, copay_limit")
    .in("client_id", clients.map((c) => c.id))
    .eq("is_current", true);

  const certMap = new Map(certs?.map((c) => [c.client_id, c]) ?? []);

  for (const client of clients) {
    const cert = certMap.get(client.id);
    if (!cert) continue;

    const clientAtt = attendances.filter((a) => a.client_id === client.id);
    const serviceDays = clientAtt.length;
    const pickupOutDays = clientAtt.filter((a) => a.pickup_outbound).length;
    const pickupInDays = clientAtt.filter((a) => a.pickup_inbound).length;
    const mealDays = clientAtt.filter((a) => a.meal_provided).length;

    const clientBaseUnits = baseUnits * serviceDays;
    const additionUnits = (pickupOutDays + pickupInDays) * 21 + mealDays * 30;
    const totalUnits = clientBaseUnits + additionUnits;
    const totalAmount = Math.floor(totalUnits * unitPrice);

    // 自己負担計算
    const copay10pct = Math.floor(totalAmount * 0.1);
    const copayAmount = Math.min(copay10pct, cert.copay_limit);

    const publicExpense = totalAmount - copayAmount;

    batchTotalUnits += totalUnits;
    batchTotalAmount += totalAmount;
    batchTotalCopay += copayAmount;

    billingDetails.push({
      billing_batch_id: batch.id,
      client_id: client.id,
      certificate_id: cert.id,
      municipality_code: cert.municipality_code,
      service_code: "A61111",
      service_days: serviceDays,
      base_units: clientBaseUnits,
      addition_units: additionUnits,
      subtraction_units: 0,
      total_units: totalUnits,
      unit_price: unitPrice,
      total_amount: totalAmount,
      public_expense: publicExpense,
      copay_amount: copayAmount,
      copay_limit_result: null,
      copay_after_limit: copayAmount,
      pickup_outbound_days: pickupOutDays,
      pickup_inbound_days: pickupInDays,
      meal_provision_days: mealDays,
    });
  }

  await supabase.from("billing_details").insert(billingDetails);

  // バッチの合計を更新
  await supabase
    .from("billing_batches")
    .update({
      total_units: batchTotalUnits,
      total_amount: batchTotalAmount,
      total_copay: batchTotalCopay,
    })
    .eq("id", batch.id);

  console.log(`  バッチ作成: 合計 ¥${batchTotalAmount.toLocaleString()}`);
  console.log(`  明細: ${billingDetails.length}件`);

  // 10. 利用者請求書
  const invoices = billingDetails.map((d, i) => {
    const mealCost = d.meal_provision_days * 300;
    return {
      billing_batch_id: batch.id,
      client_id: d.client_id,
      invoice_number: `INV-${year}${String(month).padStart(2, "0")}-${String(i + 1).padStart(4, "0")}`,
      invoice_date: `${year}-${String(month).padStart(2, "0")}-28`,
      copay_amount: d.copay_amount,
      meal_cost: mealCost,
      other_cost: 0,
      total_amount: d.copay_amount + mealCost,
      status: "issued",
    };
  });

  await supabase.from("billing_client_invoices").insert(invoices);
  console.log(`  利用者請求書: ${invoices.length}件\n`);

  // 11. 支援記録（2026年2月分）
  console.log("--- 支援記録 ---");
  // Phase 2テーブルの既存データ削除
  const existClientIds = clients.map((c) => c.id);
  await supabase.from("support_records").delete().eq("office_id", officeId);
  await supabase.from("support_plan_reviews").delete().in(
    "plan_id",
    (await supabase.from("individual_support_plans").select("id").eq("office_id", officeId)).data?.map((p) => p.id) ?? []
  );
  await supabase.from("support_plan_goals").delete().in(
    "plan_id",
    (await supabase.from("individual_support_plans").select("id").eq("office_id", officeId)).data?.map((p) => p.id) ?? []
  );
  await supabase.from("individual_support_plans").delete().eq("office_id", officeId);

  const healthStatuses = ["good", "fair", "poor"];
  const moods = ["good", "normal", "low"];
  const workPerfs = ["excellent", "good", "fair", "poor"];
  const recordContents = [
    "午前は封入作業に集中して取り組めた。午後は疲れが見えたため休憩を多めに入れた。",
    "清掃業務を丁寧にこなした。他の利用者とも良好なコミュニケーションが取れていた。",
    "パン製造の工程を一通り担当。生地の成形が上達してきている。",
    "データ入力作業。正確性が向上しており、ミスが減少。",
    "グループ活動に積極的に参加。リーダー的な役割を自然と果たしていた。",
    "体調がやや不安定だったが、午前中の軽作業には取り組めた。",
    "集中力が続き、目標数を達成できた。本人も達成感を感じている様子。",
  ];

  const supportRecords: {
    office_id: string;
    client_id: string;
    attendance_id: string | null;
    record_date: string;
    record_content: string;
    health_status: string;
    mood: string;
    work_performance: string;
    special_notes: string | null;
  }[] = [];

  // 出席データからランダムに支援記録を作成（70%の出席日に記録あり）
  for (const client of clients) {
    const clientAtt = attendances.filter((a) => a.client_id === client.id);
    for (const att of clientAtt) {
      if (Math.random() > 0.7) continue;
      supportRecords.push({
        office_id: officeId,
        client_id: client.id,
        attendance_id: null,
        record_date: att.attendance_date,
        record_content: recordContents[Math.floor(Math.random() * recordContents.length)],
        health_status: healthStatuses[Math.floor(Math.random() * healthStatuses.length)],
        mood: moods[Math.floor(Math.random() * moods.length)],
        work_performance: workPerfs[Math.floor(Math.random() * workPerfs.length)],
        special_notes: Math.random() > 0.7 ? "家族から体調について連絡あり" : null,
      });
    }
  }

  if (supportRecords.length > 0) {
    await supabase.from("support_records").insert(supportRecords);
  }
  console.log(`  ${supportRecords.length}件 投入\n`);

  // 12. 個別支援計画
  console.log("--- 個別支援計画 ---");
  const planData = [
    {
      office_id: officeId,
      client_id: clients[0].id,
      plan_number: "ISP-2025-001",
      status: "active",
      start_date: "2025-10-01",
      end_date: "2026-09-30",
      overall_goal: "就労に必要な基礎体力と集中力を向上させ、一般就労への移行を目指す",
      support_policy: "段階的に作業時間を延長し、体力面と精神面の安定を図る",
      notes: null,
    },
    {
      office_id: officeId,
      client_id: clients[1].id,
      plan_number: "ISP-2025-002",
      status: "active",
      start_date: "2025-10-01",
      end_date: "2026-09-30",
      overall_goal: "対人コミュニケーション能力を高め、チームでの作業に安定して参加する",
      support_policy: "小グループでの活動を中心に、段階的に関わる人数を増やす",
      notes: null,
    },
    {
      office_id: officeId,
      client_id: clients[2].id,
      plan_number: "ISP-2025-003",
      status: "active",
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      overall_goal: "パン製造技術を習得し、販売業務にも携われるようにする",
      support_policy: "製造工程を段階的に担当し、接客マナーの訓練も並行して行う",
      notes: "身体面の配慮が必要。長時間の立ち作業は避ける。",
    },
    {
      office_id: officeId,
      client_id: clients[3].id,
      plan_number: "ISP-2026-001",
      status: "draft",
      start_date: "2026-04-01",
      end_date: "2027-03-31",
      overall_goal: "PC操作スキルを向上させ、データ入力業務の精度と速度を高める",
      support_policy: "タイピング練習とExcel操作を中心に、実務レベルのスキル習得を支援",
      notes: null,
    },
    {
      office_id: officeId,
      client_id: clients[4].id,
      plan_number: "ISP-2025-004",
      status: "active",
      start_date: "2025-09-01",
      end_date: "2026-08-31",
      overall_goal: "生活リズムを安定させ、毎日の通所を継続する",
      support_policy: "朝の送迎を活用し、規則正しい通所習慣を確立する。服薬管理の支援も行う。",
      notes: "主治医との連携が重要。月1回の通院日は通所なし。",
    },
  ];

  const { data: plans } = await supabase
    .from("individual_support_plans")
    .insert(planData)
    .select("id, client_id, plan_number");

  if (!plans?.length) {
    console.error("支援計画の投入に失敗");
  } else {
    console.log(`  ${plans.length}件 投入`);

    // 13. 支援計画の目標
    console.log("--- 支援計画目標 ---");
    const goalsData: {
      plan_id: string;
      goal_type: string;
      goal_content: string;
      target_date: string;
      achievement_criteria: string;
      sort_order: number;
      is_achieved: boolean;
    }[] = [];

    for (const plan of plans) {
      goalsData.push(
        {
          plan_id: plan.id,
          goal_type: "long_term",
          goal_content: "一般就労または就労継続支援A型への移行",
          target_date: "2027-03-31",
          achievement_criteria: "就労移行支援の利用開始、またはA型事業所との面接実施",
          sort_order: 1,
          is_achieved: false,
        },
        {
          plan_id: plan.id,
          goal_type: "short_term",
          goal_content: "月間出席率80%以上を維持する",
          target_date: "2026-09-30",
          achievement_criteria: "3ヶ月連続で出席率80%以上を達成",
          sort_order: 2,
          is_achieved: false,
        },
        {
          plan_id: plan.id,
          goal_type: "short_term",
          goal_content: "担当作業の品質基準を満たす",
          target_date: "2026-09-30",
          achievement_criteria: "作業チェックでのエラー率5%以下",
          sort_order: 3,
          is_achieved: false,
        }
      );
    }

    await supabase.from("support_plan_goals").insert(goalsData);
    console.log(`  ${goalsData.length}件 投入\n`);
  }

  // 完了サマリー
  console.log("=== ダミーデータ投入完了 ===\n");
  console.log("PDF確認用URL:");
  console.log(`  請求書PDF:       /api/pdf/invoice?batchId=${batch.id}`);
  console.log(`  工賃明細PDF:     /api/pdf/wage-statement?year=2025&month=2&clientId=${clients[0].id}`);
  console.log(`  実績記録票PDF:   /api/pdf/service-record?year=${year}&month=${month}&clientId=${clients[0].id}`);
  console.log("");
  console.log("利用者ID一覧:");
  for (const c of clients) {
    console.log(`  ${c.client_number} ${c.family_name}${c.given_name}: ${c.id}`);
  }
}

main().catch(console.error);
