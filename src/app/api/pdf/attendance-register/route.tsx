import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOfficeId } from "@/lib/supabase/queries";
import { registerFonts } from "@/lib/pdf/font";
import {
  AttendanceRegisterPdf,
  type AttendanceRegisterData,
  type AttendanceRegisterClient,
} from "@/lib/pdf/attendance-register";

/**
 * GET /api/pdf/attendance-register?year=2026&month=2
 * 出席簿PDF（月間・全利用者）
 */
export async function GET(request: NextRequest) {
  try {
    registerFonts();

    const yearStr = request.nextUrl.searchParams.get("year");
    const monthStr = request.nextUrl.searchParams.get("month");

    if (!yearStr || !monthStr) {
      return NextResponse.json({ error: "year, month are required" }, { status: 400 });
    }

    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12 || year < 2000 || year > 2100) {
      return NextResponse.json({ error: "valid year (2000-2100) and month (1-12) are required" }, { status: 400 });
    }
    const daysInMonth = new Date(year, month, 0).getDate();
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

    // 利用者一覧
    const { data: clients } = await supabase
      .from("clients")
      .select("id, client_number, family_name, given_name")
      .eq("office_id", officeId)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("client_number", { ascending: true })
      .returns<{ id: string; client_number: string | null; family_name: string; given_name: string }[]>();

    if (!clients?.length) {
      return NextResponse.json({ error: "利用者が見つかりません" }, { status: 404 });
    }

    // 月間出席データ
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

    const { data: attendances } = await supabase
      .from("attendances")
      .select("client_id, attendance_date, status")
      .eq("office_id", officeId)
      .gte("attendance_date", startDate)
      .lte("attendance_date", endDate)
      .returns<{ client_id: string; attendance_date: string; status: string }[]>();

    // クライアントごとにマップ化
    const attMap = new Map<string, Map<number, string>>();
    for (const a of attendances ?? []) {
      const day = parseInt(a.attendance_date.split("-")[2]);
      if (!attMap.has(a.client_id)) {
        attMap.set(a.client_id, new Map());
      }
      attMap.get(a.client_id)!.set(day, a.status);
    }

    const registerClients: AttendanceRegisterClient[] = clients.map((c) => {
      const dayMap = attMap.get(c.id) ?? new Map<number, string>();
      const dailyStatus: (string | null)[] = [];
      let presentDays = 0;
      let absentDays = 0;

      for (let d = 1; d <= daysInMonth; d++) {
        const status = dayMap.get(d) ?? null;
        dailyStatus.push(status);
        if (status === "present" || status === "late" || status === "early_leave") {
          presentDays++;
        } else if (status === "absent" || status === "absent_notified") {
          absentDays++;
        }
      }

      return {
        clientNumber: c.client_number ?? "",
        clientName: `${c.family_name}${c.given_name}`,
        dailyStatus,
        presentDays,
        absentDays,
      };
    });

    const pdfData: AttendanceRegisterData = {
      officeName: office.name,
      officeNumber: office.office_number,
      targetYear: year,
      targetMonth: month,
      daysInMonth,
      clients: registerClients,
    };

    const buffer = new Uint8Array(await renderToBuffer(<AttendanceRegisterPdf data={pdfData} />));
    const filename = `attendance_register_${year}${String(month).padStart(2, "0")}.pdf`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    console.error("Attendance register PDF error:", error);
    return NextResponse.json({ error: "PDF生成に失敗しました" }, { status: 500 });
  }
}
