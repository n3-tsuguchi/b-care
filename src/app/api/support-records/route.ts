import { NextRequest, NextResponse } from "next/server";
import { getSupportRecordsByDate } from "@/lib/supabase/queries";

export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get("date");
    if (!date) {
      return NextResponse.json({ error: "date is required" }, { status: 400 });
    }
    const records = await getSupportRecordsByDate(date);
    return NextResponse.json(records);
  } catch (error) {
    console.error("Support records fetch error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
