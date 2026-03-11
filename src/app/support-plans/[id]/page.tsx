import { Header } from "@/components/layout/Header";
import { SupportPlanDetail } from "@/components/support-plans/SupportPlanDetail";
import { getSupportPlanDetail, getOfficeId } from "@/lib/supabase/queries";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SupportPlanDetailPage({ params }: Props) {
  const { id } = await params;
  const [plan, officeId] = await Promise.all([
    getSupportPlanDetail(id).catch(() => null),
    getOfficeId(),
  ]);

  return (
    <>
      <Header
        title={plan ? `${plan.family_name} ${plan.given_name} - 支援計画` : "支援計画"}
        description={plan ? `第${plan.plan_number}号（${plan.plan_start_date} 〜 ${plan.plan_end_date}）` : ""}
      />
      <div className="p-6">
        <SupportPlanDetail plan={plan} officeId={officeId} />
      </div>
    </>
  );
}
