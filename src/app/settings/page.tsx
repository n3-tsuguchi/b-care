import { Header } from "@/components/layout/Header";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { getOfficeSettings } from "@/lib/supabase/queries";

export default async function SettingsPage() {
  const officeSettings = await getOfficeSettings().catch(() => null);

  return (
    <>
      <Header title="設定" description="事業所情報・加算設定・工賃規程" />
      <div className="p-6">
        <SettingsPanel officeSettings={officeSettings} />
      </div>
    </>
  );
}
