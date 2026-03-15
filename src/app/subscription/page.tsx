"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CreditCard, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

type SubStatus = {
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  isActive: boolean;
};

export default function SubscriptionPage() {
  const searchParams = useSearchParams();
  const urlStatus = searchParams.get("status");

  const [sub, setSub] = useState<SubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadStatus() {
      // Checkout成功後はStripeからDB同期を実行
      if (urlStatus === "success") {
        await fetch("/api/stripe/verify", { method: "POST" });
      }
      const res = await fetch("/api/stripe/status");
      const data = await res.json();
      setSub(data);
      setLoading(false);
    }
    loadStatus();
  }, [urlStatus]);

  const handleSubscribe = async () => {
    setActionLoading(true);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error || "エラーが発生しました");
      setActionLoading(false);
    }
  };

  const handleManage = async () => {
    setActionLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error || "エラーが発生しました");
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statusLabel: Record<string, { text: string; color: string }> = {
    trialing: { text: "無料トライアル中", color: "text-blue-600 bg-blue-50" },
    active: { text: "有効", color: "text-green-600 bg-green-50" },
    past_due: { text: "支払い遅延", color: "text-yellow-600 bg-yellow-50" },
    canceled: { text: "解約済み", color: "text-gray-600 bg-gray-50" },
    none: { text: "未登録", color: "text-gray-600 bg-gray-50" },
  };

  const currentStatus = statusLabel[sub?.status ?? "none"] ?? statusLabel.none;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">サブスクリプション管理</h1>

      {/* Checkout後のステータスメッセージ */}
      {urlStatus === "success" && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
          <CheckCircle className="h-5 w-5" />
          <span>サブスクリプションの登録が完了しました。</span>
        </div>
      )}
      {urlStatus === "canceled" && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
          <AlertTriangle className="h-5 w-5" />
          <span>登録がキャンセルされました。</span>
        </div>
      )}

      {/* プラン情報カード */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold mb-1">B-Care スタンダードプラン</h2>
            <p className="text-muted-foreground text-sm">
              就労継続支援B型 請求・経理管理システム
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${currentStatus.color}`}
          >
            {currentStatus.text}
          </span>
        </div>

        {/* 価格 */}
        <div className="mb-6 pb-6 border-b border-border">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">¥3,980</span>
            <span className="text-muted-foreground">/月（税抜）</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">初月30日間無料</p>
        </div>

        {/* サブスクリプション詳細 */}
        {sub?.isActive && (
          <div className="mb-6 space-y-2 text-sm">
            {sub.status === "trialing" && sub.trialEnd && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">トライアル終了日</span>
                <span className="font-medium">
                  {new Date(sub.trialEnd).toLocaleDateString("ja-JP")}
                </span>
              </div>
            )}
            {sub.currentPeriodEnd && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">次回請求日</span>
                <span className="font-medium">
                  {new Date(sub.currentPeriodEnd).toLocaleDateString("ja-JP")}
                </span>
              </div>
            )}
            {sub.cancelAtPeriodEnd && (
              <div className="flex items-center gap-2 mt-2 rounded-lg bg-yellow-50 p-3 text-yellow-800 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>
                  期間終了後に解約されます（
                  {sub.currentPeriodEnd &&
                    new Date(sub.currentPeriodEnd).toLocaleDateString("ja-JP")}
                  まで利用可能）
                </span>
              </div>
            )}
          </div>
        )}

        {/* 機能一覧 */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3">含まれる機能</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              "利用者管理",
              "出席管理・記録",
              "支援記録・個別支援計画",
              "工賃計算・管理",
              "国保連請求（CSV出力）",
              "PDF帳票出力",
              "ダッシュボード・アラート",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* アクションボタン */}
        {sub?.isActive ? (
          <button
            onClick={handleManage}
            disabled={actionLoading}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            支払い方法・プランを管理
          </button>
        ) : (
          <button
            onClick={handleSubscribe}
            disabled={actionLoading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            30日間無料で始める
          </button>
        )}
      </div>
    </div>
  );
}
