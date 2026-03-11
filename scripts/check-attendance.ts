import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const env = readFileSync(".env.local", "utf-8");
const vars: Record<string, string> = {};
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) vars[m[1].trim()] = m[2].trim();
}

const supabase = createClient(
  vars["NEXT_PUBLIC_SUPABASE_URL"],
  vars["SUPABASE_SERVICE_ROLE_KEY"]
);

async function check() {
  // 全出席レコード
  const { data: all, count } = await supabase
    .from("attendances")
    .select("*", { count: "exact" })
    .limit(10);

  console.log("Total attendance records:", count);
  if (all?.length) {
    console.log("Sample:", JSON.stringify(all[0], null, 2));
    console.log("Dates in data:", [...new Set(all.map(a => a.attendance_date))]);
    console.log("Statuses:", [...new Set(all.map(a => a.status))]);
  }

  // 今月のデータ
  const { data: thisMonth, count: thisCount } = await supabase
    .from("attendances")
    .select("*", { count: "exact" })
    .gte("attendance_date", "2026-03-01")
    .lte("attendance_date", "2026-03-31");
  console.log("\nMarch 2026 records:", thisCount);

  // 2月データ
  const { data: feb, count: febCount } = await supabase
    .from("attendances")
    .select("*", { count: "exact" })
    .gte("attendance_date", "2026-02-01")
    .lte("attendance_date", "2026-02-28");
  console.log("February 2026 records:", febCount);
}

check();
