import React from "react";
import { Document, Page, View, Text, StyleSheet, Svg, Circle, Line } from "@react-pdf/renderer";
import { commonStyles, colors } from "./styles";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

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
    marginBottom: 4,
    letterSpacing: 2,
  },
  period: {
    fontSize: 9,
    textAlign: "center",
    marginBottom: 8,
    color: "#555555",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    fontSize: 8,
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
    minHeight: 18,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: colors.lightBorder,
    minHeight: 13,
    alignItems: "center",
  },
  totalRow: {
    flexDirection: "row",
    backgroundColor: colors.lightGray,
    borderTopWidth: 2,
    borderTopColor: colors.border,
    minHeight: 16,
    alignItems: "center",
  },
  colName: { width: "12%", paddingHorizontal: 2 },
  colDay: { width: "2.5%", paddingHorizontal: 0.5, textAlign: "center", alignItems: "center", justifyContent: "center" },
  colTotal: { width: "5.5%", paddingHorizontal: 2, textAlign: "right" },
  headerText: {
    fontSize: 5.5,
    fontFamily: "NotoSansJP-Bold",
    textAlign: "center",
  },
  cell: { fontSize: 5.5, textAlign: "center" },
  cellName: { fontSize: 6.5 },
  cellBold: { fontSize: 6, fontFamily: "NotoSansJP-Bold", textAlign: "right" },
  signRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
});

export type AttendanceRegisterClient = {
  clientNumber: string;
  clientName: string;
  dailyStatus: (string | null)[]; // index 0 = day 1, length = days in month
  presentDays: number;
  absentDays: number;
};

export type AttendanceRegisterData = {
  officeName: string;
  officeNumber: string;
  targetYear: number;
  targetMonth: number;
  daysInMonth: number;
  clients: AttendanceRegisterClient[];
};

/** 出席 = ○ (circle) */
function MarkPresent() {
  return (
    <Svg width={8} height={8} viewBox="0 0 10 10">
      <Circle cx={5} cy={5} r={4} stroke="#000000" strokeWidth={1.2} fill="none" />
    </Svg>
  );
}

/** 遅刻 = △ (triangle) */
function MarkLate() {
  return (
    <Svg width={8} height={8} viewBox="0 0 10 10">
      <Line x1={5} y1={1} x2={9} y2={9} stroke="#d97706" strokeWidth={1.2} />
      <Line x1={9} y1={9} x2={1} y2={9} stroke="#d97706" strokeWidth={1.2} />
      <Line x1={1} y1={9} x2={5} y2={1} stroke="#d97706" strokeWidth={1.2} />
    </Svg>
  );
}

/** 早退 = ▽ (inverted triangle) */
function MarkEarlyLeave() {
  return (
    <Svg width={8} height={8} viewBox="0 0 10 10">
      <Line x1={1} y1={1} x2={9} y2={1} stroke="#ea580c" strokeWidth={1.2} />
      <Line x1={9} y1={1} x2={5} y2={9} stroke="#ea580c" strokeWidth={1.2} />
      <Line x1={5} y1={9} x2={1} y2={1} stroke="#ea580c" strokeWidth={1.2} />
    </Svg>
  );
}

/** 欠席 = × (cross) */
function MarkAbsent() {
  return (
    <Svg width={8} height={8} viewBox="0 0 10 10">
      <Line x1={1} y1={1} x2={9} y2={9} stroke="#dc2626" strokeWidth={1.5} />
      <Line x1={9} y1={1} x2={1} y2={9} stroke="#dc2626" strokeWidth={1.5} />
    </Svg>
  );
}

/** 欠席届出 = filled small circle */
function MarkAbsentNotified() {
  return (
    <Svg width={8} height={8} viewBox="0 0 10 10">
      <Circle cx={5} cy={5} r={3} stroke="#6b7280" strokeWidth={1} fill="#6b7280" />
    </Svg>
  );
}

const statusMarkComponent: Record<string, () => React.JSX.Element> = {
  present: MarkPresent,
  late: MarkLate,
  early_leave: MarkEarlyLeave,
  absent: MarkAbsent,
  absent_notified: MarkAbsentNotified,
};

