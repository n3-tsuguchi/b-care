"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { disabilityTypeLabels, incomeCategoryLabels } from "@/lib/constants";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

type Props = {
  officeId: string;
};

type FormData = {
  // 基本情報
  family_name: string;
  given_name: string;
  family_name_kana: string;
  given_name_kana: string;
  birth_date: string;
  gender: string;
  disability_type: string;
  disability_grade: string;
  support_category: string;
  client_number: string;
  // 連絡先
  postal_code: string;
  address: string;
  phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  // 利用情報
  enrollment_date: string;
  notes: string;
  // 口座情報
  bank_name: string;
  bank_branch: string;
  bank_account_type: string;
  bank_account_number: string;
  bank_account_holder: string;
  // 受給者証情報
  certificate_number: string;
  municipality_code: string;
  municipality_name: string;
  service_type: string;
  decision_start_date: string;
  decision_end_date: string;
  monthly_days_limit: string;
  income_category: string;
  copay_limit: string;
};

const initialFormData: FormData = {
  family_name: "",
  given_name: "",
  family_name_kana: "",
  given_name_kana: "",
  birth_date: "",
  gender: "",
  disability_type: "",
  disability_grade: "",
  support_category: "",
  client_number: "",
  postal_code: "",
  address: "",
  phone: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  emergency_contact_relation: "",
  enrollment_date: new Date().toISOString().split("T")[0],
  notes: "",
  bank_name: "",
  bank_branch: "",
  bank_account_type: "ordinary",
  bank_account_number: "",
  bank_account_holder: "",
  certificate_number: "",
  municipality_code: "",
  municipality_name: "",
  service_type: "type_1",
  decision_start_date: "",
  decision_end_date: "",
  monthly_days_limit: "22",
  income_category: "low_income",
  copay_limit: "0",
};

function InputField({
  label,
  required,
  ...props
}: { label: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <input
        className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        {...props}
      />
    </div>
  );
}

