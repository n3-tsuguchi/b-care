// ラベル定数（UIで使用する表示ラベル）

export const disabilityTypeLabels: Record<string, string> = {
  physical: "身体障害",
  intellectual: "知的障害",
  mental: "精神障害",
  developmental: "発達障害",
  intractable: "難病",
};

export const statusLabels: Record<string, string> = {
  active: "利用中",
  suspended: "休止中",
  terminated: "終了",
};

export const billingStatusLabels: Record<string, string> = {
  draft: "作成中",
  checked: "チェック済",
  exported: "CSV出力済",
  submitted: "提出済",
  paid: "入金済",
  returned: "返戻",
};

export const incomeCategoryLabels: Record<string, string> = {
  seikatsu_hogo: "生活保護",
  low_income: "低所得",
  general_1: "一般1",
  general_2: "一般2",
};
