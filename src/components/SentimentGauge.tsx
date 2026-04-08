import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { MarketSignal } from '@/lib/mock-data';
import { SENTIMENT_CONFIG } from '@/lib/sentiment-config';

interface SentimentGaugeProps {
  signal: MarketSignal;
}

export const SentimentGauge = memo(function SentimentGauge({ signal }: SentimentGaugeProps) {
  const cfg = SENTIMENT_CONFIG[signal.sentiment];
  const gaugePercent = ((signal.score + 100) / 200) * 100;

  return (
    <Card className={`rounded-xl overflow-hidden border ${cfg.borderClass} animate-fade-in`} role="article" aria-label={`${signal.nameKr} 시그널: ${cfg.label}, 점수 ${signal.score}`}>
      <CardContent className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm sm:text-base font-bold">{signal.nameKr}</h3>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold ${cfg.bgClass} ${cfg.colorClass}`}>
            <cfg.Icon className="w-3.5 h-3.5" />
            {cfg.label}
          </div>
        </div>

        {/* Score display */}
        <div className="text-center mb-3">
          <span className={`text-3xl sm:text-4xl font-extrabold font-mono ${cfg.colorClass}`}>
            {signal.score > 0 ? '+' : ''}{signal.score}
          </span>
          <p className="text-[11px] text-muted-foreground mt-0.5">점수 (-100 ~ +100)</p>
        </div>

        {/* Gauge bar */}
        <div className="mb-3">
          <div className="relative h-3 bg-muted rounded-full overflow-hidden" role="meter" aria-label={`${signal.nameKr} 시그널 게이지`} aria-valuenow={signal.score} aria-valuemin={-100} aria-valuemax={100}>
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: '100%',
                background: 'linear-gradient(to right, hsl(var(--down)), hsl(var(--muted-foreground)) 50%, hsl(var(--up)))',
                opacity: 0.3,
              }}
              aria-hidden="true"
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-card shadow-md transition-all duration-500"
              style={{
                left: `calc(${gaugePercent}% - 8px)`,
                backgroundColor: signal.sentiment === 'bullish'
                  ? 'hsl(var(--up))'
                  : signal.sentiment === 'bearish'
                    ? 'hsl(var(--down))'
                    : 'hsl(var(--muted-foreground))',
              }}
              aria-hidden="true"
            />
          </div>
          <div className="flex justify-between text-[10px] sm:text-[11px] text-muted-foreground mt-1 font-medium">
            <span>🔵 약세</span>
            <span>중립</span>
            <span>🔴 강세</span>
          </div>
        </div>

        {/* Factors */}
        <div className="space-y-1.5" role="list" aria-label="영향 요인">
          {signal.factors.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] sm:text-xs" role="listitem">
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                f.impact === 'positive' ? 'bg-up' : f.impact === 'negative' ? 'bg-down' : 'bg-muted-foreground'
              }`} aria-hidden="true" />
              <span className="text-foreground/80 flex-1 truncate">{f.name}</span>
              <span className={`text-[10px] font-semibold ${
                f.impact === 'positive' ? 'text-up' : f.impact === 'negative' ? 'text-down' : 'text-muted-foreground'
              }`}>
                {f.impact === 'positive' ? '호재' : f.impact === 'negative' ? '악재' : '중립'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
