// サンプルデータ投入（紙の売上報告シート 7/18・7/19 とレシート 7/20 を元にした例）
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DENOMS = [10000, 5000, 1000, 500, 100, 50, 10];
const total = (b) => DENOMS.reduce((s, d) => s + d * (b[String(d)] || 0), 0);

async function createReport(r) {
  const genkinTotal = total(r.genkin);
  const salesCashTotal = total(r.salesCash);
  const cashSales = salesCashTotal - genkinTotal;
  const totalSales = cashSales + r.paypay;
  await prisma.eventReport.create({
    data: {
      date: new Date(r.date),
      eventName: r.eventName,
      weather: r.weather,
      staff: r.staff,
      genkinBreakdown: r.genkin,
      genkinTotal,
      salesCashBreakdown: r.salesCash,
      salesCashTotal,
      paypayAmount: r.paypay,
      registerGross: r.registerGross ?? null,
      registerNet: r.registerNet ?? null,
      stallFee: r.stallFee,
      cashSales,
      totalSales,
      netProfit: totalSales - r.stallFee,
      kanso: r.kanso ?? null,
      hansei: r.hansei ?? null,
      shortages: r.shortages ?? null,
      status: r.status ?? "draft",
      prepItems: { create: r.prep ?? [] },
      productSales: { create: r.products ?? [] },
      hourlySales: { create: r.hourly ?? [] },
      competitors: { create: r.competitors ?? [] },
    },
  });
  console.log(`✓ ${r.date} ${r.eventName} 売上 ¥${totalSales.toLocaleString()}`);
}

await prisma.eventReport.deleteMany({});

await createReport({
  date: "2026-07-18",
  eventName: "モリコロパーク",
  weather: "晴れ",
  staff: ["TAKA", "ENO", "YOKO"],
  genkin: { 1000: 20, 500: 50, 100: 20, 50: 100 }, // 52,000
  salesCash: { 10000: 6, 5000: 2, 1000: 54, 500: 51, 100: 56, 50: 37, 10: 19 },
  paypay: 46200,
  stallFee: 1000,
  prep: [
    { name: "肉巻きおむすび", unit: "個", qtyTaken: 340, qtyReturned: 2, sortOrder: 0 },
    { name: "からあげ", unit: "タッパ", qtyTaken: 12, qtyReturned: 0, sortOrder: 1 },
  ],
  competitors: [
    {
      name: "からあげ本舗",
      genre: "から揚げ",
      mainProduct: "から揚げ4個",
      price: 600,
      crowdLevel: "行列",
      memo: "昼前から行列。セット割で勝負している",
      sortOrder: 0,
    },
    {
      name: "クレープ日和",
      genre: "クレープ",
      mainProduct: "いちごクレープ",
      price: 700,
      crowdLevel: "混雑",
      memo: "女性客が中心。うちとは客層が違う",
      sortOrder: 1,
    },
  ],
  kanso: "今日はカキ氷日和。暑さでドリンクもよく出た。",
  hansei: "肉巻きが早めに売り切れ。次回は仕込みを増やす。",
  shortages: "串40、パック、輪ゴム",
  status: "final",
});

await createReport({
  date: "2026-07-19",
  eventName: "モリコロパーク",
  weather: "猛暑",
  staff: ["TAKA", "ENO", "YUKI"],
  genkin: { 1000: 20, 500: 50, 100: 56, 50: 50 }, // 53,100
  salesCash: { 10000: 7, 5000: 4, 1000: 76, 500: 67, 100: 60, 50: 31 },
  paypay: 36480,
  stallFee: 4000,
  prep: [
    { name: "肉巻きおむすび", unit: "個", qtyTaken: 354, qtyReturned: 9, sortOrder: 0 },
    { name: "からあげ", unit: "タッパ", qtyTaken: 28, qtyReturned: 0, sortOrder: 1 },
  ],
  competitors: [
    {
      name: "からあげ本舗",
      genre: "から揚げ",
      mainProduct: "から揚げ4個",
      price: 600,
      crowdLevel: "行列",
      memo: "2日連続で隣。やはり強い",
      sortOrder: 0,
    },
    {
      name: "石窯ピッツァ Luce",
      genre: "ピザ",
      mainProduct: "マルゲリータ",
      price: 1200,
      crowdLevel: "ふつう",
      memo: "単価が高い分、回転はゆっくり",
      sortOrder: 1,
    },
    {
      name: "かき氷 こおりや",
      genre: "かき氷",
      mainProduct: "いちごミルク",
      price: 600,
      crowdLevel: "行列",
      memo: "猛暑で終日行列。うちのドリンクは苦戦",
      sortOrder: 2,
    },
  ],
  kanso: "2日目も好調。",
  hansei: "ドリンクの氷が足りなくなった。",
  shortages: "パン粉、氷",
  status: "final",
});

await createReport({
  date: "2026-07-20",
  eventName: "地元マルシェ",
  weather: "晴れ",
  staff: ["TAKA", "ENO"],
  genkin: { 1000: 20, 500: 50, 100: 50, 50: 40 }, // 52,000
  salesCash: { 10000: 10, 5000: 10, 1000: 30, 500: 8, 100: 12, 50: 2 }, // 185,300
  paypay: 2250,
  registerGross: 137800,
  registerNet: 135550,
  stallFee: 3000,
  prep: [
    { name: "肉巻きおむすび", unit: "個", qtyTaken: 130, qtyReturned: 9, sortOrder: 0 },
    { name: "からあげ", unit: "タッパ", qtyTaken: 8, qtyReturned: 1, sortOrder: 1 },
  ],
  products: [
    { productName: "ぶたころ", quantity: 54, amount: 35100, sortOrder: 0 },
    { productName: "ちーころ", quantity: 26, amount: 18200, sortOrder: 1 },
    { productName: "みそころ", quantity: 24, amount: 16800, sortOrder: 2 },
    { productName: "きむころ", quantity: 9, amount: 6300, sortOrder: 3 },
    { productName: "らーころ", quantity: 8, amount: 5600, sortOrder: 4 },
    { productName: "ぷれーん", quantity: 10, amount: 7000, sortOrder: 5 },
    { productName: "ゆずそると", quantity: 26, amount: 20800, sortOrder: 6 },
    { productName: "がーりっく", quantity: 16, amount: 12800, sortOrder: 7 },
    { productName: "くろぶたみそ", quantity: 19, amount: 15200, sortOrder: 8 },
  ],
  hourly: [
    { hourStart: "09:00", count: 1, amount: 1350 },
    { hourStart: "10:00", count: 5, amount: 5050 },
    { hourStart: "11:00", count: 22, amount: 30450 },
    { hourStart: "12:00", count: 31, amount: 34050 },
    { hourStart: "13:00", count: 30, amount: 35600 },
    { hourStart: "14:00", count: 19, amount: 20550 },
    { hourStart: "15:00", count: 12, amount: 10750 },
  ],
  kanso: "昼のピークで行列。13時台がいちばん売れた。",
  status: "draft",
});

await prisma.$disconnect();
console.log("シード完了");
