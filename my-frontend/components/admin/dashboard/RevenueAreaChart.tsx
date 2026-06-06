"use client";

import { useState } from "react";
import { usePreferences } from "@/lib/i18n";
import { Calendar } from "lucide-react";

interface RevenueDataPoint {
  date: string;
  revenue: number;
  ordersCount: number;
}

interface RevenueAreaChartProps {
  data: RevenueDataPoint[];
}

export default function RevenueAreaChart({ data }: RevenueAreaChartProps) {
  const { formatPrice } = usePreferences();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const revenues = data ?? [];

  // Safeguard against empty data
  if (revenues.length === 0) {
    return (
      <div className="h-[320px] flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-3xl text-gray-400 bg-gray-50/50 gap-2">
        <Calendar className="w-8 h-8 text-gray-300" />
        <p className="text-sm font-medium">Không có dữ liệu doanh thu trong khoảng thời gian này.</p>
      </div>
    );
  }

  const length = revenues.length;

  // 1. Safe max revenue calculation
  const maxRevenue = length > 0 ? Math.max(...revenues.map((c) => c.revenue), 10) : 10;

  // 2. Add padding to top of the chart (15% breathing room)
  const chartMax = maxRevenue * 1.15;

  // Chart layout parameters for 1000x300 viewport
  const paddingLeft = 100;
  const paddingRight = 40;
  const paddingTop = 30;
  const paddingBottom = 50;
  const chartWidth = 1000 - paddingLeft - paddingRight;
  const chartHeight = 300 - paddingTop - paddingBottom;

  // Map data to chart coordinates
  const points: [number, number][] = revenues.map((d, i) => {
    const x = length > 1
      ? paddingLeft + (i / (length - 1)) * chartWidth
      : paddingLeft + chartWidth / 2;
    const y = (paddingTop + chartHeight) - (d.revenue / chartMax) * chartHeight;
    return [x, y];
  });

  // 3. Smooth Bezier Line Path Generator
  const generateBezierPath = (pts: [number, number][]) => {
    if (pts.length === 0) return "";
    let path = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      // Control points for smooth horizontal S-curve
      const cp1x = p0[0] + (p1[0] - p0[0]) * 0.35;
      const cp1y = p0[1];
      const cp2x = p0[0] + (p1[0] - p0[0]) * 0.65;
      const cp2y = p1[1];
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1[0]} ${p1[1]}`;
    }
    return path;
  };

  const linePath = generateBezierPath(points);

  // Generate Area Path (closed loop under the Bezier line)
  const generateAreaPath = (pts: [number, number][]) => {
    if (pts.length === 0) return "";
    const baselineY = paddingTop + chartHeight;
    const firstX = pts[0][0];
    const lastX = pts[pts.length - 1][0];
    return `M ${firstX} ${baselineY} L ${firstX} ${pts[0][1]} ${linePath.substring(1)} L ${lastX} ${baselineY} Z`;
  };

  const areaPath = generateAreaPath(points);

  // Define grid values (4 levels from 0 to chartMax)
  const gridLevels = 4;
  const gridLines = Array.from({ length: gridLevels + 1 }, (_, i) => {
    const pct = i / gridLevels;
    const val = pct * chartMax;
    const y = (paddingTop + chartHeight) - pct * chartHeight;
    return { val, y };
  });

  // Width of each interactive column
  const columnWidth = length > 1 ? chartWidth / (length - 1) : chartWidth;

  return (
    <div className="relative w-full select-none group">
      {/* 4. Responsive SVG Chart Area */}
      <svg
        viewBox="0 0 1000 300"
        preserveAspectRatio="none"
        className="w-full h-[320px] overflow-visible"
      >
        <defs>
          {/* Fill Gradient */}
          <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid Lines & Y-Axis Labels */}
        {gridLines.map((line, i) => (
          <g key={i} className="opacity-75 transition-opacity duration-300">
            {/* Grid line */}
            <line
              x1={paddingLeft}
              y1={line.y}
              x2={paddingLeft + chartWidth}
              y2={line.y}
              stroke="var(--brand-border)"
              strokeWidth={1}
              strokeOpacity={0.5}
            />
            {/* Y-Axis Label */}
            <text
              x={paddingLeft - 12}
              y={line.y + 4}
              textAnchor="end"
              className="fill-brand-muted font-bold text-[10px]"
            >
              {formatPrice(Math.round(line.val))}
            </text>
          </g>
        ))}

        {/* X-Axis Labels (Start, Mid, End) */}
        {length > 0 && (
          <g className="fill-brand-muted font-bold text-[10px]">
            {/* Start */}
            <text x={paddingLeft} y={paddingTop + chartHeight + 22} textAnchor="start">
              {new Date(revenues[0].date).toLocaleDateString("vi-VN", { month: "short", day: "numeric" })}
            </text>
            {/* Mid */}
            {length > 2 && (
              <text x={paddingLeft + chartWidth / 2} y={paddingTop + chartHeight + 22} textAnchor="middle">
                {new Date(revenues[Math.floor(length / 2)].date).toLocaleDateString("vi-VN", { month: "short", day: "numeric" })}
              </text>
            )}
            {/* End */}
            <text x={paddingLeft + chartWidth} y={paddingTop + chartHeight + 22} textAnchor="end">
              {new Date(revenues[length - 1].date).toLocaleDateString("vi-VN", { month: "short", day: "numeric" })}
            </text>
          </g>
        )}

        {/* Gradient Area Fill */}
        {areaPath && (
          <path
            d={areaPath}
            fill="url(#chartAreaGradient)"
            className="transition-all duration-300"
          />
        )}

        {/* Stroke Line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="var(--brand-primary)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />
        )}

        {/* Interactive Hover Indicators */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <g>
            {/* Vertical Tracker Line */}
            <line
              x1={points[hoveredIndex][0]}
              y1={paddingTop}
              x2={points[hoveredIndex][0]}
              y2={paddingTop + chartHeight}
              stroke="var(--brand-primary)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              strokeOpacity={0.6}
            />

            {/* Glowing outer pulse circle */}
            <circle
              cx={points[hoveredIndex][0]}
              cy={points[hoveredIndex][1]}
              r={12}
              fill="var(--brand-primary)"
              fillOpacity={0.15}
            />

            {/* Highlight Dot */}
            <circle
              cx={points[hoveredIndex][0]}
              cy={points[hoveredIndex][1]}
              r={6}
              fill="var(--brand-primary)"
              stroke="var(--brand-surface)"
              strokeWidth={2.5}
              className="drop-shadow-md"
            />
          </g>
        )}

        {/* Invisible Columns for Hover Detection */}
        {points.map((pt, i) => {
          const rectX = pt[0] - columnWidth / 2;
          const rectW = columnWidth;
          return (
            <rect
              key={i}
              x={rectX}
              y={paddingTop}
              width={rectW}
              height={chartHeight}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          );
        })}
      </svg>

      {/* 5. Styled Floating Tooltip using formatPrice */}
      {hoveredIndex !== null && points[hoveredIndex] && (
        <div
          className="absolute pointer-events-none z-30 transition-all duration-150 ease-out bg-brand-surface text-brand-text border border-brand-border/80 px-3.5 py-2.5 rounded-2xl shadow-xl text-left shrink-0 whitespace-nowrap min-w-[130px]"
          style={{
            left: `${(points[hoveredIndex][0] / 1000) * 100}%`,
            top: `${(points[hoveredIndex][1] / 300) * 100}%`,
            transform: "translate(-50%, -125%)",
          }}
        >
          {/* Tooltip header: Date */}
          <p className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">
            {new Date(revenues[hoveredIndex].date).toLocaleDateString("vi-VN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          
          {/* Tooltip Content: Revenue & Orders count */}
          <div className="mt-1 flex flex-col gap-0.5">
            <span className="text-sm font-extrabold text-brand-primary">
              {formatPrice(revenues[hoveredIndex].revenue)}
            </span>
            <span className="text-[10px] font-semibold text-brand-secondary">
              {revenues[hoveredIndex].ordersCount} đơn hàng
            </span>
          </div>

          {/* Tiny pointing arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-brand-surface" />
        </div>
      )}
    </div>
  );
}
