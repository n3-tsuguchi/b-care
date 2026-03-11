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
import { formatCurrency, cn } from "@/lib/utils";
import {
  Calendar,
  CheckCircle2,
  Sparkles,
  Download,
  FileText,
  Loader2,
  AlertTriangle,
  XCircle,
  Info,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

type CheckResult = {
  severity: "error" | "warning" | "info";
  clientId?: string;
  clientName?: string;
  message: string;
  field?: string;
};

type ValidationWarning = {
  severity: "error" | "warning";
  clientId: string;
  clientName?: string;
  message: string;
};

type BillingResult = {
  batchId: string;
  clientCount: number;
  totalUnits: number;
  totalAmount: number;
  totalCopay: number;
  validationWarnings?: ValidationWarning[];
};

type AiCheckResult = {
  status: string;
  errorCount: number;
  warningCount: number;
  results: CheckResult[];
};

type InvoiceResult = {
  count: number;
  totalAmount: number;
};

const steps = [
  { id: 1, label: "対象月選択", icon: Calendar },
  { id: 2, label: "実績確認", icon: CheckCircle2 },
  { id: 3, label: "AIチェック", icon: Sparkles },
  { id: 4, label: "CSV出力", icon: Download },
  { id: 5, label: "利用者請求書", icon: FileText },
];

export function BillingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: 対象月
  const now = new Date();
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const [year, setYear] = useState(prevYear);
  const [month, setMonth] = useState(prevMonth);

  // Step 2: 請求データ作成結果
  const [billingResult, setBillingResult] = useState<BillingResult | null>(null);

  // Step 3: AIチェック結果
  const [aiCheckResult, setAiCheckResult] = useState<AiCheckResult | null>(null);

  // Step 5: 請求書生成結果
  const [invoiceResult, setInvoiceResult] = useState<InvoiceResult | null>(null);

  // Step 2: 請求データ作成
  const createBilling = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBillingResult(data);
      setCurrentStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "請求データの作成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: AIチェック実行
  const runAiCheck = async () => {
    if (!billingResult?.batchId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/ai-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: billingResult.batchId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAiCheckResult(data);
      setCurrentStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AIチェックに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // Step 4: CSV出力
  const exportCsv = async () => {
    if (!billingResult?.batchId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: billingResult.batchId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `billing_${year}${String(month).padStart(2, "0")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setCurrentStep(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : "CSV出力に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // Step 5: 利用者請求書生成
  const generateInvoices = async () => {
    if (!billingResult?.batchId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: billingResult.batchId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInvoiceResult(data);
      setCurrentStep(5);
    } catch (e) {
      setError(e instanceof Error ? e.message : "請求書の生成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const severityConfig = {
    error: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", label: "エラー" },
    warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", label: "警告" },
    info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50", label: "情報" },
  };

  return (
    <div className="space-y-6">
      {/* ステップインジケーター */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                    currentStep >= step.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {currentStep > step.id ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    "whitespace-nowrap text-xs font-medium",
                    currentStep >= step.id
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "mt-[-18px] h-[2px] w-12 transition-colors",
                    currentStep > step.id ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* エラー表示 */}
      {error && (
        <Card className="border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-red-700">
            <XCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      )}

      {/* Step 1: 対象月選択 */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>対象月を選択</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              請求データを作成する対象月を選択してください。出席データが登録されている月を選んでください。
            </p>
            <div className="flex items-center gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">年</label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
                >
                  {Array.from({ length: 3 }, (_, i) => now.getFullYear() - i).map(
                    (y) => (
                      <option key={y} value={y}>
                        {y}年
                      </option>
                    )
                  )}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">月</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {m}月
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button onClick={createBilling} disabled={loading} size="lg">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              請求データ作成
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: 実績確認 */}
      {currentStep === 2 && billingResult && (
        <Card>
          <CardHeader>
            <CardTitle>実績確認</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 p-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <p className="font-medium">
                  請求データを作成しました
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">対象利用者数</p>
                <p className="text-2xl font-bold">{billingResult.clientCount}名</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">合計単位数</p>
                <p className="text-2xl font-bold">
                  {billingResult.totalUnits.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">請求金額</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(billingResult.totalAmount)}
                </p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">利用者負担</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(billingResult.totalCopay)}
                </p>
              </div>
            </div>

            {/* 事前バリデーション警告 */}
            {billingResult.validationWarnings && billingResult.validationWarnings.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">事前チェック結果</p>
                {billingResult.validationWarnings.map((w, i) => {
                  const isError = w.severity === "error";
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex items-start gap-3 rounded-lg p-3",
                        isError ? "bg-red-50" : "bg-amber-50"
                      )}
                    >
                      {isError ? (
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                      ) : (
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      )}
                      <div className="text-sm">
                        {w.clientName && (
                          <span className="mr-2 font-medium">{w.clientName}:</span>
                        )}
                        <span>{w.message}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
              >
                <ArrowLeft className="h-4 w-4" />
                戻る
              </Button>
              <Button onClick={runAiCheck} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                AIチェックを実行
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: AIチェック結果 */}
      {currentStep === 3 && aiCheckResult && (
        <Card>
          <CardHeader>
            <CardTitle>AIチェック結果</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            {/* サマリー */}
            <div className="flex gap-3">
              {aiCheckResult.errorCount > 0 && (
                <Badge variant="danger">
                  エラー {aiCheckResult.errorCount}件
                </Badge>
              )}
              {aiCheckResult.warningCount > 0 && (
                <Badge variant="warning">
                  警告 {aiCheckResult.warningCount}件
                </Badge>
              )}
              {aiCheckResult.errorCount === 0 && aiCheckResult.warningCount === 0 && (
                <Badge variant="success">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  問題なし
                </Badge>
              )}
            </div>

            {/* チェック結果一覧 */}
            {aiCheckResult.results.length > 0 && (
              <div className="space-y-2">
                {aiCheckResult.results.map((result, i) => {
                  const config = severityConfig[result.severity];
                  const Icon = config.icon;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex items-start gap-3 rounded-lg p-3",
                        config.bg
                      )}
                    >
                      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", config.color)} />
                      <div>
                        {result.clientName && (
                          <span className="mr-2 text-sm font-medium">
                            {result.clientName}:
                          </span>
                        )}
                        <span className="text-sm">{result.message}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {aiCheckResult.errorCount === 0 && (
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-sm text-green-700">
                  エラーはありません。CSV出力に進むことができます。
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
              >
                <ArrowLeft className="h-4 w-4" />
                戻る
              </Button>
              <Button
                onClick={exportCsv}
                disabled={loading || aiCheckResult.errorCount > 0}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                CSV出力
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 4: CSV出力完了 */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>CSV出力完了</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 p-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <p className="font-medium">
                  CSVファイルをダウンロードしました
                </p>
              </div>
              <p className="mt-2 text-sm text-green-600">
                ダウンロードしたCSVファイルを国保連の伝送システムにアップロードしてください。
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={exportCsv} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                再ダウンロード
              </Button>
              <Button onClick={generateInvoices} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                利用者請求書を生成
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 5: 利用者請求書 */}
      {currentStep === 5 && invoiceResult && (
        <Card>
          <CardHeader>
            <CardTitle>利用者請求書の生成完了</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 p-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <p className="font-medium">
                  {invoiceResult.count}件の利用者請求書を生成しました
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">請求書件数</p>
                <p className="text-2xl font-bold">{invoiceResult.count}件</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">利用者負担合計</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(invoiceResult.totalAmount)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => router.push("/billing")}>
                <ArrowLeft className="h-4 w-4" />
                請求管理に戻る
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (!billingResult?.batchId) return;
                  const a = document.createElement("a");
                  a.href = `/api/pdf/invoice?batchId=${billingResult.batchId}`;
                  a.download = "";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
              >
                <FileText className="h-4 w-4" />
                請求書PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentStep(1);
                  setBillingResult(null);
                  setAiCheckResult(null);
                  setInvoiceResult(null);
                  setError(null);
                }}
              >
                新しい請求データを作成
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
