import { Header } from "@/components/layout/Header";
import { ClientList } from "@/components/clients/ClientList";
import { getClients } from "@/lib/supabase/queries";

export default async function ClientsPage() {
  const clients = await getClients().catch(() => []);

  return (
    <>
      <Header title="利用者管理" description="利用者の基本情報と受給者証を一元管理" />
      <div className="p-6">
        <ClientList clients={clients} />
      </div>
    </>
  );
}
