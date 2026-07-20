"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// dataviz リファレンスパレット（ライトモード）
const SERIES_1 = "#2a78d6";
const GRID = "#e1e0d9";
const MUTED = "#898781";
const INK = "#0b0b0b";

const tooltipStyle = {
  background: "#ffffff",
  border: `1px solid ${GRID}`,
  borderRadius: 8,
  fontSize: 12,
  color: INK,
};

const yenTick = (v: number) =>
  v >= 10000 ? `${(v / 10000).toLocaleString()}万` : v.toLocaleString();

const yenFull = (v: number) => `¥${Number(v).toLocaleString()}`;

export function HourlyBarChart({
  data,
}: {
  data: { hourStart: string; amount: number; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID} strokeWidth={1} vertical={false} />
        <XAxis
          dataKey="hourStart"
          tick={{ fontSize: 11, fill: MUTED }}
          tickLine={false}
          axisLine={{ stroke: GRID }}
        />
        <YAxis
          tickFormatter={yenTick}
          tick={{ fontSize: 11, fill: MUTED }}
          tickLine={false}
          axisLine={false}
          width={44}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number, name: string) =>
            name === "amount" ? [yenFull(v), "売上"] : [v, name]
          }
          labelFormatter={(l) => `${l}〜`}
          cursor={{ fill: "rgba(42,120,214,0.08)" }}
        />
        <Bar
          dataKey="amount"
          fill={SERIES_1}
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ProductBarChart({
  data,
}: {
  data: { productName: string; quantity: number; amount: number }[];
}) {
  const height = Math.max(160, data.length * 36 + 30);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 48, left: 8, bottom: 0 }}
      >
        <CartesianGrid stroke={GRID} strokeWidth={1} horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: MUTED }}
          tickLine={false}
          axisLine={false}
          hide
        />
        <YAxis
          type="category"
          dataKey="productName"
          tick={{ fontSize: 12, fill: INK }}
          tickLine={false}
          axisLine={{ stroke: GRID }}
          width={84}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number, name: string) =>
            name === "quantity" ? [`${v}点`, "販売数"] : [yenFull(v), "金額"]
          }
          cursor={{ fill: "rgba(42,120,214,0.08)" }}
        />
        <Bar
          dataKey="quantity"
          fill={SERIES_1}
          radius={[0, 4, 4, 0]}
          maxBarSize={20}
          isAnimationActive={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={SERIES_1} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendLineChart({
  data,
}: {
  data: { label: string; amount: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID} strokeWidth={1} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: MUTED }}
          tickLine={false}
          axisLine={{ stroke: GRID }}
        />
        <YAxis
          tickFormatter={yenTick}
          tick={{ fontSize: 11, fill: MUTED }}
          tickLine={false}
          axisLine={false}
          width={44}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number) => [yenFull(v), "売上"]}
        />
        <Line
          type="monotone"
          dataKey="amount"
          stroke={SERIES_1}
          strokeWidth={2}
          dot={{ r: 4, fill: SERIES_1, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
