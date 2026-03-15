import { NextRequest, NextResponse } from "next/server";
import { getAttendanceByDate, getOfficeId } from "@/lib/supabase/queries";

export async function GET(request: NextRequest) {
  try {
    await getOfficeId();

    const date = request.nextUrl.searchParams.get("date");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "valid date (YYYY-MM-DD) is required" }, { status: 400 });
    }

    const records = await getAttendanceByDate(date);
    return NextResponse.json(records);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}
