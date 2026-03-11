"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DashboardStats } from "@/lib/supabase/queries";
import { Target, AlertTriangle, FileCheck } from "lucide-react";

type Props = {
  plans: DashboardStats["supportPlans"];
  certificates: DashboardStats["certificates"];
};

export function SupportPlanSummary({ plans, certificates }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <CardTitle>支援計画・受給者証</CardTitle>
        </div>
      </CardHeader>
      <div className="space-y-4">
        {/* 支援計画 */}
        <div className="flex flex-wrap gap-4">
          <Link href="/support-plans" className="flex items-center gap-2 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors flex-1 min-w-[140px]">
            <div className="rounded-lg bg-green-50 p-2 text-green-600">
              <FileCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">実施中の計画</p>
              <p className="text-lg font-bold text-foreground">{plans.active}件</p>
            </div>
          </Link>
          {plans.expiringSoon > 0 && (
            <Link href="/support-plans" className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3 hover:bg-amber-50 transition-colors flex-1 min-w-[140px]">
              <div className="rounded-lg bg-amber-100 p-2 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-amber-700">30日以内に終了</p>
                <p className="text-lg font-bold text-amber-700">{plans.expiringSoon}件</p>
              </div>
            </Link>
          )}
          {plans.needsReview > 0 && (
            <Link href="/support-plans" className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/50 p-3 hover:bg-blue-50 transition-colors flex-1 min-w-[140px]">
              <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-blue-700">下書き</p>
                <p className="text-lg font-bold text-blue-700">{plans.needsReview}件</p>
              </div>
            </Link>
          )}
        </div>

        {/* 受給者証アラート */}
        {certificates.expiringSoon.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-sm font-medium text-red-700">受給者証 期限切れ間近</p>
              <Badge variant="danger">{certificates.expiringSoon.length}件</Badge>
            </div>
            <div className="space-y-1">
              {certificates.expiringSoon.map((cert, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-red-700">{cert.clientName}</span>
                  <span className="text-red-600">{cert.endDate} まで</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {plans.active === 0 && plans.needsReview === 0 && certificates.expiringSoon.length === 0 && (
          <p className="text-sm text-muted-foreground">特に対応が必要な項目はありません</p>
        )}
      </div>
    </Card>
  );
}
