"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { MonthlyWageTrendItem } from "@/lib/supabase/queries";
import { formatCurrency } from "@/lib/utils";

type Props = {
  data: MonthlyWageTrendItem[];
};

export function WageTrend({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>平均工賃月額の推移</CardTitle>
        </CardHeader>
        <p className="px-4 pb-4 text-sm text-muted-foreground">
          工賃データがありません
        </p>
      </Card>
    );
  }

  const maxWage = Math.max(...data.map((d) => d.avg));
  const minWage = Math.min(...data.map((d) => d.avg));
  const range = maxWage - minWage || 1;

  const currentAvg = data[data.length - 1].avg;

  const getRewardTier = (avg: number) => {
    if (avg >= 45000) return "4万5千円以上";
    if (avg >= 30000) return "3万円以上4万5千円未満";
    if (avg >= 15000) return "1万5千円以上3万円未満";
    if (avg >= 10000) return "1万円以上1万5千円未満";
    return "1万円未満";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>平均工賃月額の推移</CardTitle>
            <CardDescription>
              現在の報酬区分: {getRewardTier(currentAvg)}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(currentAvg)}
            </p>
            <p className="text-xs text-muted-foreground">直近月の平均工賃</p>
          </div>
        </div>
      </CardHeader>

      <div className="flex items-end gap-3 pt-4" style={{ height: 160 }}>
        {data.map((d) => {
          const height = ((d.avg - minWage + range * 0.1) / (range * 1.2)) * 100;
          const monthLabel = d.month.split("-")[1] + "月";

          return (
            <div key={d.month} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-xs font-medium text-foreground">
                {formatCurrency(d.avg)}
              </span>
              <div className="w-full max-w-[60px]">
                <div
                  className="w-full rounded-t-lg bg-primary/80 transition-all hover:bg-primary"
                  style={{ height: `${height}px` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{monthLabel}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-6 space-y-2 border-t border-border pt-4">
        <p className="text-xs font-medium text-muted-foreground">報酬区分の目安</p>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "1万円未満", color: "bg-red-200" },
            { label: "1万〜1.5万", color: "bg-amber-200" },
            { label: "1.5万〜3万", color: "bg-green-200" },
            { label: "3万〜4.5万", color: "bg-blue-200" },
            { label: "4.5万以上", color: "bg-purple-200" },
          ].map((tier) => (
            <span key={tier.label} className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className={`h-2.5 w-2.5 rounded-sm ${tier.color}`} />
              {tier.label}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
