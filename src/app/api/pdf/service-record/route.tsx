import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOfficeId } from "@/lib/supabase/queries";
import { registerFonts } from "@/lib/pdf/font";
import {
  ServiceRecordPdf,
  type ServiceRecordData,
  type DayRecord,
} from "@/lib/pdf/service-record";

/**
 * GET /api/pdf/service-record?year=2025&month=3&clientId=xxx
 * サービス提供実績記録票PDF
 */
export async function GET(request: NextRequest) {
  try {
    registerFonts();

    const yearStr = request.nextUrl.searchParams.get("year");
    const monthStr = request.nextUrl.searchParams.get("month");
    const clientId = request.nextUrl.searchParams.get("clientId");

    if (!yearStr || !monthStr || !clientId) {
      return NextResponse.json(
        { error: "year, month, clientId are required" },
        { status: 400 }
      );
    }

    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    const officeId = await getOfficeId();
    const supabase = await createServerSupabaseClient();

    // 事業所情報
    const { data: office } = await supabase
      .from("offices")
      .select("office_number, name")
      .eq("id", officeId)
      .returns<{ office_number: string; name: string }[]>()
      .single();

    if (!office) {
      return NextResponse.json({ error: "事業所情報が見つかりません" }, { status: 404 });
    }

    // 利用者情報
    const { data: client } = await supabase
      .from("clients")
      .select("id, family_name, given_name")
      .eq("id", clientId)
      .eq("office_id", officeId)
      .returns<{ id: string; family_name: string; given_name: string }[]>()
      .single();

    if (!client) {
      return NextResponse.json({ error: "利用者が見つかりません" }, { status: 404 });
    }

    // 受給者証
    const { data: cert } = await supabase
      .from("certificates")
      .select("certificate_number")
      .eq("client_id", clientId)
      .eq("is_current", true)
      .returns<{ certificate_number: string }[]>()
      .single();

    // 対象月の出席データ
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const { data: attendances } = await supabase
      .from("attendances")
      .select("attendance_date, status, check_in_time, check_out_time, service_hours, pickup_outbound, pickup_inbound, meal_provided, notes")
      .eq("client_id", clientId)
      .eq("office_id", officeId)
      .gte("attendance_date", startDate)
      .lte("attendance_date", endDate)
      .returns<{
        attendance_date: string;
        status: string;
        check_in_time: string | null;
        check_out_time: string | null;
        service_hours: number | null;
        pickup_outbound: boolean;
        pickup_inbound: boolean;
        meal_provided: boolean;
        notes: string | null;
      }[]>();

    const attendanceMap = new Map(
      attendances?.map((a) => [a.attendance_date, a]) ?? []
    );

    // 日別データ構築
    const days: DayRecord[] = [];
    let presentDays = 0;
    let totalServiceHours = 0;
    let pickupOutDays = 0;
    let pickupInDays = 0;
    let mealDays = 0;

    for (let d = 1; d <= lastDay; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dateObj = new Date(year, month - 1, d);
      const weekday = dateObj.getDay();
      const att = attendanceMap.get(dateStr);

      const record: DayRecord = {
        day: d,
        weekday,
        status: att?.status ?? null,
        checkIn: att?.check_in_time?.substring(0, 5) ?? null,
        checkOut: att?.check_out_time?.substring(0, 5) ?? null,
        serviceHours: att?.service_hours ?? null,
        pickupOut: att?.pickup_outbound ?? false,
        pickupIn: att?.pickup_inbound ?? false,
        meal: att?.meal_provided ?? false,
        note: att?.notes ?? "",
      };

      days.push(record);

      if (att) {
        if (["present", "late", "early_leave"].includes(att.status)) {
          presentDays++;
          totalServiceHours += att.service_hours ?? 0;
        }
        if (att.pickup_outbound) pickupOutDays++;
        if (att.pickup_inbound) pickupInDays++;
        if (att.meal_provided) mealDays++;
      }
    }

    const pdfData: ServiceRecordData = {
      clientName: `${client.family_name}${client.given_name}`,
      certificateNumber: cert?.certificate_number ?? "",
      officeName: office.name,
      officeNumber: office.office_number,
      targetYear: year,
      targetMonth: month,
      days,
      summary: {
        presentDays,
        totalServiceHours,
        pickupOutDays,
        pickupInDays,
        mealDays,
      },
    };

    const buffer = new Uint8Array(await renderToBuffer(<ServiceRecordPdf data={pdfData} />));

    const filename = `service_record_${year}${String(month).padStart(2, "0")}_${client.family_name}.pdf`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    console.error("Service record PDF error:", error);
    return NextResponse.json({ error: "PDF生成に失敗しました" }, { status: 500 });
  }
}
