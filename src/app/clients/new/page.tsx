import { Header } from "@/components/layout/Header";
import { ClientForm } from "@/components/clients/ClientForm";
import { getOfficeId } from "@/lib/supabase/queries";

export default async function NewClientPage() {
  const officeId = await getOfficeId().catch(() => null);

  if (!officeId) {
    return (
      <>
        <Header title="利用者登録" description="" />
        <div className="p-6">
          <p className="text-muted-foreground">ログインしてください。</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="利用者登録" description="新しい利用者の基本情報と受給者証を登録します" />
      <div className="p-6">
        <ClientForm officeId={officeId} />
      </div>
    </>
  );
}
