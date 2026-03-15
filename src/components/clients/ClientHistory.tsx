"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

type Props = {
  clientId: string;
};

type AttendanceHistoryRow = {
  attendance_date: string;
  status: string;
  check_in_time: string | null;
  check_out_time: string | null;
  pickup_outbound: boolean;
  pickup_inbound: boolean;
  meal_provided: boolean;
};

type WageHistoryRow = {
  fiscal_year: number;
  month: number;
  working_days: number;
  total_hours: number;
  base_wage: number;
  piece_wage: number;
  total_wage: number;
  status: string;
};

const statusLabels: Record<string, string> = {
  present: "出席",
  absent: "欠席",
  late: "遅刻",
  early_leave: "早退",
};

const statusColors: Record<string, string> = {
  present: "success",
  absent: "danger",
  late: "warning",
  early_leave: "warning",
};

const wageStatusLabels: Record<string, string> = {
  draft: "下書き",
  confirmed: "確定",
  paid: "支給済",
};

export function ClientHistory({ clientId }: Props) {
  const [activeTab, setActiveTab] = useState<"attendance" | "wage">("attendance");

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={activeTab === "attendance" ? "primary" : "outline"}
          size="sm"
          onClick={() => setActiveTab("attendance")}
        >
          出席履歴
        </Button>
        <Button
          variant={activeTab === "wage" ? "primary" : "outline"}
          size="sm"
          onClick={() => setActiveTab("wage")}
        >
          工賃履歴
        </Button>
      </div>

      {activeTab === "attendance" && <AttendanceHistory clientId={clientId} />}
      {activeTab === "wage" && <WageHistory clientId={clientId} />}
    </div>
  );
}

function AttendanceHistory({ clientId }: { clientId: string }) {
  const [records, setRecords] = useState<AttendanceHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearMonth, setYearMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    const startDate = `${yearMonth.year}-${String(yearMonth.month).padStart(2, "0")}-01`;
    const endDay = new Date(yearMonth.year, yearMonth.month, 0).getDate();
    const endDate = `${yearMonth.year}-${String(yearMonth.month).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;

    supabase
      .from("attendances")
      .select("attendance_date, status, check_in_time, check_out_time, pickup_outbound, pickup_inbound, meal_provided")
      .eq("client_id", clientId)
      .gte("attendance_date", startDate)
      .lte("attendance_date", endDate)
      .order("attendance_date", { ascending: true })
      .returns<AttendanceHistoryRow[]>()
      .then(({ data }) => {
        if (!cancelled) {
          setRecords(data ?? []);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [clientId, yearMonth]);

  const changeMonth = (offset: number) => {
    setYearMonth((prev) => {
      let m = prev.month + offset;
      let y = prev.year;
      if (m > 12) { m = 1; y++; }
      if (m < 1) { m = 12; y--; }
      return { year: y, month: m };
    });
  };

  const presentCount = records.filter((r) =>
    ["present", "late", "early_leave"].includes(r.status)
  ).length;
  const absentCount = records.filter((r) => r.status === "absent").length;

  return (
    <Card className="p-0 overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>出席履歴</CardTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeMonth(-1)}
              className="rounded-lg p-1.5 hover:bg-accent transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              {yearMonth.year}年{yearMonth.month}月
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="rounded-lg p-1.5 hover:bg-accent transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <Badge variant="success">出席 {presentCount}日</Badge>
          <Badge variant="danger">欠席 {absentCount}日</Badge>
          <Badge variant="secondary">合計 {records.length}日</Badge>
        </div>
      </CardHeader>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : records.length === 0 ? (
        <p className="px-6 pb-6 text-sm text-muted-foreground">
          この月の出席記録はありません
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日付</TableHead>
              <TableHead>状態</TableHead>
              <TableHead>入所</TableHead>
              <TableHead>退所</TableHead>
              <TableHead>送迎</TableHead>
              <TableHead>食事</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.attendance_date}>
                <TableCell className="text-sm">
                  {r.attendance_date.split("-")[2]}日
                </TableCell>
                <TableCell>
                  <Badge variant={(statusColors[r.status] ?? "secondary") as "success" | "danger" | "warning" | "secondary"}>
                    {statusLabels[r.status] ?? r.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.check_in_time?.slice(0, 5) ?? "-"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.check_out_time?.slice(0, 5) ?? "-"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {r.pickup_outbound && "往"}
                  {r.pickup_outbound && r.pickup_inbound && " / "}
                  {r.pickup_inbound && "復"}
                  {!r.pickup_outbound && !r.pickup_inbound && "-"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {r.meal_provided ? "あり" : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

function WageHistory({ clientId }: { clientId: string }) {
  const [records, setRecords] = useState<WageHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("monthly_wages")
        .select("fiscal_year, month, working_days, total_hours, base_wage, piece_wage, total_wage, status")
        .eq("client_id", clientId)
        .order("fiscal_year", { ascending: false })
        .order("month", { ascending: false })
        .limit(12)
        .returns<WageHistoryRow[]>();

      setRecords(data ?? []);
      setLoading(false);
    })();
  }, [clientId]);

  const totalWage = records.reduce((sum, r) => sum + r.total_wage, 0);
  const avgWage = records.length > 0 ? Math.round(totalWage / records.length) : 0;

  return (
    <Card className="p-0 overflow-hidden">
      <CardHeader>
        <CardTitle>工賃履歴（直近12ヶ月）</CardTitle>
        {records.length > 0 && (
          <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
            <span>合計: <strong className="text-foreground">{totalWage.toLocaleString()}円</strong></span>
            <span>月平均: <strong className="text-foreground">{avgWage.toLocaleString()}円</strong></span>
          </div>
        )}
      </CardHeader>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : records.length === 0 ? (
        <p className="px-6 pb-6 text-sm text-muted-foreground">
          工賃データがありません
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>年月</TableHead>
              <TableHead className="text-right">出勤日数</TableHead>
              <TableHead className="text-right">作業時間</TableHead>
              <TableHead className="text-right">基本工賃</TableHead>
              <TableHead className="text-right">出来高</TableHead>
              <TableHead className="text-right">合計</TableHead>
              <TableHead>状態</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={`${r.fiscal_year}-${r.month}`}>
                <TableCell className="text-sm">
                  {r.fiscal_year}年{r.month}月
                </TableCell>
                <TableCell className="text-right text-sm">
                  {r.working_days}日
                </TableCell>
                <TableCell className="text-right text-sm">
                  {r.total_hours.toFixed(1)}h
                </TableCell>
                <TableCell className="text-right text-sm">
                  {r.base_wage.toLocaleString()}円
                </TableCell>
                <TableCell className="text-right text-sm">
                  {r.piece_wage > 0 ? `${r.piece_wage.toLocaleString()}円` : "-"}
                </TableCell>
                <TableCell className="text-right text-sm font-medium">
                  {r.total_wage.toLocaleString()}円
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      r.status === "paid"
                        ? "success"
                        : r.status === "confirmed"
                        ? "warning"
                        : "secondary"
                    }
                  >
                    {wageStatusLabels[r.status] ?? r.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
