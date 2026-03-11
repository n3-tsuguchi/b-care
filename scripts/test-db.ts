import { readFileSync } from "fs";
import postgres from "postgres";

const env = readFileSync(".env.local", "utf-8");
const vars: Record<string, string> = {};
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) vars[m[1].trim()] = m[2].trim();
}

const projectRef = vars["NEXT_PUBLIC_SUPABASE_URL"].replace("https://", "").replace(".supabase.co", "");
const pw = vars["SUPABASE_SERVICE_ROLE_KEY"];

// Try direct connection (port 5432) instead of pooler
const directUrl = `postgresql://postgres:${pw}@db.${projectRef}.supabase.co:5432/postgres`;

async function test() {
  console.log("Connecting to:", `db.${projectRef}.supabase.co:5432`);
  const sql = postgres(directUrl, { ssl: "require", connect_timeout: 10 });
  try {
    const r = await sql`SELECT 1 as ok`;
    console.log("Connected!", r);
  } catch (e: unknown) {
    console.log("Direct failed:", (e as Error).message);

    // Try pooler with password as database password
    const poolerUrl = `postgresql://postgres.${projectRef}:${pw}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`;
    console.log("\nTrying session pooler (5432)...");
    const sql2 = postgres(poolerUrl, { ssl: "require", connect_timeout: 10 });
    try {
      const r2 = await sql2`SELECT 1 as ok`;
      console.log("Pooler connected!", r2);
      await sql2.end();
    } catch (e2: unknown) {
      console.log("Pooler failed:", (e2 as Error).message);
      await sql2.end();
    }
  } finally {
    await sql.end();
  }
}

test();
