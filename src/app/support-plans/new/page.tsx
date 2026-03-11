import { Header } from "@/components/layout/Header";
import { SupportPlanForm } from "@/components/support-plans/SupportPlanForm";
import { getActiveClientsForPlan, getOfficeId } from "@/lib/supabase/queries";

export default async function NewSupportPlanPage() {
  const [clients, officeId] = await Promise.all([
    getActiveClientsForPlan(),
    getOfficeId(),
  ]);

  return (
    <>
      <Header title="新規支援計画" description="個別支援計画を作成" />
      <div className="p-6">
        <SupportPlanForm clients={clients} officeId={officeId} />
      </div>
    </>
  );
}
