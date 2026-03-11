"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";

const goalCategories = [
  { value: "work", label: "就労" },
  { value: "life_skills", label: "生活スキル" },
  { value: "health", label: "健康" },
  { value: "social", label: "対人関係" },
  { value: "independence", label: "自立" },
  { value: "other", label: "その他" },
];

type GoalInput = {
  goal_category: string;
  goal_description: string;
  support_content: string;
  achievement_criteria: string;
};

type Props = {
  clients: { id: string; family_name: string; given_name: string; client_number: string | null }[];
  officeId: string;
};

export function SupportPlanForm({ clients, officeId }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    client_id: "",
    plan_start_date: new Date().toISOString().split("T")[0],
    plan_end_date: "",
    long_term_goal: "",
    short_term_goal: "",
    support_policy: "",
  });
  const [goals, setGoals] = useState<GoalInput[]>([
    { goal_category: "work", goal_description: "", support_content: "", achievement_criteria: "" },
  ]);

  const addGoal = () => {
    setGoals([...goals, { goal_category: "work", goal_description: "", support_content: "", achievement_criteria: "" }]);
  };

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const updateGoal = (index: number, field: keyof GoalInput, value: string) => {
    setGoals(goals.map((g, i) => (i === index ? { ...g, [field]: value } : g)));
  };

  const handleSubmit = async (status: "draft" | "active") => {
    if (!form.client_id || !form.plan_start_date || !form.plan_end_date) {
      alert("利用者、開始日、終了日は必須です");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();

      // 既存の計画数を取得してplan_numberを決定
      const { count } = await supabase
        .from("individual_support_plans")
        .select("*", { count: "exact", head: true })
        .eq("office_id", officeId)
        .eq("client_id", form.client_id);

      const planNumber = (count ?? 0) + 1;

      const { data: plan, error } = await supabase
        .from("individual_support_plans")
        .insert({
          office_id: officeId,
          client_id: form.client_id,
          plan_number: planNumber,
          plan_start_date: form.plan_start_date,
          plan_end_date: form.plan_end_date,
          long_term_goal: form.long_term_goal || null,
          short_term_goal: form.short_term_goal || null,
          support_policy: form.support_policy || null,
          status,
        })
        .select("id")
        .single();

      if (error) throw error;

      // 目標を保存
      const validGoals = goals.filter((g) => g.goal_description);
      if (validGoals.length > 0 && plan) {
        await supabase.from("support_plan_goals").insert(
          validGoals.map((g, i) => ({
            plan_id: plan.id,
            goal_category: g.goal_category,
            goal_description: g.goal_description,
            support_content: g.support_content || null,
            achievement_criteria: g.achievement_criteria || null,
            sort_order: i,
          }))
        );
      }

      router.push("/support-plans");
      router.refresh();
    } catch (e) {
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/support-plans"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        計画一覧に戻る
      </Link>

      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1">
            <p className="text-xs text-muted-foreground">対象利用者 *</p>
            <select
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">選択してください</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.family_name} {c.given_name}（{c.client_number ?? "-"}）
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">計画開始日 *</p>
            <input
              type="date"
              value={form.plan_start_date}
              onChange={(e) => setForm({ ...form, plan_start_date: e.target.value })}
              className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">計画終了日 *</p>
            <input
              type="date"
              value={form.plan_end_date}
              onChange={(e) => setForm({ ...form, plan_end_date: e.target.value })}
              className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </Card>

      {/* 目標 */}
      <Card>
        <CardHeader>
          <CardTitle>支援方針・目標</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">長期目標</p>
            <textarea
              value={form.long_term_goal}
              onChange={(e) => setForm({ ...form, long_term_goal: e.target.value })}
              placeholder="1年後の到達目標"
              rows={2}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">短期目標</p>
            <textarea
              value={form.short_term_goal}
              onChange={(e) => setForm({ ...form, short_term_goal: e.target.value })}
              placeholder="3〜6ヶ月の到達目標"
              rows={2}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">支援方針</p>
            <textarea
              value={form.support_policy}
              onChange={(e) => setForm({ ...form, support_policy: e.target.value })}
              placeholder="支援のアプローチ方法"
              rows={2}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </Card>

      {/* 個別目標 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>個別目標</CardTitle>
            <Button variant="outline" size="sm" onClick={addGoal}>
              <Plus className="h-4 w-4" />
              目標追加
            </Button>
          </div>
        </CardHeader>
        <div className="space-y-4">
          {goals.map((goal, i) => (
            <div key={i} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">目標 {i + 1}</p>
                {goals.length > 1 && (
                  <button
                    onClick={() => removeGoal(i)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">カテゴリ</p>
                  <select
                    value={goal.goal_category}
                    onChange={(e) => updateGoal(i, "goal_category", e.target.value)}
                    className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {goalCategories.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">達成基準</p>
                  <input
                    type="text"
                    value={goal.achievement_criteria}
                    onChange={(e) => updateGoal(i, "achievement_criteria", e.target.value)}
                    placeholder="具体的な達成基準"
                    className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <p className="text-xs text-muted-foreground">目標内容</p>
                  <textarea
                    value={goal.goal_description}
                    onChange={(e) => updateGoal(i, "goal_description", e.target.value)}
                    placeholder="達成したい目標"
                    rows={2}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <p className="text-xs text-muted-foreground">支援内容</p>
                  <textarea
                    value={goal.support_content}
                    onChange={(e) => updateGoal(i, "support_content", e.target.value)}
                    placeholder="目標達成のための具体的な支援内容"
                    rows={2}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* アクション */}
      <div className="flex justify-end gap-3">
        <Link href="/support-plans">
          <Button variant="outline">キャンセル</Button>
        </Link>
        <Button variant="outline" onClick={() => handleSubmit("draft")} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          下書き保存
        </Button>
        <Button onClick={() => handleSubmit("active")} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          計画を確定
        </Button>
      </div>
    </div>
  );
}
