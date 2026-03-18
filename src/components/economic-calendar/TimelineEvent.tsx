import { memo, useCallback } from 'react';
import { Star, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EconomicEvent } from '@/lib/mock-data';
import { getEventImpact } from '@/lib/event-impact';
import { getTickerMeta } from '@/lib/ticker-meta';
import { EventDetail } from './EventDetail';

function ImportanceStars({ level }: { level: EconomicEvent['importance'] }) {
  const count = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
  const label = level === 'high' ? '높음' : level === 'medium' ? '보통' : '낮음';
  return (
    <div className="flex gap-0.5" title={`중요도: ${label}`} role="img" aria-label={`중요도: ${label}`}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'w-2.5 h-2.5',
            i < count ? 'fill-warning text-warning' : 'text-muted-foreground/20'
          )}
        />
      ))}
    </div>
  );
}

function importanceDotColor(level: EconomicEvent['importance']) {
  return level === 'high' ? 'bg-destructive' : level === 'medium' ? 'bg-warning' : 'bg-muted-foreground/40';
}

function TimingBadge({ timing }: { timing: NonNullable<EconomicEvent['timing']> }) {
  if (timing === 'TNS') return null;
  const label = timing === 'BMO' ? '장 전' : '장 후';
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-md border font-medium bg-muted text-muted-foreground border-border">
      {label}
    </span>
  );
}

interface Props {
  event: EconomicEvent;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  index: number;
}

export const TimelineEvent = memo(function TimelineEvent({ event, isExpanded, onToggle, index }: Props) {
  const handleClick = useCallback(() => onToggle(event.id), [event.id, onToggle]);
  const isEarnings = event.category === 'earnings';
  // 거시경제 이벤트만 영향도 태그 표시 (캐싱됨)
  const impacts = isEarnings ? [] : getEventImpact(event.name);
  const tickerMeta = isEarnings && event.ticker ? getTickerMeta(event.ticker) : null;

  return (
    <div
      className="relative animate-fade-in"
      style={{ animationDelay: `${index * 40}ms` }}
      role="listitem"
    >
      {/* Timeline connector line */}
      <div className="absolute left-[22px] sm:left-[26px] top-0 bottom-0 w-px bg-border/60" />

      {/* Timeline dot */}
      <div className={cn(
        'absolute left-[17px] sm:left-[21px] top-4 w-[11px] h-[11px] rounded-full border-2 border-card z-10 transition-transform duration-200',
        importanceDotColor(event.importance),
        isExpanded && 'scale-125'
      )} />

      {/* Event content */}
      <button
        type="button"
        className={cn(
          'w-full text-left pl-10 sm:pl-12 pr-4 py-3 flex items-start gap-3 transition-colors duration-150 cursor-pointer rounded-r-lg',
          isExpanded ? 'bg-accent/50' : 'hover:bg-accent/30'
        )}
        onClick={handleClick}
        aria-expanded={isExpanded}
      >
        {/* Time */}
        <span className="text-xs font-mono text-muted-foreground w-10 shrink-0 pt-0.5 tabular-nums font-medium">
          {event.time}
        </span>

        {/* Country flag + name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {isEarnings ? <img src="/icons/icon-chart-bar.png" alt="" className="w-5 h-5 shrink-0" /> : <span className="text-base shrink-0">{event.country}</span>}
            {isEarnings && (
              <span className="text-base shrink-0">{event.country}</span>
            )}
            <p className="text-sm font-semibold leading-tight truncate">{event.name}</p>
            <ImportanceStars level={event.importance} />
            {isEarnings && event.timing && <TimingBadge timing={event.timing} />}
            {tickerMeta && (
              <span className={cn('text-[9px] px-1.5 py-0.5 rounded-md border font-medium shrink-0', tickerMeta.colorClass)}>
                {tickerMeta.sector}
              </span>
            )}
            {impacts.map(sym => (
              <span
                key={sym}
                className="text-[9px] font-mono px-1 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0"
              >
                {sym}
              </span>
            ))}
          </div>

          {/* Earnings ticker / macro data preview */}
          {isEarnings ? (
            event.ticker && (
              <div className="mt-1 text-[11px] text-muted-foreground">
                <span className="font-mono font-medium text-foreground/70">{event.ticker}</span>
                {event.epsActual != null && (
                  <span className="ml-2">
                    EPS 실적: <span className={cn(
                      'font-bold',
                      event.epsEstimate != null
                        ? parseFloat(event.epsActual) > parseFloat(event.epsEstimate) ? 'text-up' : parseFloat(event.epsActual) < parseFloat(event.epsEstimate) ? 'text-down' : 'text-foreground'
                        : 'text-foreground'
                    )}>{event.epsActual}</span>
                  </span>
                )}
              </div>
            )
          ) : (
            (event.actual || event.forecast || event.previous) && (
              <div className="flex flex-wrap gap-x-3 mt-1 text-[11px] text-muted-foreground">
                {event.actual && (
                  <span className="font-bold">
                    발표: <span className={
                      event.forecast
                        ? parseFloat(event.actual) > parseFloat(event.forecast) ? 'text-up'
                        : parseFloat(event.actual) < parseFloat(event.forecast) ? 'text-down'
                        : 'text-foreground'
                        : 'text-foreground'
                    }>{event.actual}</span>
                  </span>
                )}
                {event.forecast && <span>예상: <span className="text-foreground font-medium">{event.forecast}</span></span>}
                {event.previous && <span>이전: {event.previous}</span>}
              </div>
            )
          )}
        </div>

        {/* Expand chevron */}
        <ChevronDown className={cn(
          'w-4 h-4 text-muted-foreground shrink-0 mt-0.5 transition-transform duration-200',
          isExpanded && 'rotate-180'
        )} />
      </button>

      {/* Expanded detail */}
      {isExpanded && <EventDetail event={event} />}
    </div>
  );
});
