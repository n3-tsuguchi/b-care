"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { Plus, Edit, Trash2, X, Loader2 } from "lucide-react";

type StaffMember = {
  id: string;
  name: string;
  position: string;
  qualifications: string[] | null;
  employment_type: string;
  hire_date: string | null;
  is_active: boolean;
};

const positionOptions = [
  "管理者",
  "サービス管理責任者",
  "職業指導員",
  "生活支援員",
  "目標工賃達成指導員",
  "就労支援員",
  "事務員",
];

const employmentTypeLabels: Record<string, string> = {
  full_time: "常勤",
  part_time: "非常勤",
  contract: "契約",
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

export function StaffManager() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    position: "職業指導員",
    employment_type: "full_time",
    hire_date: "",
    qualifications: "",
  });

  const fetchStaff = useCallback(async () => {
    const officeId = await getOfficeId();
    if (!officeId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("staff_members")
      .select("*")
      .eq("office_id", officeId)
      .order("created_at", { ascending: true })
      .returns<StaffMember[]>();
    setStaff(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const resetForm = () => {
    setForm({
      name: "",
      position: "職業指導員",
      employment_type: "full_time",
      hire_date: "",
      qualifications: "",
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const startEdit = (s: StaffMember) => {
    setForm({
      name: s.name,
      position: s.position,
      employment_type: s.employment_type,
      hire_date: s.hire_date ?? "",
      qualifications: s.qualifications?.join(", ") ?? "",
    });
    setEditingId(s.id);
    setShowAddForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const officeId = await getOfficeId();
      if (!officeId) return;
      const supabase = createClient();

      const quals = form.qualifications
        .split(/[,、]/)
        .map((q) => q.trim())
        .filter(Boolean);

      const payload = {
        office_id: officeId,
        name: form.name.trim(),
        position: form.position,
        employment_type: form.employment_type,
        hire_date: form.hire_date || null,
        qualifications: quals.length > 0 ? quals : null,
      };

      if (editingId) {
        await supabase.from("staff_members").update(payload).eq("id", editingId);
      } else {
        await supabase.from("staff_members").insert(payload);
      }

      resetForm();
      await fetchStaff();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この職員を削除しますか？")) return;
    const supabase = createClient();
    await supabase.from("staff_members").delete().eq("id", id);
    await fetchStaff();
  };

  const toggleActive = async (s: StaffMember) => {
    const supabase = createClient();
    await supabase
      .from("staff_members")
      .update({ is_active: !s.is_active })
      .eq("id", s.id);
    await fetchStaff();
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
          <CardTitle>職員一覧</CardTitle>
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
              {editingId ? "職員情報を編集" : "新しい職員"}
            </p>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">氏名 *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例: 山本 太郎"
                className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">職種</label>
              <select
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {positionOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">雇用形態</label>
              <select
                value={form.employment_type}
                onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
                className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="full_time">常勤</option>
                <option value="part_time">非常勤</option>
                <option value="contract">契約</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">入社日</label>
              <input
                type="date"
                value={form.hire_date}
                onChange={(e) => setForm({ ...form, hire_date: e.target.value })}
                className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs text-muted-foreground">
                資格（カンマ区切り）
              </label>
              <input
                type="text"
                value={form.qualifications}
                onChange={(e) => setForm({ ...form, qualifications: e.target.value })}
                placeholder="例: 社会福祉士, 精神保健福祉士"
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
        {staff.length === 0 && !showAddForm && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            職員が登録されていません
          </p>
        )}
        {staff.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between rounded-lg border border-border p-3"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">{s.name}</p>
                <Badge
                  variant={s.is_active ? "success" : "secondary"}
                >
                  {s.is_active ? "在籍" : "退職"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {s.position}（{employmentTypeLabels[s.employment_type] ?? s.employment_type}）
                {s.hire_date && ` / 入社: ${s.hire_date}`}
              </p>
              {s.qualifications && s.qualifications.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {s.qualifications.map((q) => (
                    <span
                      key={q}
                      className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700"
                    >
                      {q}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleActive(s)}
                className="text-xs"
              >
                {s.is_active ? "退職" : "復帰"}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(s)}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => handleDelete(s.id)}
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
