import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOfficeId } from "@/lib/supabase/queries";
import { registerFonts } from "@/lib/pdf/font";
import { WageLedgerPdf, type WageLedgerData, type WageLedgerEntry } from "@/lib/pdf/wage-ledger";

/**
 * GET /api/pdf/wage-ledger?year=2026&month=2
 * 工賃支払台帳PDF
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

    // 工賃データ
    const { data: wages } = await supabase
      .from("monthly_wages")
      .select("*")
      .eq("office_id", officeId)
      .eq("fiscal_year", year)
      .eq("month", month)
      .returns<{
        client_id: string;
        working_days: number;
        total_hours: number;
        base_wage: number;
        piece_wage: number;
        adjustment: number;
        total_wage: number;
        status: string;
      }[]>();

    if (!wages?.length) {
      return NextResponse.json({ error: "工賃データが見つかりません" }, { status: 404 });
    }

    // 利用者名
    const clientIds = wages.map((w) => w.client_id);
    const { data: clients } = await supabase
      .from("clients")
      .select("id, client_number, family_name, given_name")
      .in("id", clientIds)
      .returns<{ id: string; client_number: string | null; family_name: string; given_name: string }[]>();

    const clientMap = new Map(clients?.map((c) => [c.id, c]) ?? []);

    // 生産活動収支
    const { data: revenues } = await supabase
      .from("production_revenues")
      .select("amount")
      .eq("office_id", officeId)
      .eq("fiscal_year", year)
      .eq("month", month)
      .returns<{ amount: number }[]>();

    const { data: expenses } = await supabase
      .from("production_expenses")
      .select("amount")
      .eq("office_id", officeId)
      .eq("fiscal_year", year)
      .eq("month", month)
      .returns<{ amount: number }[]>();

    const totalRevenue = revenues?.reduce((s, r) => s + r.amount, 0) ?? 0;
    const totalExpense = expenses?.reduce((s, e) => s + e.amount, 0) ?? 0;

    const entries: WageLedgerEntry[] = wages.map((w) => {
      const client = clientMap.get(w.client_id);
      return {
        clientNumber: client?.client_number ?? "",
        clientName: client ? `${client.family_name}${client.given_name}` : "",
        workingDays: w.working_days,
        totalHours: w.total_hours,
        baseWage: w.base_wage,
        pieceWage: w.piece_wage,
        adjustment: w.adjustment,
        totalWage: w.total_wage,
        status: w.status,
      };
    });

    const pdfData: WageLedgerData = {
      officeName: office.name,
      officeNumber: office.office_number,
      targetYearMonth: `${year}年${month}月分`,
      entries,
      totalRevenue,
      totalExpense,
      distributable: totalRevenue - totalExpense,
    };

    const buffer = new Uint8Array(await renderToBuffer(<WageLedgerPdf data={pdfData} />));
    const filename = `wage_ledger_${year}${String(month).padStart(2, "0")}.pdf`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    console.error("Wage ledger PDF error:", error);
    return NextResponse.json({ error: "PDF生成に失敗しました" }, { status: 500 });
  }
}
