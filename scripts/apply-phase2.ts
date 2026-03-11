import { readFileSync } from "fs";
import postgres from "postgres";

const env = readFileSync(".env.local", "utf-8");
const vars: Record<string, string> = {};
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) vars[m[1].trim()] = m[2].trim();
}

const supabaseUrl = vars["NEXT_PUBLIC_SUPABASE_URL"];
const projectRef = supabaseUrl.replace("https://", "").replace(".supabase.co", "");
const serviceKey = vars["SUPABASE_SERVICE_ROLE_KEY"];

// Supabase Transaction Pooler connection
const connectionString = `postgresql://postgres.${projectRef}:${serviceKey}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`;

async function apply() {
  const sql = postgres(connectionString, { ssl: "require" });

  try {
    const migration = readFileSync("supabase/migrations/00005_phase2_support.sql", "utf-8");
    await sql.unsafe(migration);
    console.log("Migration applied successfully!");
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message?.includes("already exists")) {
      console.log("Tables already exist, skipping...");
    } else {
      console.error("Migration error:", err.message);
    }
  } finally {
    await sql.end();
  }
}

apply();
