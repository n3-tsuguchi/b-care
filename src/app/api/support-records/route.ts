import { NextRequest, NextResponse } from "next/server";
import { getSupportRecordsByDate, getOfficeId } from "@/lib/supabase/queries";

export async function GET(request: NextRequest) {
  try {
    await getOfficeId();

    const date = request.nextUrl.searchParams.get("date");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "valid date (YYYY-MM-DD) is required" }, { status: 400 });
    }
    const records = await getSupportRecordsByDate(date);
    return NextResponse.json(records);
  } catch (error) {
    console.error("Support records fetch error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
