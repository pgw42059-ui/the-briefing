import { memo } from 'react';
import { Clock, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EconomicEvent } from '@/lib/mock-data';
import { getEventDescription } from '@/lib/event-descriptions';
import { getTickerMeta, getTickerUrl } from '@/lib/ticker-meta';

function fmtRevenue(v: number): string {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9)  return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6)  return `$${(v / 1e6).toFixed(1)}M`;
  return `$${v.toLocaleString()}`;
}

function SurpriseIndicator({ actual, forecast }: { actual?: number | string; forecast?: number | string }) {
  if (actual == null || forecast == null) return null;
  const a = typeof actual === 'string' ? parseFloat(actual) : actual;
  const f = typeof forecast === 'string' ? parseFloat(forecast) : forecast;
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

// 'upcoming' | 'recent-past' (< 2h) | 'long-past' (>= 2h)
type EventStatus = 'upcoming' | 'recent-past' | 'long-past';

function getEventStatus(event: EconomicEvent): EventStatus {
  try {
    if (!event.date || !event.time || event.time === 'TBD') return 'upcoming';
    const now = new Date();
    // event.date/time은 KST 기준이므로 +09:00으로 명시해 UTC ms와 정확히 비교
    const eventTime = new Date(`${event.date}T${event.time}:00+09:00`);
    const diffMs = now.getTime() - eventTime.getTime();
    if (diffMs <= 0) return 'upcoming';
    // 2시간 이내: 아직 actual 안 올라왔을 수 있음
    if (diffMs < 2 * 60 * 60 * 1000) return 'recent-past';
    // 2시간 이상 경과: ForexFactory가 업데이트 안 했더라도 발표 완료로 처리
    return 'long-past';
  } catch {
    return 'upcoming';
  }
}

function EarningsDetail({ event }: { event: EconomicEvent }) {
  const hasEpsEst = event.epsEstimate != null;
  const hasEpsAct = event.epsActual != null;
  const hasSurprise = event.epsSurprisePct != null;
  const hasRevEst = event.revenueEstimate != null;
  const hasRevAct = event.revenueActual != null;
  const tickerMeta = event.ticker ? getTickerMeta(event.ticker) : null;

  return (
    <>
      {/* Company info */}
      {event.companyName && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">{event.companyName}</span>
          {event.ticker && (
            <>
              {tickerMeta && (
                <span className={cn('text-[9px] px-1.5 py-0.5 rounded-md border font-medium', tickerMeta.colorClass)}>
                  {tickerMeta.sector}
                </span>
              )}
              <a
                href={getTickerUrl(event.ticker)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-primary hover:underline"
              >
                {event.ticker} ↗
              </a>
            </>
          )}
        </div>
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

      {/* Revenue */}
      {(hasRevEst || hasRevAct) && (
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-2.5 rounded-lg bg-background/60 border border-border/20">
            <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">매출 예상</p>
            <p className="text-sm font-semibold tabular-nums">
              {hasRevEst ? fmtRevenue(event.revenueEstimate!) : '—'}
            </p>
          </div>
          <div className={cn(
            'text-center p-2.5 rounded-lg bg-background/60 border border-border/20',
            hasRevAct && 'ring-1 ring-primary/30 border-primary/10'
          )}>
            <p className="text-[10px] text-muted-foreground mb-1 flex items-center justify-center gap-1 uppercase tracking-wider">
              매출 실적
              {hasRevAct && hasRevEst && (
                <SurpriseIndicator
                  actual={event.revenueActual}
                  forecast={event.revenueEstimate}
                />
              )}
            </p>
            <p className={cn(
              'text-sm font-bold tabular-nums',
              hasRevAct && hasRevEst
                ? event.revenueActual! > event.revenueEstimate! ? 'text-up'
                : event.revenueActual! < event.revenueEstimate! ? 'text-down'
                : 'text-foreground'
                : 'text-foreground'
            )}>
              {hasRevAct ? fmtRevenue(event.revenueActual!) : '—'}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export const EventDetail = memo(function EventDetail({ event }: { event: EconomicEvent }) {
  const status = getEventStatus(event);
  const isPast = status !== 'upcoming';
  const isEarnings = event.category === 'earnings';
  const description = !isEarnings ? getEventDescription(event.name) : undefined;

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
              // 실적: epsActual 있거나 2시간+ 경과 시 완료
              (event.epsActual != null || status === 'long-past') ? (
                <span className="text-up">✅ 발표 완료</span>
              ) : status === 'recent-past' ? (
                <span className="text-warning">⏳ 발표 대기중</span>
              ) : (
                <span className="text-muted-foreground">🕐 발표 예정</span>
              )
            ) : (
              // 거시경제: actual 있거나 2시간+ 경과 시 완료
              (hasActual || status === 'long-past') ? (
                <span className="text-up">✅ 발표 완료</span>
              ) : status === 'recent-past' ? (
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

        {/* 지표 설명 */}
        {description && (
          <div className="flex gap-2 pt-1 border-t border-border/20">
            <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          </div>
        )}
      </div>
    </div>
  );
});
