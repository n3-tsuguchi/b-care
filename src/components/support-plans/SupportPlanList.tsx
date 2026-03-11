"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SupportPlan } from "@/lib/supabase/queries";
import { Plus, FileText, Search } from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "success" | "secondary" | "danger" | "default" }> = {
  draft: { label: "下書き", variant: "secondary" },
  active: { label: "実施中", variant: "success" },
  completed: { label: "完了", variant: "default" },
  cancelled: { label: "中止", variant: "danger" },
};

type Props = {
  plans: SupportPlan[];
};

export function SupportPlanList({ plans }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = plans.filter((p) => {
    const name = `${p.family_name}${p.given_name}`;
    const matchSearch = !search || name.includes(search) || (p.client_number ?? "").includes(search);
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activePlans = plans.filter((p) => p.status === "active").length;
  const draftPlans = plans.filter((p) => p.status === "draft").length;

  return (
    <div className="space-y-4">
      {/* 統計・アクション */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="利用者を検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-lg border border-border bg-card pl-10 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">全てのステータス</option>
            <option value="active">実施中</option>
            <option value="draft">下書き</option>
            <option value="completed">完了</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-2 text-sm">
            <Badge variant="success">実施中 {activePlans}</Badge>
            <Badge variant="secondary">下書き {draftPlans}</Badge>
          </div>
          <Link href="/support-plans/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              新規計画
            </Button>
          </Link>
        </div>
      </div>

      {/* 計画一覧 */}
      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-2 text-muted-foreground">
            {plans.length === 0 ? "個別支援計画がまだありません" : "条件に一致する計画がありません"}
          </p>
          {plans.length === 0 && (
            <Link href="/support-plans/new">
              <Button size="sm" className="mt-4">
                <Plus className="h-4 w-4" />
                最初の計画を作成
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((plan) => {
            const sc = statusConfig[plan.status] ?? statusConfig.draft;
            return (
              <Link key={plan.id} href={`/support-plans/${plan.id}`}>
                <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                        {plan.family_name?.[0] ?? "?"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {plan.family_name} {plan.given_name}
                          </p>
                          <Badge variant={sc.variant}>{sc.label}</Badge>
                          <span className="text-xs text-muted-foreground">
                            第{plan.plan_number}号
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {plan.plan_start_date} 〜 {plan.plan_end_date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {plan.long_term_goal && (
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-[300px]">
                          長期目標: {plan.long_term_goal}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
