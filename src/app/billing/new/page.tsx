import { Header } from "@/components/layout/Header";
import { BillingWizard } from "@/components/billing/BillingWizard";

export default function BillingNewPage() {
  return (
    <>
      <Header
        title="請求データ作成"
        description="出席データから請求データを自動生成し、AIチェックを実行します"
      />
      <BillingWizard />
    </>
  );
}
