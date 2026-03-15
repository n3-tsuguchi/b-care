import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOfficeId } from "@/lib/supabase/queries";
import { registerFonts } from "@/lib/pdf/font";
import { WageStatementPdf, type WageStatementData } from "@/lib/pdf/wage-statement";

/**
 * GET /api/pdf/wage-statement?year=2025&month=3&clientId=xxx
 * 工賃明細書PDF（個別利用者）
 */
export async function GET(request: NextRequest) {
  let pdfData: WageStatementData;
  let clientFamilyName: string;
  let year: number;
  let month: number;

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

    year = parseInt(yearStr, 10);
    month = parseInt(monthStr, 10);
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12 || year < 2000 || year > 2100) {
      return NextResponse.json({ error: "valid year (2000-2100) and month (1-12) are required" }, { status: 400 });
    }

    const officeId = await getOfficeId();
    const supabase = await createServerSupabaseClient();

    // 事業所情報
    const { data: office } = await supabase
      .from("offices")
      .select("name, address")
      .eq("id", officeId)
      .returns<{ name: string; address: string | null }[]>()
      .single();

    if (!office) {
      return NextResponse.json({ error: "事業所情報が見つかりません" }, { status: 404 });
    }

    // 利用者情報
    const { data: client } = await supabase
      .from("clients")
      .select("id, client_number, family_name, given_name")
      .eq("id", clientId)
      .eq("office_id", officeId)
      .returns<{ id: string; client_number: string | null; family_name: string; given_name: string }[]>()
      .single();

    if (!client) {
      return NextResponse.json({ error: "利用者が見つかりません" }, { status: 404 });
    }

    // 工賃データ
    const { data: wage } = await supabase
      .from("monthly_wages")
      .select("*")
      .eq("office_id", officeId)
      .eq("client_id", clientId)
      .eq("fiscal_year", year)
      .eq("month", month)
      .returns<{
        working_days: number;
        total_hours: number;
        base_wage: number;
        piece_wage: number;
        adjustment: number;
        total_wage: number;
      }[]>()
      .single();

    if (!wage) {
      return NextResponse.json({ error: "工賃データが見つかりません" }, { status: 404 });
    }

    clientFamilyName = client.family_name;
    pdfData = {
      clientName: `${client.family_name}${client.given_name}`,
      clientNumber: client.client_number,
      targetYearMonth: `${year}年${month}月分`,
      officeName: office.name,
      officeAddress: office.address ?? "",
      workingDays: wage.working_days,
      totalHours: wage.total_hours,
      baseWage: wage.base_wage,
      pieceWage: wage.piece_wage,
      adjustment: wage.adjustment,
      totalWage: wage.total_wage,
    };
  } catch (error) {
    console.error("Wage statement PDF error:", error);
    return NextResponse.json({ error: "PDF生成に失敗しました" }, { status: 500 });
  }

  const pdfElement = <WageStatementPdf data={pdfData} />;
  const buffer = new Uint8Array(await renderToBuffer(pdfElement));

  const filename = `wage_${year}${String(month).padStart(2, "0")}_${clientFamilyName}.pdf`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
