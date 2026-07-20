import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateJa, yen, DENOMINATIONS, type CashBreakdown } from "@/lib/calc";
import { HourlyBarChart, ProductBarChart } from "@/components/charts";
import { ReportActions } from "@/components/ReportActions";

export const dynamic = "force-dynamic";

function CashTable({ breakdown }: { breakdown: CashBreakdown }) {
  const rows = DENOMINATIONS.filter((d) => breakdown?.[String(d)]);
  if (rows.length === 0) return <p className="text-sm text-ink-3">未入力</p>;
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map((d) => (
          <tr key={d} className="border-b border-line last:border-0">
            <td className="py-1 text-ink-2 tnum">{d.toLocaleString()}円</td>
            <td className="py-1 text-right tnum">{breakdown[String(d)]}枚</td>
            <td className="py-1 text-right tnum">
              {yen(d * (breakdown[String(d)] || 0))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const RECEIPT_LABELS: Record<string, string> = {
  daily: "① 日計明細",
  plu: "② 商品別（PLU）",
  hourly: "③ 時間帯別",
  other: "その他",
};

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await prisma.eventReport.findUnique({
    where: { id },
    include: {
      prepItems: { orderBy: { sortOrder: "asc" } },
      productSales: { orderBy: { quantity: "desc" } },
      hourlySales: { orderBy: { hourStart: "asc" } },
      receiptImages: true,
    },
  });
  if (!report) notFound();

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-ink-3 tnum">
              {formatDateJa(report.date)} {report.weather ?? ""}
            </p>
            <h1 className="text-2xl font-bold">{report.eventName}</h1>
            {report.staff.length > 0 && (
              <p className="mt-1 text-sm text-ink-2">
                👥 {report.staff.join("・")}
              </p>
            )}
          </div>
          <div className="text-right">
            {report.status === "final" ? (
              <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent">
                確定済み
              </span>
            ) : (
              <span className="rounded-full bg-page px-3 py-1 text-xs text-ink-3">
                下書き
              </span>
            )}
            {report.sheetSyncedAt && (
              <p className="mt-1 text-xs text-good">売上台帳へ反映済み ✓</p>
            )}
          </div>
        </div>

        {/* 売上ハイライト */}
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4">
          <div>
            <p className="text-xs text-ink-3">本日の売上</p>
            <p className="text-xl font-bold text-accent tnum">
              {yen(report.totalSales)}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-3">現金 / PayPay</p>
            <p className="text-sm font-bold tnum">
              {yen(report.cashSales)}
              <span className="text-ink-3"> / </span>
              {yen(report.paypayAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-3">手残り（−出店料）</p>
            <p className="text-sm font-bold tnum">{yen(report.netProfit)}</p>
          </div>
        </div>
      </div>

      {/* 時間帯別 */}
      {report.hourlySales.length > 0 && (
        <div className="card p-4">
          <h2 className="font-bold">時間帯別売上</h2>
          <div className="mt-2">
            <HourlyBarChart
              data={report.hourlySales.map((h) => ({
                hourStart: h.hourStart,
                amount: h.amount,
                count: h.count,
              }))}
            />
          </div>
        </div>
      )}

      {/* 商品別 */}
      {report.productSales.length > 0 && (
        <div className="card p-4">
          <h2 className="font-bold">商品別販売数</h2>
          <div className="mt-2">
            <ProductBarChart
              data={report.productSales.map((p) => ({
                productName: p.productName,
                quantity: p.quantity,
                amount: p.amount,
              }))}
            />
          </div>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {report.productSales.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="py-1">{p.productName}</td>
                  <td className="py-1 text-right tnum">{p.quantity}点</td>
                  <td className="py-1 text-right tnum">{yen(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 仕込み */}
      {report.prepItems.length > 0 && (
        <div className="card p-4">
          <h2 className="font-bold">仕込みの量</h2>
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-3">
                <th className="py-1 font-normal">品目</th>
                <th className="py-1 text-right font-normal">持出</th>
                <th className="py-1 text-right font-normal">持ち帰り</th>
                <th className="py-1 text-right font-normal">出た量</th>
              </tr>
            </thead>
            <tbody>
              {report.prepItems.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="py-1">{p.name}</td>
                  <td className="py-1 text-right tnum">
                    {p.qtyTaken}
                    {p.unit}
                  </td>
                  <td className="py-1 text-right tnum">
                    {p.qtyReturned}
                    {p.unit}
                  </td>
                  <td className="py-1 text-right font-bold tnum">
                    {Math.round((p.qtyTaken - p.qtyReturned) * 100) / 100}
                    {p.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* お金の詳細 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-4">
          <h2 className="font-bold">
            元金 <span className="tnum">{yen(report.genkinTotal)}</span>
          </h2>
          <div className="mt-2">
            <CashTable breakdown={(report.genkinBreakdown ?? {}) as CashBreakdown} />
          </div>
        </div>
        <div className="card p-4">
          <h2 className="font-bold">
            閉店時現金 <span className="tnum">{yen(report.salesCashTotal)}</span>
          </h2>
          <div className="mt-2">
            <CashTable
              breakdown={(report.salesCashBreakdown ?? {}) as CashBreakdown}
            />
          </div>
          {(report.registerGross || report.registerNet) && (
            <p className="mt-2 text-xs text-ink-3 tnum">
              レジ集計: 総売 {yen(report.registerGross)} / 純売{" "}
              {yen(report.registerNet)}
            </p>
          )}
        </div>
      </div>

      {/* 振り返り */}
      {(report.kanso || report.hansei || report.kaizen || report.shortages) && (
        <div className="card space-y-3 p-4">
          <h2 className="font-bold">今日の振り返り</h2>
          {(
            [
              ["感想", report.kanso],
              ["反省点・改善点", report.hansei],
              ["次への改善アイデア", report.kaizen],
              ["足りないもの", report.shortages],
            ] as const
          )
            .filter(([, v]) => v)
            .map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-ink-3">{label}</p>
                <p className="whitespace-pre-wrap text-sm">{value}</p>
              </div>
            ))}
        </div>
      )}

      {/* レシート写真 */}
      {report.receiptImages.length > 0 && (
        <div className="card p-4">
          <h2 className="font-bold">レシート</h2>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {report.receiptImages.map((img) => (
              <a key={img.id} href={img.url} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={RECEIPT_LABELS[img.kind] ?? img.kind}
                  className="h-32 w-full rounded-lg border border-line object-cover"
                />
                <p className="mt-1 text-center text-xs text-ink-3">
                  {RECEIPT_LABELS[img.kind] ?? img.kind}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}

      <ReportActions
        reportId={report.id}
        status={report.status}
        synced={Boolean(report.sheetSyncedAt)}
      />
    </div>
  );
}
