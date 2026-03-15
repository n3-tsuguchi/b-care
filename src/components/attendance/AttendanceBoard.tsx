"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AttendanceRecord } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Check,
  X,
  Clock,
  Bus,
  UtensilsCrossed,
  Loader2,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AttendanceStatus = "present" | "absent" | "late" | "early_leave" | "";

const statusConfig = {
  present: { label: "出席", color: "bg-green-500 text-white", icon: Check },
  absent: { label: "欠席", color: "bg-red-100 text-red-700", icon: X },
  late: { label: "遅刻", color: "bg-amber-100 text-amber-700", icon: Clock },
  early_leave: {
    label: "早退",
    color: "bg-orange-100 text-orange-700",
    icon: Clock,
  },
  "": { label: "未入力", color: "bg-muted text-muted-foreground", icon: null },
};

type Props = {
  initialRecords: AttendanceRecord[];
  initialDate: string;
  officeId: string;
};

export function AttendanceBoard({ initialRecords, initialDate, officeId }: Props) {
  const [date, setDate] = useState(initialDate);
  const [records, setRecords] = useState(initialRecords);
  const [loading, setLoading] = useState(false);

  const fetchRecords = useCallback(async (newDate: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?date=${newDate}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch {
      // フォールバック: クライアント直接クエリ
    } finally {
      setLoading(false);
    }
  }, []);

  const changeDate = (offset: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + offset);
    const newDate = d.toISOString().split("T")[0];
    setDate(newDate);
    fetchRecords(newDate);
  };

  const saveAttendance = async (
    record: AttendanceRecord,
    updates: Partial<AttendanceRecord>
  ) => {
    const supabase = createClient();
    const updatedRecord = { ...record, ...updates };

    if (record.id) {
      // 既存レコード更新
      await supabase
        .from("attendances")
        .update({
          status: updatedRecord.status,
          pickup_outbound: updatedRecord.pickup_outbound,
          pickup_inbound: updatedRecord.pickup_inbound,
          meal_provided: updatedRecord.meal_provided,
        })
        .eq("id", record.id);
    } else if (updatedRecord.status) {
      // 新規レコード作成
      const { data } = await supabase
        .from("attendances")
        .insert({
          office_id: officeId,
          client_id: record.client_id,
          attendance_date: date,
          status: updatedRecord.status,
          pickup_outbound: updatedRecord.pickup_outbound,
          pickup_inbound: updatedRecord.pickup_inbound,
          meal_provided: updatedRecord.meal_provided,
        })
        .select("id")
        .single();

      if (data) {
        updatedRecord.id = data.id;
      }
    }

    return updatedRecord;
  };

  const toggleStatus = async (
    clientId: string,
    newStatus: AttendanceStatus
  ) => {
    const record = records.find((r) => r.client_id === clientId);
    if (!record) return;

    const finalStatus = record.status === newStatus ? "" : newStatus;

    // 楽観的更新
    setRecords((prev) =>
      prev.map((r) =>
        r.client_id === clientId ? { ...r, status: finalStatus } : r
      )
    );

    const saved = await saveAttendance(record, { status: finalStatus });
    setRecords((prev) =>
      prev.map((r) => (r.client_id === clientId ? saved : r))
    );
  };

  const togglePickup = async (
    clientId: string,
    direction: "outbound" | "inbound"
  ) => {
    const record = records.find((r) => r.client_id === clientId);
    if (!record) return;

    const key =
      direction === "outbound" ? "pickup_outbound" : "pickup_inbound";
    const newValue = !record[key];

    setRecords((prev) =>
      prev.map((r) =>
        r.client_id === clientId ? { ...r, [key]: newValue } : r
      )
    );

    await saveAttendance(record, { [key]: newValue });
  };

  const toggleMeal = async (clientId: string) => {
    const record = records.find((r) => r.client_id === clientId);
    if (!record) return;

    const newValue = !record.meal_provided;

    setRecords((prev) =>
      prev.map((r) =>
        r.client_id === clientId ? { ...r, meal_provided: newValue } : r
      )
    );

    await saveAttendance(record, { meal_provided: newValue });
  };

  const exportAttendanceSheet = () => {
    const recorded = records.filter((r) => r.status !== "");
    if (recorded.length === 0) return;

    const statusLabel: Record<string, string> = {
      present: "出席",
      absent: "欠席",
      late: "遅刻",
      early_leave: "早退",
    };

    const header = "利用者番号,氏名,出席状況,送迎（往）,送迎（復）,食事提供";
    const rows = records.map((r) =>
      [
        r.client_number ?? "",
        `${r.family_name}${r.given_name}`,
        statusLabel[r.status] ?? (r.status || "未入力"),
        r.pickup_outbound ? "あり" : "",
        r.pickup_inbound ? "あり" : "",
        r.meal_provided ? "あり" : "",
      ].join(",")
    );

    const csv = "\uFEFF" + [`日付: ${date}`, header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const presentCount = records.filter(
    (r) => r.status === "present" || r.status === "late" || r.status === "early_leave"
  ).length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const unrecorded = records.filter((r) => r.status === "").length;

  return (
    <div className="space-y-4">
      {/* 日付選択と統計 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg p-2 hover:bg-accent transition-colors"
            onClick={() => changeDate(-1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              fetchRecords(e.target.value);
            }}
            className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            className="rounded-lg p-2 hover:bg-accent transition-colors"
            onClick={() => changeDate(1)}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-2 text-sm">
            <Badge variant="success">出席 {presentCount}</Badge>
            <Badge variant="danger">欠席 {absentCount}</Badge>
            {unrecorded > 0 && (
              <Badge variant="secondary">未入力 {unrecorded}</Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={exportAttendanceSheet}>
            <Download className="h-4 w-4" />
            実績記録票
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const [y, m] = date.split("-");
              const a = document.createElement("a");
              a.href = `/api/pdf/attendance-register?year=${y}&month=${parseInt(m)}`;
              a.download = "";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
          >
            <FileText className="h-4 w-4" />
            出席簿PDF
          </Button>
        </div>
      </div>

      {/* 出席入力カード */}
      <div className="grid gap-3">
        {records.map((record) => {
          const _config =
            statusConfig[record.status as keyof typeof statusConfig] ||
            statusConfig[""];

          return (
            <Card key={record.client_id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* 利用者情報 */}
                <div className="flex items-center gap-3 sm:w-40">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                    {record.family_name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {record.family_name} {record.given_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {record.client_number ?? "-"}
                    </p>
                  </div>
                </div>

                {/* 出席ステータスボタン */}
                <div className="flex gap-2">
                  {(
                    ["present", "absent", "late", "early_leave"] as const
                  ).map((status) => {
                    const sc = statusConfig[status];
                    return (
                      <button
                        key={status}
                        onClick={() => toggleStatus(record.client_id, status)}
                        className={cn(
                          "flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                          record.status === status
                            ? sc.color
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        {sc.icon && <sc.icon className="h-3.5 w-3.5" />}
                        {sc.label}
                      </button>
                    );
                  })}
                </div>

                {/* 送迎・食事 */}
                <div className="flex items-center gap-2 sm:ml-auto">
                  <button
                    onClick={() =>
                      togglePickup(record.client_id, "outbound")
                    }
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                      record.pickup_outbound
                        ? "bg-blue-100 text-blue-700"
                        : "bg-muted text-muted-foreground"
                    )}
                    title="往路送迎"
                  >
                    <Bus className="h-3.5 w-3.5" />
                    往
                  </button>
                  <button
                    onClick={() =>
                      togglePickup(record.client_id, "inbound")
                    }
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                      record.pickup_inbound
                        ? "bg-blue-100 text-blue-700"
                        : "bg-muted text-muted-foreground"
                    )}
                    title="復路送迎"
                  >
                    <Bus className="h-3.5 w-3.5" />
                    復
                  </button>
                  <button
                    onClick={() => toggleMeal(record.client_id)}
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                      record.meal_provided
                        ? "bg-amber-100 text-amber-700"
                        : "bg-muted text-muted-foreground"
                    )}
                    title="食事提供"
                  >
                    <UtensilsCrossed className="h-3.5 w-3.5" />
                    食事
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
