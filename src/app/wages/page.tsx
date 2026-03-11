import { Header } from "@/components/layout/Header";
import { WageManagement } from "@/components/wages/WageManagement";
import { getWageData } from "@/lib/supabase/queries";
import { getAvgWageMonthly } from "@/lib/supabase/queries";

type Props = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

export default async function WagesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const now = new Date();
  const defaultMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const defaultYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  const year = sp.year ? parseInt(sp.year) : defaultYear;
  const month = sp.month ? parseInt(sp.month) : defaultMonth;

  const [wageData, avgWage] = await Promise.all([
    getWageData(year, month).catch(() => ({
      year,
      month,
      totalRevenue: 0,
      totalExpense: 0,
      distributable: 0,
      clientWages: [],
    })),
    getAvgWageMonthly(year).catch(() => null),
  ]);

  return (
    <>
      <Header title="工賃管理" description="生産活動収支と工賃計算を管理" />
      <div className="p-6">
        <WageManagement data={wageData} avgWage={avgWage} />
      </div>
    </>
  );
}
