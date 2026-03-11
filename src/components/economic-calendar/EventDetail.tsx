import { memo } from 'react';
import { Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EconomicEvent } from '@/lib/mock-data';

function SurpriseIndicator({ actual, forecast }: { actual?: string; forecast?: string }) {
  if (!actual || !forecast) return null;
  const a = parseFloat(actual);
  const f = parseFloat(forecast);
  if (isNaN(a) || isNaN(f)) return null;
  const diff = a - f;
  if (Math.abs(diff) < 0.001) return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  return diff > 0
    ? <TrendingUp className="w-3.5 h-3.5 text-up" />
    : <TrendingDown className="w-3.5 h-3.5 text-down" />;
}

function ImportanceBadge({ level }: { level: EconomicEvent['importance'] }) {
  const config = {
    high: { label: '높음', className: 'bg-destructive/10 text-destructive border-destructive/20' },
    medium: { label: '보통', className: 'bg-warning/10 text-warning border-warning/20' },
    low: { label: '낮음', className: 'bg-muted text-muted-foreground border-border' },
  };
  const { label, className } = config[level];
  return (
    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-md border font-medium', className)}>
      {label}
    </span>
  );
}

function getEventStatus(event: EconomicEvent) {
  try {
    if (!event.date || !event.time || event.time === 'TBD') return false;
    const now = new Date();
    // event.date/time은 KST 기준이므로 +09:00으로 명시해 UTC ms와 정확히 비교
    const eventTime = new Date(`${event.date}T${event.time}:00+09:00`);
    return now > eventTime;
  } catch {
    return false;
  }
}

function EarningsDetail({ event }: { event: EconomicEvent }) {
  const hasEpsEst = event.epsEstimate != null;
  const hasEpsAct = event.epsActual != null;
  const hasSurprise = event.epsSurprisePct != null;

  return (
    <>
      {/* Company info */}
      {event.companyName && (
        <p className="text-xs text-muted-foreground">
          {event.companyName}
          {event.ticker && <span className="ml-2 font-mono text-foreground/60">{event.ticker}</span>}
        </p>
      )}

      {/* EPS grid */}
      {(hasEpsEst || hasEpsAct || hasSurprise) ? (
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2.5 rounded-lg bg-background/60 border border-border/20">
            <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">EPS 예상</p>
            <p className="text-sm font-semibold tabular-nums">
              {hasEpsEst ? event.epsEstimate : '—'}
            </p>
          </div>
          <div className={cn(
            'text-center p-2.5 rounded-lg bg-background/60 border border-border/20',
            hasEpsAct && 'ring-1 ring-primary/30 border-primary/10'
          )}>
            <p className="text-[10px] text-muted-foreground mb-1 flex items-center justify-center gap-1 uppercase tracking-wider">
              EPS 실적
              {hasEpsAct && hasEpsEst && (
                <SurpriseIndicator actual={event.epsActual} forecast={event.epsEstimate} />
              )}
            </p>
            <p className={cn(
              'text-sm font-bold tabular-nums',
              hasEpsAct && hasEpsEst
                ? parseFloat(event.epsActual!) > parseFloat(event.epsEstimate!) ? 'text-up'
                : parseFloat(event.epsActual!) < parseFloat(event.epsEstimate!) ? 'text-down'
                : 'text-foreground'
                : 'text-foreground'
            )}>
              {hasEpsAct ? event.epsActual : '—'}
            </p>
          </div>
          <div className="text-center p-2.5 rounded-lg bg-background/60 border border-border/20">
            <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">서프라이즈</p>
            <p className={cn(
              'text-sm font-bold tabular-nums',
              hasSurprise
                ? event.epsSurprisePct! > 0 ? 'text-up' : event.epsSurprisePct! < 0 ? 'text-down' : 'text-foreground'
                : 'text-foreground'
            )}>
              {hasSurprise ? `${event.epsSurprisePct! > 0 ? '+' : ''}${event.epsSurprisePct}%` : '—'}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">EPS 데이터 없음 (발표 예정)</p>
      )}
    </>
  );
}

export const EventDetail = memo(function EventDetail({ event }: { event: EconomicEvent }) {
  const isPast = getEventStatus(event);
  const isEarnings = event.category === 'earnings';

  const hasActual = !!event.actual;
  const hasForecast = !!event.forecast;
  const hasPrevious = !!event.previous;

  return (
    <div className="animate-in slide-in-from-top-1 duration-200 pb-4 pl-10 sm:pl-12 pr-4">
      <div className="bg-muted/40 rounded-xl p-4 space-y-3 border border-border/30">
        {/* Status row */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground font-mono">{event.date} {event.time} {isEarnings ? '' : 'KST'}</span>
          <ImportanceBadge level={event.importance} />
          {isEarnings && event.timing && event.timing !== 'TNS' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md border font-medium bg-muted text-muted-foreground border-border">
              {event.timing === 'BMO' ? '장 전 (BMO)' : '장 후 (AMC)'}
            </span>
          )}
          <span className="ml-auto text-[10px] font-medium">
            {isEarnings ? (
              event.epsActual != null ? (
                <span className="text-up">✅ 발표 완료</span>
              ) : isPast ? (
                <span className="text-warning">⏳ 발표 대기중</span>
              ) : (
                <span className="text-muted-foreground">🕐 발표 예정</span>
              )
            ) : (
              hasActual ? (
                <span className="text-up">✅ 발표 완료</span>
              ) : isPast ? (
                <span className="text-warning">⏳ 발표 대기중</span>
              ) : (
                <span className="text-muted-foreground">🕐 발표 예정</span>
              )
            )}
          </span>
        </div>

        {isEarnings ? (
          <EarningsDetail event={event} />
        ) : (
          <>
            {/* Macro data grid */}
            {(hasForecast || hasPrevious || hasActual) && (
              <div className="grid grid-cols-3 gap-2">
                {hasForecast && (
                  <div className="text-center p-2.5 rounded-lg bg-background/60 border border-border/20">
                    <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">예상</p>
                    <p className="text-sm font-semibold tabular-nums">{event.forecast}</p>
                  </div>
                )}
                {hasPrevious && (
                  <div className="text-center p-2.5 rounded-lg bg-background/60 border border-border/20">
                    <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">이전</p>
                    <p className="text-sm font-semibold tabular-nums">{event.previous}</p>
                  </div>
                )}
                {hasActual && (
                  <div className="text-center p-2.5 rounded-lg bg-background/60 ring-1 ring-primary/30 border border-primary/10">
                    <p className="text-[10px] text-muted-foreground mb-1 flex items-center justify-center gap-1 uppercase tracking-wider">
                      발표 <SurpriseIndicator actual={event.actual} forecast={event.forecast} />
                    </p>
                    <p className={cn(
                      'text-sm font-bold tabular-nums',
                      event.forecast
                        ? parseFloat(event.actual!) > parseFloat(event.forecast) ? 'text-up'
                        : parseFloat(event.actual!) < parseFloat(event.forecast) ? 'text-down'
                        : 'text-foreground'
                        : 'text-foreground'
                    )}>{event.actual}</p>
                  </div>
                )}
              </div>
            )}

            {!hasForecast && !hasPrevious && !hasActual && (
              <p className="text-xs text-muted-foreground italic">수치 데이터 없음 (연설/회의 등)</p>
            )}
          </>
        )}
      </div>
    </div>
  );
});
