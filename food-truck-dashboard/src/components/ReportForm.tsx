"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DENOMINATIONS,
  DEFAULT_PREP_ITEMS,
  WEATHER_OPTIONS,
  breakdownTotal,
  yen,
  type CashBreakdown,
} from "@/lib/calc";

type PrepRow = { name: string; unit: string; qtyTaken: number; qtyReturned: number };
type ProductRow = { productName: string; quantity: number; amount: number };
type HourlyRow = { hourStart: string; count: number; amount: number };
type ReceiptSlot = {
  kind: "daily" | "plu" | "hourly" | "other";
  label: string;
  hint: string;
  dataUrl?: string;
  url?: string;
  ocrBusy?: boolean;
  ocrError?: string;
};

type OcrResult = {
  kind: string;
  products?: ProductRow[];
  hourly?: HourlyRow[];
  totals?: {
    gross?: number;
    net?: number;
    cash?: number;
    paypay?: number;
    totalCount?: number;
    totalAmount?: number;
  };
  note?: string;
};

export type ReportFormInitial = {
  id?: string;
  date?: string;
  eventName?: string;
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
  prepItems?: PrepRow[];
  productSales?: ProductRow[];
  hourlySales?: HourlyRow[];
  receiptImages?: { kind: string; url: string }[];
};

const RECEIPT_SLOTS: Omit<ReceiptSlot, "dataUrl" | "url">[] = [
  { kind: "daily", label: "① 日計明細", hint: "総売・純売・現金・PayPay" },
  { kind: "plu", label: "② 商品別（PLU）", hint: "おむすび5種の内訳" },
  { kind: "hourly", label: "③ 時間帯別", hint: "何時にどれだけ出たか" },
];

