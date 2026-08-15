// 紙の売上報告シートと同じ金種の並び
export const DENOMINATIONS = [10000, 5000, 1000, 500, 100, 50, 10] as const;

export type CashBreakdown = Record<string, number>;

export function breakdownTotal(breakdown: CashBreakdown | null | undefined): number {
  if (!breakdown) return 0;
  return DENOMINATIONS.reduce(
    (sum, d) => sum + d * (Number(breakdown[String(d)]) || 0),
    0
  );
}

export function calcSales(input: {
  genkinBreakdown?: CashBreakdown | null;
  salesCashBreakdown?: CashBreakdown | null;
  paypayAmount?: number;
  stallFee?: number;
}) {
  const genkinTotal = breakdownTotal(input.genkinBreakdown);
  const salesCashTotal = breakdownTotal(input.salesCashBreakdown);
  const paypay = input.paypayAmount || 0;
  const stallFee = input.stallFee || 0;
  const cashSales = salesCashTotal - genkinTotal;
  const totalSales = cashSales + paypay;
  const netProfit = totalSales - stallFee;
  return { genkinTotal, salesCashTotal, cashSales, totalSales, netProfit };
}

export function yen(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return `¥${n.toLocaleString("ja-JP")}`;
}

export const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"];

export function formatDateJa(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}（${WEEKDAYS_JA[d.getUTCDay()]}）`;
}

export const WEATHER_OPTIONS = ["晴れ", "曇り", "雨", "晴れ時々曇り", "猛暑", "雪"];

// 競合の混雑度（OCRの enum と揃える）
export const CROWD_LEVELS = ["空いてる", "ふつう", "混雑", "行列"];

// よく使う仕込み品目（フォームの初期行）
export const DEFAULT_PREP_ITEMS = [
  { name: "肉巻きおむすび", unit: "個" },
  { name: "からあげ", unit: "タッパ" },
  { name: "米", unit: "升" },
];
