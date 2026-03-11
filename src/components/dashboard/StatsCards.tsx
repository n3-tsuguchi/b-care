"use client";

import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { DashboardStats } from "@/lib/supabase/queries";
import {
  FileText,
  CalendarCheck,
  Coins,
  Users,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

type Props = {
  stats: DashboardStats | null;
};

export function StatsCards({ stats }: Props) {
  const s = stats ?? {
    billing: { currentMonth: 0, previousMonth: 0, changePercent: 0 },
    attendance: { today: 0, capacity: 20, monthlyRate: 0 },
    wage: { currentMonth: 0, avgPerPerson: 0 },
    clients: { active: 0, new: 0 },
  };

  const cards = [
    {
      title: "今月の請求予定額",
      value: formatCurrency(s.billing.currentMonth),
      change: s.billing.changePercent >= 0
        ? `前月比 +${s.billing.changePercent}%`
        : `前月比 ${s.billing.changePercent}%`,
      trend: s.billing.changePercent >= 0 ? ("up" as const) : ("down" as const),
      icon: FileText,
      color: "text-blue-600 bg-blue-50",
    },
    {
      title: "本日の出席者数",
      value: `${s.attendance.today} / ${s.attendance.capacity}名`,
      change: `月間出席率 ${s.attendance.monthlyRate}%`,
      trend: "up" as const,
      icon: CalendarCheck,
      color: "text-green-600 bg-green-50",
    },
    {
      title: "今月の工賃支払予定",
      value: formatCurrency(s.wage.currentMonth),
      change: `平均 ${formatCurrency(s.wage.avgPerPerson)}/人`,
      trend: "up" as const,
      icon: Coins,
      color: "text-amber-600 bg-amber-50",
    },
    {
      title: "利用者数",
      value: `${s.clients.active}名`,
      change: `今月 +${s.clients.new}名`,
      trend: "up" as const,
      icon: Users,
      color: "text-purple-600 bg-purple-50",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((stat) => (
        <Card key={stat.title} className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <div className="flex items-center gap-1 text-xs">
                {stat.trend === "up" ? (
                  <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                )}
                <span className="text-muted-foreground">{stat.change}</span>
              </div>
            </div>
            <div className={`rounded-lg p-2.5 ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
