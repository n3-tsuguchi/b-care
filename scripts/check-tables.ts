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
  // support_records テーブルにアクセスできるか
  const { data: _data, error } = await supabase.from("support_records").select("*").limit(1);
  console.log("support_records:", error ? `ERROR: ${error.message}` : "OK (exists)");

  const { error: e2 } = await supabase.from("individual_support_plans").select("*").limit(1);
  console.log("individual_support_plans:", e2 ? `ERROR: ${e2.message}` : "OK (exists)");

  const { error: e3 } = await supabase.from("support_plan_goals").select("*").limit(1);
  console.log("support_plan_goals:", e3 ? `ERROR: ${e3.message}` : "OK (exists)");

  const { error: e4 } = await supabase.from("support_plan_reviews").select("*").limit(1);
  console.log("support_plan_reviews:", e4 ? `ERROR: ${e4.message}` : "OK (exists)");
}

check();
