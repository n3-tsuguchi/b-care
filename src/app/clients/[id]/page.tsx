import { Header } from "@/components/layout/Header";
import { ClientDetail } from "@/components/clients/ClientDetail";
import { getClientById } from "@/lib/supabase/queries";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClientById(id).catch(() => null);

  return (
    <>
      <Header title="利用者詳細" />
      <div className="p-6">
        <ClientDetail client={client} />
      </div>
    </>
  );
}
