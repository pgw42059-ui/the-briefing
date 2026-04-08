import { AlertTriangle, Info, Sparkles, RefreshCw, Settings2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MarketAnalysisItem } from '@/hooks/use-market-analysis';

interface MarketSummaryProps {
  items?: MarketAnalysisItem[];
  isLoading?: boolean;
  isError?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  cacheTtlMinutes: number;
  onCacheTtlChange: (minutes: number) => void;
  onClearCache?: () => void;
}

const fallbackItems: MarketAnalysisItem[] = [
  { type: 'info', text: '시황 분석 데이터를 불러오는 중입니다...' },
];

const TTL_OPTIONS = [
  { value: 1, label: '1분' },
  { value: 5, label: '5분' },
  { value: 10, label: '10분' },
  { value: 30, label: '30분' },
  { value: 60, label: '1시간' },
];

export function MarketSummary({ items, isLoading, isError, onRefresh, isRefreshing, cacheTtlMinutes, onCacheTtlChange, onClearCache }: MarketSummaryProps) {
  const displayItems = items && items.length > 0 ? items : fallbackItems;

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
            📋 오늘의 시황
            <span className="flex items-center gap-1 text-[10px] sm:text-xs font-medium text-foreground bg-primary/15 px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              AI 분석
            </span>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" aria-label="캐시 설정" title="캐시 설정">
                  <Settings2 className="w-4 h-4" aria-hidden="true" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3 rounded-xl" align="end">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">캐시 만료 시간</label>
                    <Select value={String(cacheTtlMinutes)} onValueChange={(v) => onCacheTtlChange(Number(v))}>
                      <SelectTrigger className="h-9 text-sm rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TTL_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={String(opt.value)} className="text-sm">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {onClearCache && (
                    <Button variant="outline" size="sm" className="w-full h-9 text-sm gap-1.5 rounded-lg" onClick={onClearCache}>
                      <Trash2 className="w-3.5 h-3.5" />
                      캐시 초기화
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            {onRefresh && (
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={onRefresh} disabled={isLoading || isRefreshing} aria-label="새로고침" title="새로고침">
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {isLoading ? (
          <>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </>
        ) : isError ? (
          <div className="flex items-start gap-2.5 text-sm p-2.5 rounded-lg bg-warning/10">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <p className="text-foreground/80 leading-relaxed">시황 분석을 불러오지 못했습니다. 새로고침을 눌러 다시 시도하세요.</p>
          </div>
        ) : (
          displayItems.map((item, i) => (
            <div key={i} className={`flex items-start gap-2.5 text-sm p-2.5 rounded-lg ${
              item.type === 'alert' ? 'bg-warning/10' : 'bg-muted/50'
            }`}>
              {item.type === 'alert' ? (
                <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              )}
              <p className="text-foreground/80 leading-relaxed">{item.text}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
