import { Header } from "@/components/layout/Header";
import { SupportRecordBoard } from "@/components/support-records/SupportRecordBoard";
import { getSupportRecordsByDate, getOfficeId } from "@/lib/supabase/queries";

export default async function SupportRecordsPage() {
  const today = new Date().toISOString().split("T")[0];
  const [records, officeId] = await Promise.all([
    getSupportRecordsByDate(today).catch(() => []),
    getOfficeId(),
  ]);

  return (
    <>
      <Header title="支援記録" description="利用者の日々の支援内容を記録" />
      <div className="p-6">
        <SupportRecordBoard initialRecords={records} initialDate={today} officeId={officeId} />
      </div>
    </>
  );
}
