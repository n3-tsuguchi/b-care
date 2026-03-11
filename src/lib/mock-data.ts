// ダッシュボード用モックデータ

export const dashboardStats = {
  billing: {
    currentMonth: 2_850_000,
    previousMonth: 2_720_000,
    changePercent: 4.8,
  },
  attendance: {
    today: 18,
    capacity: 20,
    monthlyRate: 87.5,
  },
  wage: {
    currentMonth: 385_000,
    avgPerPerson: 17_500,
    yearlyAvg: 16_800,
  },
  clients: {
    active: 24,
    new: 2,
    terminated: 0,
  },
};

export const alerts = [
  {
    id: "1",
    type: "cert_expiry" as const,
    severity: "critical" as const,
    title: "受給者証期限切れ間近",
    message: "山田太郎さんの受給者証が2026年3月31日に期限切れとなります。更新手続きをご確認ください。",
    dueDate: "2026-03-31",
    createdAt: "2026-03-10",
  },
  {
    id: "2",
    type: "plan_review" as const,
    severity: "warning" as const,
    title: "個別支援計画の更新時期",
    message: "佐藤花子さんの個別支援計画のモニタリング期限が近づいています。",
    dueDate: "2026-03-25",
    createdAt: "2026-03-08",
  },
  {
    id: "3",
    type: "billing_deadline" as const,
    severity: "warning" as const,
    title: "国保連請求締切リマインド",
    message: "2月分の国保連請求データ提出期限は3月10日です。",
    dueDate: "2026-03-10",
    createdAt: "2026-03-01",
  },
];

export const recentAttendance = [
  { date: "2026-03-10", present: 18, absent: 2, late: 1 },
  { date: "2026-03-09", present: 17, absent: 3, late: 0 },
  { date: "2026-03-08", present: 19, absent: 1, late: 1 },
  { date: "2026-03-07", present: 16, absent: 4, late: 2 },
  { date: "2026-03-06", present: 20, absent: 0, late: 0 },
];

export const monthlyWageTrend = [
  { month: "2025-10", avg: 16200 },
  { month: "2025-11", avg: 16800 },
  { month: "2025-12", avg: 15900 },
  { month: "2026-01", avg: 17100 },
  { month: "2026-02", avg: 17500 },
];

// 利用者モックデータ
export const clients = [
  {
    id: "1",
    clientNumber: "B-001",
    familyName: "山田",
    givenName: "太郎",
    familyNameKana: "ヤマダ",
    givenNameKana: "タロウ",
    birthDate: "1990-05-15",
    gender: "male",
    disabilityType: "intellectual",
    supportCategory: 3,
    status: "active",
    enrollmentDate: "2024-04-01",
    certificate: {
      number: "1234567890",
      decisionEndDate: "2026-03-31",
      monthlyDaysLimit: 22,
      incomeCategory: "low_income",
      copayLimit: 0,
    },
  },
  {
    id: "2",
    clientNumber: "B-002",
    familyName: "佐藤",
    givenName: "花子",
    familyNameKana: "サトウ",
    givenNameKana: "ハナコ",
    birthDate: "1985-11-20",
    gender: "female",
    disabilityType: "mental",
    supportCategory: 2,
    status: "active",
    enrollmentDate: "2023-10-01",
    certificate: {
      number: "2345678901",
      decisionEndDate: "2026-09-30",
      monthlyDaysLimit: 20,
      incomeCategory: "low_income",
      copayLimit: 0,
    },
  },
  {
    id: "3",
    clientNumber: "B-003",
    familyName: "鈴木",
    givenName: "一郎",
    familyNameKana: "スズキ",
    givenNameKana: "イチロウ",
    birthDate: "1978-03-08",
    gender: "male",
    disabilityType: "physical",
    supportCategory: 4,
    status: "active",
    enrollmentDate: "2022-04-01",
    certificate: {
      number: "3456789012",
      decisionEndDate: "2027-03-31",
      monthlyDaysLimit: 22,
      incomeCategory: "general_1",
      copayLimit: 9300,
    },
  },
  {
    id: "4",
    clientNumber: "B-004",
    familyName: "田中",
    givenName: "美咲",
    familyNameKana: "タナカ",
    givenNameKana: "ミサキ",
    birthDate: "1995-07-22",
    gender: "female",
    disabilityType: "developmental",
    supportCategory: 2,
    status: "active",
    enrollmentDate: "2025-01-15",
    certificate: {
      number: "4567890123",
      decisionEndDate: "2026-12-31",
      monthlyDaysLimit: 18,
      incomeCategory: "low_income",
      copayLimit: 0,
    },
  },
  {
    id: "5",
    clientNumber: "B-005",
    familyName: "高橋",
    givenName: "健太",
    familyNameKana: "タカハシ",
    givenNameKana: "ケンタ",
    birthDate: "1988-12-03",
    gender: "male",
    disabilityType: "mental",
    supportCategory: 3,
    status: "active",
    enrollmentDate: "2024-07-01",
    certificate: {
      number: "5678901234",
      decisionEndDate: "2026-06-30",
      monthlyDaysLimit: 22,
      incomeCategory: "low_income",
      copayLimit: 0,
    },
  },
  {
    id: "6",
    clientNumber: "B-006",
    familyName: "伊藤",
    givenName: "愛",
    familyNameKana: "イトウ",
    givenNameKana: "アイ",
    birthDate: "2000-01-10",
    gender: "female",
    disabilityType: "intellectual",
    supportCategory: 3,
    status: "active",
    enrollmentDate: "2025-04-01",
    certificate: {
      number: "6789012345",
      decisionEndDate: "2027-03-31",
      monthlyDaysLimit: 20,
      incomeCategory: "low_income",
      copayLimit: 0,
    },
  },
];

