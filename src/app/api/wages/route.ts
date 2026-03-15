import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOfficeId } from "@/lib/supabase/queries";

/**
 * POST /api/wages - 工賃計算実行
 * 出席データと工賃規程から月次工賃を自動計算し、monthly_wages に保存する
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

    // 1. 工賃規程を取得
    type WageRuleRow = {
      calculation_method: string;
      base_hourly_rate: number | null;
      base_daily_rate: number | null;
      rounding_method: string;
    };
    const { data: wageRule } = await supabase
      .from("wage_rules")
      .select("calculation_method, base_hourly_rate, base_daily_rate, rounding_method")
      .eq("office_id", officeId)
      .eq("fiscal_year", year)
      .returns<WageRuleRow[]>()
      .single();

    const baseHourlyRate = Number(wageRule?.base_hourly_rate ?? 250);
    const baseDailyRate = Number(wageRule?.base_daily_rate ?? 2000);
    const calculationMethod = wageRule?.calculation_method ?? "hourly";
    const roundingMethod = wageRule?.rounding_method ?? "floor";

    // 2. 対象月の出席データを取得（出席・遅刻・早退のみ）
    const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    type AttRow = {
      id: string;
      client_id: string;
      attendance_date: string;
      status: string;
      check_in_time: string | null;
      check_out_time: string | null;
      service_hours: number | null;
    };

    const { data: attendances } = await supabase
      .from("attendances")
      .select("id, client_id, attendance_date, status, check_in_time, check_out_time, service_hours")
      .eq("office_id", officeId)
      .gte("attendance_date", monthStart)
      .lte("attendance_date", monthEnd)
      .in("status", ["present", "late", "early_leave"])
      .returns<AttRow[]>();

    if (!attendances?.length) {
      return NextResponse.json({ message: "対象月の出席データがありません", calculated: 0 });
    }

    // 3. 出来高データを取得
    const attendanceIds = attendances.map((a) => a.id);
    const { data: workDetails } = await supabase
      .from("attendance_work_details")
      .select("attendance_id, amount")
      .in("attendance_id", attendanceIds)
      .returns<{ attendance_id: string; amount: number | null }[]>();

    const pieceAmountByAttendance = new Map<string, number>();
    for (const wd of workDetails ?? []) {
      const current = pieceAmountByAttendance.get(wd.attendance_id) ?? 0;
      pieceAmountByAttendance.set(wd.attendance_id, current + Number(wd.amount ?? 0));
    }

    // 4. 利用者ごとに集計
    const clientStats = new Map<
      string,
      { days: number; hours: number; pieceWage: number }
    >();

    for (const att of attendances) {
      const stats = clientStats.get(att.client_id) ?? {
        days: 0,
        hours: 0,
        pieceWage: 0,
      };
      stats.days += 1;

      // サービス時間の計算
      if (att.service_hours) {
        stats.hours += Number(att.service_hours);
      } else if (att.check_in_time && att.check_out_time) {
        const [inH, inM] = att.check_in_time.split(":").map(Number);
        const [outH, outM] = att.check_out_time.split(":").map(Number);
        const hours = (outH * 60 + outM - (inH * 60 + inM)) / 60;
        stats.hours += Math.max(0, hours - 1); // 休憩1時間差引
      } else {
        stats.hours += 6; // デフォルト6時間
      }

      // 出来高加算
      const attId = att.id;
      stats.pieceWage += pieceAmountByAttendance.get(attId) ?? 0;

      clientStats.set(att.client_id, stats);
    }

    // 5. 工賃計算
    const roundFn = (v: number) => {
      if (roundingMethod === "ceil") return Math.ceil(v);
      if (roundingMethod === "round") return Math.round(v);
      return Math.floor(v);
    };

    const wageRecords = Array.from(clientStats.entries()).map(
      ([clientId, stats]) => {
        let baseWage = 0;
        if (calculationMethod === "daily") {
          baseWage = roundFn(stats.days * baseDailyRate);
        } else {
          // hourly or mixed
          baseWage = roundFn(stats.hours * baseHourlyRate);
        }
        const pieceWage = roundFn(stats.pieceWage);
        const totalWage = baseWage + pieceWage;

        return {
          office_id: officeId,
          client_id: clientId,
          fiscal_year: year,
          month,
          working_days: stats.days,
          total_hours: Math.round(stats.hours * 100) / 100,
          base_wage: baseWage,
          piece_wage: pieceWage,
          adjustment: 0,
          total_wage: totalWage,
          status: "draft" as const,
        };
      }
    );

    // 6. 既存データを削除して保存（upsertの代替）
    await supabase
      .from("monthly_wages")
      .delete()
      .eq("office_id", officeId)
      .eq("fiscal_year", year)
      .eq("month", month)
      .eq("status", "draft");

    const { error } = await supabase.from("monthly_wages").insert(wageRecords);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 7. 月次サマリーも更新
    const { data: revenues } = await supabase
      .from("production_revenues")
      .select("amount")
      .eq("office_id", officeId)
      .eq("fiscal_year", year)
      .eq("month", month);

    const { data: expenses } = await supabase
      .from("production_expenses")
      .select("amount")
      .eq("office_id", officeId)
      .eq("fiscal_year", year)
      .eq("month", month);

    const totalRevenue = revenues?.reduce((s, r) => s + Number(r.amount), 0) ?? 0;
    const totalExpense = expenses?.reduce((s, e) => s + Number(e.amount), 0) ?? 0;
    const totalWagePaid = wageRecords.reduce((s, w) => s + w.total_wage, 0);
    const avgWage = wageRecords.length > 0 ? Math.round(totalWagePaid / wageRecords.length) : 0;

    // 月間の平均日次利用者数を計算
    const uniqueDates = new Set(attendances.map((a) => a.attendance_date));
    const avgDailyUsers = uniqueDates.size > 0
      ? Math.round((attendances.length / uniqueDates.size) * 100) / 100
      : 0;

    await supabase
      .from("monthly_wage_summaries")
      .upsert(
        {
          office_id: officeId,
          fiscal_year: year,
          month,
          total_production_revenue: totalRevenue,
          total_production_expense: totalExpense,
          distributable_amount: totalRevenue - totalExpense,
          total_wage_paid: totalWagePaid,
          avg_wage_per_person: avgWage,
          avg_daily_users: avgDailyUsers,
        },
        { onConflict: "office_id,fiscal_year,month" }
      );

    return NextResponse.json({
      message: "工賃計算が完了しました",
      calculated: wageRecords.length,
      totalWage: totalWagePaid,
      avgWage,
    });
  } catch (error) {
    console.error("Wage calculation error:", error);
    return NextResponse.json(
      { error: "工賃計算に失敗しました" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/wages - 工賃ステータス更新（確定・支払済みなど）
 */
export async function PATCH(request: NextRequest) {
  try {
    const { year, month, status } = await request.json();
    if (!year || !month || !status) {
      return NextResponse.json(
        { error: "year, month, and status are required" },
        { status: 400 }
      );
    }

    const officeId = await getOfficeId();
    const supabase = await createServerSupabaseClient();

    const updateData: Record<string, unknown> = { status };
    if (status === "paid") {
      updateData.paid_at = new Date().toISOString().split("T")[0];
    }

    const { error } = await supabase
      .from("monthly_wages")
      .update(updateData)
      .eq("office_id", officeId)
      .eq("fiscal_year", year)
      .eq("month", month);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: `ステータスを「${status}」に更新しました` });
  } catch {
    return NextResponse.json(
      { error: "ステータス更新に失敗しました" },
      { status: 500 }
    );
  }
}
