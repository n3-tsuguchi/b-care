import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    // 既存の有効サブスクリプションを確認
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id, status")
      .eq("organization_id", user.organization_id)
      .in("status", ["trialing", "active"])
      .limit(1)
      .single();

    const existingRow = existing as { stripe_customer_id: string; status: string } | null;

    if (existingRow) {
      return NextResponse.json(
        { error: "既にサブスクリプションが有効です" },
        { status: 400 }
      );
    }

    // Stripe Customerを作成 or 再利用
    let customerId: string;
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("organization_id", user.organization_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const subRow = sub as { stripe_customer_id: string } | null;

    if (subRow?.stripe_customer_id) {
      customerId = subRow.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          organization_id: user.organization_id,
          user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    const priceId = process.env.STRIPE_PRICE_ID!;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 30,
        metadata: {
          organization_id: user.organization_id,
        },
      },
      success_url: `${baseUrl}/subscription?status=success`,
      cancel_url: `${baseUrl}/subscription?status=canceled`,
      metadata: {
        organization_id: user.organization_id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
