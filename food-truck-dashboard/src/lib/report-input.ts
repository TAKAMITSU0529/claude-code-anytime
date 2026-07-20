import { calcSales, type CashBreakdown } from "./calc";

export type ReportInput = {
  date: string;
  eventName: string;
  weather?: string | null;
  staff?: string[];
  genkinBreakdown?: CashBreakdown | null;
  salesCashBreakdown?: CashBreakdown | null;
  paypayAmount?: number;
  registerGross?: number | null;
  registerNet?: number | null;
  stallFee?: number;
  kanso?: string | null;
  hansei?: string | null;
  kaizen?: string | null;
  shortages?: string | null;
  prepItems?: {
    name: string;
    unit: string;
    qtyTaken: number;
    qtyReturned: number;
  }[];
  productSales?: { productName: string; quantity: number; amount: number }[];
  hourlySales?: { hourStart: string; count: number; amount: number }[];
  receiptImages?: { kind: string; url: string }[];
};

export function toReportData(input: ReportInput) {
  const totals = calcSales(input);
  return {
    date: new Date(input.date),
    eventName: input.eventName?.trim() || "（イベント名未入力）",
    weather: input.weather || null,
    staff: (input.staff || []).map((s) => s.trim()).filter(Boolean),
    genkinBreakdown: input.genkinBreakdown ?? {},
    genkinTotal: totals.genkinTotal,
    salesCashBreakdown: input.salesCashBreakdown ?? {},
    salesCashTotal: totals.salesCashTotal,
    paypayAmount: input.paypayAmount || 0,
    registerGross: input.registerGross ?? null,
    registerNet: input.registerNet ?? null,
    stallFee: input.stallFee || 0,
    cashSales: totals.cashSales,
    totalSales: totals.totalSales,
    netProfit: totals.netProfit,
    kanso: input.kanso || null,
    hansei: input.hansei || null,
    kaizen: input.kaizen || null,
    shortages: input.shortages || null,
  };
}

export function nestedCreates(input: ReportInput) {
  return {
    prepItems: {
      create: (input.prepItems || [])
        .filter((p) => p.name?.trim())
        .map((p, i) => ({
          name: p.name.trim(),
          unit: p.unit || "個",
          qtyTaken: Number(p.qtyTaken) || 0,
          qtyReturned: Number(p.qtyReturned) || 0,
          sortOrder: i,
        })),
    },
    productSales: {
      create: (input.productSales || [])
        .filter((p) => p.productName?.trim())
        .map((p, i) => ({
          productName: p.productName.trim(),
          quantity: Number(p.quantity) || 0,
          amount: Number(p.amount) || 0,
          sortOrder: i,
        })),
    },
    hourlySales: {
      create: (input.hourlySales || [])
        .filter((h) => h.hourStart?.trim())
        .map((h) => ({
          hourStart: h.hourStart.trim(),
          count: Number(h.count) || 0,
          amount: Number(h.amount) || 0,
        })),
    },
    receiptImages: {
      create: (input.receiptImages || [])
        .filter((r) => r.url)
        .map((r) => ({ kind: r.kind || "other", url: r.url })),
    },
  };
}
