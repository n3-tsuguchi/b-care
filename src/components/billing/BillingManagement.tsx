"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { billingStatusLabels } from "@/lib/constants";
import type { BillingBatch } from "@/lib/supabase/queries";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  FileDown,
  Sparkles,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  CircleDollarSign,
} from "lucide-react";

const statusIcons: Record<string, typeof CheckCircle2> = {
  draft: Clock,
  checked: CheckCircle2,
  exported: FileDown,
  submitted: FileText,
  paid: CircleDollarSign,
  returned: AlertCircle,
};

const statusVariants: Record<
  string,
  "default" | "success" | "warning" | "danger" | "secondary"
> = {
  draft: "secondary",
  checked: "default",
  exported: "default",
  submitted: "warning",
  paid: "success",
  returned: "danger",
};

type Props = {
  batches: BillingBatch[];
};

export function BillingManagement({ batches }: Props) {
  return (
    <div className="space-y-6">
      {/* 請求ウィザードCTA */}
      <Card className="border-primary/20 bg-primary/5 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              新しい請求データを作成
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              出席データから自動で請求データを生成し、AIが提出前にエラーチェックを行います
            </p>
          </div>
          <a
            href="/billing/new"
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-base font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-5 w-5" />
            請求データ作成
          </a>
        </div>
      </Card>

      {/* 請求フロー */}
      <Card>
        <CardHeader>
          <CardTitle>請求ワークフロー</CardTitle>
        </CardHeader>
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
          {[
            { step: 1, label: "対象月選択", icon: "📅" },
            { step: 2, label: "実績確認", icon: "✅" },
            { step: 3, label: "AIチェック", icon: "🤖" },
            { step: 4, label: "CSV出力", icon: "📤" },
            { step: 5, label: "利用者請求書", icon: "📄" },
          ].map((item, i) => (
            <div key={item.step} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-lg">
                  {item.icon}
                </div>
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {item.label}
                </span>
              </div>
              {i < 4 && (
                <div className="mt-[-18px] h-[2px] w-8 bg-border" />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* AIチェック機能 */}
      <Card className="border-amber-200 bg-amber-50/50 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-100 p-2 text-amber-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-medium text-foreground">AI請求チェック</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              AIが請求データを自動分析し、加算要件の未充足、日数超過、受給者証の不整合などのエラーを事前に検出します。返戻リスクを大幅に削減できます。
            </p>
          </div>
        </div>
      </Card>

      {/* 請求履歴 */}
      <Card className="p-0 overflow-hidden">
        <div className="border-b border-border p-4">
          <h3 className="font-semibold text-foreground">請求履歴</h3>
        </div>
        {batches.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            請求データがありません
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>対象年月</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead className="text-right">合計単位数</TableHead>
                <TableHead className="text-right">請求金額</TableHead>
                <TableHead className="text-right">利用者負担</TableHead>
                <TableHead className="text-right">入金額</TableHead>
                <TableHead>提出日</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => {
                const StatusIcon = statusIcons[batch.status] || Clock;
                return (
                  <TableRow key={batch.id} className="cursor-pointer">
                    <TableCell className="font-medium">
                      {batch.target_year}年{batch.target_month}月
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[batch.status] ?? "secondary"}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {billingStatusLabels[batch.status] ?? batch.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {batch.total_units.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(batch.total_amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(batch.total_copay)}
                    </TableCell>
                    <TableCell className="text-right">
                      {batch.paid_amount
                        ? formatCurrency(batch.paid_amount)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {batch.submitted_at ?? "-"}
                    </TableCell>
                    <TableCell>
                      {["exported", "submitted", "paid"].includes(batch.status) && (
                        <a
                          href={`/api/pdf/invoice?batchId=${batch.id}`}
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground inline-flex"
                          title="請求書PDF"
                        >
                          <FileText className="h-4 w-4" />
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
