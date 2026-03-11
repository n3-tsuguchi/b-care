"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Plus, Edit, Trash2, X, Loader2, GripVertical } from "lucide-react";

type WorkType = {
  id: string;
  name: string;
  description: string | null;
  unit_type: string;
  unit_price: number | null;
  sort_order: number;
  is_active: boolean;
};

const unitTypeLabels: Record<string, string> = {
  hourly: "時給",
  daily: "日給",
  piece: "出来高",
};

async function getOfficeId() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("users")
    .select("office_id")
    .eq("id", user.id)
    .single();
  return profile?.office_id ?? null;
}

export function WorkTypeManager() {
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    unit_type: "hourly",
    unit_price: "",
  });

  const fetchWorkTypes = useCallback(async () => {
    const officeId = await getOfficeId();
    if (!officeId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("work_types")
      .select("*")
      .eq("office_id", officeId)
      .order("sort_order", { ascending: true })
      .returns<WorkType[]>();
    setWorkTypes(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWorkTypes();
  }, [fetchWorkTypes]);

  const resetForm = () => {
    setForm({ name: "", description: "", unit_type: "hourly", unit_price: "" });
    setEditingId(null);
    setShowAddForm(false);
  };

  const startEdit = (wt: WorkType) => {
    setForm({
      name: wt.name,
      description: wt.description ?? "",
      unit_type: wt.unit_type,
      unit_price: wt.unit_price?.toString() ?? "",
    });
    setEditingId(wt.id);
    setShowAddForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const officeId = await getOfficeId();
      if (!officeId) return;
      const supabase = createClient();

      const payload = {
        office_id: officeId,
        name: form.name.trim(),
        description: form.description.trim() || null,
        unit_type: form.unit_type,
        unit_price: form.unit_price ? Number(form.unit_price) : null,
      };

      if (editingId) {
        await supabase
          .from("work_types")
          .update(payload)
          .eq("id", editingId);
      } else {
        await supabase
          .from("work_types")
          .insert({ ...payload, sort_order: workTypes.length + 1 });
      }

      resetForm();
      await fetchWorkTypes();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この作業種別を削除しますか？")) return;
    const supabase = createClient();
    await supabase.from("work_types").delete().eq("id", id);
    await fetchWorkTypes();
  };

  const toggleActive = async (wt: WorkType) => {
    const supabase = createClient();
    await supabase
      .from("work_types")
      .update({ is_active: !wt.is_active })
      .eq("id", wt.id);
    await fetchWorkTypes();
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>作業種別マスタ</CardTitle>
          {!showAddForm && (
            <Button size="sm" onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4" />
              追加
            </Button>
          )}
        </div>
      </CardHeader>

      {showAddForm && (
        <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              {editingId ? "作業種別を編集" : "新しい作業種別"}
            </p>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">作業名 *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例: 内職作業"
                className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">説明</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="例: 封入・シール貼り等"
                className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">単位種別</label>
              <select
                value={form.unit_type}
                onChange={(e) => setForm({ ...form, unit_type: e.target.value })}
                className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="hourly">時給</option>
                <option value="daily">日給</option>
                <option value="piece">出来高</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">単価（円）</label>
              <input
                type="number"
                value={form.unit_price}
                onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                placeholder="例: 250"
                className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={resetForm}>
              キャンセル
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingId ? "更新" : "追加"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {workTypes.length === 0 && !showAddForm && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            作業種別が登録されていません
          </p>
        )}
        {workTypes.map((wt) => (
          <div
            key={wt.id}
            className="flex items-center justify-between rounded-lg border border-border p-3"
          >
            <div className="flex items-center gap-3">
              <GripVertical className="h-4 w-4 text-muted-foreground/50" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{wt.name}</p>
                  {!wt.is_active && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      無効
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {unitTypeLabels[wt.unit_type] ?? wt.unit_type}
                  {wt.unit_price != null && ` / ${wt.unit_price.toLocaleString()}円`}
                  {wt.description && ` — ${wt.description}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleActive(wt)}
                className="text-xs"
              >
                {wt.is_active ? "無効化" : "有効化"}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(wt)}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => handleDelete(wt.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
