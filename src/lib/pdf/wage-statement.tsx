import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { commonStyles, colors } from "./styles";

const s = StyleSheet.create({
  container: {
    padding: 40,
    fontFamily: "NotoSansJP",
    fontSize: 9,
    color: "#000000",
  },
  title: {
    fontSize: 14,
    fontFamily: "NotoSansJP-Bold",
    textAlign: "center",
    marginBottom: 4,
    letterSpacing: 2,
  },
  period: {
    fontSize: 10,
    textAlign: "center",
    marginBottom: 16,
    color: "#555555",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoBlock: {
    width: "48%",
  },
  label: {
    fontSize: 8,
    color: "#555555",
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    fontFamily: "NotoSansJP-Bold",
  },
  // テーブル
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: colors.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 24,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.lightBorder,
    minHeight: 22,
    alignItems: "center",
  },
  totalRow: {
    flexDirection: "row",
    backgroundColor: colors.lightGray,
    borderTopWidth: 2,
    borderTopColor: colors.border,
    minHeight: 28,
    alignItems: "center",
  },
  col1: { width: "40%", paddingHorizontal: 6 },
  col2: { width: "30%", paddingHorizontal: 6 },
  col3: { width: "30%", paddingHorizontal: 6 },
  headerCell: {
    fontSize: 8,
    fontFamily: "NotoSansJP-Bold",
    textAlign: "center",
  },
  cell: { fontSize: 9 },
  cellRight: { fontSize: 9, textAlign: "right" },
  cellBold: { fontSize: 10, fontFamily: "NotoSansJP-Bold", textAlign: "right" },
  // 差引支給額
  netPaySection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: 16,
  },
  netPayLabel: {
    fontSize: 11,
    fontFamily: "NotoSansJP-Bold",
    marginRight: 16,
  },
  netPayAmount: {
    fontSize: 20,
    fontFamily: "NotoSansJP-Bold",
  },
  yen: {
    fontSize: 11,
    marginLeft: 2,
  },
  // 出勤情報
  attendanceTable: {
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  attRow: {
    flexDirection: "row",
    minHeight: 22,
    alignItems: "center",
  },
  attLabel: {
    width: "30%",
    paddingHorizontal: 6,
    backgroundColor: colors.headerBg,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    fontSize: 8,
    fontFamily: "NotoSansJP-Bold",
    height: "100%",
    justifyContent: "center",
  },
  attValue: {
    width: "20%",
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: colors.lightBorder,
    fontSize: 9,
    textAlign: "right",
  },
  attLabel2: {
    width: "30%",
    paddingHorizontal: 6,
    backgroundColor: colors.headerBg,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    fontSize: 8,
    fontFamily: "NotoSansJP-Bold",
    height: "100%",
    justifyContent: "center",
  },
  attValue2: {
    width: "20%",
    paddingHorizontal: 6,
    fontSize: 9,
    textAlign: "right",
  },
  // 事業所印
  stampRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
});

export type WageStatementData = {
  clientName: string;
  clientNumber: string | null;
  targetYearMonth: string;
  officeName: string;
  officeAddress: string;
  workingDays: number;
  totalHours: number;
  baseWage: number;
  pieceWage: number;
  adjustment: number;
  totalWage: number;
};

function fmt(n: number): string {
  return n.toLocaleString("ja-JP");
}

export function WageStatementPdf({ data }: { data: WageStatementData }) {
  const wageItems = [
    { label: "基本工賃", detail: `${data.workingDays}日 x 時給/日給`, amount: data.baseWage },
    ...(data.pieceWage > 0
      ? [{ label: "出来高工賃", detail: "", amount: data.pieceWage }]
      : []),
    ...(data.adjustment !== 0
      ? [{ label: "調整額", detail: "", amount: data.adjustment }]
      : []),
  ];

  return (
    <Document>
      <Page size="A4" style={s.container}>
        <Text style={s.title}>工 賃 明 細 書</Text>
        <Text style={s.period}>{data.targetYearMonth}</Text>

        {/* 利用者・事業所情報 */}
        <View style={s.infoRow}>
          <View style={s.infoBlock}>
            <Text style={s.label}>利用者名</Text>
            <Text style={s.value}>{data.clientName} 様</Text>
            {data.clientNumber && (
              <Text style={{ fontSize: 8, color: "#555555", marginTop: 2 }}>
                利用者番号: {data.clientNumber}
              </Text>
            )}
          </View>
          <View style={s.infoBlock}>
            <Text style={s.label}>事業所名</Text>
            <Text style={s.value}>{data.officeName}</Text>
            {data.officeAddress && (
              <Text style={{ fontSize: 8, color: "#555555", marginTop: 2 }}>
                {data.officeAddress}
              </Text>
            )}
          </View>
        </View>

        {/* 差引支給額 */}
        <View style={s.netPaySection}>
          <Text style={s.netPayLabel}>差引支給額</Text>
          <Text style={s.netPayAmount}>{fmt(data.totalWage)}</Text>
          <Text style={s.yen}>円</Text>
        </View>

        {/* 出勤情報 */}
        <View style={s.attendanceTable}>
          <View style={{ ...s.attRow, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={s.attLabel}>
              <Text>出勤日数</Text>
            </View>
            <Text style={s.attValue}>{data.workingDays} 日</Text>
            <View style={s.attLabel2}>
              <Text>作業時間合計</Text>
            </View>
            <Text style={s.attValue2}>{data.totalHours.toFixed(1)} 時間</Text>
          </View>
        </View>

        {/* 工賃明細テーブル */}
        <View style={s.table}>
          <View style={s.headerRow}>
            <View style={s.col1}>
              <Text style={s.headerCell}>項目</Text>
            </View>
            <View style={s.col2}>
              <Text style={s.headerCell}>内訳</Text>
            </View>
            <View style={s.col3}>
              <Text style={s.headerCell}>金額</Text>
            </View>
          </View>
          {wageItems.map((item, i) => (
            <View key={i} style={s.row}>
              <View style={s.col1}>
                <Text style={s.cell}>{item.label}</Text>
              </View>
              <View style={s.col2}>
                <Text style={s.cell}>{item.detail}</Text>
              </View>
              <View style={s.col3}>
                <Text style={s.cellRight}>{fmt(item.amount)} 円</Text>
              </View>
            </View>
          ))}
          <View style={s.totalRow}>
            <View style={s.col1}>
              <Text style={s.cellBold}>合計</Text>
            </View>
            <View style={s.col2}>
              <Text style={s.cell} />
            </View>
            <View style={s.col3}>
              <Text style={s.cellBold}>{fmt(data.totalWage)} 円</Text>
            </View>
          </View>
        </View>

        {/* 印鑑欄 */}
        <View style={s.stampRow}>
          <View style={{ alignItems: "center", marginRight: 16 }}>
            <Text style={{ fontSize: 8, marginBottom: 4 }}>事業所印</Text>
            <View style={commonStyles.stampBox} />
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 8, marginBottom: 4 }}>受領印</Text>
            <View style={commonStyles.stampBox} />
          </View>
        </View>

        <Text style={commonStyles.footer}>B-Care 就労継続支援B型 経理管理システム</Text>
      </Page>
    </Document>
  );
}
