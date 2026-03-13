import { memo } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { MarketCompositeScore } from '@/lib/mock-data';

interface Props {
  composite: MarketCompositeScore;
}

const sentimentColor = {
  bullish: 'text-up',
  bearish: 'text-down',
  neutral: 'text-muted-foreground',
} as const;

const sentimentBg = {
  bullish: 'bg-up-muted border-up/30',
  bearish: 'bg-down-muted border-down/30',
  neutral: 'bg-muted border-border',
} as const;

const SentimentIcon = ({ s }: { s: MarketCompositeScore['sentiment'] }) => {
  if (s === 'bullish') return <TrendingUp className="w-4 h-4" />;
  if (s === 'bearish') return <TrendingDown className="w-4 h-4" />;
  return <Minus className="w-4 h-4" />;
};

export const MarketCompositeBar = memo(function MarketCompositeBar({ composite }: Props) {
  const gaugePercent = ((composite.score + 100) / 200) * 100;
  const cfg = {
    color: sentimentColor[composite.sentiment],
    bg: sentimentBg[composite.sentiment],
    label: composite.sentiment === 'bullish' ? '강세' : composite.sentiment === 'bearish' ? '약세' : '중립',
  };

  return (
    <Card className="rounded-xl border border-border/60 shadow-sm mb-5 sm:mb-6 overflow-hidden">
      {/* top accent */}
      <div className="h-0.5 bg-gradient-to-r from-down via-muted-foreground to-up opacity-60" />
      <CardContent className="p-4 sm:p-5">
        {/* Title row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm sm:text-base font-bold">시장 종합 심리</h2>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">지수·원자재·FX·공포탐욕 통합 지표</p>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold border ${cfg.bg} ${cfg.color}`}>
            <SentimentIcon s={composite.sentiment} />
            {cfg.label}
          </div>
        </div>

        {/* Score + Gauge */}
        <div className="flex items-center gap-4 mb-4">
          <span className={`text-4xl sm:text-5xl font-extrabold font-mono shrink-0 ${cfg.color}`}>
            {composite.score > 0 ? '+' : ''}{composite.score}
          </span>
          <div className="flex-1">
            <div className="relative h-4 bg-muted rounded-full overflow-hidden mb-1" role="meter" aria-valuenow={composite.score} aria-valuemin={-100} aria-valuemax={100}>
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(to right, hsl(var(--down)), hsl(var(--muted-foreground)) 50%, hsl(var(--up)))',
                  opacity: 0.3,
                }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-card shadow-md transition-all duration-500"
                style={{
                  left: `calc(${gaugePercent}% - 10px)`,
                  backgroundColor:
                    composite.sentiment === 'bullish'
                      ? 'hsl(var(--up))'
                      : composite.sentiment === 'bearish'
                        ? 'hsl(var(--down))'
                        : 'hsl(var(--muted-foreground))',
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
              <span>🔵 극도 약세</span>
              <span>중립</span>
              <span>극도 강세 🔴</span>
            </div>
          </div>
        </div>

        {/* Regime badge */}
        <div className="flex items-center gap-2 mb-4">
          {composite.regime === 'stagflation' && <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
          <span className="text-xs font-semibold text-foreground/70">시장 국면:</span>
          <span className="text-xs font-bold">{composite.regimeLabel}</span>
        </div>

        {/* Pillars */}
        <div className={`grid gap-2 mb-4 ${composite.pillars.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
          {composite.pillars.map((p) => (
            <div key={p.label} className={`rounded-lg border px-2.5 py-2 text-center ${sentimentBg[p.sentiment]}`}>
              <p className="text-[10px] text-muted-foreground font-medium mb-0.5">{p.label}</p>
              <p className={`text-sm sm:text-base font-extrabold font-mono ${sentimentColor[p.sentiment]}`}>
                {p.score > 0 ? '+' : ''}{p.score}
              </p>
            </div>
          ))}
        </div>

        {/* Cross-asset factors */}
        {composite.crossAssetFactors.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">크로스애셋 시그널</p>
            {composite.crossAssetFactors.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] sm:text-xs">
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  f.impact === 'positive' ? 'bg-up' : f.impact === 'negative' ? 'bg-down' : 'bg-muted-foreground'
                }`} />
                <span className="text-foreground/80 flex-1">{f.name}</span>
                <span className={`text-[10px] font-semibold ${
                  f.impact === 'positive' ? 'text-up' : f.impact === 'negative' ? 'text-down' : 'text-muted-foreground'
                }`}>
                  {f.impact === 'positive' ? '호재' : f.impact === 'negative' ? '악재' : '중립'}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
