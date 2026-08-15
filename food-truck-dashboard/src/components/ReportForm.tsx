"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DENOMINATIONS,
  DEFAULT_PREP_ITEMS,
  WEATHER_OPTIONS,
  CROWD_LEVELS,
  breakdownTotal,
  yen,
  type CashBreakdown,
} from "@/lib/calc";

type PrepRow = { name: string; unit: string; qtyTaken: number; qtyReturned: number };
type ProductRow = { productName: string; quantity: number; amount: number };
type HourlyRow = { hourStart: string; count: number; amount: number };

type CompetitorRow = {
  name: string;
  genre: string;
  mainProduct: string;
  price: number;
  crowdLevel: string;
  memo: string;
  // 抽出元の写真。保存済みなら url、未アップロードなら dataUrl を持つ
  photoUrl?: string;
  photoDataUrl?: string;
};

// 1枚の写真。撮ったばかりなら dataUrl、保存済みなら url
type Photo = {
  dataUrl?: string;
  url?: string;
  ocrBusy?: boolean;
  ocrError?: string;
};

type ReceiptSlot = {
  kind: "daily" | "plu" | "hourly";
  label: string;
  hint: string;
  photos: Photo[];
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

type CompetitorOcrResult = {
  competitors?: {
    name: string;
    genre?: string;
    mainProduct?: string;
    price?: number;
    crowdLevel?: string;
    memo?: string;
  }[];
  note?: string;
};

type OcrPreview =
  | { mode: "receipt"; result: OcrResult }
  | {
      mode: "competitor";
      result: CompetitorOcrResult;
      picks: boolean[];
      photo: Photo;
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
  competitors?: {
    name: string;
    genre?: string | null;
    mainProduct?: string | null;
    price?: number | null;
    crowdLevel?: string | null;
    memo?: string | null;
    photoUrl?: string | null;
  }[];
};

const RECEIPT_SLOTS: Omit<ReceiptSlot, "photos">[] = [
  { kind: "daily", label: "① 日計明細", hint: "総売・純売・現金・PayPay" },
  { kind: "plu", label: "② 商品別（PLU）", hint: "おむすび5種の内訳" },
  { kind: "hourly", label: "③ 時間帯別", hint: "何時にどれだけ出たか" },
];

const COMPETITOR_PHOTO_KIND = "competitor";

const EMPTY_COMPETITOR: CompetitorRow = {
  name: "",
  genre: "",
  mainProduct: "",
  price: 0,
  crowdLevel: "",
  memo: "",
};

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
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs text-white">
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
      photos: (initial?.receiptImages || [])
        .filter((r) => r.kind === s.kind)
        .map((r) => ({ url: r.url })),
    }))
  );
  const [compPhotos, setCompPhotos] = useState<Photo[]>(
    (initial?.receiptImages || [])
      .filter((r) => r.kind === COMPETITOR_PHOTO_KIND)
      .map((r) => ({ url: r.url }))
  );
  const [competitors, setCompetitors] = useState<CompetitorRow[]>(
    (initial?.competitors || []).map((c) => ({
      name: c.name,
      genre: c.genre || "",
      mainProduct: c.mainProduct || "",
      price: c.price || 0,
      crowdLevel: c.crowdLevel || "",
      memo: c.memo || "",
      photoUrl: c.photoUrl || undefined,
    }))
  );
  const [ocrPreview, setOcrPreview] = useState<OcrPreview | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const receiptInputs = useRef<(HTMLInputElement | null)[]>([]);
  const compInput = useRef<HTMLInputElement | null>(null);

  const genkinTotal = useMemo(() => breakdownTotal(genkin), [genkin]);
  const salesCashTotal = useMemo(() => breakdownTotal(salesCash), [salesCash]);
  const cashSales = salesCashTotal - genkinTotal;
  const totalSales = cashSales + paypay;
  const netProfit = totalSales - stallFee;

  const patchReceiptPhoto = (
    slotIndex: number,
    photoIndex: number,
    patch: Partial<Photo>
  ) =>
    setSlots((prev) =>
      prev.map((s, i) =>
        i === slotIndex
          ? {
              ...s,
              photos: s.photos.map((p, j) =>
                j === photoIndex ? { ...p, ...patch } : p
              ),
            }
          : s
      )
    );

  const patchCompPhoto = (photoIndex: number, patch: Partial<Photo>) =>
    setCompPhotos((prev) =>
      prev.map((p, j) => (j === photoIndex ? { ...p, ...patch } : p))
    );

  // 選んだ写真を「追加」する（既存の写真は消さない）
  const addPhotos = async (
    files: FileList | null,
    append: (photos: Photo[]) => void
  ) => {
    if (!files?.length) return;
    const added: Photo[] = [];
    for (const file of Array.from(files)) {
      try {
        added.push({ dataUrl: await downscaleImage(file) });
      } catch {
        added.push({ ocrError: "画像の読み込みに失敗しました" });
      }
    }
    append(added);
  };

  const runReceiptOcr = async (slotIndex: number, photoIndex: number) => {
    const image = slots[slotIndex].photos[photoIndex]?.dataUrl;
    if (!image) return;
    patchReceiptPhoto(slotIndex, photoIndex, {
      ocrBusy: true,
      ocrError: undefined,
    });
    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, mode: "receipt" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "読み取りに失敗しました");
      setOcrPreview({ mode: "receipt", result: data as OcrResult });
    } catch (e) {
      patchReceiptPhoto(slotIndex, photoIndex, {
        ocrError: e instanceof Error ? e.message : "読み取りエラー",
      });
    } finally {
      patchReceiptPhoto(slotIndex, photoIndex, { ocrBusy: false });
    }
  };

  const runCompetitorOcr = async (photoIndex: number) => {
    const photo = compPhotos[photoIndex];
    const image = photo?.dataUrl;
    if (!image) return;
    patchCompPhoto(photoIndex, { ocrBusy: true, ocrError: undefined });
    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, mode: "competitor" }),
      });
      const data = (await res.json()) as CompetitorOcrResult & { error?: string };
      if (!res.ok) throw new Error(data.error || "読み取りに失敗しました");
      const found = data.competitors || [];
      if (found.length === 0) {
        patchCompPhoto(photoIndex, {
          ocrError: "この写真からは店舗を読み取れませんでした",
        });
        return;
      }
      setOcrPreview({
        mode: "competitor",
        result: data,
        // 既にリストにある店名は初期状態でOFF（二重登録を防ぐ）
        picks: found.map(
          (c) => !competitors.some((x) => x.name.trim() === c.name?.trim())
        ),
        photo,
      });
    } catch (e) {
      patchCompPhoto(photoIndex, {
        ocrError: e instanceof Error ? e.message : "読み取りエラー",
      });
    } finally {
      patchCompPhoto(photoIndex, { ocrBusy: false });
    }
  };

  const applyOcr = () => {
    if (!ocrPreview) return;

    if (ocrPreview.mode === "competitor") {
      const found = ocrPreview.result.competitors || [];
      const picked = found
        .filter((_, i) => ocrPreview.picks[i])
        .map((c) => ({
          name: c.name || "",
          genre: c.genre || "",
          mainProduct: c.mainProduct || "",
          price: c.price || 0,
          crowdLevel: c.crowdLevel || "",
          memo: c.memo || "",
          photoUrl: ocrPreview.photo.url,
          photoDataUrl: ocrPreview.photo.dataUrl,
        }));
      // 既存リストの末尾に追加（上書きしない）
      setCompetitors((prev) => [...prev, ...picked]);
      setOcrPreview(null);
      return;
    }

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
    if (r.hourly?.length) {
      // 2枚目以降のレシートも既存の時間帯に足し合わせる（上書きしない）
      setHourly((prev) => {
        const merged = [...prev];
        for (const h of r.hourly!) {
          const idx = merged.findIndex((m) => m.hourStart === h.hourStart);
          if (idx >= 0) merged[idx] = h;
          else merged.push(h);
        }
        return merged.sort((a, b) => a.hourStart.localeCompare(b.hourStart));
      });
    }
    if (r.totals?.gross) setRegisterGross(r.totals.gross);
    if (r.totals?.net) setRegisterNet(r.totals.net);
    if (r.totals?.paypay) setPaypay(r.totals.paypay);
    setOcrPreview(null);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const receiptImages: { kind: string; url: string }[] = [];
      // 未アップロードの写真だけ保存し、dataUrl → 保存先URL の対応を作る
      const uploaded = new Map<string, string>();

      const uploadPhoto = async (photo: Photo, kind: string) => {
        if (photo.url) {
          receiptImages.push({ kind, url: photo.url });
          return;
        }
        if (!photo.dataUrl) return;
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: photo.dataUrl, filename: kind }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "画像の保存に失敗しました");
        uploaded.set(photo.dataUrl, data.url);
        receiptImages.push({ kind, url: data.url });
      };

      for (const slot of slots) {
        for (const photo of slot.photos) await uploadPhoto(photo, slot.kind);
      }
      for (const photo of compPhotos) {
        await uploadPhoto(photo, COMPETITOR_PHOTO_KIND);
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
        competitors: competitors.map((c) => ({
          name: c.name,
          genre: c.genre,
          mainProduct: c.mainProduct,
          price: c.price || null,
          crowdLevel: c.crowdLevel,
          memo: c.memo,
          photoUrl:
            c.photoUrl ||
            (c.photoDataUrl ? uploaded.get(c.photoDataUrl) : undefined) ||
            null,
        })),
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

  const setComp = (i: number, patch: Partial<CompetitorRow>) =>
    setCompetitors((prev) =>
      prev.map((c, j) => (j === i ? { ...c, ...patch } : c))
    );

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
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold">
                    {slot.label}
                    {slot.photos.length > 0 && (
                      <span className="ml-2 rounded-full bg-page px-2 py-0.5 text-xs font-normal text-ink-3 tnum">
                        {slot.photos.length}枚
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink-3">{slot.hint}</p>
                </div>
                <button
                  type="button"
                  onClick={() => receiptInputs.current[i]?.click()}
                  className="shrink-0 rounded-full border border-line px-3 py-1.5 text-sm"
                >
                  ＋ 写真を追加
                </button>
              </div>
              <input
                ref={(el) => {
                  receiptInputs.current[i] = el;
                }}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  addPhotos(e.target.files, (added) =>
                    setSlots((prev) =>
                      prev.map((s, j) =>
                        j === i ? { ...s, photos: [...s.photos, ...added] } : s
                      )
                    )
                  );
                  e.target.value = "";
                }}
              />
              {slot.photos.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {slot.photos.map((photo, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-2 rounded-lg bg-page p-2"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.dataUrl || photo.url}
                        alt={`${slot.label} ${j + 1}枚目`}
                        className="h-14 w-14 shrink-0 rounded border border-line object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-ink-3 tnum">{j + 1}枚目</p>
                        {photo.ocrError && (
                          <p className="text-xs text-red-600">{photo.ocrError}</p>
                        )}
                      </div>
                      {photo.dataUrl && (
                        <button
                          type="button"
                          onClick={() => runReceiptOcr(i, j)}
                          disabled={photo.ocrBusy}
                          className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                        >
                          {photo.ocrBusy ? "読み取り中…" : "✨ 読み取る"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setSlots((prev) =>
                            prev.map((s, k) =>
                              k === i
                                ? { ...s, photos: s.photos.filter((_, l) => l !== j) }
                                : s
                            )
                          )
                        }
                        className="shrink-0 px-1 text-ink-3"
                        aria-label="写真を削除"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section
        step="5"
        title="競合キッチンカー"
        aside={
          competitors.length > 0 ? (
            <span className="text-sm font-bold tnum">{competitors.length}店</span>
          ) : undefined
        }
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-line p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold">
                  競合の写真
                  {compPhotos.length > 0 && (
                    <span className="ml-2 rounded-full bg-page px-2 py-0.5 text-xs font-normal text-ink-3 tnum">
                      {compPhotos.length}枚
                    </span>
                  )}
                </p>
                <p className="text-xs text-ink-3">
                  何枚でも追加できます。読み取るたびに下のリストに積み上がります
                </p>
              </div>
              <button
                type="button"
                onClick={() => compInput.current?.click()}
                className="shrink-0 rounded-full border border-line px-3 py-1.5 text-sm"
              >
                ＋ 写真を追加
              </button>
            </div>
            <input
              ref={compInput}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addPhotos(e.target.files, (added) =>
                  setCompPhotos((prev) => [...prev, ...added])
                );
                e.target.value = "";
              }}
            />
            {compPhotos.length > 0 && (
              <ul className="mt-2 space-y-2">
                {compPhotos.map((photo, j) => (
                  <li
                    key={j}
                    className="flex items-center gap-2 rounded-lg bg-page p-2"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.dataUrl || photo.url}
                      alt={`競合の写真 ${j + 1}枚目`}
                      className="h-14 w-14 shrink-0 rounded border border-line object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-ink-3 tnum">{j + 1}枚目</p>
                      {photo.ocrError && (
                        <p className="text-xs text-red-600">{photo.ocrError}</p>
                      )}
                    </div>
                    {photo.dataUrl && (
                      <button
                        type="button"
                        onClick={() => runCompetitorOcr(j)}
                        disabled={photo.ocrBusy}
                        className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                      >
                        {photo.ocrBusy ? "読み取り中…" : "✨ 読み取る"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setCompPhotos((prev) => prev.filter((_, l) => l !== j))
                      }
                      className="shrink-0 px-1 text-ink-3"
                      aria-label="写真を削除"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 積み上がっていく競合リスト */}
          {competitors.length === 0 ? (
            <p className="py-2 text-center text-sm text-ink-3">
              まだ競合が登録されていません
            </p>
          ) : (
            <ul className="space-y-2" data-testid="competitor-list">
              {competitors.map((c, i) => (
                <li key={i} className="rounded-xl border border-line p-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-2 w-5 shrink-0 text-center text-xs font-bold text-ink-3 tnum">
                      {i + 1}
                    </span>
                    {(c.photoDataUrl || c.photoUrl) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.photoDataUrl || c.photoUrl}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded border border-line object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={c.name}
                          placeholder="店名"
                          onChange={(e) => setComp(i, { name: e.target.value })}
                          className="min-w-0 flex-1 rounded-lg border border-line px-2 py-2 text-sm font-bold focus:border-accent focus:outline-none"
                        />
                        <input
                          type="text"
                          value={c.genre}
                          placeholder="ジャンル"
                          onChange={(e) => setComp(i, { genre: e.target.value })}
                          className="w-24 min-w-0 rounded-lg border border-line px-2 py-2 text-sm focus:border-accent focus:outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={c.mainProduct}
                          placeholder="主力商品"
                          onChange={(e) =>
                            setComp(i, { mainProduct: e.target.value })
                          }
                          className="min-w-0 flex-1 rounded-lg border border-line px-2 py-2 text-sm focus:border-accent focus:outline-none"
                        />
                        <Num
                          value={c.price}
                          onChange={(n) => setComp(i, { price: n })}
                          className="w-20"
                          placeholder="価格"
                        />
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {CROWD_LEVELS.map((lv) => (
                          <button
                            key={lv}
                            type="button"
                            onClick={() =>
                              setComp(i, {
                                crowdLevel: c.crowdLevel === lv ? "" : lv,
                              })
                            }
                            className={`rounded-full border px-2.5 py-1 text-xs ${
                              c.crowdLevel === lv
                                ? "border-accent bg-accent text-white"
                                : "border-line bg-surface text-ink-2"
                            }`}
                          >
                            {lv}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={c.memo}
                        placeholder="気づいたこと（行列の長さ、セット販売 等）"
                        onChange={(e) => setComp(i, { memo: e.target.value })}
                        className="w-full rounded-lg border border-line px-2 py-2 text-sm focus:border-accent focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setCompetitors((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="mt-2 shrink-0 text-ink-3"
                      aria-label="この競合を削除"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => setCompetitors((prev) => [...prev, { ...EMPTY_COMPETITOR }])}
            className="w-full rounded-full border border-line py-2 text-sm text-ink-2"
          >
            ＋ 手動で競合を追加
          </button>
        </div>
      </Section>

      <Section
        step="6"
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

      <Section step="7" title="今日の振り返り">
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

      {/* 読み取り結果の確認モーダル */}
      {ocrPreview && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="card max-h-[80vh] w-full max-w-md overflow-y-auto p-4">
            <h3 className="font-bold">✨ 読み取り結果の確認</h3>

            {ocrPreview.mode === "competitor" ? (
              <>
                <p className="mt-1 text-xs text-ink-3">
                  追加する店舗にチェックを入れてください。既存のリストの後ろに追加されます
                </p>
                <ul className="mt-3 space-y-2">
                  {(ocrPreview.result.competitors || []).map((c, i) => {
                    const dup = competitors.some(
                      (x) => x.name.trim() === c.name?.trim()
                    );
                    return (
                      <li key={i}>
                        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-line p-2">
                          <input
                            type="checkbox"
                            checked={ocrPreview.picks[i]}
                            onChange={(e) =>
                              setOcrPreview({
                                ...ocrPreview,
                                picks: ocrPreview.picks.map((p, j) =>
                                  j === i ? e.target.checked : p
                                ),
                              })
                            }
                            className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
                          />
                          <span className="min-w-0 flex-1 text-sm">
                            <span className="font-bold">{c.name}</span>
                            {c.genre && (
                              <span className="ml-2 text-xs text-ink-3">
                                {c.genre}
                              </span>
                            )}
                            {dup && (
                              <span className="ml-2 rounded-full bg-page px-2 py-0.5 text-[11px] text-ink-3">
                                登録済み
                              </span>
                            )}
                            {(c.mainProduct || c.price) && (
                              <span className="mt-0.5 block text-xs text-ink-2 tnum">
                                {c.mainProduct}
                                {c.price ? ` ${yen(c.price)}` : ""}
                              </span>
                            )}
                            {c.crowdLevel && (
                              <span className="mt-0.5 block text-xs text-ink-3">
                                混雑度: {c.crowdLevel}
                              </span>
                            )}
                            {c.memo && (
                              <span className="mt-0.5 block text-xs text-ink-3">
                                {c.memo}
                              </span>
                            )}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
                {ocrPreview.result.note && (
                  <p className="mt-2 text-xs text-ink-3">
                    📝 {ocrPreview.result.note}
                  </p>
                )}
              </>
            ) : (
              <>
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
                              <td className="py-1 text-right tnum">
                                {p.quantity}点
                              </td>
                              <td className="py-1 text-right tnum">
                                {yen(p.amount)}
                              </td>
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
                              <td className="py-1 text-right tnum">
                                {yen(h.amount)}
                              </td>
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
                    <p className="text-xs text-ink-3">
                      📝 {ocrPreview.result.note}
                    </p>
                  )}
                </div>
              </>
            )}

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
                disabled={
                  ocrPreview.mode === "competitor" &&
                  !ocrPreview.picks.some(Boolean)
                }
                className="flex-1 rounded-xl bg-accent py-3 font-bold text-white disabled:opacity-40"
              >
                {ocrPreview.mode === "competitor"
                  ? `追加する（${ocrPreview.picks.filter(Boolean).length}件）`
                  : "反映する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
