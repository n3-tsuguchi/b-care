import { Header } from "@/components/layout/Header";
import { SupportPlanList } from "@/components/support-plans/SupportPlanList";
import { getSupportPlans } from "@/lib/supabase/queries";

export default async function SupportPlansPage() {
  const plans = await getSupportPlans().catch(() => []);

  return (
    <>
      <Header title="個別支援計画" description="利用者ごとの支援計画を作成・管理" />
      <div className="p-6">
        <SupportPlanList plans={plans} />
      </div>
    </>
  );
}
