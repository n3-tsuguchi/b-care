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

async function test() {
  // Get an office and client
  const { data: clients } = await supabase
    .from("clients")
    .select("id, office_id, family_name")
    .eq("status", "active")
    .limit(1);

  if (!clients?.length) {
    console.log("No clients found");
    return;
  }

  const client = clients[0];
  console.log("Client:", client.family_name, client.id);

  // Try insert with service role (bypasses RLS)
  const { data, error } = await supabase
    .from("support_records")
    .insert({
      office_id: client.office_id,
      client_id: client.id,
      record_date: "2026-02-03",
      record_content: "テスト支援記録",
      health_status: "good",
      mood: "good",
      work_performance: "good",
    })
    .select("id")
    .single();

  if (error) {
    console.log("Insert error:", error.message, error.details, error.hint);
  } else {
    console.log("Insert OK:", data);
    // Clean up
    await supabase.from("support_records").delete().eq("id", data.id);
    console.log("Cleaned up");
  }

  // Now test with anon key (simulates client-side)
  const anonClient = createClient(
    vars["NEXT_PUBLIC_SUPABASE_URL"],
    vars["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
  );

  const { data: d2, error: e2 } = await anonClient
    .from("support_records")
    .insert({
      office_id: client.office_id,
      client_id: client.id,
      record_date: "2026-02-04",
      record_content: "テスト支援記録（anon）",
    })
    .select("id")
    .single();

  if (e2) {
    console.log("Anon insert error:", e2.message, e2.code);
  } else {
    console.log("Anon insert OK:", d2);
    await supabase.from("support_records").delete().eq("id", d2.id);
  }
}

test();
