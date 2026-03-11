"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import type { WageSummary, AvgWageMonthly } from "@/lib/supabase/queries";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Calculator,
  Download,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Loader2,
  Lock,
  FileText,
  ChevronLeft,
  ChevronRight,
  Target,
} from "lucide-react";

const tabs = [
  { id: "summary", label: "月次サマリー" },
  { id: "detail", label: "利用者別工賃" },
  { id: "avg", label: "平均工賃月額" },
];

type Props = {
  data: WageSummary;
  avgWage: AvgWageMonthly | null;
};

export function WageManagement({ data, avgWage }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("summary");
  const { year, month, totalRevenue, totalExpense, distributable, clientWages } = data;
  const [loading, setLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const hasConfirmed = clientWages.some((w) => w.status === "confirmed" || w.status === "paid");

  // 年月ナビ
  const changeMonth = (offset: number) => {
    let newMonth = month + offset;
    let newYear = year;
    if (newMonth < 1) { newMonth = 12; newYear--; }
    if (newMonth > 12) { newMonth = 1; newYear++; }
    router.push(`/wages?year=${newYear}&month=${newMonth}`);
  };

  // 工賃計算実行
  const calculateWages = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/wages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setMessage(`${result.calculated}名の工賃を計算しました（合計: ${formatCurrency(result.totalWage)}）`);
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "工賃計算に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // 工賃確定
  const confirmWages = async () => {
    if (!confirm("工賃を確定しますか？確定後は再計算できません。")) return;
    setConfirmLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/wages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month, status: "confirmed" }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setMessage("工賃を確定しました");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "確定に失敗しました");
    } finally {
      setConfirmLoading(false);
    }
  };

  // 工賃明細CSVダウンロード
  const downloadWageSheet = () => {
    if (clientWages.length === 0) return;

    const header = "利用者番号,氏名,出勤日数,作業時間,基本工賃,出来高,調整,合計,ステータス";
    const rows = clientWages.map((w) =>
      [
        w.client_number ?? "",
        `${w.family_name}${w.given_name}`,
        w.working_days,
        w.total_hours.toFixed(1),
        w.base_wage,
        w.piece_wage,
        w.adjustment,
        w.total_wage,
        w.status === "confirmed" ? "確定" : w.status === "paid" ? "支払済" : "下書き",
      ].join(",")
    );

    const totalRow = [
      "",
      "合計",
      clientWages.reduce((s, w) => s + w.working_days, 0),
      clientWages.reduce((s, w) => s + w.total_hours, 0).toFixed(1),
      clientWages.reduce((s, w) => s + w.base_wage, 0),
      clientWages.reduce((s, w) => s + w.piece_wage, 0),
      clientWages.reduce((s, w) => s + w.adjustment, 0),
      clientWages.reduce((s, w) => s + w.total_wage, 0),
      "",
    ].join(",");

    const csv = "\uFEFF" + [header, ...rows, totalRow].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wage_detail_${year}${String(month).padStart(2, "0")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 工賃明細書PDF（個別）
  const downloadWagePdf = async (clientId: string) => {
    const url = `/api/pdf/wage-statement?year=${year}&month=${month}&clientId=${clientId}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 工賃支払台帳PDF
  const downloadWageLedgerPdf = () => {
    const a = document.createElement("a");
    a.href = `/api/pdf/wage-ledger?year=${year}&month=${month}`;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 報酬区分の推定
  const getRewardTier = (avg: number) => {
    if (avg >= 45000) return "4万5千円以上";
    if (avg >= 35000) return "3万5千円以上4万5千円未満";
    if (avg >= 25000) return "2万5千円以上3万5千円未満";
    if (avg >= 15000) return "1万5千円以上2万5千円未満";
    if (avg >= 10000) return "1万円以上1万5千円未満";
    if (avg >= 5000) return "5千円以上1万円未満";
    return "5千円未満";
  };

  return (
    <div className="space-y-6">
      {/* 年月選択 */}
      <div className="flex items-center gap-3">
        <button
          className="rounded-lg p-2 hover:bg-accent transition-colors"
          onClick={() => changeMonth(-1)}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-bold text-foreground">
          {year}年{month}月
        </h2>
        <button
          className="rounded-lg p-2 hover:bg-accent transition-colors"
          onClick={() => changeMonth(1)}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* メッセージ */}
      {message && (
        <Card className="border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-700">{message}</p>
        </Card>
      )}

      {/* 月次サマリーカード */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">生産活動収入</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div className="rounded-lg bg-green-50 p-2.5 text-green-600">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">生産活動経費</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(totalExpense)}
              </p>
            </div>
            <div className="rounded-lg bg-red-50 p-2.5 text-red-600">
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">分配可能額</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(distributable)}
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* タブ */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 pb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={calculateWages}
            disabled={loading || hasConfirmed}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Calculator className="h-4 w-4" />
            )}
            工賃計算実行
          </Button>
          {clientWages.length > 0 && !hasConfirmed && (
            <Button
              size="sm"
              onClick={confirmWages}
              disabled={confirmLoading}
            >
              {confirmLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              工賃確定
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={downloadWageSheet}
            disabled={clientWages.length === 0}
          >
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadWageLedgerPdf}
            disabled={clientWages.length === 0}
          >
            <FileText className="h-4 w-4" />
            工賃支払台帳
          </Button>
        </div>
      </div>

      {/* 利用者別工賃テーブル */}
      {activeTab === "detail" && (
        <Card className="p-0 overflow-hidden">
          {clientWages.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              工賃データがありません。「工賃計算実行」をクリックして出席データから工賃を計算してください。
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>利用者番号</TableHead>
                  <TableHead>氏名</TableHead>
                  <TableHead className="text-right">出勤日数</TableHead>
                  <TableHead className="text-right">作業時間</TableHead>
                  <TableHead className="text-right">基本工賃</TableHead>
                  <TableHead className="text-right">出来高</TableHead>
                  <TableHead className="text-right">合計</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientWages.map((wage) => (
                  <TableRow key={wage.id}>
                    <TableCell className="font-mono text-xs">
                      {wage.client_number ?? "-"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {wage.family_name} {wage.given_name}
                    </TableCell>
                    <TableCell className="text-right">
                      {wage.working_days}日
                    </TableCell>
                    <TableCell className="text-right">
                      {wage.total_hours.toFixed(1)}h
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(wage.base_wage)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(wage.piece_wage)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(wage.total_wage)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          wage.status === "confirmed"
                            ? "success"
                            : wage.status === "paid"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {wage.status === "confirmed" ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            確定
                          </span>
                        ) : wage.status === "paid" ? (
                          "支払済"
                        ) : (
                          "下書き"
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => downloadWagePdf(wage.client_id)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="工賃明細書PDF"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
                {/* 合計行 */}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell />
                  <TableCell>合計</TableCell>
                  <TableCell className="text-right">
                    {clientWages.reduce((s, w) => s + w.working_days, 0)}日
                  </TableCell>
                  <TableCell className="text-right">
                    {clientWages.reduce((s, w) => s + w.total_hours, 0).toFixed(1)}h
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(clientWages.reduce((s, w) => s + w.base_wage, 0))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(clientWages.reduce((s, w) => s + w.piece_wage, 0))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(clientWages.reduce((s, w) => s + w.total_wage, 0))}
                  </TableCell>
                  <TableCell />
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {activeTab === "summary" && (
        <Card>
          <CardHeader>
            <CardTitle>生産活動収支内訳</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">収入合計</span>
                <span className="font-medium">
                  {formatCurrency(totalRevenue)}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full w-full rounded-full bg-green-500" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">経費合計</span>
                <span className="font-medium">
                  {formatCurrency(totalExpense)}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-red-400"
                  style={{
                    width: `${totalRevenue > 0 ? (totalExpense / totalRevenue) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">工賃支払総額</span>
                <span className="font-medium">
                  {formatCurrency(clientWages.reduce((s, w) => s + w.total_wage, 0))}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-blue-400"
                  style={{
                    width: `${distributable > 0 ? (clientWages.reduce((s, w) => s + w.total_wage, 0) / distributable) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">
                  工賃として分配可能な額
                </span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(distributable)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                生産活動収入 − 生産活動経費 = 工賃原資（原則として全額を利用者に分配）
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 平均工賃月額タブ */}
      {activeTab === "avg" && (
        <div className="space-y-4">
          {avgWage ? (
            <>
              {/* 現在の平均工賃月額 */}
              <Card className="border-primary/20 bg-primary/5 p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {avgWage.fiscalYear}年度 平均工賃月額（{avgWage.monthsElapsed}ヶ月経過時点）
                    </p>
                    <p className="text-3xl font-bold text-primary">
                      {formatCurrency(avgWage.currentAvgWageMonthly)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">推定報酬区分</p>
                    <p className="text-sm font-semibold text-foreground">
                      {getRewardTier(avgWage.currentAvgWageMonthly)}
                    </p>
                  </div>
                </div>
              </Card>

              {/* サマリー */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="p-4">
                  <p className="text-xs text-muted-foreground">年度累計工賃支払額</p>
                  <p className="text-xl font-bold">{formatCurrency(avgWage.totalWagePaid)}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-muted-foreground">平均利用者数</p>
                  <p className="text-xl font-bold">{avgWage.avgDailyUsers.toFixed(1)}名</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-muted-foreground">集計月数</p>
                  <p className="text-xl font-bold">{avgWage.monthsElapsed}ヶ月</p>
                </Card>
              </div>

              {/* 月別推移 */}
              <Card className="p-0 overflow-hidden">
                <div className="border-b border-border p-4">
                  <h3 className="font-semibold text-foreground">月別推移</h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>月</TableHead>
                      <TableHead className="text-right">工賃支払額</TableHead>
                      <TableHead className="text-right">利用者数</TableHead>
                      <TableHead className="text-right">1人あたり平均</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {avgWage.monthlyBreakdown.map((m) => (
                      <TableRow key={m.month}>
                        <TableCell className="font-medium">{m.month}月</TableCell>
                        <TableCell className="text-right">{formatCurrency(m.totalWage)}</TableCell>
                        <TableCell className="text-right">{m.userCount}名</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(m.avg)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>

              <Card className="p-4">
                <p className="text-xs text-muted-foreground">
                  ※ 平均工賃月額 = 年度累計工賃支払総額 ÷ 平均利用者数 ÷ 経過月数で算出しています。
                  翌年度の報酬区分はこの値に基づいて決定されます。
                </p>
              </Card>
            </>
          ) : (
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">
                当年度の工賃データがありません。工賃計算を実行すると平均工賃月額が表示されます。
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
