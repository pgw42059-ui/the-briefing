import { useFearGreed } from '@/hooks/use-fear-greed';
import { Skeleton } from '@/components/ui/skeleton';

const ZONES = [
  { max: 25,  label: '극도의 공포', short: '극공포', color: '#ef4444' },
  { max: 45,  label: '공포',       short: '공포',   color: '#f97316' },
  { max: 55,  label: '중립',       short: '중립',   color: '#eab308' },
  { max: 75,  label: '탐욕',       short: '탐욕',   color: '#84cc16' },
  { max: 100, label: '극도의 탐욕', short: '극탐욕', color: '#22c55e' },
];

const HISTORY_LABELS = [
  { key: 'oneYearAgo',   label: '1년 전' },
  { key: 'oneMonthAgo',  label: '1개월 전' },
  { key: 'oneWeekAgo',   label: '1주 전' },
  { key: 'previousClose',label: '전일' },
] as const;

function getZone(score: number) {
  return ZONES.find((z) => score <= z.max) ?? ZONES[ZONES.length - 1];
}

// ── SVG 게이지 ───────────────────────────────────────────────
function GaugeArc({ score }: { score: number }) {
  const R = 72;
  const cx = 90;
  const cy = 88;

  // 점수 → 각도 (π = 왼쪽, 0 = 오른쪽, 반시계)
  const toRad = (s: number) => Math.PI - (s / 100) * Math.PI;

  const pt = (s: number, r: number) => {
    const a = toRad(s);
    return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
  };

  // 배경 전체 호
  const bgStart = pt(0, R);
  const bgEnd   = pt(100, R);
  const bgPath  = `M ${bgEnd.x} ${bgEnd.y} A ${R} ${R} 0 0 0 ${bgStart.x} ${bgStart.y}`;

  // 구간별 채색 호
  const zoneArcs: string[] = [];
  let prevBound = 0;
  for (const z of ZONES) {
    const s1 = pt(prevBound, R);
    const s2 = pt(z.max,    R);
    const large = (z.max - prevBound) > 50 ? 1 : 0;
    // 점수가 오른쪽(0)에서 왼쪽(100)으로 → sweep=0
    zoneArcs.push(
      `<path d="M ${s2.x} ${s2.y} A ${R} ${R} 0 ${large} 0 ${s1.x} ${s1.y}"` +
      ` fill="none" stroke="${z.color}" stroke-width="13" stroke-linecap="butt" opacity="0.28"/>`
    );
    prevBound = z.max;
  }

  // 점수 호 (0 → score)
  const scoreEnd   = pt(score, R);
  const scoreLarge = score > 50 ? 1 : 0;
  const zone       = getZone(score);
  const scoreArc   = `M ${bgStart.x} ${bgStart.y} A ${R} ${R} 0 ${scoreLarge} 1 ${scoreEnd.x} ${scoreEnd.y}`;

  // 바늘
  const needleTip  = pt(score, R - 8);
  const needleBase = pt(score, 14);

  // 눈금(tick) 위치: 0, 25, 50, 75, 100
  const ticks = [0, 25, 50, 75, 100].map((s) => {
    const inner = pt(s, R - 18);
    const outer = pt(s, R - 6);
    return { inner, outer, s };
  });

  // 구간 레이블 중간점
  const midPoints = ZONES.map((z, i) => {
    const from = i === 0 ? 0 : ZONES[i - 1].max;
    const mid  = (from + z.max) / 2;
    return { ...pt(mid, R + 14), label: z.short, color: z.color };
  });

  return (
    <svg viewBox="0 -12 180 112" className="w-full max-w-[260px] mx-auto select-none">
      <defs>
        <linearGradient id="fgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#ef4444" />
          <stop offset="25%"  stopColor="#f97316" />
          <stop offset="50%"  stopColor="#eab308" />
          <stop offset="75%"  stopColor="#84cc16" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>

      {/* 배경 트랙 */}
      <path d={bgPath} fill="none" stroke="hsl(var(--muted))" strokeWidth="13" strokeLinecap="butt" />

      {/* 구간 컬러 */}
      {ZONES.map((z, i) => {
        const from   = i === 0 ? 0 : ZONES[i - 1].max;
        const s1     = pt(from, R);
        const s2     = pt(z.max, R);
        const large  = (z.max - from) > 50 ? 1 : 0;
        return (
          <path
            key={z.label}
            d={`M ${s2.x} ${s2.y} A ${R} ${R} 0 ${large} 0 ${s1.x} ${s1.y}`}
            fill="none"
            stroke={z.color}
            strokeWidth="13"
            strokeLinecap="butt"
            opacity={0.22}
          />
        );
      })}

      {/* 점수 호 */}
      <path d={scoreArc} fill="none" stroke={zone.color} strokeWidth="13" strokeLinecap="butt" />

      {/* 눈금 */}
      {ticks.map(({ inner, outer }) => (
        <line
          key={outer.x}
          x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
          stroke="hsl(var(--background))" strokeWidth="1.5"
        />
      ))}

      {/* 구간 레이블 */}
      {midPoints.map(({ x, y, label, color }) => (
        <text
          key={label}
          x={x} y={y}
          textAnchor="middle"
          fontSize="6.2"
          fill={color}
          fontWeight="600"
          opacity={0.9}
        >
          {label}
        </text>
      ))}

      {/* 바늘 */}
      <line
        x1={needleBase.x} y1={needleBase.y}
        x2={needleTip.x}  y2={needleTip.y}
        stroke={zone.color} strokeWidth="2.5" strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="5" fill={zone.color} />
      <circle cx={cx} cy={cy} r="2.5" fill="hsl(var(--background))" />
    </svg>
  );
}

