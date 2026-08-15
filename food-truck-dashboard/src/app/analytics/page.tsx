import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateJa, yen } from "@/lib/calc";
import { HourlyBarChart, ProductBarChart, TrendLineChart } from "@/components/charts";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const reports = await prisma.eventReport.findMany({
    orderBy: { date: "asc" },
    include: { productSales: true, hourlySales: true, competitors: true },
  });

  if (reports.length === 0) {
    return (
      <div className="card p-10 text-center text-ink-3">
        <p className="text-3xl">📊</p>
        <p className="mt-2">まだデータがありません。売上報告を作成すると分析が表示されます。</p>
      </div>
    );
  }

  // 月別売上推移（直近12ヶ月）
  const byMonth = new Map<string, number>();
  for (const r of reports) {
    const k = `${r.date.getUTCFullYear()}/${r.date.getUTCMonth() + 1}`;
    byMonth.set(k, (byMonth.get(k) || 0) + r.totalSales);
  }
  const monthly = Array.from(byMonth.entries())
    .slice(-12)
    .map(([label, amount]) => ({ label, amount }));

  // 商品別合計
  const byProduct = new Map<string, { quantity: number; amount: number }>();
  for (const r of reports) {
    for (const p of r.productSales) {
      const cur = byProduct.get(p.productName) || { quantity: 0, amount: 0 };
      byProduct.set(p.productName, {
        quantity: cur.quantity + p.quantity,
        amount: cur.amount + p.amount,
      });
    }
  }
  const products = Array.from(byProduct.entries())
    .map(([productName, v]) => ({ productName, ...v }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // 時間帯別平均
  const byHour = new Map<string, { total: number; n: number; count: number }>();
  for (const r of reports) {
    for (const h of r.hourlySales) {
      const cur = byHour.get(h.hourStart) || { total: 0, n: 0, count: 0 };
      byHour.set(h.hourStart, {
        total: cur.total + h.amount,
        n: cur.n + 1,
        count: cur.count + h.count,
      });
    }
  }
  const hourlyAvg = Array.from(byHour.entries())
    .map(([hourStart, v]) => ({
      hourStart,
      amount: Math.round(v.total / v.n),
      count: Math.round(v.count / v.n),
    }))
    .sort((a, b) => a.hourStart.localeCompare(b.hourStart));

  // イベント別ランキング
  const topEvents = [...reports]
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 5);

  // 天気別平均
  const byWeather = new Map<string, { total: number; n: number }>();
  for (const r of reports) {
    if (!r.weather) continue;
    const cur = byWeather.get(r.weather) || { total: 0, n: 0 };
    byWeather.set(r.weather, { total: cur.total + r.totalSales, n: cur.n + 1 });
  }
  const weatherAvg = Array.from(byWeather.entries()).map(([w, v]) => ({
    weather: w,
    avg: Math.round(v.total / v.n),
    n: v.n,
  }));

  // よく一緒になる競合（店名で集計）
  const byCompetitor = new Map<
    string,
    { n: number; genre: string | null; lastEvent: string; lastDate: Date }
  >();
  for (const r of reports) {
    for (const c of r.competitors) {
      const cur = byCompetitor.get(c.name);
      byCompetitor.set(c.name, {
        n: (cur?.n || 0) + 1,
        genre: c.genre || cur?.genre || null,
        lastEvent: r.eventName,
        lastDate: r.date,
      });
    }
  }
  const topCompetitors = Array.from(byCompetitor.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 5);

  // ジャンル別の遭遇回数
  const byGenre = new Map<string, number>();
  for (const r of reports) {
    for (const c of r.competitors) {
      if (!c.genre) continue;
      byGenre.set(c.genre, (byGenre.get(c.genre) || 0) + 1);
    }
  }
  const genres = Array.from(byGenre.entries())
    .map(([genre, n]) => ({ genre, n }))
    .sort((a, b) => b.n - a.n);

  const grandTotal = reports.reduce((s, r) => s + r.totalSales, 0);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">分析ダッシュボード</h1>

      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-xs text-ink-3">累計出店</p>
          <p className="mt-1 text-lg font-bold tnum md:text-2xl">
            {reports.length}
            <span className="ml-0.5 text-sm font-normal text-ink-3">回</span>
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-3">累計売上</p>
          <p className="mt-1 text-lg font-bold tnum md:text-2xl">{yen(grandTotal)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-3">1回あたり平均</p>
          <p className="mt-1 text-lg font-bold tnum md:text-2xl">
            {yen(Math.round(grandTotal / reports.length))}
          </p>
        </div>
      </div>

      {monthly.length > 1 && (
        <div className="card p-4">
          <h2 className="font-bold">月別売上推移</h2>
          <div className="mt-2">
            <TrendLineChart data={monthly} />
          </div>
        </div>
      )}

      {hourlyAvg.length > 0 && (
        <div className="card p-4">
          <h2 className="font-bold">時間帯別の平均売上</h2>
          <p className="text-xs text-ink-3">どの時間に売れるか（全イベント平均）</p>
          <div className="mt-2">
            <HourlyBarChart data={hourlyAvg} />
          </div>
        </div>
      )}

      {products.length > 0 && (
        <div className="card p-4">
          <h2 className="font-bold">商品別 累計販売数 TOP10</h2>
          <div className="mt-2">
            <ProductBarChart data={products} />
          </div>
        </div>
      )}

      <div className="card p-4">
        <h2 className="font-bold">売上ランキング TOP5</h2>
        <ol className="mt-2 space-y-2">
          {topEvents.map((r, i) => (
            <li key={r.id}>
              <Link
                href={`/reports/${r.id}`}
                className="flex items-center gap-3 rounded-lg p-1 hover:bg-page"
              >
                <span className="w-6 text-center font-bold text-ink-3">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">
                    {r.eventName}
                  </span>
                  <span className="text-xs text-ink-3 tnum">
                    {formatDateJa(r.date)} {r.weather ?? ""}
                  </span>
                </span>
                <span className="font-bold tnum">{yen(r.totalSales)}</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>

      {topCompetitors.length > 0 && (
        <div className="card p-4">
          <h2 className="font-bold">よく一緒になる競合 TOP5</h2>
          <ol className="mt-2 space-y-2">
            {topCompetitors.map((c, i) => (
              <li key={c.name} className="flex items-center gap-3">
                <span className="w-6 text-center font-bold text-ink-3">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">
                    {c.name}
                    {c.genre && (
                      <span className="ml-2 rounded-full bg-page px-2 py-0.5 text-xs font-normal text-ink-2">
                        {c.genre}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-ink-3 tnum">
                    最近: {formatDateJa(c.lastDate)} {c.lastEvent}
                  </span>
                </span>
                <span className="font-bold tnum">{c.n}回</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {genres.length > 0 && (
        <div className="card p-4">
          <h2 className="font-bold">ジャンル別 遭遇回数</h2>
          <p className="text-xs text-ink-3">どんな競合と当たりやすいか</p>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {genres.map((g) => (
                <tr key={g.genre} className="border-b border-line last:border-0">
                  <td className="py-1.5">{g.genre}</td>
                  <td className="py-1.5 text-right font-bold tnum">{g.n}回</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {weatherAvg.length > 0 && (
        <div className="card p-4">
          <h2 className="font-bold">天気別の平均売上</h2>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {weatherAvg.map((w) => (
                <tr key={w.weather} className="border-b border-line last:border-0">
                  <td className="py-1.5">{w.weather}</td>
                  <td className="py-1.5 text-right text-xs text-ink-3 tnum">
                    {w.n}回
                  </td>
                  <td className="py-1.5 text-right font-bold tnum">
                    {yen(w.avg)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
