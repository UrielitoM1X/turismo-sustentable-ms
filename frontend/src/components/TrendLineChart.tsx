import React, { useState } from "react";
import { BiDailyPoint } from "../api/services/biService";

export type TrendMetricKey = "revenue" | "bookings_count" | "tourists" | "impact_fund";

interface TrendLineChartProps {
  data: BiDailyPoint[];
  metric: TrendMetricKey;
  color: string;
  gradientId: string;
  formatValue: (val: number) => string;
  lang: "es" | "en";
}

export default function TrendLineChart({
  data,
  metric,
  color,
  gradientId,
  formatValue,
  lang,
}: TrendLineChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return null;
  }

  const width = 680;
  const height = 220;
  const padL = 56;
  const padR = 20;
  const padT = 20;
  const padB = 34;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const values = data.map((d) => Number(d[metric] || 0));
  const rawMax = Math.max(...values, 1);
  const maxVal = rawMax <= 4 ? 4 : Math.ceil(rawMax * 1.15);

  const coords = data.map((d, i) => {
    const x =
      data.length === 1
        ? padL + chartW / 2
        : padL + (i / (data.length - 1)) * chartW;
    const val = Number(d[metric] || 0);
    const y = padT + chartH - (val / maxVal) * chartH;
    return { x, y, val, point: d };
  });

  const linePath = coords
    .map((c, idx) => `${idx === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${(padT + chartH).toFixed(1)} ` +
    `L${coords[0].x.toFixed(1)},${(padT + chartH).toFixed(1)} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    y: padT + chartH - ratio * chartH,
    value: maxVal * ratio,
  }));

  const formatShortDate = (isoDate: string) => {
    const parts = isoDate.split("-");
    if (parts.length !== 3) return isoDate;
    const monthNamesEs = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    const monthNamesEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const m = Math.max(0, Math.min(11, Number(parts[1]) - 1));
    const names = lang === "es" ? monthNamesEs : monthNamesEn;
    return `${Number(parts[2])} ${names[m]}`;
  };

  const hovered = hoverIdx !== null ? coords[hoverIdx] : null;

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines and Y-axis ticks */}
        {yTicks.map((tick, idx) => (
          <g key={idx}>
            <line
              x1={padL}
              y1={tick.y}
              x2={width - padR}
              y2={tick.y}
              stroke="currentColor"
              strokeOpacity="0.1"
              strokeDasharray="3 3"
            />
            <text
              x={padL - 8}
              y={tick.y + 4}
              textAnchor="end"
              className="fill-muted-foreground text-[10px]"
            >
              {metric === "revenue" || metric === "impact_fund"
                ? `$${Math.round(tick.value).toLocaleString()}`
                : Math.round(tick.value)}
            </text>
          </g>
        ))}

        {/* Area and Line */}
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* X-axis labels (every 2-3 days) */}
        {coords.map((c, idx) => {
          const showLabel = idx === 0 || idx === coords.length - 1 || idx % 3 === 0;
          if (!showLabel) return null;
          return (
            <text
              key={c.point.date}
              x={c.x}
              y={height - 8}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {formatShortDate(c.point.date)}
            </text>
          );
        })}

        {/* Hover vertical guide */}
        {hovered && (
          <line
            x1={hovered.x}
            y1={padT}
            x2={hovered.x}
            y2={padT + chartH}
            stroke={color}
            strokeOpacity="0.35"
            strokeDasharray="3 3"
          />
        )}

        {/* Interactive Data Points */}
        {coords.map((c, idx) => {
          const isHovered = hoverIdx === idx;
          return (
            <g
              key={c.point.date}
              className="cursor-pointer"
              onMouseEnter={() => setHoverIdx(idx)}
              onMouseLeave={() => setHoverIdx(null)}
            >
              <rect
                x={c.x - chartW / (data.length * 2)}
                y={padT}
                width={chartW / data.length}
                height={chartH}
                fill="transparent"
              />
              <circle
                cx={c.x}
                cy={c.y}
                r={isHovered ? 5.5 : 3.2}
                fill={isHovered ? color : "#ffffff"}
                stroke={color}
                strokeWidth="2"
              />
            </g>
          );
        })}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute top-2 right-3 bg-[#1E201D] dark:bg-[#18201C] text-white text-[11px] px-3 py-2 rounded-xl shadow-lg border border-white/10"
        >
          <div className="font-bold text-[#A5B29A]">{hovered.point.date}</div>
          <div className="font-semibold">{formatValue(hovered.val)}</div>
        </div>
      )}
    </div>
  );
}
