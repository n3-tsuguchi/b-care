import { Font } from "@react-pdf/renderer";
import { FONT_URL, FONT_URL_BOLD } from "./styles";

let registered = false;

export function registerFonts() {
  if (registered) return;
  Font.register({
    family: "NotoSansJP",
    src: FONT_URL,
  });
  Font.register({
    family: "NotoSansJP-Bold",
    src: FONT_URL_BOLD,
  });
  registered = true;
}
