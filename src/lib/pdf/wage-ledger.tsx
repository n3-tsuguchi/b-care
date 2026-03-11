import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { commonStyles, colors } from "./styles";

const s = StyleSheet.create({
  container: {
    padding: 30,
    fontFamily: "NotoSansJP",
    fontSize: 8,
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
    marginBottom: 12,
    color: "#555555",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: colors.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 22,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: colors.lightBorder,
    minHeight: 20,
    alignItems: "center",
  },
  totalRow: {
    flexDirection: "row",
    backgroundColor: colors.lightGray,
    borderTopWidth: 2,
    borderTopColor: colors.border,
    minHeight: 24,
    alignItems: "center",
  },
  colNo: { width: "6%", paddingHorizontal: 3 },
  colName: { width: "16%", paddingHorizontal: 3 },
  colDays: { width: "8%", paddingHorizontal: 3, textAlign: "right" },
  colHours: { width: "10%", paddingHorizontal: 3, textAlign: "right" },
  colBase: { width: "12%", paddingHorizontal: 3, textAlign: "right" },
  colPiece: { width: "12%", paddingHorizontal: 3, textAlign: "right" },
  colAdj: { width: "10%", paddingHorizontal: 3, textAlign: "right" },
  colTotal: { width: "14%", paddingHorizontal: 3, textAlign: "right" },
  colStatus: { width: "12%", paddingHorizontal: 3, textAlign: "center" },
  headerText: {
    fontSize: 7,
    fontFamily: "NotoSansJP-Bold",
    textAlign: "center",
  },
  cell: { fontSize: 8 },
  cellRight: { fontSize: 8, textAlign: "right" },
  cellBold: { fontSize: 8, fontFamily: "NotoSansJP-Bold", textAlign: "right" },
  cellCenter: { fontSize: 8, textAlign: "center" },
  summarySection: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: "row",
    minHeight: 20,
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: colors.lightBorder,
  },
  summaryLabel: {
    width: "30%",
    paddingHorizontal: 6,
    backgroundColor: colors.headerBg,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    fontSize: 8,
    fontFamily: "NotoSansJP-Bold",
  },
  summaryValue: {
    width: "20%",
    paddingHorizontal: 6,
    textAlign: "right",
    fontSize: 9,
  },
  signRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
});

export type WageLedgerEntry = {
  clientNumber: string;
  clientName: string;
  workingDays: number;
  totalHours: number;
  baseWage: number;
  pieceWage: number;
  adjustment: number;
  totalWage: number;
  status: string;
};

export type WageLedgerData = {
  officeName: string;
  officeNumber: string;
  targetYearMonth: string;
  entries: WageLedgerEntry[];
  totalRevenue: number;
  totalExpense: number;
  distributable: number;
};

function fmt(n: number): string {
  return n.toLocaleString("ja-JP");
}

