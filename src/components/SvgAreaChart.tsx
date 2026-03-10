import { useMemo, useState, useCallback, useRef } from 'react';

interface DataPoint {
  date: string;
  close: number;
}

interface SvgAreaChartProps {
  data: DataPoint[];
  color: string;
  className?: string;
}

const PADDING = { top: 10, right: 10, bottom: 28, left: 55 };

export function SvgAreaChart({ data, color, className = '' }: SvgAreaChartProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; value: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { path, areaPath, yTicks, xTicks, points, viewW, viewH } = useMemo(() => {
    if (data.length < 2) return { path: '', areaPath: '', yTicks: [], xTicks: [], points: [], viewW: 0, viewH: 0 };

    const vW = 800;
    const vH = 300;
    const w = vW - PADDING.left - PADDING.right;
    const h = vH - PADDING.top - PADDING.bottom;

    const closes = data.map(d => d.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const range = max - min || 1;
    const yPad = range * 0.05;
    const adjMin = min - yPad;
    const adjMax = max + yPad;
    const adjRange = adjMax - adjMin;

    const pts = data.map((d, i) => ({
      x: PADDING.left + (i / (data.length - 1)) * w,
      y: PADDING.top + ((adjMax - d.close) / adjRange) * h,
      date: d.date,
      value: d.close,
    }));

    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const area = `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${(PADDING.top + h).toFixed(1)} L${pts[0].x.toFixed(1)},${(PADDING.top + h).toFixed(1)} Z`;

    // Y-axis ticks (5 ticks)
    const yTickCount = 5;
    const yT = Array.from({ length: yTickCount }, (_, i) => {
      const val = adjMin + (adjRange / (yTickCount - 1)) * i;
      const y = PADDING.top + ((adjMax - val) / adjRange) * h;
      return { y, label: val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) };
    });

    // X-axis ticks (max 6)
    const xTickCount = Math.min(6, data.length);
    const step = Math.max(1, Math.floor((data.length - 1) / (xTickCount - 1)));
    const xT: { x: number; label: string }[] = [];
    for (let i = 0; i < data.length; i += step) {
      xT.push({ x: pts[i].x, label: data[i].date });
    }
    // ensure last tick
    if (xT.length > 0 && xT[xT.length - 1].x !== pts[pts.length - 1].x) {
      xT.push({ x: pts[pts.length - 1].x, label: data[data.length - 1].date });
    }

    return { path: linePath, areaPath: area, yTicks: yT, xTicks: xT, points: pts, viewW: vW, viewH: vH };
  }, [data]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * viewW;
    // Find nearest point
    let nearest = points[0];
    let minDist = Math.abs(mouseX - nearest.x);
    for (let i = 1; i < points.length; i++) {
      const dist = Math.abs(mouseX - points[i].x);
      if (dist < minDist) {
        minDist = dist;
        nearest = points[i];
      }
    }
    setTooltip({ x: nearest.x, y: nearest.y, date: nearest.date, value: nearest.value });
  }, [points, viewW]);

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  if (!path) return null;

  const gridH = viewH - PADDING.top - PADDING.bottom;

  return (
    <div className={className}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewW} ${viewH}`}
        preserveAspectRatio="none"
        className="w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <line key={`g-${i}`} x1={PADDING.left} x2={viewW - PADDING.right} y1={t.y} y2={t.y} stroke="hsl(var(--border))" strokeWidth="0.5" strokeOpacity="0.5" strokeDasharray="4 4" />
        ))}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="svg-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0.03} />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path d={areaPath} fill="url(#svg-area-grad)" />

        {/* Line */}
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Y-axis labels */}
        {yTicks.map((t, i) => (
          <text key={`y-${i}`} x={PADDING.left - 6} y={t.y + 4} textAnchor="end" fill="hsl(var(--muted-foreground))" fontSize="11" fontFamily="monospace">{t.label}</text>
        ))}

        {/* X-axis labels */}
        {xTicks.map((t, i) => (
          <text key={`x-${i}`} x={t.x} y={PADDING.top + gridH + 18} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="11">{t.label}</text>
        ))}

        {/* Tooltip crosshair + dot */}
        {tooltip && (
          <>
            <line x1={tooltip.x} x2={tooltip.x} y1={PADDING.top} y2={PADDING.top + gridH} stroke="hsl(var(--muted-foreground))" strokeWidth="0.8" strokeDasharray="3 3" />
            <circle cx={tooltip.x} cy={tooltip.y} r="4" fill={color} stroke="hsl(var(--background))" strokeWidth="2" />
          </>
        )}
      </svg>
      {/* Tooltip label (HTML overlay for crisp text) */}
      {tooltip && svgRef.current && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl"
          style={{
            left: `${(tooltip.x / viewW) * 100}%`,
            top: 0,
            transform: 'translateX(-50%)',
          }}
        >
          <p className="text-muted-foreground">{tooltip.date}</p>
          <p className="font-mono font-bold">{tooltip.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      )}
    </div>
  );
}
