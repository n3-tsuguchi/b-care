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
    fontSize: 16,
    fontFamily: "NotoSansJP-Bold",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 4,
  },
  invoiceNumber: {
    fontSize: 8,
    textAlign: "right",
    marginBottom: 4,
  },
  dateRow: {
    fontSize: 9,
    textAlign: "right",
    marginBottom: 16,
  },
  clientName: {
    fontSize: 12,
    fontFamily: "NotoSansJP-Bold",
    marginBottom: 4,
  },
  sama: {
    fontSize: 10,
    marginLeft: 8,
  },
  clientSection: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
  },
  officeSection: {
    alignItems: "flex-end",
    marginBottom: 20,
  },
  officeName: {
    fontSize: 10,
    fontFamily: "NotoSansJP-Bold",
    marginBottom: 2,
  },
  officeInfo: {
    fontSize: 8,
    color: "#555555",
    marginBottom: 1,
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: colors.border,
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: "NotoSansJP-Bold",
    marginRight: 16,
  },
  totalAmount: {
    fontSize: 18,
    fontFamily: "NotoSansJP-Bold",
  },
  yen: {
    fontSize: 11,
    marginLeft: 2,
  },
  // 明細テーブル
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
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
  rowLast: {
    flexDirection: "row",
    minHeight: 22,
    alignItems: "center",
  },
  totalRow: {
    flexDirection: "row",
    backgroundColor: colors.lightGray,
    borderTopWidth: 2,
    borderTopColor: colors.border,
    minHeight: 26,
    alignItems: "center",
  },
  colItem: { width: "50%", paddingHorizontal: 6 },
  colAmount: { width: "25%", paddingHorizontal: 6, textAlign: "right" },
  colNote: { width: "25%", paddingHorizontal: 6, textAlign: "center" },
  headerCell: {
    fontSize: 8,
    fontFamily: "NotoSansJP-Bold",
    textAlign: "center",
  },
  cell: { fontSize: 9 },
  cellRight: { fontSize: 9, textAlign: "right" },
  cellBold: { fontSize: 9, fontFamily: "NotoSansJP-Bold", textAlign: "right" },
  // 備考
  noteSection: {
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.lightBorder,
    minHeight: 40,
  },
  noteLabel: {
    fontSize: 8,
    fontFamily: "NotoSansJP-Bold",
    marginBottom: 4,
  },
  noteText: {
    fontSize: 8,
    color: "#555555",
  },
  // 印鑑欄
  stampRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 24,
  },
});

export type ClientInvoiceData = {
  invoiceNumber: string;
  invoiceDate: string;
  clientName: string;
  targetYearMonth: string;
  officeName: string;
  officeAddress: string;
  officePhone: string;
  copayAmount: number;
  mealCost: number;
  otherCost: number;
  totalAmount: number;
};

function formatAmount(n: number): string {
  return n.toLocaleString("ja-JP");
}

export function ClientInvoicePdf({ data }: { data: ClientInvoiceData }) {
  const items = [
    { label: "障害福祉サービス利用者負担額", amount: data.copayAmount, note: "" },
    ...(data.mealCost > 0
      ? [{ label: "食費", amount: data.mealCost, note: "" }]
      : []),
    ...(data.otherCost > 0
      ? [{ label: "その他実費", amount: data.otherCost, note: "" }]
      : []),
  ];

  return (
    <Document>
      <Page size="A4" style={s.container}>
        <Text style={s.invoiceNumber}>No. {data.invoiceNumber}</Text>
        <Text style={s.dateRow}>{data.invoiceDate}</Text>

        <Text style={s.title}>請 求 書</Text>

        {/* 宛先 */}
        <View style={s.clientSection}>
          <View style={{ flexDirection: "row", alignItems: "baseline" }}>
            <Text style={s.clientName}>{data.clientName}</Text>
            <Text style={s.sama}>様</Text>
          </View>
          <Text style={{ fontSize: 8, color: "#555555" }}>
            {data.targetYearMonth} ご利用分
          </Text>
        </View>

        {/* 事業所情報 */}
        <View style={s.officeSection}>
          <Text style={s.officeName}>{data.officeName}</Text>
          {data.officeAddress && (
            <Text style={s.officeInfo}>{data.officeAddress}</Text>
          )}
          {data.officePhone && (
            <Text style={s.officeInfo}>TEL: {data.officePhone}</Text>
          )}
        </View>

        {/* 合計金額 */}
        <View style={s.totalSection}>
          <Text style={s.totalLabel}>ご請求金額</Text>
          <Text style={s.totalAmount}>{formatAmount(data.totalAmount)}</Text>
          <Text style={s.yen}>円</Text>
        </View>

        {/* 明細テーブル */}
        <View style={s.table}>
          <View style={s.headerRow}>
            <View style={s.colItem}>
              <Text style={s.headerCell}>項目</Text>
            </View>
            <View style={s.colAmount}>
              <Text style={s.headerCell}>金額</Text>
            </View>
            <View style={s.colNote}>
              <Text style={s.headerCell}>備考</Text>
            </View>
          </View>
          {items.map((item, i) => (
            <View
              key={i}
              style={i === items.length - 1 ? s.rowLast : s.row}
            >
              <View style={s.colItem}>
                <Text style={s.cell}>{item.label}</Text>
              </View>
              <View style={s.colAmount}>
                <Text style={s.cellRight}>
                  {formatAmount(item.amount)} 円
                </Text>
              </View>
              <View style={s.colNote}>
                <Text style={s.cell}>{item.note}</Text>
              </View>
            </View>
          ))}
          <View style={s.totalRow}>
            <View style={s.colItem}>
              <Text style={s.cellBold}>合計</Text>
            </View>
            <View style={s.colAmount}>
              <Text style={s.cellBold}>
                {formatAmount(data.totalAmount)} 円
              </Text>
            </View>
            <View style={s.colNote}>
              <Text style={s.cell} />
            </View>
          </View>
        </View>

        {/* 備考 */}
        <View style={s.noteSection}>
          <Text style={s.noteLabel}>備考</Text>
          <Text style={s.noteText}>
            お支払い期日までにお支払いいただきますようお願い申し上げます。
          </Text>
        </View>

        {/* 印鑑欄 */}
        <View style={s.stampRow}>
          <View style={commonStyles.stampBox}>
            <Text style={commonStyles.stampLabel}>確認印</Text>
          </View>
        </View>

        <Text style={commonStyles.footer}>B-Care 就労継続支援B型 経理管理システム</Text>
      </Page>
    </Document>
  );
}
