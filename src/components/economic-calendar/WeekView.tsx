import { memo, useMemo } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { EconomicEvent } from '@/lib/mock-data';
import type { ImportanceLevel } from './ImportanceFilter';
import { TimelineEvent } from './TimelineEvent';

// 모듈 레벨 상수 — 렌더마다 재계산 없음
const TODAY_STR = new Date().toISOString().slice(0, 10);

interface Props {
  events: EconomicEvent[];        // 카테고리 필터 적용된 전체 이벤트
  importance: ImportanceLevel;
  expandedId: string | null;
  onToggle: (id: string) => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export const WeekView = memo(function WeekView({
  events, importance, expandedId, onToggle, selectedDate, onSelectDate,
}: Props) {
  // 선택된 날짜가 속한 주의 월~일
  const weekDays = useMemo(() => {
    const mon = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  }, [selectedDate]);

  const weekDateSet = useMemo(
    () => new Set(weekDays.map(d => format(d, 'yyyy-MM-dd'))),
    [weekDays],
  );

  // 이번 주 이벤트를 날짜별로 그룹화 + 시간순 정렬
  const groupedByDate = useMemo(() => {
    const map = new Map<string, EconomicEvent[]>();
    for (const e of events) {
      if (!weekDateSet.has(e.date)) continue;
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    map.forEach((list, key) =>
      map.set(key, [...list].sort((a, b) => a.time.localeCompare(b.time)))
    );
    return map;
  }, [events, weekDateSet]);

  // 중요도 필터 적용
  const filtered = useMemo(() => {
    if (importance === 'all') return groupedByDate;
    const result = new Map<string, EconomicEvent[]>();
    groupedByDate.forEach((evs, date) => {
      const f = evs.filter(e => e.importance === importance);
      if (f.length > 0) result.set(date, f);
    });
    return result;
  }, [groupedByDate, importance]);

  const selectedStr = format(selectedDate, 'yyyy-MM-dd');
  const hasAny = filtered.size > 0;

  return (
    <div>
      {/* 요일 칩 행 */}
      <div className="flex gap-1 px-3 py-2.5 border-b border-border/30">
        {weekDays.map(day => {
          const dateStr   = format(day, 'yyyy-MM-dd');
          const dayEvs    = groupedByDate.get(dateStr) ?? [];
          const highCount = dayEvs.filter(e => e.importance === 'high').length;
          const medCount  = dayEvs.filter(e => e.importance === 'medium').length;
          const isSelected = dateStr === selectedStr;
          const isToday    = dateStr === TODAY_STR;
          const isWeekend  = day.getDay() === 0 || day.getDay() === 6;

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(day)}
              className={cn(
                'flex-1 flex flex-col items-center py-1.5 rounded-lg text-[11px] transition-colors',
                isSelected
                  ? 'bg-primary text-primary-foreground shadow'
                  : isToday
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : isWeekend
                  ? 'text-muted-foreground/40 hover:bg-accent/30'
                  : 'hover:bg-accent/50 text-foreground',
              )}
            >
              <span className="font-medium">{format(day, 'EEE', { locale: ko })}</span>
              <span className="tabular-nums font-semibold">{format(day, 'd')}</span>
              <div className="flex gap-0.5 mt-0.5 h-1.5">
                {highCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-destructive" />}
                {medCount  > 0 && <span className="w-1.5 h-1.5 rounded-full bg-warning" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* 날짜별 그룹 이벤트 */}
      <div className="relative py-2" role="list" aria-label="주간 이벤트 타임라인">
        {hasAny ? (
          weekDays.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayEvs  = filtered.get(dateStr);
            if (!dayEvs?.length) return null;

            const isSelectedDay = dateStr === selectedStr;
            const isToday       = dateStr === TODAY_STR;

            return (
              <div key={dateStr}>
                {/* 날짜 그룹 헤더 */}
                <div className={cn(
                  'px-4 py-1.5 border-b border-border/20 flex items-center gap-2',
                  isSelectedDay ? 'bg-primary/5' : isToday ? 'bg-accent/30' : 'bg-muted/20',
                )}>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {format(day, 'M월 d일 (EEEE)', { locale: ko })}
                  </span>
                  {isToday && (
                    <span className="text-[10px] text-primary font-medium">오늘</span>
                  )}
                  <span className="ml-auto text-[10px] text-muted-foreground/50">
                    {dayEvs.length}개
                  </span>
                </div>

                {dayEvs.map((event, i) => (
                  <TimelineEvent
                    key={event.id}
                    event={event}
                    isExpanded={expandedId === event.id}
                    onToggle={onToggle}
                    index={i}
                  />
                ))}
              </div>
            );
          })
        ) : (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">이번 주 예정된 이벤트가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
});
