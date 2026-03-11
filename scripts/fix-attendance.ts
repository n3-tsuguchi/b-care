import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const env = readFileSync("/mnt/c/Users/津口雄作/tsuguchi/b-care/.env.local", "utf-8");
const vars: Record<string, string> = {};
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) vars[m[1].trim()] = m[2].trim();
}

const supabase = createClient(
  vars["NEXT_PUBLIC_SUPABASE_URL"],
  vars["SUPABASE_SERVICE_ROLE_KEY"]
);

async function fix() {
  // 空office_idのレコードを検索
  const { data: broken, error: e1 } = await supabase
    .from("attendances")
    .select("id, office_id, client_id")
    .eq("office_id", "");

  console.log("Broken records (empty office_id):", broken?.length ?? 0);
  if (!broken?.length) {
    console.log("No records to fix.");
    return;
  }

  // client_idから正しいoffice_idを取得
  const clientIds = [...new Set(broken.map(r => r.client_id))];
  const { data: clients } = await supabase
    .from("clients")
    .select("id, office_id")
    .in("id", clientIds);

  const clientOfficeMap = new Map(clients?.map(c => [c.id, c.office_id]) ?? []);

  for (const record of broken) {
    const correctOfficeId = clientOfficeMap.get(record.client_id);
    if (correctOfficeId) {
      const { error } = await supabase
        .from("attendances")
        .update({ office_id: correctOfficeId })
        .eq("id", record.id);
      if (error) {
        console.error(`Failed to fix ${record.id}:`, error.message);
      } else {
        console.log(`Fixed ${record.id} -> ${correctOfficeId}`);
      }
    }
  }
  console.log("Done!");
}

fix();
