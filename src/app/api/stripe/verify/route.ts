import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createClient } from "@supabase/supabase-js";

/**
 * Checkout完了後にクライアントから呼ばれ、
 * Stripeのサブスクリプション状態をDBに同期する。
 * Webhookが届かないローカル開発でも動作する。
 */
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // サービスロールでDB操作（RLSバイパス）
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // メールで全顧客を検索し、サブスクリプションがある顧客を見つける
    const customersByEmail = await stripe.customers.list({
      email: user.email,
      limit: 10,
    });

    let foundCustomer;
    let foundSub;

    for (const c of customersByEmail.data) {
      const subs = await stripe.subscriptions.list({
        customer: c.id,
        limit: 1,
      });
      if (subs.data.length > 0) {
        foundCustomer = c;
        foundSub = subs.data[0];
        break;
      }
    }

    if (!foundCustomer || !foundSub) {
      return NextResponse.json({ error: "サブスクリプションが見つかりません" }, { status: 404 });
    }

    const item = foundSub.items.data[0];

    await supabase.from("subscriptions").upsert(
      {
        organization_id: user.organization_id,
        stripe_customer_id: foundCustomer.id,
        stripe_subscription_id: foundSub.id,
        status: foundSub.status,
        price_id: item?.price.id ?? null,
        current_period_start: item
          ? new Date(item.current_period_start * 1000).toISOString()
          : null,
        current_period_end: item
          ? new Date(item.current_period_end * 1000).toISOString()
          : null,
        cancel_at_period_end: foundSub.cancel_at_period_end,
        trial_end: foundSub.trial_end
          ? new Date(foundSub.trial_end * 1000).toISOString()
          : null,
      },
      { onConflict: "stripe_customer_id" }
    );

    return NextResponse.json({ status: foundSub.status });
  } catch (err) {
    console.error("Stripe verify error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