async function downscaleImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = dataUrl;
  });
  const MAX = 1600;
  const scale = Math.min(1, MAX / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function Num({
  value,
  onChange,
  className = "",
  placeholder,
}: {
  value: number;
  onChange: (n: number) => void;
  className?: string;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      value={value === 0 ? "" : value}
      placeholder={placeholder ?? "0"}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      onFocus={(e) => e.target.select()}
      className={`rounded-lg border border-line px-2 py-2 text-right tnum focus:border-accent focus:outline-none ${className}`}
    />
  );
}

function Section({
  step,
  title,
  children,
  aside,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="card p-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-bold">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs text-white">
            {step}
          </span>
          {title}
        </h2>
        {aside}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function CashCounter({
  breakdown,
  onChange,
}: {
  breakdown: CashBreakdown;
  onChange: (b: CashBreakdown) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
      {DENOMINATIONS.map((d) => (
        <label key={d} className="flex items-center gap-2 text-sm">
          <span className="w-14 shrink-0 text-right text-ink-2 tnum">
            {d.toLocaleString()}円
          </span>
          <Num
            value={breakdown[String(d)] || 0}
            onChange={(n) => onChange({ ...breakdown, [String(d)]: n })}
            className="w-full min-w-0"
          />
          <span className="text-xs text-ink-3">枚</span>
        </label>
      ))}
    </div>
  );
}

export function ReportForm({ initial }: { initial?: ReportFormInitial }) {
  const router = useRouter();
  const [date, setDate] = useState(initial?.date?.slice(0, 10) || today());
  const [eventName, setEventName] = useState(initial?.eventName || "");
  const [weather, setWeather] = useState(initial?.weather || "");
  const [staffText, setStaffText] = useState((initial?.staff || []).join("、"));
  const [genkin, setGenkin] = useState<CashBreakdown>(
    initial?.genkinBreakdown || {}
  );
  const [salesCash, setSalesCash] = useState<CashBreakdown>(
    initial?.salesCashBreakdown || {}
  );
  const [paypay, setPaypay] = useState(initial?.paypayAmount || 0);
  const [registerGross, setRegisterGross] = useState(initial?.registerGross || 0);
  const [registerNet, setRegisterNet] = useState(initial?.registerNet || 0);
  const [stallFee, setStallFee] = useState(initial?.stallFee || 0);
  const [prep, setPrep] = useState<PrepRow[]>(
    initial?.prepItems?.length
      ? initial.prepItems
      : DEFAULT_PREP_ITEMS.map((p) => ({ ...p, qtyTaken: 0, qtyReturned: 0 }))
  );
  const [products, setProducts] = useState<ProductRow[]>(
    initial?.productSales || []
  );
  const [hourly, setHourly] = useState<HourlyRow[]>(initial?.hourlySales || []);
  const [kanso, setKanso] = useState(initial?.kanso || "");
  const [hansei, setHansei] = useState(initial?.hansei || "");
  const [kaizen, setKaizen] = useState(initial?.kaizen || "");
  const [shortages, setShortages] = useState(initial?.shortages || "");
  const [slots, setSlots] = useState<ReceiptSlot[]>(
    RECEIPT_SLOTS.map((s) => ({
      ...s,
      url: initial?.receiptImages?.find((r) => r.kind === s.kind)?.url,
    }))
  );
  const [ocrPreview, setOcrPreview] = useState<{
    slotIndex: number;
    result: OcrResult;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputs = useRef<(HTMLInputElement | null)[]>([]);

  const genkinTotal = useMemo(() => breakdownTotal(genkin), [genkin]);
  const salesCashTotal = useMemo(() => breakdownTotal(salesCash), [salesCash]);
  const cashSales = salesCashTotal - genkinTotal;
  const totalSales = cashSales + paypay;
  const netProfit = totalSales - stallFee;

  const setSlot = (i: number, patch: Partial<ReceiptSlot>) =>
    setSlots((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  const onPickImage = async (i: number, file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await downscaleImage(file);
      setSlot(i, { dataUrl, url: undefined, ocrError: undefined });
    } catch {
      setSlot(i, { ocrError: "画像の読み込みに失敗しました" });
    }
  };

  const runOcr = async (i: number) => {
    const slot = slots[i];
    const image = slot.dataUrl;
    if (!image) return;
    setSlot(i, { ocrBusy: true, ocrError: undefined });
    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "読み取りに失敗しました");
      setOcrPreview({ slotIndex: i, result: data as OcrResult });
    } catch (e) {
      setSlot(i, { ocrError: e instanceof Error ? e.message : "読み取りエラー" });
    } finally {
      setSlot(i, { ocrBusy: false });
    }
  };

  const applyOcr = () => {
    if (!ocrPreview) return;
    const r = ocrPreview.result;
    if (r.products?.length) {
      setProducts((prev) => {
        const merged = [...prev];
        for (const p of r.products!) {
          const idx = merged.findIndex((m) => m.productName === p.productName);
          if (idx >= 0) merged[idx] = p;
          else merged.push(p);
        }
        return merged;
      });
    }
    if (r.hourly?.length) setHourly(r.hourly);
    if (r.totals?.gross) setRegisterGross(r.totals.gross);
    if (r.totals?.net) setRegisterNet(r.totals.net);
    if (r.totals?.paypay) setPaypay(r.totals.paypay);
    setOcrPreview(null);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      // 未アップロードのレシート画像を保存
      const receiptImages: { kind: string; url: string }[] = [];
      for (const slot of slots) {
        if (slot.dataUrl) {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: slot.dataUrl, filename: slot.kind }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "画像の保存に失敗しました");
          receiptImages.push({ kind: slot.kind, url: data.url });
        } else if (slot.url) {
          receiptImages.push({ kind: slot.kind, url: slot.url });
        }
      }

      const payload = {
        date,
        eventName,
        weather: weather || null,
        staff: staffText.split(/[、,\s]+/).filter(Boolean),
        genkinBreakdown: genkin,
        salesCashBreakdown: salesCash,
        paypayAmount: paypay,
        registerGross: registerGross || null,
        registerNet: registerNet || null,
        stallFee,
        kanso,
        hansei,
        kaizen,
        shortages,
        prepItems: prep,
        productSales: products,
        hourlySales: hourly,
        receiptImages,
      };

      const res = await fetch(
        initial?.id ? `/api/reports/${initial.id}` : "/api/reports",
        {
          method: initial?.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存に失敗しました");
      router.push(`/reports/${data.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Section step="1" title="基本情報">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="text-ink-3">日付</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line px-3 py-2 focus:border-accent focus:outline-none"
              />
            </label>
            <label className="block text-sm">
              <span className="text-ink-3">出店料（円）</span>
              <Num
                value={stallFee}
                onChange={setStallFee}
                className="mt-1 w-full"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-ink-3">イベント名</span>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="例: モリコロパーク"
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 focus:border-accent focus:outline-none"
            />
          </label>
          <div className="text-sm">
            <span className="text-ink-3">天気</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {WEATHER_OPTIONS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWeather(weather === w ? "" : w)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    weather === w
                      ? "border-accent bg-accent text-white"
                      : "border-line bg-surface text-ink-2"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
          <label className="block text-sm">
            <span className="text-ink-3">スタッフ（「、」区切り）</span>
            <input
              type="text"
              value={staffText}
              onChange={(e) => setStaffText(e.target.value)}
              placeholder="例: TAKA、ENO"
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 focus:border-accent focus:outline-none"
            />
          </label>
        </div>
      </Section>

      <Section
        step="2"
        title="元金"
        aside={<span className="font-bold tnum">{yen(genkinTotal)}</span>}
      >
        <CashCounter breakdown={genkin} onChange={setGenkin} />
      </Section>

      <Section step="3" title="仕込みの量と商品種類">
        <div className="space-y-2">
          {prep.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={p.name}
                placeholder="品名"
                onChange={(e) =>
                  setPrep(prep.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
                }
                className="min-w-0 flex-1 rounded-lg border border-line px-2 py-2 text-sm focus:border-accent focus:outline-none"
              />
              <Num
                value={p.qtyTaken}
                onChange={(n) =>
                  setPrep(prep.map((x, j) => (j === i ? { ...x, qtyTaken: n } : x)))
                }
                className="w-16"
                placeholder="持出"
              />
              <select
                value={p.unit}
                onChange={(e) =>
                  setPrep(prep.map((x, j) => (j === i ? { ...x, unit: e.target.value } : x)))
                }
                className="rounded-lg border border-line px-1 py-2 text-sm"
              >
                {["個", "タッパ", "升", "袋", "kg", "本"].map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
              <Num
                value={p.qtyReturned}
                onChange={(n) =>
                  setPrep(prep.map((x, j) => (j === i ? { ...x, qtyReturned: n } : x)))
                }
                className="w-16"
                placeholder="残り"
              />
              <button
                type="button"
                onClick={() => setPrep(prep.filter((_, j) => j !== i))}
                className="text-ink-3"
                aria-label="行を削除"
              >
                ✕
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-3">
              左から: 品名 / 持っていった量 / 単位 / 持ち帰った量
            </p>
            <button
              type="button"
              onClick={() =>
                setPrep([...prep, { name: "", unit: "個", qtyTaken: 0, qtyReturned: 0 }])
              }
              className="rounded-full border border-line px-3 py-1 text-sm text-ink-2"
            >
              ＋ 行を追加
            </button>
          </div>
        </div>
      </Section>

      <Section step="4" title="レシート撮影 → AI読み取り">
        <div className="space-y-3">
          {slots.map((slot, i) => (
            <div key={slot.kind} className="rounded-xl border border-line p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">{slot.label}</p>
                  <p className="text-xs text-ink-3">{slot.hint}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputs.current[i]?.click()}
                    className="rounded-full border border-line px-3 py-1.5 text-sm"
                  >
                    📷 {slot.dataUrl || slot.url ? "撮り直す" : "撮影"}
                  </button>
                  {slot.dataUrl && (
                    <button
                      type="button"
                      onClick={() => runOcr(i)}
                      disabled={slot.ocrBusy}
                      className="rounded-full bg-accent px-3 py-1.5 text-sm font-bold text-white disabled:opacity-40"
                    >
                      {slot.ocrBusy ? "読み取り中…" : "✨ AIで読み取る"}
                    </button>
                  )}
                </div>
              </div>
              <input
                ref={(el) => {
                  fileInputs.current[i] = el;
                }}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => onPickImage(i, e.target.files?.[0])}
              />
              {(slot.dataUrl || slot.url) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={slot.dataUrl || slot.url}
                  alt={slot.label}
                  className="mt-2 max-h-40 rounded-lg border border-line object-contain"
                />
              )}
              {slot.ocrError && (
                <p className="mt-2 text-sm text-red-600">{slot.ocrError}</p>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section
        step="5"
        title="売上（閉店時の現金カウント）"
        aside={<span className="font-bold tnum">{yen(salesCashTotal)}</span>}
      >
        <CashCounter breakdown={salesCash} onChange={setSalesCash} />
        <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
          <label className="block">
            <span className="text-ink-3">PayPay（円）</span>
            <Num value={paypay} onChange={setPaypay} className="mt-1 w-full" />
          </label>
          <label className="block">
            <span className="text-ink-3">総売（レジ）</span>
            <Num
              value={registerGross}
              onChange={setRegisterGross}
              className="mt-1 w-full"
            />
          </label>
          <label className="block">
            <span className="text-ink-3">純売（レジ）</span>
            <Num
              value={registerNet}
              onChange={setRegisterNet}
              className="mt-1 w-full"
            />
          </label>
        </div>

        {/* 自動計算サマリー */}
        <div className="mt-4 rounded-xl bg-accent-soft p-3 text-sm">
          <div className="flex justify-between">
            <span>現金売上（現金合計 − 元金）</span>
            <span className="font-bold tnum">{yen(cashSales)}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span>本日の売上（現金売上 ＋ PayPay）</span>
            <span className="font-bold tnum">{yen(totalSales)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-accent/20 pt-1">
            <span>手残り（− 出店料 {yen(stallFee)}）</span>
            <span className="text-base font-bold text-accent tnum">
              {yen(netProfit)}
            </span>
          </div>
          {registerNet > 0 && Math.abs(registerNet - totalSales) > 0 && (
            <p className="mt-2 text-xs text-ink-2">
              ⚠️ レジ純売 {yen(registerNet)} との差額:{" "}
              <span className="tnum">{yen(totalSales - registerNet)}</span>
            </p>
          )}
        </div>
      </Section>

      <Section step="6" title="今日の振り返り">
        <div className="space-y-3 text-sm">
          {(
            [
              ["感想", kanso, setKanso, "今日はカキ氷日和だった 等"],
              ["反省点・改善点", hansei, setHansei, "売り切れの時間、仕込み量の反省 等"],
              ["次への改善アイデア", kaizen, setKaizen, ""],
              ["今日の足りないもの", shortages, setShortages, "串、パック、輪ゴム 等"],
            ] as const
          ).map(([label, value, setter, ph]) => (
            <label key={label} className="block">
              <span className="text-ink-3">{label}</span>
              <textarea
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={ph}
                rows={2}
                className="mt-1 w-full rounded-lg border border-line px-3 py-2 focus:border-accent focus:outline-none"
              />
            </label>
          ))}
        </div>
      </Section>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="w-full rounded-2xl bg-accent py-4 text-lg font-bold text-white shadow disabled:opacity-40"
      >
        {saving ? "保存中…" : initial?.id ? "更新する" : "保存する"}
      </button>

      {/* OCR結果の確認モーダル */}
      {ocrPreview && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="card max-h-[80vh] w-full max-w-md overflow-y-auto p-4">
            <h3 className="font-bold">✨ 読み取り結果の確認</h3>
            <p className="mt-1 text-xs text-ink-3">
              内容を確認して「反映する」を押すと入力欄に反映されます
            </p>
            <div className="mt-3 space-y-3 text-sm">
              {ocrPreview.result.products?.length ? (
                <div>
                  <p className="font-bold text-ink-2">商品別</p>
                  <table className="mt-1 w-full">
                    <tbody>
                      {ocrPreview.result.products.map((p, i) => (
                        <tr key={i} className="border-b border-line">
                          <td className="py-1">{p.productName}</td>
                          <td className="py-1 text-right tnum">{p.quantity}点</td>
                          <td className="py-1 text-right tnum">{yen(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              {ocrPreview.result.hourly?.length ? (
                <div>
                  <p className="font-bold text-ink-2">時間帯別</p>
                  <table className="mt-1 w-full">
                    <tbody>
                      {ocrPreview.result.hourly.map((h, i) => (
                        <tr key={i} className="border-b border-line">
                          <td className="py-1 tnum">{h.hourStart}〜</td>
                          <td className="py-1 text-right tnum">{h.count}件</td>
                          <td className="py-1 text-right tnum">{yen(h.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              {ocrPreview.result.totals && (
                <div className="rounded-lg bg-page p-2 text-xs">
                  {Object.entries({
                    総売: ocrPreview.result.totals.gross,
                    純売: ocrPreview.result.totals.net,
                    現金: ocrPreview.result.totals.cash,
                    PayPay: ocrPreview.result.totals.paypay,
                    合計金額: ocrPreview.result.totals.totalAmount,
                  })
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <span key={k} className="mr-3 tnum">
                        {k}: {yen(v!)}
                      </span>
                    ))}
                </div>
              )}
              {ocrPreview.result.note && (
                <p className="text-xs text-ink-3">📝 {ocrPreview.result.note}</p>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setOcrPreview(null)}
                className="flex-1 rounded-xl border border-line py-3 font-bold text-ink-2"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={applyOcr}
                className="flex-1 rounded-xl bg-accent py-3 font-bold text-white"
              >
                反映する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