// 出席モックデータ（本日分）
export const todayAttendance = clients.map((client, index) => ({
  clientId: client.id,
  clientNumber: client.clientNumber,
  familyName: client.familyName,
  givenName: client.givenName,
  status: index < 4 ? "present" : index === 4 ? "absent" : ("" as string),
  checkInTime: index < 4 ? `09:${String(index * 5 + 10).padStart(2, "0")}` : "",
  checkOutTime: index < 3 ? `15:${String(30 + index * 5).padStart(2, "0")}` : "",
  pickupOutbound: index % 3 === 0,
  pickupInbound: index % 3 === 0,
  mealProvided: index < 4,
}));

// 工賃モックデータ
export const wageData = {
  summary: {
    year: 2025,
    month: 2,
    totalRevenue: 520_000,
    totalExpense: 135_000,
    distributable: 385_000,
  },
  clientWages: clients.map((client, i) => ({
    clientId: client.id,
    clientNumber: client.clientNumber,
    familyName: client.familyName,
    givenName: client.givenName,
    workingDays: 18 - i,
    totalHours: (18 - i) * 4.5,
    baseWage: (18 - i) * 250 * 4.5,
    pieceWage: Math.floor(Math.random() * 3000),
    totalWage: Math.floor((18 - i) * 250 * 4.5 + Math.random() * 3000),
    status: i < 3 ? "confirmed" : "draft",
  })),
};

// 請求モックデータ
export const billingData = {
  batches: [
    {
      id: "b1",
      targetYear: 2026,
      targetMonth: 2,
      status: "submitted",
      totalUnits: 12450,
      totalAmount: 1_245_000,
      totalCopay: 9_300,
      submittedAt: "2026-03-08",
    },
    {
      id: "b2",
      targetYear: 2026,
      targetMonth: 1,
      status: "paid",
      totalUnits: 11800,
      totalAmount: 1_180_000,
      totalCopay: 9_300,
      paidAt: "2026-03-15",
      paidAmount: 1_170_700,
    },
    {
      id: "b3",
      targetYear: 2025,
      targetMonth: 12,
      status: "paid",
      totalUnits: 10900,
      totalAmount: 1_090_000,
      totalCopay: 9_300,
      paidAt: "2026-02-15",
      paidAmount: 1_080_700,
    },
  ],
};

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
