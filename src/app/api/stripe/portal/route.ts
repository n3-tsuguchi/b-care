import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("organization_id", user.organization_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const subRow = sub as { stripe_customer_id: string } | null;

  if (!subRow?.stripe_customer_id) {
    return NextResponse.json(
      { error: "サブスクリプションが見つかりません" },
      { status: 404 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: subRow.stripe_customer_id,
    return_url: `${baseUrl}/subscription`,
  });

  return NextResponse.json({ url: session.url });
}