export function WageLedgerPdf({ data }: { data: WageLedgerData }) {
  const totals = data.entries.reduce(
    (acc, e) => ({
      days: acc.days + e.workingDays,
      hours: acc.hours + e.totalHours,
      base: acc.base + e.baseWage,
      piece: acc.piece + e.pieceWage,
      adj: acc.adj + e.adjustment,
      total: acc.total + e.totalWage,
    }),
    { days: 0, hours: 0, base: 0, piece: 0, adj: 0, total: 0 }
  );

  return (
    <Document>
      <Page size="A4" style={s.container}>
        <Text style={s.title}>工 賃 支 払 台 帳</Text>
        <Text style={s.period}>{data.targetYearMonth}</Text>

        <View style={s.infoRow}>
          <Text style={{ fontSize: 9 }}>
            事業所: {data.officeName}（{data.officeNumber}）
          </Text>
          <Text style={{ fontSize: 8, color: "#555" }}>
            対象者数: {data.entries.length}名
          </Text>
        </View>

        {/* テーブル */}
        <View style={s.table}>
          <View style={s.headerRow}>
            <View style={s.colNo}><Text style={s.headerText}>No.</Text></View>
            <View style={s.colName}><Text style={s.headerText}>氏名</Text></View>
            <View style={s.colDays}><Text style={s.headerText}>出勤日</Text></View>
            <View style={s.colHours}><Text style={s.headerText}>作業時間</Text></View>
            <View style={s.colBase}><Text style={s.headerText}>基本工賃</Text></View>
            <View style={s.colPiece}><Text style={s.headerText}>出来高</Text></View>
            <View style={s.colAdj}><Text style={s.headerText}>調整額</Text></View>
            <View style={s.colTotal}><Text style={s.headerText}>支給合計</Text></View>
            <View style={s.colStatus}><Text style={s.headerText}>状態</Text></View>
          </View>

          {data.entries.map((entry, i) => (
            <View key={i} style={s.row}>
              <View style={s.colNo}><Text style={s.cellCenter}>{i + 1}</Text></View>
              <View style={s.colName}><Text style={s.cell}>{entry.clientName}</Text></View>
              <View style={s.colDays}><Text style={s.cellRight}>{entry.workingDays}</Text></View>
              <View style={s.colHours}><Text style={s.cellRight}>{entry.totalHours.toFixed(1)}</Text></View>
              <View style={s.colBase}><Text style={s.cellRight}>{fmt(entry.baseWage)}</Text></View>
              <View style={s.colPiece}><Text style={s.cellRight}>{fmt(entry.pieceWage)}</Text></View>
              <View style={s.colAdj}><Text style={s.cellRight}>{fmt(entry.adjustment)}</Text></View>
              <View style={s.colTotal}><Text style={s.cellBold}>{fmt(entry.totalWage)}</Text></View>
              <View style={s.colStatus}>
                <Text style={s.cellCenter}>
                  {entry.status === "confirmed" ? "確定" : entry.status === "paid" ? "支払済" : "下書き"}
                </Text>
              </View>
            </View>
          ))}

          <View style={s.totalRow}>
            <View style={s.colNo}><Text style={s.cell} /></View>
            <View style={s.colName}><Text style={{ ...s.cell, fontFamily: "NotoSansJP-Bold" }}>合計</Text></View>
            <View style={s.colDays}><Text style={s.cellBold}>{totals.days}</Text></View>
            <View style={s.colHours}><Text style={s.cellBold}>{totals.hours.toFixed(1)}</Text></View>
            <View style={s.colBase}><Text style={s.cellBold}>{fmt(totals.base)}</Text></View>
            <View style={s.colPiece}><Text style={s.cellBold}>{fmt(totals.piece)}</Text></View>
            <View style={s.colAdj}><Text style={s.cellBold}>{fmt(totals.adj)}</Text></View>
            <View style={s.colTotal}><Text style={s.cellBold}>{fmt(totals.total)}</Text></View>
            <View style={s.colStatus}><Text style={s.cell} /></View>
          </View>
        </View>

        {/* 収支サマリー */}
        <View style={s.summarySection}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>生産活動収入</Text>
            <Text style={s.summaryValue}>{fmt(data.totalRevenue)} 円</Text>
            <Text style={s.summaryLabel}>生産活動経費</Text>
            <Text style={s.summaryValue}>{fmt(data.totalExpense)} 円</Text>
          </View>
          <View style={{ ...s.summaryRow, borderBottomWidth: 0 }}>
            <Text style={s.summaryLabel}>分配可能額（収入−経費）</Text>
            <Text style={s.summaryValue}>{fmt(data.distributable)} 円</Text>
            <Text style={s.summaryLabel}>工賃支払合計</Text>
            <Text style={{ ...s.summaryValue, fontFamily: "NotoSansJP-Bold" }}>{fmt(totals.total)} 円</Text>
          </View>
        </View>

        {/* 確認印欄 */}
        <View style={s.signRow}>
          <View style={commonStyles.stampBox}>
            <Text style={commonStyles.stampLabel}>管理者</Text>
          </View>
          <View style={commonStyles.stampBox}>
            <Text style={commonStyles.stampLabel}>経理担当</Text>
          </View>
        </View>

        <Text style={commonStyles.footer}>B-Care 就労継続支援B型 経理管理システム</Text>
      </Page>
    </Document>
  );
}
