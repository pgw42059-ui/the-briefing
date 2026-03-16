import { useMemo, useState, memo, useCallback } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useEconomicEvents } from '@/hooks/use-economic-events';
import { useEarningsEvents } from '@/hooks/use-earnings-events';
import { ImportanceFilter, type ImportanceLevel } from './economic-calendar/ImportanceFilter';
import { TimelineEvent } from './economic-calendar/TimelineEvent';
import type { EconomicEvent } from '@/lib/mock-data';

type CategoryTab = 'macro' | 'earnings';

export const EconomicCalendar = memo(function EconomicCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [importance, setImportance] = useState<ImportanceLevel>('all');
  const [category, setCategory] = useState<CategoryTab>('macro');

  const { data: macroEvents = [], isLoading: macroLoading } = useEconomicEvents();
  const { data: earningsEvents = [], isLoading: earningsLoading } = useEarningsEvents();

  const isLoading = category === 'macro' ? macroLoading : earningsLoading;

  // Tag macro events with category field if missing
  const taggedMacro = useMemo<EconomicEvent[]>(
    () => macroEvents.map((e) => ({ ...e, category: 'macro' as const })),
    [macroEvents]
  );

  const taggedEarnings = useMemo<EconomicEvent[]>(
    () => earningsEvents.map((e) => ({ ...e, category: 'earnings' as const })),
    [earningsEvents]
  );

  const activeEvents = useMemo(() => {
    return category === 'macro' ? taggedMacro : taggedEarnings;
  }, [category, taggedMacro, taggedEarnings]);

  const dayEvents = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return activeEvents
      .filter((e) => e.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [activeEvents, selectedDate]);

  const filteredEvents = useMemo(
    () => importance === 'all' ? dayEvents : dayEvents.filter((e) => e.importance === importance),
    [dayEvents, importance]
  );

  const counts = useMemo(() => ({
    all: dayEvents.length,
    high: dayEvents.filter((e) => e.importance === 'high').length,
    medium: dayEvents.filter((e) => e.importance === 'medium').length,
    low: dayEvents.filter((e) => e.importance === 'low').length,
  }), [dayEvents]);

  // Combine all events for calendar dot indicators
  const eventDates = useMemo(
    () => new Set([...taggedMacro, ...taggedEarnings].map((e) => e.date)),
    [taggedMacro, taggedEarnings]
  );

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  // Data covers this week Mon–Sun + next week Mon–Sun
  const dataRangeEnd = useMemo(() => {
    const thisMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
    return addDays(thisMonday, 13); // end of next week Sunday
  }, []);
  const isOutOfRange = selectedDate > dataRangeEnd;

  const shiftDate = useCallback((days: number) => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + days);
      return d;
    });
    setExpandedId(null);
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const hasEvents = useCallback(
    (date: Date) => eventDates.has(format(date, 'yyyy-MM-dd')),
    [eventDates]
  );

  const handleCategoryChange = useCallback((tab: CategoryTab) => {
    setCategory(tab);
    setExpandedId(null);
    setImportance('all');
  }, []);

  const emptyMessage = category === 'macro'
    ? '이 날짜에 예정된 경제지표가 없습니다'
    : '이 날짜에 예정된 실적 발표가 없습니다';

  return (
    <Card className="rounded-xl overflow-hidden">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
              📅 경제 캘린더
            </CardTitle>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              {format(selectedDate, 'yyyy년 M월 d일 EEEE', { locale: ko })}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => shiftDate(-1)} aria-label="이전 날짜">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs sm:text-sm gap-1.5 px-3 rounded-lg">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {isToday ? '오늘' : format(selectedDate, 'M/d (EEE)', { locale: ko })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-xl" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  className={cn('p-3 pointer-events-auto')}
                  modifiers={{ hasEvent: (date) => hasEvents(date) }}
                  modifiersClassNames={{ hasEvent: 'border border-primary/50' }}
                />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => shiftDate(1)} aria-label="다음 날짜">
              <ChevronRight className="w-4 h-4" />
            </Button>
            {!isToday && (
              <Button variant="ghost" size="sm" className="h-8 text-xs px-2 rounded-lg" onClick={() => setSelectedDate(new Date())}>
                오늘
              </Button>
            )}
          </div>
        </div>

        {/* Category tabs */}
        <div className="mt-3 flex gap-1 p-1 bg-muted/40 rounded-lg w-fit">
          <button
            onClick={() => handleCategoryChange('macro')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-md transition-colors',
              category === 'macro'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            거시경제
          </button>
          <button
            onClick={() => handleCategoryChange('earnings')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-md transition-colors',
              category === 'earnings'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <img src="/icons/icon-chart-bar.png" alt="" className="w-4 h-4 inline-block align-middle mr-1" /> 기업실적
          </button>
        </div>

        {/* Importance filter */}
        {dayEvents.length > 0 && (
          <div className="mt-2">
            <ImportanceFilter value={importance} onChange={setImportance} counts={counts} />
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0 min-h-[350px]">
        {isLoading ? (
          <div className="px-4 py-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 items-center pl-10">
                <Skeleton className="h-3 w-10 rounded" />
                <Skeleton className="h-10 flex-1 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="mb-3"><img src={category === 'earnings' ? '/icons/icon-chart-bar.png' : isOutOfRange ? '/icons/icon-calendar.png' : '/icons/icon-inbox.png'} alt="" className="w-12 h-12 mx-auto" /></p>
            <p className="text-sm text-muted-foreground">
              {dayEvents.length > 0
                ? '해당 중요도의 이벤트가 없습니다'
                : isOutOfRange && category === 'macro'
                  ? '이번 주·다음 주 이외의 데이터는 제공되지 않습니다'
                  : emptyMessage}
            </p>
          </div>
        ) : (
          <div className="relative py-2" role="list" aria-label="경제 이벤트 타임라인">
            {filteredEvents.map((event, i) => (
              <TimelineEvent
                key={event.id}
                event={event}
                isExpanded={expandedId === event.id}
                onToggle={toggleExpand}
                index={i}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
