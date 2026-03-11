import { Header } from "@/components/layout/Header";
import { AttendanceBoard } from "@/components/attendance/AttendanceBoard";
import { getAttendanceByDate, getOfficeId } from "@/lib/supabase/queries";

export default async function AttendancePage() {
  const today = new Date().toISOString().split("T")[0];
  const [records, officeId] = await Promise.all([
    getAttendanceByDate(today).catch(() => []),
    getOfficeId(),
  ]);

  return (
    <>
      <Header title="出席管理" description="利用者の出席・作業実績をワンタップで記録" />
      <div className="p-6">
        <AttendanceBoard initialRecords={records} initialDate={today} officeId={officeId} />
      </div>
    </>
  );
}
