"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { OfficeSettings } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/client";
import {
  Building2,
  ListPlus,
  Coins,
  Wrench,
  Users,
  Calendar,
  Loader2,
  Check,
} from "lucide-react";
import { WorkTypeManager } from "./WorkTypeManager";
import { StaffManager } from "./StaffManager";

const settingsSections = [
  { id: "office", label: "事業所情報", icon: Building2 },
  { id: "additions", label: "加算設定", icon: ListPlus },
  { id: "wage_rules", label: "工賃規程", icon: Coins },
  { id: "work_types", label: "作業種別", icon: Wrench },
  { id: "staff", label: "職員管理", icon: Users },
  { id: "fiscal", label: "年度設定", icon: Calendar },
];

type Props = {
  officeSettings: OfficeSettings | null;
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

export function SettingsPanel({ officeSettings }: Props) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("office");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const office = officeSettings ?? {
    office_number: "",
    name: "",
    service_type: "",
    staffing_ratio: "7.5:1",
    capacity: 20,
    postal_code: null,
    address: null,
    phone: null,
    fax: null,
  };

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveOffice = async () => {
    setSaving(true);
    try {
      const officeId = await getOfficeId();
      if (!officeId) {
        showMessage("事業所IDが取得できませんでした");
        setSaving(false);
        return;
      }

      const container = document.getElementById("office-form")!;
      const getValue = (name: string) =>
        (container.querySelector(`input[name="${name}"]`) as HTMLInputElement)?.value ?? "";
      const supabase = createClient();

      const { error } = await supabase
        .from("offices")
        .update({
          name: getValue("name"),
          office_number: getValue("office_number"),
          staffing_ratio: getValue("staffing_ratio"),
          capacity: Number(getValue("capacity")),
          address: getValue("address"),
          phone: getValue("phone"),
        })
        .eq("id", officeId);

      if (error) throw error;
      showMessage("事業所情報を保存しました");
      router.refresh();
    } catch {
      showMessage("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWageRules = async () => {
    setSaving(true);
    try {
      const officeId = await getOfficeId();
      if (!officeId) {
        showMessage("事業所IDが取得できませんでした");
        setSaving(false);
        return;
      }

      const container = document.getElementById("wage-form")!;
      const getValue = (name: string) =>
        (container.querySelector(`input[name="${name}"]`) as HTMLInputElement)?.value ?? "";
      const supabase = createClient();

      const calcMethodMap: Record<string, string> = {
        "時給方式": "hourly",
        "日給方式": "daily",
        "出来高方式": "piece",
        "混合方式（基本時給 + 出来高）": "mixed",
      };
      const paymentMethodMap: Record<string, string> = {
        "銀行振込": "bank_transfer",
        "現金": "cash",
      };
      const roundingMap: Record<string, string> = {
        "切り捨て": "floor",
        "四捨五入": "round",
        "切り上げ": "ceil",
      };

      const currentYear = new Date().getFullYear();
      const calcMethod = calcMethodMap[getValue("calc_method")] ?? "hourly";
      const hourlyRate = parseInt(getValue("hourly_rate").replace(/[^0-9]/g, "")) || 250;
      const paymentDay = parseInt(getValue("payment_day").replace(/[^0-9]/g, "")) || 25;
      const paymentMethod = paymentMethodMap[getValue("payment_method")] ?? "bank_transfer";
      const rounding = roundingMap[getValue("rounding")] ?? "floor";

      await supabase
        .from("wage_rules")
        .upsert(
          {
            office_id: officeId,
            fiscal_year: currentYear,
            calculation_method: calcMethod,
            base_hourly_rate: hourlyRate,
            payment_day: paymentDay,
            payment_method: paymentMethod,
            rounding_method: rounding,
          },
          { onConflict: "office_id,fiscal_year" }
        );

      showMessage("工賃規程を保存しました");
    } catch {
      showMessage("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFiscal = async () => {
    setSaving(true);
    try {
      const officeId = await getOfficeId();
      if (!officeId) {
        showMessage("事業所IDが取得できませんでした");
        setSaving(false);
        return;
      }

      const container = document.getElementById("fiscal-form")!;
      const getValue = (name: string) =>
        (container.querySelector(`input[name="${name}"]`) as HTMLInputElement)?.value ?? "";
      const supabase = createClient();
      const currentYear = new Date().getFullYear();

      const prevAvgWage = parseInt(getValue("prev_avg_wage").replace(/[^0-9]/g, "")) || 0;
      const annualDays = parseInt(getValue("annual_days").replace(/[^0-9]/g, "")) || 245;

      await supabase
        .from("fiscal_years")
        .upsert(
          {
            office_id: officeId,
            fiscal_year: currentYear,
            start_date: `${currentYear}-04-01`,
            end_date: `${currentYear + 1}-03-31`,
            prev_avg_wage: prevAvgWage,
            reward_tier: getValue("reward_tier"),
            annual_opening_days: annualDays,
            is_current: true,
          },
          { onConflict: "office_id,fiscal_year" }
        );

      showMessage("年度設定を保存しました");
    } catch {
      showMessage("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAdditions = async () => {
    setSaving(true);
    try {
      const officeId = await getOfficeId();
      if (!officeId) return;

      const supabase = createClient();
      const currentYear = new Date().getFullYear();
      const checkboxes = document.querySelectorAll<HTMLInputElement>('[data-addition-code]');

      for (const cb of checkboxes) {
        const code = cb.dataset.additionCode!;
        await supabase
          .from("office_additions")
          .upsert(
            {
              office_id: officeId,
              fiscal_year: currentYear,
              addition_code: code,
              is_enabled: cb.checked,
            },
            { onConflict: "office_id,fiscal_year,addition_code" }
          );
      }

      showMessage("加算設定を保存しました");
    } catch {
      showMessage("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* サイドナビ */}
      <nav className="w-full shrink-0 lg:w-56">
        <div className="flex gap-1 overflow-x-auto lg:flex-col">
          {settingsSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                activeSection === section.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <section.icon className="h-4 w-4 shrink-0" />
              {section.label}
            </button>
          ))}
        </div>
      </nav>

      {/* コンテンツ */}
      <div className="flex-1">
        {/* 保存メッセージ */}
        {message && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
            <Check className="h-4 w-4" />
            {message}
          </div>
        )}

        {activeSection === "office" && (
          <Card>
            <CardHeader>
              <CardTitle>事業所基本情報</CardTitle>
            </CardHeader>
            <div id="office-form" className="space-y-4">
              <FormField
                label="事業所番号"
                name="office_number"
                defaultValue={office.office_number}
              />
              <FormField
                label="事業所名称"
                name="name"
                defaultValue={office.name}
              />
              <FormField
                label="人員配置比率"
                name="staffing_ratio"
                defaultValue={office.staffing_ratio}
              />
              <FormField
                label="定員"
                name="capacity"
                defaultValue={String(office.capacity)}
              />
              <FormField
                label="住所"
                name="address"
                defaultValue={office.address ?? ""}
              />
              <FormField
                label="電話番号"
                name="phone"
                defaultValue={office.phone ?? ""}
              />
              <div className="pt-4">
                <Button type="button" onClick={handleSaveOffice} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {saving ? "保存中..." : "保存"}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {activeSection === "additions" && (
          <Card>
            <CardHeader>
              <CardTitle>加算設定</CardTitle>
            </CardHeader>
            <div className="space-y-3">
              {[
                { code: "pickup", name: "送迎加算", enabled: true, detail: "21単位/回（片道）" },
                { code: "meal", name: "食事提供体制加算", enabled: true, detail: "30単位/日" },
                { code: "target_wage", name: "目標工賃達成指導員配置加算", enabled: false, detail: "36〜45単位/日" },
                { code: "welfare_staff", name: "福祉専門職員配置等加算", enabled: false, detail: "(I)15 / (II)10 / (III)6 単位/日" },
                { code: "copay_limit_mgr", name: "利用者負担上限額管理加算", enabled: true, detail: "150単位/月" },
                { code: "treatment_improvement", name: "福祉・介護職員等処遇改善加算", enabled: true, detail: "所定単位の一定割合" },
              ].map((addition) => (
                <div
                  key={addition.code}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {addition.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {addition.detail}
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      defaultChecked={addition.enabled}
                      data-addition-code={addition.code}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
                  </label>
                </div>
              ))}
            </div>
            <div className="pt-4">
              <Button onClick={handleSaveAdditions} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </Card>
        )}

        {activeSection === "wage_rules" && (
          <Card>
            <CardHeader>
              <CardTitle>工賃規程</CardTitle>
            </CardHeader>
            <div id="wage-form" className="space-y-4">
              <FormField
                label="工賃計算方式"
                name="calc_method"
                defaultValue="混合方式（基本時給 + 出来高）"
              />
              <FormField
                label="基本時給"
                name="hourly_rate"
                defaultValue="250円"
              />
              <FormField
                label="支給日"
                name="payment_day"
                defaultValue="毎月25日"
              />
              <FormField
                label="支払方法"
                name="payment_method"
                defaultValue="銀行振込"
              />
              <FormField
                label="端数処理"
                name="rounding"
                defaultValue="切り捨て"
              />
              <div className="pt-4">
                <Button type="button" onClick={handleSaveWageRules} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {saving ? "保存中..." : "保存"}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {activeSection === "work_types" && <WorkTypeManager />}

        {activeSection === "staff" && <StaffManager />}

        {activeSection === "fiscal" && (
          <Card>
            <CardHeader>
              <CardTitle>年度設定</CardTitle>
            </CardHeader>
            <div id="fiscal-form" className="space-y-4">
              <FormField
                label="現在の年度"
                name="fiscal_year"
                defaultValue="2025年度（2025年4月〜2026年3月）"
              />
              <FormField
                label="前年度平均工賃月額"
                name="prev_avg_wage"
                defaultValue="16,800円"
              />
              <FormField
                label="報酬区分"
                name="reward_tier"
                defaultValue="1万5千円以上3万円未満"
              />
              <FormField
                label="年間開所日数（見込み）"
                name="annual_days"
                defaultValue="245日"
              />
              <div className="pt-4">
                <Button type="button" onClick={handleSaveFiscal} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {saving ? "保存中..." : "保存"}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function FormField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue}
        className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}
