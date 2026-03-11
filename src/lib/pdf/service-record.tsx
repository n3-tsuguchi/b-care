import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { commonStyles, colors } from "./styles";

const s = StyleSheet.create({
  container: {
    padding: 20,
    fontFamily: "NotoSansJP",
    fontSize: 7,
    color: "#000000",
  },
  title: {
    fontSize: 12,
    fontFamily: "NotoSansJP-Bold",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 2,
  },
  // ヘッダー情報
  infoGrid: {
    flexDirection: "row",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoCell: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  infoCellLast: {
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  infoLabel: {
    fontSize: 6,
    color: "#555555",
    fontFamily: "NotoSansJP-Bold",
  },
  infoValue: {
    fontSize: 8,
    marginTop: 1,
  },
  // 日別テーブル
  dayTable: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayHeaderRow: {
    flexDirection: "row",
    backgroundColor: colors.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 18,
    alignItems: "center",
  },
  dayRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: colors.lightBorder,
    minHeight: 14,
    alignItems: "center",
  },
  dayRowPresent: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: colors.lightBorder,
    minHeight: 14,
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  colDay: { width: "6%", paddingHorizontal: 2, textAlign: "center" },
  colWeekday: { width: "6%", paddingHorizontal: 2, textAlign: "center" },
  colStatus: { width: "8%", paddingHorizontal: 2, textAlign: "center" },
  colTime: { width: "10%", paddingHorizontal: 2, textAlign: "center" },
  colHours: { width: "8%", paddingHorizontal: 2, textAlign: "right" },
  colPickup: { width: "7%", paddingHorizontal: 2, textAlign: "center" },
  colMeal: { width: "7%", paddingHorizontal: 2, textAlign: "center" },
  colNote: { width: "20%", paddingHorizontal: 2 },
  headerText: {
    fontSize: 6,
    fontFamily: "NotoSansJP-Bold",
    textAlign: "center",
  },
  cellText: {
    fontSize: 6.5,
  },
  cellTextCenter: {
    fontSize: 6.5,
    textAlign: "center",
  },
  // 集計
  summaryTable: {
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: "row",
    minHeight: 20,
    alignItems: "center",
  },
  summaryLabel: {
    width: "25%",
    paddingHorizontal: 6,
    backgroundColor: colors.headerBg,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    fontSize: 7,
    fontFamily: "NotoSansJP-Bold",
    height: "100%",
    justifyContent: "center",
  },
  summaryValue: {
    width: "25%",
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: colors.lightBorder,
    fontSize: 8,
    textAlign: "right",
  },
  // 確認欄
  signRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  signBox: {
    borderWidth: 1,
    borderColor: colors.border,
    width: 100,
    marginLeft: 8,
  },
  signLabel: {
    fontSize: 6,
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 2,
    backgroundColor: colors.headerBg,
    fontFamily: "NotoSansJP-Bold",
  },
  signSpace: {
    height: 36,
  },
});

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

const statusText: Record<string, string> = {
  present: "出席",
  absent: "欠席",
  late: "遅刻",
  early_leave: "早退",
  absent_notified: "欠（届）",
};

export type DayRecord = {
  day: number;
  weekday: number; // 0=日 6=土
  status: string | null; // null = 開所日でない
  checkIn: string | null;
  checkOut: string | null;
  serviceHours: number | null;
  pickupOut: boolean;
  pickupIn: boolean;
  meal: boolean;
  note: string;
};

export type ServiceRecordData = {
  clientName: string;
  certificateNumber: string;
  officeName: string;
  officeNumber: string;
  targetYear: number;
  targetMonth: number;
  days: DayRecord[];
  summary: {
    presentDays: number;
    totalServiceHours: number;
    pickupOutDays: number;
    pickupInDays: number;
    mealDays: number;
  };
};

export function ServiceRecordPdf({ data }: { data: ServiceRecordData }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.container}>
        <Text style={s.title}>サービス提供実績記録票</Text>

        {/* ヘッダー情報 */}
        <View style={s.infoGrid}>
          <View style={{ ...s.infoCell, width: "25%" }}>
            <Text style={s.infoLabel}>利用者名</Text>
            <Text style={s.infoValue}>{data.clientName}</Text>
          </View>
          <View style={{ ...s.infoCell, width: "20%" }}>
            <Text style={s.infoLabel}>受給者証番号</Text>
            <Text style={s.infoValue}>{data.certificateNumber}</Text>
          </View>
          <View style={{ ...s.infoCell, width: "25%" }}>
            <Text style={s.infoLabel}>事業所名</Text>
            <Text style={s.infoValue}>{data.officeName}</Text>
          </View>
          <View style={{ ...s.infoCell, width: "15%" }}>
            <Text style={s.infoLabel}>事業所番号</Text>
            <Text style={s.infoValue}>{data.officeNumber}</Text>
          </View>
          <View style={{ ...s.infoCellLast, width: "15%" }}>
            <Text style={s.infoLabel}>対象年月</Text>
            <Text style={s.infoValue}>
              {data.targetYear}年{data.targetMonth}月
            </Text>
          </View>
        </View>

        {/* 日別テーブル */}
        <View style={s.dayTable}>
          {/* ヘッダー */}
          <View style={s.dayHeaderRow}>
            <View style={s.colDay}>
              <Text style={s.headerText}>日</Text>
            </View>
            <View style={s.colWeekday}>
              <Text style={s.headerText}>曜日</Text>
            </View>
            <View style={s.colStatus}>
              <Text style={s.headerText}>出欠</Text>
            </View>
            <View style={s.colTime}>
              <Text style={s.headerText}>開始時間</Text>
            </View>
            <View style={s.colTime}>
              <Text style={s.headerText}>終了時間</Text>
            </View>
            <View style={s.colHours}>
              <Text style={s.headerText}>提供時間</Text>
            </View>
            <View style={s.colPickup}>
              <Text style={s.headerText}>送迎(往)</Text>
            </View>
            <View style={s.colPickup}>
              <Text style={s.headerText}>送迎(復)</Text>
            </View>
            <View style={s.colMeal}>
              <Text style={s.headerText}>食事</Text>
            </View>
            <View style={s.colNote}>
              <Text style={s.headerText}>備考</Text>
            </View>
          </View>

          {/* 日別行 */}
          {data.days.map((day) => {
            const isPresent = day.status === "present" || day.status === "late" || day.status === "early_leave";
            return (
              <View
                key={day.day}
                style={isPresent ? s.dayRowPresent : s.dayRow}
              >
                <View style={s.colDay}>
                  <Text style={s.cellTextCenter}>{day.day}</Text>
                </View>
                <View style={s.colWeekday}>
                  <Text style={{
                    ...s.cellTextCenter,
                    color: day.weekday === 0 ? "#CC0000" : day.weekday === 6 ? "#0066CC" : "#000000",
                  }}>
                    {WEEKDAYS[day.weekday]}
                  </Text>
                </View>
                <View style={s.colStatus}>
                  <Text style={s.cellTextCenter}>
                    {day.status ? (statusText[day.status] ?? "") : ""}
                  </Text>
                </View>
                <View style={s.colTime}>
                  <Text style={s.cellTextCenter}>{day.checkIn ?? ""}</Text>
                </View>
                <View style={s.colTime}>
                  <Text style={s.cellTextCenter}>{day.checkOut ?? ""}</Text>
                </View>
                <View style={s.colHours}>
                  <Text style={{ fontSize: 6.5, textAlign: "right" }}>
                    {day.serviceHours != null ? day.serviceHours.toFixed(1) : ""}
                  </Text>
                </View>
                <View style={s.colPickup}>
                  <Text style={s.cellTextCenter}>
                    {day.pickupOut ? "1" : ""}
                  </Text>
                </View>
                <View style={s.colPickup}>
                  <Text style={s.cellTextCenter}>
                    {day.pickupIn ? "1" : ""}
                  </Text>
                </View>
                <View style={s.colMeal}>
                  <Text style={s.cellTextCenter}>
                    {day.meal ? "1" : ""}
                  </Text>
                </View>
                <View style={s.colNote}>
                  <Text style={s.cellText}>{day.note}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* 月次集計 */}
        <View style={s.summaryTable}>
          <View style={{ ...s.summaryRow, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={s.summaryLabel}>
              <Text>出席日数</Text>
            </View>
            <Text style={s.summaryValue}>
              {data.summary.presentDays} 日
            </Text>
            <View style={s.summaryLabel}>
              <Text>サービス提供時間</Text>
            </View>
            <Text style={s.summaryValue}>
              {data.summary.totalServiceHours.toFixed(1)} 時間
            </Text>
          </View>
          <View style={s.summaryRow}>
            <View style={s.summaryLabel}>
              <Text>送迎（往）回数</Text>
            </View>
            <Text style={s.summaryValue}>
              {data.summary.pickupOutDays} 回
            </Text>
            <View style={s.summaryLabel}>
              <Text>送迎（復）回数</Text>
            </View>
            <Text style={s.summaryValue}>
              {data.summary.pickupInDays} 回
            </Text>
          </View>
          <View style={{ ...s.summaryRow, borderTopWidth: 1, borderTopColor: colors.border }}>
            <View style={s.summaryLabel}>
              <Text>食事提供回数</Text>
            </View>
            <Text style={s.summaryValue}>
              {data.summary.mealDays} 回
            </Text>
            <View style={s.summaryLabel}>
              <Text />
            </View>
            <Text style={s.summaryValue} />
          </View>
        </View>

        {/* 確認欄 */}
        <View style={s.signRow}>
          <View style={s.signBox}>
            <Text style={s.signLabel}>利用者確認印</Text>
            <View style={s.signSpace} />
          </View>
          <View style={s.signBox}>
            <Text style={s.signLabel}>サービス管理責任者</Text>
            <View style={s.signSpace} />
          </View>
          <View style={s.signBox}>
            <Text style={s.signLabel}>管理者</Text>
            <View style={s.signSpace} />
          </View>
        </View>

        <Text style={{ ...commonStyles.footer, bottom: 10 }}>
          B-Care 就労継続支援B型 経理管理システム
        </Text>
      </Page>
    </Document>
  );
}