// ── 히스토리 바 ──────────────────────────────────────────────
function HistoryBar({
  label,
  value,
  current,
}: {
  label: string;
  value: number;
  current: number;
}) {
  const diff       = current - value;
  const zone       = getZone(value);
  const diffStr    = diff > 0 ? `+${diff}` : String(diff);
  const diffColor  = diff > 0 ? '#22c55e' : diff < 0 ? '#ef4444' : 'hsl(var(--muted-foreground))';
  const diffArrow  = diff > 0 ? '▲' : diff < 0 ? '▼' : '─';

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-14 text-right text-muted-foreground shrink-0">{label}</span>
      {/* 바 */}
      <div className="relative flex-1 h-4 bg-muted/40 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, backgroundColor: zone.color, opacity: 0.6 }}
        />
        {/* 현재 마커 */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-foreground/30"
          style={{ left: `${current}%` }}
        />
      </div>
      {/* 값 */}
      <span className="w-5 text-center font-semibold tabular-nums">{value}</span>
      {/* 차이 */}
      <span className="w-8 text-right tabular-nums font-medium" style={{ color: diffColor }}>
        {diffArrow} {Math.abs(diff)}
      </span>
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────
export function FearGreedGauge() {
  const { data, isLoading, isError } = useFearGreed();

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-[100px] w-[240px] mx-auto" />
        <Skeleton className="h-8 w-28 mx-auto" />
        <div className="space-y-2 pt-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-5 w-full rounded-full" />)}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-bold mb-3">😨 공포 & 탐욕 지수</h3>
        <p className="text-xs text-muted-foreground text-center py-6">데이터를 불러올 수 없습니다</p>
      </div>
    );
  }

  const zone = getZone(data.score);

  return (
    <div className="glass-card rounded-2xl p-5 animate-fade-in">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold">😨 CNN 공포 &amp; 탐욕 지수</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">시장 심리 지표 · 실시간</p>
        </div>
        {/* 뱃지 */}
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: zone.color + '22', color: zone.color, border: `1px solid ${zone.color}55` }}
        >
          {zone.label}
        </span>
      </div>

      {/* 게이지 */}
      <GaugeArc score={data.score} />

      {/* 점수 + 레이블 */}
      <div className="text-center -mt-2 mb-4">
        <span className="text-4xl font-extrabold tabular-nums" style={{ color: zone.color }}>
          {data.score}
        </span>
        <span className="text-xs text-muted-foreground ml-1">/ 100</span>
      </div>

      {/* 설명 문장 */}
      <p className="text-[11px] text-center text-muted-foreground mb-4 leading-relaxed">
        {zone.label === '극도의 공포' && '투자자들이 매우 두려워하고 있습니다.\n과매도 가능성에 주목하세요.'}
        {zone.label === '공포'       && '시장에 불안 심리가 팽배합니다.'}
        {zone.label === '중립'       && '시장 심리가 균형 상태입니다.'}
        {zone.label === '탐욕'       && '투자자들이 다소 낙관적입니다.'}
        {zone.label === '극도의 탐욕' && '과도한 낙관으로 과열 위험이 있습니다.'}
      </p>

      {/* 히스토리 바 */}
      <div className="border-t border-border/50 pt-3 space-y-2">
        <p className="text-[10px] text-muted-foreground font-medium mb-1.5">과거 대비 현재</p>
        {HISTORY_LABELS.map(({ key, label }) => (
          <HistoryBar
            key={key}
            label={label}
            value={data[key]}
            current={data.score}
          />
        ))}
      </div>
    </div>
  );
}
