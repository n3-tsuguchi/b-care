// クエリモジュールの一括エクスポート
// 既存の import { xxx } from "@/lib/supabase/queries" との互換性を維持

export { getOfficeId } from "./common";
export { getClients, getClientById, getActiveClientsForPlan } from "./clients";
export type { ClientWithCertificate } from "./clients";
export { getAttendanceByDate, getRecentAttendanceStats } from "./attendance";
export type { AttendanceRecord, DailyAttendanceStats } from "./attendance";
export { getBillingBatches } from "./billing";
export type { BillingBatch } from "./billing";
export { getWageData, getMonthlyWageTrend, getAvgWageMonthly } from "./wages";
export type { MonthlyWageEntry, WageSummary, MonthlyWageTrendItem, AvgWageMonthly } from "./wages";
export { getDashboardStats } from "./dashboard";
export type { DashboardStats } from "./dashboard";
export { getAlerts } from "./alerts";
export type { AlertItem } from "./alerts";
export { getOfficeSettings } from "./settings";
export type { OfficeSettings } from "./settings";
export { getSupportRecordsByDate } from "./support-records";
export type { SupportRecord } from "./support-records";
export { getSupportPlans, getSupportPlanDetail } from "./support-plans";
export type { SupportPlan, SupportPlanGoal, SupportPlanReview } from "./support-plans";
