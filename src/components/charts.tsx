import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ReactNode } from "react";

/** Seviye (sıralı) verisi için tek tonlu açıktan koyuya rampa */
export const LEVEL_RAMP = ["#cbc3fd", "#a99df8", "#8574ee", "#5b4bdb", "#31287f"];
/** Doğrulanmış kategorik sıra (indigo · mint · sarı) */
export const CATEGORICAL = ["#5b4bdb", "#14a38b", "#e0a126"];

const axisTick = { fill: "#6b7086", fontSize: 12 };
const compact = new Intl.NumberFormat("tr-TR", { notation: "compact", maximumFractionDigits: 1 });
const tickFmt = (v: number) => (Math.abs(v) >= 10000 ? compact.format(v) : String(v));

function TipBox({ title, rows }: { title: ReactNode; rows: { label: string; value: ReactNode; color?: string }[] }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-pop">
      <p className="mb-1 font-semibold text-ink">{title}</p>
      {rows.map((r) => (
        <p key={r.label} className="flex items-center gap-2 text-muted">
          {r.color && <span className="size-2 rounded-full" style={{ background: r.color }} />}
          {r.label}: <b className="font-semibold text-ink tabular-nums">{r.value}</b>
        </p>
      ))}
    </div>
  );
}

export function SimpleBars({
  data,
  dataKey = "value",
  nameKey = "name",
  unit = "",
  height = 240,
  color = "#5b4bdb",
  layout = "vertical",
  valueLabel = "Değer",
  highlight,
  colors,
}: {
  data: Record<string, string | number>[];
  dataKey?: string;
  nameKey?: string;
  unit?: string;
  height?: number;
  color?: string;
  layout?: "vertical" | "horizontal";
  valueLabel?: string;
  highlight?: string;
  colors?: string[];
}) {
  const horizontalBars = layout === "horizontal";
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={horizontalBars ? "vertical" : "horizontal"} margin={{ top: 8, right: 12, left: horizontalBars ? 4 : -8, bottom: 0 }} barCategoryGap={horizontalBars ? 8 : "28%"}>
        <CartesianGrid stroke="#eeeef1" vertical={horizontalBars} horizontal={!horizontalBars} />
        {/* Recharts eksenleri Fragment içinde tanımaz; doğrudan çocuk olmalı */}
        {horizontalBars ? <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} tickFormatter={tickFmt} /> : <XAxis dataKey={nameKey} tick={axisTick} axisLine={false} tickLine={false} interval={0} />}
        {horizontalBars ? <YAxis type="category" dataKey={nameKey} tick={axisTick} axisLine={false} tickLine={false} width={104} /> : <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} tickFormatter={tickFmt} width={48} />}
        <Tooltip
          cursor={{ fill: "rgba(91,75,219,0.06)" }}
          content={({ active, payload, label }) =>
            active && payload?.length ? <TipBox title={label ?? payload[0].payload[nameKey]} rows={[{ label: valueLabel, value: `${Number(payload[0].value).toLocaleString("tr-TR")}${unit}` }]} /> : null
          }
        />
        <Bar dataKey={dataKey} animationDuration={500} radius={horizontalBars ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={horizontalBars ? 18 : 36}>
          {data.map((d, i) => (
            <Cell key={i} fill={colors?.[i] ?? (highlight && d[nameKey] !== highlight ? "#cbc3fd" : color)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({
  data,
  colors,
  size = 168,
  center,
  unit = "öğrenci",
}: {
  data: { name: string; value: number }[];
  colors: string[];
  size?: number;
  center?: ReactNode;
  unit?: string;
}) {
  const total = data.reduce((a, b) => a + b.value, 0);
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} isAnimationActive={false} dataKey="value" nameKey="name" innerRadius={size * 0.34} outerRadius={size / 2} paddingAngle={1.5} stroke="#fff" strokeWidth={2} startAngle={90} endAngle={-270}>
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <TipBox
                    title={payload[0].name}
                    rows={[{ label: "Sayı", value: `${payload[0].value} ${unit} · %${Math.round(((payload[0].value as number) / Math.max(total, 1)) * 100)}`, color: payload[0].payload.fill }]}
                  />
                ) : null
              }
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">{center ?? <div><div className="text-2xl font-bold tabular-nums">{total}</div><div className="text-[11px] text-muted">{unit}</div></div>}</div>
      </div>
      <ul className="min-w-[140px] flex-1 space-y-2">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2.5 text-[13px]">
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: colors[i % colors.length] }} />
            <span className="flex-1 text-ink-2">{d.name}</span>
            <span className="font-semibold tabular-nums">{d.value}</span>
            <span className="w-9 text-right text-xs text-muted tabular-nums">%{Math.round((d.value / Math.max(total, 1)) * 100)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Seviye dağılımı için yatay yığılmış tek çubuk — küçük kartlarda donut yerine */
export function LevelStrip({ counts }: { counts: number[] }) {
  const total = counts.reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full bg-canvas-2">
      {counts.map((c, i) =>
        c > 0 ? <div key={i} title={`${["Başlangıç", "Temel", "Gelişen", "Orta", "İleri"][i]}: ${c}`} style={{ width: `${(c / total) * 100}%`, background: LEVEL_RAMP[i] }} /> : null,
      )}
    </div>
  );
}
