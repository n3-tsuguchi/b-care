"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SupportRecord } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Save,
  Heart,
  Smile,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";

const healthOptions = [
  { value: "good", label: "良好", color: "bg-green-100 text-green-700" },
  { value: "fair", label: "普通", color: "bg-yellow-100 text-yellow-700" },
  { value: "poor", label: "不良", color: "bg-red-100 text-red-700" },
];

const moodOptions = [
  { value: "good", label: "良い", color: "bg-green-100 text-green-700" },
  { value: "normal", label: "普通", color: "bg-yellow-100 text-yellow-700" },
  { value: "low", label: "低い", color: "bg-red-100 text-red-700" },
];

const workOptions = [
  { value: "excellent", label: "優秀", color: "bg-blue-100 text-blue-700" },
  { value: "good", label: "良好", color: "bg-green-100 text-green-700" },
  { value: "fair", label: "普通", color: "bg-yellow-100 text-yellow-700" },
  { value: "poor", label: "不良", color: "bg-red-100 text-red-700" },
];

type Props = {
  initialRecords: SupportRecord[];
  initialDate: string;
  officeId: string;
};

export function SupportRecordBoard({ initialRecords, initialDate, officeId }: Props) {
  const [date, setDate] = useState(initialDate);
  const [records, setRecords] = useState(initialRecords);
  const [loading, setLoading] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const recordsRef = useRef(records);
  useEffect(() => { recordsRef.current = records; }, [records]);

  const fetchRecords = useCallback(async (newDate: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/support-records?date=${newDate}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch {
      // ignore
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

  const updateRecord = (clientId: string, field: string, value: string | null) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.client_id === clientId ? { ...r, [field]: value } : r
      )
    );
  };

  const toggleOption = (clientId: string, field: string, value: string) => {
    const record = records.find((r) => r.client_id === clientId);
    if (!record) return;
    const current = record[field as keyof SupportRecord];
    updateRecord(clientId, field, current === value ? null : value);
  };

  const saveRecord = async (clientId: string) => {
    // refから最新のレコードを取得
    const latest = recordsRef.current;
    const record = latest.find((r) => r.client_id === clientId);
    if (!record) {
      alert("対象の利用者が見つかりません");
      return;
    }
    const key = record.client_id;
    setSavingIds((prev) => new Set(prev).add(key));

    try {
      const supabase = createClient();

      // 何かデータが入力されているか確認
      const hasData = record.record_content || record.health_status || record.mood || record.work_performance || record.special_notes;

      if (!hasData) {
        alert("体調や支援内容を入力してください");
        return;
      }

      if (record.id) {
        // 既存レコード更新
        const { error } = await supabase
          .from("support_records")
          .update({
            record_content: record.record_content || "-",
            health_status: record.health_status,
            mood: record.mood,
            work_performance: record.work_performance,
            special_notes: record.special_notes,
          })
          .eq("id", record.id);

        if (error) {
          alert("更新に失敗しました: " + error.message);
        }
      } else {
        // 新規作成
        const { data, error } = await supabase
          .from("support_records")
          .insert({
            office_id: officeId,
            client_id: record.client_id,
            attendance_id: record.attendance_id,
            record_date: date,
            record_content: record.record_content || "-",
            health_status: record.health_status,
            mood: record.mood,
            work_performance: record.work_performance,
            special_notes: record.special_notes,
          })
          .select("id")
          .single();

        if (error) {
          alert("保存に失敗しました: " + error.message);
        } else if (data) {
          setRecords((prev) =>
            prev.map((r) =>
              r.client_id === key ? { ...r, id: data.id } : r
            )
          );
        }
      }
    } catch (_e) {
      alert("保存に失敗しました");
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const saveAll = async () => {
    const toSave = records.filter(
      (r) => r.record_content || r.health_status || r.mood || r.work_performance || r.special_notes
    );
    for (const r of toSave) {
      await saveRecord(r.client_id);
    }
    if (toSave.length === 0) {
      alert("保存するデータがありません。体調や支援内容を入力してください。");
    }
  };

  const recordedCount = records.filter((r) => r.id || r.record_content).length;

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
            <Badge variant="success">記録済 {recordedCount}</Badge>
            <Badge variant="secondary">対象 {records.length}</Badge>
          </div>
          <Button size="sm" onClick={saveAll}>
            <Save className="h-4 w-4" />
            一括保存
          </Button>
        </div>
      </div>

      {records.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">この日の出席記録がありません</p>
          <p className="mt-1 text-sm text-muted-foreground">出席管理で出席を記録してください</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {records.map((record) => {
            const isSaving = savingIds.has(record.client_id);
            return (
              <Card key={record.client_id} className="p-4">
                <div className="space-y-3">
                  {/* 利用者情報ヘッダー */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                        {record.family_name?.[0] ?? "?"}
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => saveRecord(record.client_id)}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      保存
                    </Button>
                  </div>

                  {/* 状態ボタン */}
                  <div className="flex flex-wrap gap-4">
                    <div className="space-y-1">
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Heart className="h-3 w-3" /> 体調
                      </p>
                      <div className="flex gap-1">
                        {healthOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => toggleOption(record.client_id, "health_status", opt.value)}
                            className={cn(
                              "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                              record.health_status === opt.value
                                ? opt.color
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Smile className="h-3 w-3" /> 気分
                      </p>
                      <div className="flex gap-1">
                        {moodOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => toggleOption(record.client_id, "mood", opt.value)}
                            className={cn(
                              "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                              record.mood === opt.value
                                ? opt.color
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Briefcase className="h-3 w-3" /> 作業
                      </p>
                      <div className="flex gap-1">
                        {workOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => toggleOption(record.client_id, "work_performance", opt.value)}
                            className={cn(
                              "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                              record.work_performance === opt.value
                                ? opt.color
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 支援内容テキスト */}
                  <textarea
                    value={record.record_content}
                    onChange={(e) => updateRecord(record.client_id, "record_content", e.target.value)}
                    placeholder="支援内容を記録..."
                    rows={2}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />

                  {/* 特記事項 */}
                  <input
                    type="text"
                    value={record.special_notes ?? ""}
                    onChange={(e) => updateRecord(record.client_id, "special_notes", e.target.value || null)}
                    placeholder="特記事項（任意）"
                    className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
