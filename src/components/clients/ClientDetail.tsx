"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  disabilityTypeLabels,
  statusLabels,
  incomeCategoryLabels,
} from "@/lib/constants";
import type { ClientWithCertificate } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Edit, User, FileCheck, ScrollText, Save, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClientHistory } from "./ClientHistory";

const tabs = [
  { id: "basic", label: "基本情報", icon: User },
  { id: "certificate", label: "受給者証", icon: FileCheck },
  { id: "history", label: "利用履歴", icon: ScrollText },
];

type Props = {
  client: ClientWithCertificate | null;
};

export function ClientDetail({ client }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basic");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    family_name: client?.family_name ?? "",
    given_name: client?.given_name ?? "",
    family_name_kana: client?.family_name_kana ?? "",
    given_name_kana: client?.given_name_kana ?? "",
    gender: client?.gender ?? "",
    disability_type: client?.disability_type ?? "",
    phone: client?.phone ?? "",
    postal_code: client?.postal_code ?? "",
    address: client?.address ?? "",
    emergency_contact_name: client?.emergency_contact_name ?? "",
    emergency_contact_phone: client?.emergency_contact_phone ?? "",
    emergency_contact_relation: client?.emergency_contact_relation ?? "",
    notes: client?.notes ?? "",
  });

  const handleSave = async () => {
    if (!client) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("clients")
        .update({
          family_name: editData.family_name,
          given_name: editData.given_name,
          family_name_kana: editData.family_name_kana || null,
          given_name_kana: editData.given_name_kana || null,
          gender: editData.gender || null,
          disability_type: editData.disability_type || null,
          phone: editData.phone || null,
          postal_code: editData.postal_code || null,
          address: editData.address || null,
          emergency_contact_name: editData.emergency_contact_name || null,
          emergency_contact_phone: editData.emergency_contact_phone || null,
          emergency_contact_relation: editData.emergency_contact_relation || null,
          notes: editData.notes || null,
        })
        .eq("id", client.id);

      if (error) throw error;
      setIsEditing(false);
      router.refresh();
    } catch (e) {
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">利用者が見つかりません</p>
        <Link href="/clients" className="mt-4 text-primary hover:underline">
          利用者一覧に戻る
        </Link>
      </div>
    );
  }

  const cert = client.certificate;

  return (
    <div className="space-y-6">
      {/* 戻るボタンとアクション */}
      <div className="flex items-center justify-between">
        <Link
          href="/clients"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          利用者一覧に戻る
        </Link>
        {isEditing ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditing(false);
                setEditData({
                  family_name: client.family_name,
                  given_name: client.given_name,
                  family_name_kana: client.family_name_kana ?? "",
                  given_name_kana: client.given_name_kana ?? "",
                  gender: client.gender ?? "",
                  disability_type: client.disability_type ?? "",
                  phone: client.phone ?? "",
                  postal_code: client.postal_code ?? "",
                  address: client.address ?? "",
                  emergency_contact_name: client.emergency_contact_name ?? "",
                  emergency_contact_phone: client.emergency_contact_phone ?? "",
                  emergency_contact_relation: client.emergency_contact_relation ?? "",
                  notes: client.notes ?? "",
                });
              }}
            >
              <X className="h-4 w-4" />
              キャンセル
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              保存
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4" />
            編集
          </Button>
        )}
      </div>

      {/* ヘッダーカード */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
            {client.family_name[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-foreground">
                {client.family_name} {client.given_name}
              </h2>
              <Badge
                variant={client.status === "active" ? "success" : "secondary"}
              >
                {statusLabels[client.status] ?? client.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {client.family_name_kana} {client.given_name_kana} /{" "}
              {client.client_number ?? "-"}
            </p>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>生年月日: {client.birth_date}</span>
              <span>
                障害種別:{" "}
                {disabilityTypeLabels[client.disability_type ?? ""] ?? "-"}
              </span>
              <span>
                支援区分:{" "}
                {client.support_category
                  ? `区分${client.support_category}`
                  : "なし"}
              </span>
              <span>利用開始: {client.enrollment_date ?? "-"}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* タブ */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      {activeTab === "basic" && (
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          {isEditing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <EditRow label="姓" value={editData.family_name} onChange={(v) => setEditData({ ...editData, family_name: v })} />
              <EditRow label="名" value={editData.given_name} onChange={(v) => setEditData({ ...editData, given_name: v })} />
              <EditRow label="姓（カナ）" value={editData.family_name_kana} onChange={(v) => setEditData({ ...editData, family_name_kana: v })} />
              <EditRow label="名（カナ）" value={editData.given_name_kana} onChange={(v) => setEditData({ ...editData, given_name_kana: v })} />
              <InfoRow label="生年月日" value={client.birth_date} />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">性別</p>
                <select
                  value={editData.gender}
                  onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                  className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">未設定</option>
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                </select>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">障害種別</p>
                <select
                  value={editData.disability_type}
                  onChange={(e) => setEditData({ ...editData, disability_type: e.target.value })}
                  className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">未設定</option>
                  {Object.entries(disabilityTypeLabels).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <InfoRow
                label="障害支援区分"
                value={client.support_category ? `区分${client.support_category}` : "区分なし"}
              />
              <EditRow label="電話番号" value={editData.phone} onChange={(v) => setEditData({ ...editData, phone: v })} />
              <EditRow label="郵便番号" value={editData.postal_code} onChange={(v) => setEditData({ ...editData, postal_code: v })} />
              <div className="sm:col-span-2">
                <EditRow label="住所" value={editData.address} onChange={(v) => setEditData({ ...editData, address: v })} />
              </div>
              <EditRow label="緊急連絡先氏名" value={editData.emergency_contact_name} onChange={(v) => setEditData({ ...editData, emergency_contact_name: v })} />
              <EditRow label="緊急連絡先電話" value={editData.emergency_contact_phone} onChange={(v) => setEditData({ ...editData, emergency_contact_phone: v })} />
              <EditRow label="緊急連絡先（続柄）" value={editData.emergency_contact_relation} onChange={(v) => setEditData({ ...editData, emergency_contact_relation: v })} />
              <div className="sm:col-span-2">
                <p className="mb-1 text-xs text-muted-foreground">備考</p>
                <textarea
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow
                label="氏名"
                value={`${client.family_name} ${client.given_name}`}
              />
              <InfoRow
                label="フリガナ"
                value={`${client.family_name_kana ?? ""} ${client.given_name_kana ?? ""}`}
              />
              <InfoRow label="生年月日" value={client.birth_date} />
              <InfoRow
                label="性別"
                value={client.gender === "male" ? "男性" : client.gender === "female" ? "女性" : "-"}
              />
              <InfoRow
                label="障害種別"
                value={disabilityTypeLabels[client.disability_type ?? ""] ?? "-"}
              />
              <InfoRow
                label="障害支援区分"
                value={
                  client.support_category
                    ? `区分${client.support_category}`
                    : "区分なし"
                }
              />
              <InfoRow label="利用開始日" value={client.enrollment_date ?? "-"} />
              <InfoRow
                label="状態"
                value={statusLabels[client.status] ?? client.status}
              />
              {client.address && (
                <InfoRow label="住所" value={client.address} />
              )}
              {client.phone && (
                <InfoRow label="電話番号" value={client.phone} />
              )}
              {client.emergency_contact_name && (
                <InfoRow
                  label="緊急連絡先"
                  value={`${client.emergency_contact_name}（${client.emergency_contact_relation ?? "-"}）${client.emergency_contact_phone ?? ""}`}
                />
              )}
              {client.notes && (
                <div className="sm:col-span-2">
                  <InfoRow label="備考" value={client.notes} />
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {activeTab === "certificate" && (
        <Card>
          <CardHeader>
            <CardTitle>受給者証情報</CardTitle>
          </CardHeader>
          {cert ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow label="受給者証番号" value={cert.certificate_number} />
              <InfoRow
                label="支給決定期間"
                value={`${cert.decision_start_date} 〜 ${cert.decision_end_date}`}
              />
              <InfoRow
                label="月あたり利用上限日数"
                value={`${cert.monthly_days_limit}日`}
              />
              <InfoRow
                label="所得区分"
                value={incomeCategoryLabels[cert.income_category] ?? cert.income_category}
              />
              <InfoRow
                label="負担上限月額"
                value={`${cert.copay_limit.toLocaleString()}円`}
              />
              <InfoRow label="市区町村コード" value={cert.municipality_code} />
              <InfoRow
                label="上限額管理事業所"
                value={cert.is_copay_limit_manager ? "はい" : "いいえ"}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              受給者証が登録されていません
            </p>
          )}
        </Card>
      )}

      {activeTab === "history" && (
        <ClientHistory clientId={client.id} />
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function EditRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}
