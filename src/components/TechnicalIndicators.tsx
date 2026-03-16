import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TechnicalResult } from '@/lib/compute-technicals';
import { SENTIMENT_CONFIG } from '@/lib/sentiment-config';

interface TechnicalIndicatorsProps {
  indicators: TechnicalResult[];
}

export function TechnicalIndicators({ indicators }: TechnicalIndicatorsProps) {
  if (indicators.length === 0) return null;

  const bullCount = indicators.filter(i => i.signal === 'bullish').length;
  const bearCount = indicators.filter(i => i.signal === 'bearish').length;
  const overallSignal = bullCount > bearCount ? 'bullish' : bearCount > bullCount ? 'bearish' : 'neutral';
  const overall = SENTIMENT_CONFIG[overallSignal];

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg font-bold flex items-center justify-between">
          <span>📐 보조지표 분석</span>
          <span className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold ${overall.colorClass}`}>
            <overall.Icon className="w-4 h-4" />
            종합 {overall.label} ({bullCount}강세 / {bearCount}약세)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1" role="list" aria-label="보조지표 목록">
          {indicators.map((ind) => {
            const cfg = SENTIMENT_CONFIG[ind.signal];
            return (
              <div key={ind.name} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0" role="listitem">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dotClass}`} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base font-semibold">{ind.name}</span>
                    <span className="text-sm sm:text-base font-mono font-bold">{ind.value}</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{ind.description}</p>
                </div>
                <span className={`shrink-0 px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold ${cfg.bgClass} ${cfg.colorClass}`}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
