import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateJa, yen } from "@/lib/calc";

export const dynamic = "force-dynamic";

function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  return {
    gte: new Date(Date.UTC(y, m - 1, 1)),
    lt: new Date(Date.UTC(y, m, 1)),
  };
}

function shiftMonth(month: string, diff: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + diff, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

const WEATHER_ICONS: Record<string, string> = {
  晴れ: "☀️",
  曇り: "☁️",
  雨: "🌧️",
  "晴れ時々曇り": "⛅",
  猛暑: "🥵",
  雪: "❄️",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const month =
    params.month ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [y, m] = month.split("-").map(Number);

  const reports = await prisma.eventReport.findMany({
    where: { date: monthRange(month) },
    orderBy: { date: "desc" },
    include: { productSales: true },
  });

  const monthTotal = reports.reduce((s, r) => s + r.totalSales, 0);
  const monthNet = reports.reduce((s, r) => s + r.netProfit, 0);

  return (
    <div className="space-y-4">
      {/* 月セレクタ */}
      <div className="flex items-center justify-between">
        <Link
          href={`/?month=${shiftMonth(month, -1)}`}
          className="card px-4 py-2 text-sm text-ink-2"
        >
          ← 前月
        </Link>
        <h1 className="text-xl font-bold tnum">
          {y}年{m}月
        </h1>
        <Link
          href={`/?month=${shiftMonth(month, 1)}`}
          className="card px-4 py-2 text-sm text-ink-2"
        >
          翌月 →
        </Link>
      </div>

      {/* 月間サマリー */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-xs text-ink-3">出店回数</p>
          <p className="mt-1 text-lg font-bold tnum md:text-2xl">
            {reports.length}
            <span className="ml-0.5 text-sm font-normal text-ink-3">回</span>
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-3">売上合計</p>
          <p className="mt-1 text-lg font-bold tnum md:text-2xl">{yen(monthTotal)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-3">手残り合計</p>
          <p className="mt-1 text-lg font-bold tnum md:text-2xl">{yen(monthNet)}</p>
        </div>
      </div>

      {/* イベント一覧 */}
      {reports.length === 0 ? (
        <div className="card p-10 text-center text-ink-3">
          <p className="text-3xl">🍙</p>
          <p className="mt-2">この月の報告はまだありません</p>
          <Link
            href="/reports/new"
            className="mt-4 inline-block rounded-full bg-accent px-6 py-2 font-bold text-white"
          >
            ＋ 新規報告を作成
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => (
            <li key={r.id}>
              <Link
                href={`/reports/${r.id}`}
                className="card block p-4 transition hover:border-accent"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-ink-3 tnum">
                      {formatDateJa(r.date)}{" "}
                      {r.weather && (
                        <span>{WEATHER_ICONS[r.weather] ?? r.weather}</span>
                      )}
                    </p>
                    <p className="truncate text-lg font-bold">{r.eventName}</p>
                    {r.staff.length > 0 && (
                      <p className="mt-0.5 truncate text-xs text-ink-3">
                        👥 {r.staff.join("・")}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xl font-bold tnum">{yen(r.totalSales)}</p>
                    <div className="mt-1 flex items-center justify-end gap-1">
                      {r.status === "final" ? (
                        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
                          確定
                        </span>
                      ) : (
                        <span className="rounded-full bg-page px-2 py-0.5 text-[11px] text-ink-3">
                          下書き
                        </span>
                      )}
                      {r.sheetSyncedAt && (
                        <span className="text-[11px] text-good">台帳✓</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* フローティング新規ボタン（スマホ） */}
      <Link
        href="/reports/new"
        className="fixed bottom-20 right-4 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl text-white shadow-lg md:hidden"
        aria-label="新規報告"
      >
        ＋
      </Link>
    </div>
  );
}
