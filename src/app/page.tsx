import { Header } from "@/components/layout/Header";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { AlertsList } from "@/components/dashboard/AlertsList";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { WageTrend } from "@/components/dashboard/WageTrend";
import { SupportPlanSummary } from "@/components/dashboard/SupportPlanSummary";
import {
  getDashboardStats,
  getAlerts,
  getRecentAttendanceStats,
  getMonthlyWageTrend,
} from "@/lib/supabase/queries";

export default async function DashboardPage() {
  const [stats, alerts, recentAttendance, wageTrend] = await Promise.all([
    getDashboardStats().catch(() => null),
    getAlerts().catch(() => []),
    getRecentAttendanceStats().catch(() => []),
    getMonthlyWageTrend().catch(() => []),
  ]);

  return (
    <>
      <Header title="ダッシュボード" description="事業所の経営状況を一目で確認" />
      <div className="space-y-6 p-6">
        <StatsCards stats={stats} />
        <div className="grid gap-6 lg:grid-cols-2">
          <AlertsList alerts={alerts} />
          <AttendanceChart data={recentAttendance} capacity={stats?.attendance.capacity ?? 20} />
        </div>
        <WageTrend data={wageTrend} />
        {stats && (
          <SupportPlanSummary
            plans={stats.supportPlans}
            certificates={stats.certificates}
          />
        )}
      </div>
    </>
  );
}
