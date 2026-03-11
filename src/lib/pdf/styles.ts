import { StyleSheet } from "@react-pdf/renderer";

/**
 * PDF帳票共通スタイル
 * 日本語フォントはGoogle Noto Sans JPを使用
 */

export const FONT_URL =
  "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.1/files/noto-sans-jp-japanese-400-normal.woff";
export const FONT_URL_BOLD =
  "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.1/files/noto-sans-jp-japanese-700-normal.woff";

export const colors = {
  primary: "#1a2342",
  border: "#333333",
  lightBorder: "#999999",
  headerBg: "#f0f0f0",
  lightGray: "#f5f5f5",
  text: "#000000",
};

export const commonStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: "NotoSansJP",
    color: colors.text,
  },
  // 帳票タイトル
  title: {
    fontSize: 14,
    fontFamily: "NotoSansJP-Bold",
    textAlign: "center",
    marginBottom: 12,
  },
  // 帳票サブタイトル
  subtitle: {
    fontSize: 10,
    textAlign: "center",
    marginBottom: 8,
    color: "#555555",
  },
  // ヘッダー情報行
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerText: {
    fontSize: 9,
  },
  // テーブル
  table: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 20,
    alignItems: "center",
  },
  tableRowLast: {
    flexDirection: "row",
    minHeight: 20,
    alignItems: "center",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.headerBg,
    minHeight: 22,
    alignItems: "center",
  },
  tableCell: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontSize: 8,
  },
  tableCellRight: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontSize: 8,
    textAlign: "right",
  },
  tableCellCenter: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontSize: 8,
    textAlign: "center",
  },
  tableCellHeader: {
    paddingHorizontal: 4,
    paddingVertical: 3,
    fontSize: 8,
    fontFamily: "NotoSansJP-Bold",
    textAlign: "center",
  },
  // 合計行
  totalRow: {
    flexDirection: "row",
    borderTopWidth: 2,
    borderTopColor: colors.border,
    backgroundColor: colors.lightGray,
    minHeight: 24,
    alignItems: "center",
  },
  totalCell: {
    paddingHorizontal: 4,
    paddingVertical: 3,
    fontSize: 9,
    fontFamily: "NotoSansJP-Bold",
    textAlign: "right",
  },
  // フッター
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    fontSize: 7,
    color: "#888888",
    textAlign: "center",
  },
  // 印鑑欄
  stampBox: {
    borderWidth: 1,
    borderColor: colors.border,
    width: 60,
    height: 60,
    marginLeft: 8,
  },
  stampLabel: {
    fontSize: 7,
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 2,
    backgroundColor: colors.headerBg,
  },
});