function SelectField({
  label,
  required,
  options,
  ...props
}: {
  label: string;
  required?: boolean;
  options: { value: string; label: string }[];
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <select
        className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        {...props}
      >
        <option value="">選択してください</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ClientForm({ officeId }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // バリデーション
    if (!form.family_name || !form.given_name || !form.birth_date) {
      setError("氏名と生年月日は必須です。");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      // 利用者を登録
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          office_id: officeId,
          family_name: form.family_name,
          given_name: form.given_name,
          family_name_kana: form.family_name_kana || null,
          given_name_kana: form.given_name_kana || null,
          birth_date: form.birth_date,
          gender: form.gender || null,
          disability_type: form.disability_type || null,
          disability_grade: form.disability_grade || null,
          support_category: form.support_category ? parseInt(form.support_category) : null,
          client_number: form.client_number || null,
          postal_code: form.postal_code || null,
          address: form.address || null,
          phone: form.phone || null,
          emergency_contact_name: form.emergency_contact_name || null,
          emergency_contact_phone: form.emergency_contact_phone || null,
          emergency_contact_relation: form.emergency_contact_relation || null,
          enrollment_date: form.enrollment_date || null,
          notes: form.notes || null,
          bank_name: form.bank_name || null,
          bank_branch: form.bank_branch || null,
          bank_account_type: form.bank_account_type || null,
          bank_account_number: form.bank_account_number || null,
          bank_account_holder: form.bank_account_holder || null,
          status: "active",
        })
        .select("id")
        .single();

      if (clientError) throw clientError;

      // 受給者証を登録（番号が入力されている場合のみ）
      if (form.certificate_number && form.decision_start_date && form.decision_end_date) {
        const { error: certError } = await supabase
          .from("certificates")
          .insert({
            client_id: client.id,
            certificate_number: form.certificate_number,
            municipality_code: form.municipality_code || "000000",
            municipality_name: form.municipality_name || null,
            service_type: form.service_type || "type_1",
            decision_start_date: form.decision_start_date,
            decision_end_date: form.decision_end_date,
            monthly_days_limit: parseInt(form.monthly_days_limit) || 22,
            income_category: form.income_category || "low_income",
            copay_limit: parseInt(form.copay_limit) || 0,
            is_current: true,
          });

        if (certError) throw certError;
      }

      router.push("/clients");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 基本情報 */}
      <Card>
        <h2 className="mb-4 text-base font-semibold text-foreground">基本情報</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InputField
            label="姓"
            required
            value={form.family_name}
            onChange={(e) => update("family_name", e.target.value)}
            placeholder="山田"
          />
          <InputField
            label="名"
            required
            value={form.given_name}
            onChange={(e) => update("given_name", e.target.value)}
            placeholder="太郎"
          />
          <InputField
            label="利用者番号"
            value={form.client_number}
            onChange={(e) => update("client_number", e.target.value)}
            placeholder="001"
          />
          <InputField
            label="姓（カナ）"
            value={form.family_name_kana}
            onChange={(e) => update("family_name_kana", e.target.value)}
            placeholder="ヤマダ"
          />
          <InputField
            label="名（カナ）"
            value={form.given_name_kana}
            onChange={(e) => update("given_name_kana", e.target.value)}
            placeholder="タロウ"
          />
          <InputField
            label="生年月日"
            required
            type="date"
            value={form.birth_date}
            onChange={(e) => update("birth_date", e.target.value)}
          />
          <SelectField
            label="性別"
            value={form.gender}
            onChange={(e) => update("gender", e.target.value)}
            options={[
              { value: "male", label: "男性" },
              { value: "female", label: "女性" },
            ]}
          />
          <SelectField
            label="障害種別"
            value={form.disability_type}
            onChange={(e) => update("disability_type", e.target.value)}
            options={Object.entries(disabilityTypeLabels).map(([value, label]) => ({
              value,
              label,
            }))}
          />
          <InputField
            label="障害等級"
            value={form.disability_grade}
            onChange={(e) => update("disability_grade", e.target.value)}
            placeholder="1級"
          />
          <SelectField
            label="障害支援区分"
            value={form.support_category}
            onChange={(e) => update("support_category", e.target.value)}
            options={[1, 2, 3, 4, 5, 6].map((n) => ({
              value: String(n),
              label: `区分${n}`,
            }))}
          />
          <InputField
            label="利用開始日"
            type="date"
            value={form.enrollment_date}
            onChange={(e) => update("enrollment_date", e.target.value)}
          />
        </div>
      </Card>

      {/* 連絡先情報 */}
      <Card>
        <h2 className="mb-4 text-base font-semibold text-foreground">連絡先情報</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InputField
            label="郵便番号"
            value={form.postal_code}
            onChange={(e) => update("postal_code", e.target.value)}
            placeholder="123-4567"
          />
          <div className="sm:col-span-2">
            <InputField
              label="住所"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="東京都新宿区..."
            />
          </div>
          <InputField
            label="電話番号"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="090-1234-5678"
          />
          <InputField
            label="緊急連絡先氏名"
            value={form.emergency_contact_name}
            onChange={(e) => update("emergency_contact_name", e.target.value)}
            placeholder="山田花子"
          />
          <InputField
            label="緊急連絡先電話番号"
            value={form.emergency_contact_phone}
            onChange={(e) => update("emergency_contact_phone", e.target.value)}
            placeholder="090-9876-5432"
          />
          <InputField
            label="緊急連絡先（続柄）"
            value={form.emergency_contact_relation}
            onChange={(e) => update("emergency_contact_relation", e.target.value)}
            placeholder="母"
          />
        </div>
      </Card>

      {/* 口座情報 */}
      <Card>
        <h2 className="mb-4 text-base font-semibold text-foreground">口座情報（工賃振込先）</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InputField
            label="銀行名"
            value={form.bank_name}
            onChange={(e) => update("bank_name", e.target.value)}
            placeholder="○○銀行"
          />
          <InputField
            label="支店名"
            value={form.bank_branch}
            onChange={(e) => update("bank_branch", e.target.value)}
            placeholder="○○支店"
          />
          <SelectField
            label="口座種別"
            value={form.bank_account_type}
            onChange={(e) => update("bank_account_type", e.target.value)}
            options={[
              { value: "ordinary", label: "普通" },
              { value: "current", label: "当座" },
            ]}
          />
          <InputField
            label="口座番号"
            value={form.bank_account_number}
            onChange={(e) => update("bank_account_number", e.target.value)}
            placeholder="1234567"
          />
          <InputField
            label="口座名義"
            value={form.bank_account_holder}
            onChange={(e) => update("bank_account_holder", e.target.value)}
            placeholder="ヤマダ タロウ"
          />
        </div>
      </Card>

      {/* 受給者証情報 */}
      <Card>
        <h2 className="mb-4 text-base font-semibold text-foreground">受給者証情報</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          受給者証番号を入力すると、受給者証情報が登録されます。後から登録することも可能です。
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InputField
            label="受給者証番号"
            value={form.certificate_number}
            onChange={(e) => update("certificate_number", e.target.value)}
            placeholder="1234567890"
          />
          <InputField
            label="市区町村コード"
            value={form.municipality_code}
            onChange={(e) => update("municipality_code", e.target.value)}
            placeholder="131001"
          />
          <InputField
            label="市区町村名"
            value={form.municipality_name}
            onChange={(e) => update("municipality_name", e.target.value)}
            placeholder="新宿区"
          />
          <InputField
            label="支給決定開始日"
            type="date"
            value={form.decision_start_date}
            onChange={(e) => update("decision_start_date", e.target.value)}
          />
          <InputField
            label="支給決定終了日"
            type="date"
            value={form.decision_end_date}
            onChange={(e) => update("decision_end_date", e.target.value)}
          />
          <InputField
            label="月間利用日数上限"
            type="number"
            value={form.monthly_days_limit}
            onChange={(e) => update("monthly_days_limit", e.target.value)}
          />
          <SelectField
            label="所得区分"
            value={form.income_category}
            onChange={(e) => update("income_category", e.target.value)}
            options={Object.entries(incomeCategoryLabels).map(([value, label]) => ({
              value,
              label,
            }))}
          />
          <InputField
            label="負担上限月額"
            type="number"
            value={form.copay_limit}
            onChange={(e) => update("copay_limit", e.target.value)}
            placeholder="0"
          />
        </div>
      </Card>

      {/* 備考 */}
      <Card>
        <h2 className="mb-4 text-base font-semibold text-foreground">備考</h2>
        <textarea
          className="min-h-[100px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="特記事項があれば入力してください"
        />
      </Card>

      {/* アクション */}
      <div className="flex items-center justify-between">
        <Link href="/clients">
          <Button type="button" variant="outline">
            <ArrowLeft className="h-4 w-4" />
            戻る
          </Button>
        </Link>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "登録中..." : "利用者を登録"}
        </Button>
      </div>
    </form>
  );
}
