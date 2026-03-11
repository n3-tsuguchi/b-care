"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AlertItem } from "@/lib/supabase/queries";
import { AlertTriangle, Clock, FileWarning } from "lucide-react";

const alertIcons: Record<string, typeof AlertTriangle> = {
  cert_expiry: AlertTriangle,
  plan_review: Clock,
  billing_deadline: FileWarning,
};

const severityVariants: Record<string, "danger" | "warning" | "default"> = {
  critical: "danger",
  warning: "warning",
  info: "default",
};

const severityLabels: Record<string, string> = {
  critical: "緊急",
  warning: "注意",
  info: "情報",
};

type Props = {
  alerts: AlertItem[];
};

export function AlertsList({ alerts }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>アラート</CardTitle>
          <Badge variant="danger">{alerts.length}件</Badge>
        </div>
      </CardHeader>
      {alerts.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-muted-foreground">
          現在アラートはありません
        </p>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const Icon = alertIcons[alert.type] || AlertTriangle;
            const severity = alert.severity as keyof typeof severityVariants;
            return (
              <div
                key={alert.id}
                className="flex gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
              >
                <div
                  className={`mt-0.5 shrink-0 ${
                    severity === "critical"
                      ? "text-red-500"
                      : "text-amber-500"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {alert.title}
                    </p>
                    <Badge variant={severityVariants[severity] ?? "default"}>
                      {severityLabels[severity] ?? severity}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {alert.message}
                  </p>
                  {alert.due_date && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      期限: {alert.due_date}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
