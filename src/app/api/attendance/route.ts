import { NextRequest, NextResponse } from "next/server";
import { getAttendanceByDate } from "@/lib/supabase/queries";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  try {
    const records = await getAttendanceByDate(date);
    return NextResponse.json(records);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}
