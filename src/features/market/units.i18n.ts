import { defineDict, type TFn } from "@/lib/i18n/translate";
import { UNITS } from "./types";

const dict = defineDict({
  ar: { kg: "كغم", ton: "طن", head: "رأس", box: "صندوق", piece: "قطعة" },
  en: { kg: "kg", ton: "ton", head: "head", box: "box", piece: "piece" },
});
export default dict;

export type UnitKey = "kg" | "ton" | "head" | "box" | "piece";

/** Falls back to the raw enum value for any unit that has no label yet. */
export const unitLabel = (t: TFn<UnitKey>, unit: string) => {
  const k = unit.toLowerCase();
  return (UNITS as readonly string[]).includes(k) ? t(k as UnitKey) : unit;
};
