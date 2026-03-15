import { getCurrentUser } from "./supabase/auth";
import { createClient } from "@supabase/supabase-js";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "paused"
  | "none";

export type SubscriptionInfo = {
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  stripeCustomerId: string | null;
};

type SubscriptionRow = {
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_end: string | null;
  stripe_customer_id: string;
};

/**
 * サーバー側でサブスクリプション状態を取得
 * サービスロールキーを使用してRLSをバイパス
 */
export async function getSubscription(): Promise<SubscriptionInfo> {
  const user = await getCurrentUser();
  if (!user) {
    return { status: "none", currentPeriodEnd: null, cancelAtPeriodEnd: false, trialEnd: null, stripeCustomerId: null };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from("subscriptions")
    .select("status, current_period_end, cancel_at_period_end, trial_end, stripe_customer_id")
    .eq("organization_id", user.organization_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const row = data as SubscriptionRow | null;

  if (!row) {
    return { status: "none", currentPeriodEnd: null, cancelAtPeriodEnd: false, trialEnd: null, stripeCustomerId: null };
  }

  return {
    status: row.status as SubscriptionStatus,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    trialEnd: row.trial_end,
    stripeCustomerId: row.stripe_customer_id,
  };
}

/**
 * サブスクリプションが有効か判定
 */
export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return status === "trialing" || status === "active";
}
