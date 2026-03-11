import { Header } from "@/components/layout/Header";
import { BillingManagement } from "@/components/billing/BillingManagement";
import { getBillingBatches } from "@/lib/supabase/queries";

export default async function BillingPage() {
  const batches = await getBillingBatches().catch(() => []);

  return (
    <>
      <Header title="請求管理" description="国保連請求と利用者請求を一元管理" />
      <div className="p-6">
        <BillingManagement batches={batches} />
      </div>
    </>
  );
}
