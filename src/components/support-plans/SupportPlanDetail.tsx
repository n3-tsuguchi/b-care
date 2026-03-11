"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SupportPlan, SupportPlanGoal } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Edit, CheckCircle, Target, Loader2, Plus, Save } from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; variant: "success" | "secondary" | "danger" | "default" }> = {
  draft: { label: "下書き", variant: "secondary" },
  active: { label: "実施中", variant: "success" },
  completed: { label: "完了", variant: "default" },
  cancelled: { label: "中止", variant: "danger" },
};

const goalCategoryLabels: Record<string, string> = {
  work: "就労",
  life_skills: "生活スキル",
  health: "健康",
  social: "対人関係",
  independence: "自立",
  other: "その他",
};

const goalStatusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "取り組み中", color: "bg-blue-100 text-blue-700" },
  achieved: { label: "達成", color: "bg-green-100 text-green-700" },
  cancelled: { label: "中止", color: "bg-gray-100 text-gray-700" },
};

type Props = {
  plan: SupportPlan | null;
  officeId: string;
};

export function SupportPlanDetail({ plan, officeId }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [review, setReview] = useState({
    review_type: "regular" as string,
    overall_evaluation: "",
    achievements: "",
    challenges: "",
    next_steps: "",
  });

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">支援計画が見つかりません</p>
        <Link href="/support-plans" className="mt-4 text-primary hover:underline">
          計画一覧に戻る
        </Link>
      </div>
    );
  }

  const sc = statusConfig[plan.status] ?? statusConfig.draft;

  const handleStatusChange = async (newStatus: string) => {
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase
        .from("individual_support_plans")
        .update({ status: newStatus })
        .eq("id", plan.id);
      router.refresh();
    } catch {
      alert("更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleGoalStatusChange = async (goalId: string, newStatus: string) => {
    const supabase = createClient();
    await supabase
      .from("support_plan_goals")
      .update({
        status: newStatus,
        achieved_at: newStatus === "achieved" ? new Date().toISOString() : null,
      })
      .eq("id", goalId);
    router.refresh();
  };

  const handleReviewSubmit = async () => {
    if (!review.overall_evaluation) {
      alert("総合評価を入力してください");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase.from("support_plan_reviews").insert({
        plan_id: plan.id,
        review_date: new Date().toISOString().split("T")[0],
        review_type: review.review_type,
        overall_evaluation: review.overall_evaluation,
        achievements: review.achievements || null,
        challenges: review.challenges || null,
        next_steps: review.next_steps || null,
      });
      setShowReviewForm(false);
      setReview({ review_type: "regular", overall_evaluation: "", achievements: "", challenges: "", next_steps: "" });
      router.refresh();
    } catch {
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <Link
          href="/support-plans"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          計画一覧に戻る
        </Link>
        <div className="flex gap-2">
          {plan.status === "draft" && (
            <Button size="sm" onClick={() => handleStatusChange("active")} disabled={saving}>
              <CheckCircle className="h-4 w-4" />
              計画を確定
            </Button>
          )}
          {plan.status === "active" && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowReviewForm(!showReviewForm)}>
                <Edit className="h-4 w-4" />
                レビュー
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleStatusChange("completed")} disabled={saving}>
                完了にする
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ヘッダー */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
            {plan.family_name?.[0] ?? "?"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-foreground">
                {plan.family_name} {plan.given_name}
              </h2>
              <Badge variant={sc.variant}>{sc.label}</Badge>
              <span className="text-sm text-muted-foreground">第{plan.plan_number}号</span>
            </div>
            <p className="text-sm text-muted-foreground">
              計画期間: {plan.plan_start_date} 〜 {plan.plan_end_date}
            </p>
          </div>
        </div>
      </Card>

      {/* 支援方針 */}
      <Card>
        <CardHeader>
          <CardTitle>支援方針・目標</CardTitle>
        </CardHeader>
        <div className="grid gap-4">
          {plan.long_term_goal && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">長期目標</p>
              <p className="text-sm font-medium text-foreground">{plan.long_term_goal}</p>
            </div>
          )}
          {plan.short_term_goal && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">短期目標</p>
              <p className="text-sm font-medium text-foreground">{plan.short_term_goal}</p>
            </div>
          )}
          {plan.support_policy && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">支援方針</p>
              <p className="text-sm font-medium text-foreground">{plan.support_policy}</p>
            </div>
          )}
          {!plan.long_term_goal && !plan.short_term_goal && !plan.support_policy && (
            <p className="text-sm text-muted-foreground">支援方針・目標が未設定です</p>
          )}
        </div>
      </Card>

      {/* 個別目標 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle>個別目標</CardTitle>
          </div>
        </CardHeader>
        {plan.goals && plan.goals.length > 0 ? (
          <div className="space-y-3">
            {plan.goals.map((goal) => {
              const gs = goalStatusConfig[goal.status] ?? goalStatusConfig.active;
              return (
                <div key={goal.id} className="rounded-lg border border-border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{goalCategoryLabels[goal.goal_category] ?? goal.goal_category}</Badge>
                      <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", gs.color)}>
                        {gs.label}
                      </span>
                    </div>
                    {plan.status === "active" && goal.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGoalStatusChange(goal.id, "achieved")}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        達成
                      </Button>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground">{goal.goal_description}</p>
                  {goal.support_content && (
                    <p className="text-xs text-muted-foreground">支援内容: {goal.support_content}</p>
                  )}
                  {goal.achievement_criteria && (
                    <p className="text-xs text-muted-foreground">達成基準: {goal.achievement_criteria}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">個別目標が未設定です</p>
        )}
      </Card>

      {/* レビューフォーム */}
      {showReviewForm && (
        <Card>
          <CardHeader>
            <CardTitle>計画レビュー</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">レビュー種類</p>
              <select
                value={review.review_type}
                onChange={(e) => setReview({ ...review, review_type: e.target.value })}
                className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="regular">定期レビュー</option>
                <option value="interim">中間レビュー</option>
                <option value="final">最終レビュー</option>
              </select>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">総合評価 *</p>
              <textarea
                value={review.overall_evaluation}
                onChange={(e) => setReview({ ...review, overall_evaluation: e.target.value })}
                placeholder="計画全体の評価"
                rows={3}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">成果</p>
                <textarea
                  value={review.achievements}
                  onChange={(e) => setReview({ ...review, achievements: e.target.value })}
                  placeholder="達成できたこと"
                  rows={2}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">課題</p>
                <textarea
                  value={review.challenges}
                  onChange={(e) => setReview({ ...review, challenges: e.target.value })}
                  placeholder="今後の課題"
                  rows={2}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">次のステップ</p>
              <textarea
                value={review.next_steps}
                onChange={(e) => setReview({ ...review, next_steps: e.target.value })}
                placeholder="今後の方針"
                rows={2}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReviewForm(false)}>
                キャンセル
              </Button>
              <Button onClick={handleReviewSubmit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                レビューを保存
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