export function AttendanceRegisterPdf({ data }: { data: AttendanceRegisterData }) {
  const days = Array.from({ length: data.daysInMonth }, (_, i) => i + 1);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.container}>
        <Text style={s.title}>出 席 簿</Text>
        <Text style={s.period}>
          {data.targetYear}年{data.targetMonth}月
        </Text>

        <View style={s.infoRow}>
          <Text>事業所: {data.officeName}（{data.officeNumber}）</Text>
          <Text>対象者数: {data.clients.length}名</Text>
        </View>

        <View style={s.table}>
          {/* ヘッダー: 曜日 */}
          <View style={s.headerRow}>
            <View style={s.colName}>
              <Text style={s.headerText}>氏名</Text>
            </View>
            {days.map((d) => {
              const date = new Date(data.targetYear, data.targetMonth - 1, d);
              const dow = date.getDay();
              return (
                <View key={d} style={s.colDay}>
                  <Text style={{
                    fontSize: 5,
                    textAlign: "center",
                    color: dow === 0 ? "#CC0000" : dow === 6 ? "#0066CC" : "#000000",
                  }}>
                    {d}
                  </Text>
                  <Text style={{
                    fontSize: 4.5,
                    textAlign: "center",
                    color: dow === 0 ? "#CC0000" : dow === 6 ? "#0066CC" : "#666666",
                  }}>
                    {WEEKDAYS[dow]}
                  </Text>
                </View>
              );
            })}
            <View style={s.colTotal}>
              <Text style={s.headerText}>出席</Text>
            </View>
            <View style={s.colTotal}>
              <Text style={s.headerText}>欠席</Text>
            </View>
          </View>

          {/* 利用者行 */}
          {data.clients.map((client, i) => (
            <View key={i} style={s.row}>
              <View style={s.colName}>
                <Text style={s.cellName}>{client.clientName}</Text>
              </View>
              {days.map((d) => {
                const status = client.dailyStatus[d - 1];
                const MarkComponent = status ? statusMarkComponent[status] : null;
                return (
                  <View key={d} style={s.colDay}>
                    {MarkComponent ? <MarkComponent /> : null}
                  </View>
                );
              })}
              <View style={s.colTotal}>
                <Text style={s.cellBold}>{client.presentDays}</Text>
              </View>
              <View style={s.colTotal}>
                <Text style={s.cellBold}>{client.absentDays}</Text>
              </View>
            </View>
          ))}

          {/* 合計行 */}
          <View style={s.totalRow}>
            <View style={s.colName}>
              <Text style={{ fontSize: 6, fontFamily: "NotoSansJP-Bold" }}>日計</Text>
            </View>
            {days.map((d) => {
              const count = data.clients.filter((c) => {
                const st = c.dailyStatus[d - 1];
                return st === "present" || st === "late" || st === "early_leave";
              }).length;
              return (
                <View key={d} style={s.colDay}>
                  <Text style={{ fontSize: 5.5, textAlign: "center", fontFamily: "NotoSansJP-Bold" }}>
                    {count || ""}
                  </Text>
                </View>
              );
            })}
            <View style={s.colTotal}>
              <Text style={s.cellBold}>
                {data.clients.reduce((s, c) => s + c.presentDays, 0)}
              </Text>
            </View>
            <View style={s.colTotal}>
              <Text style={s.cellBold}>
                {data.clients.reduce((s, c) => s + c.absentDays, 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* 凡例 */}
        <View style={{ flexDirection: "row", gap: 16, marginTop: 6, alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <MarkPresent />
            <Text style={{ fontSize: 6 }}> 出席</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <MarkLate />
            <Text style={{ fontSize: 6 }}> 遅刻</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <MarkEarlyLeave />
            <Text style={{ fontSize: 6 }}> 早退</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <MarkAbsent />
            <Text style={{ fontSize: 6 }}> 欠席</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <MarkAbsentNotified />
            <Text style={{ fontSize: 6 }}> 欠席届出</Text>
          </View>
        </View>

        {/* 確認印 */}
        <View style={s.signRow}>
          <View style={commonStyles.stampBox}>
            <Text style={commonStyles.stampLabel}>サビ管</Text>
          </View>
          <View style={commonStyles.stampBox}>
            <Text style={commonStyles.stampLabel}>管理者</Text>
          </View>
        </View>

        <Text style={{ ...commonStyles.footer, bottom: 10 }}>
          B-Care 就労継続支援B型 経理管理システム
        </Text>
      </Page>
    </Document>
  );
}
