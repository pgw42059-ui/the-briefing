import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, ChevronRight, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LazySparkline } from '@/components/LazySparkline';
import type { FuturesQuote } from '@/lib/mock-data';
import type { SparklinePoint } from '@/hooks/use-sparklines';

interface PriceCardProps {
  quote: FuturesQuote;
  sparklineData?: SparklinePoint[];
  showWatchlist?: boolean;
  isWatched?: boolean;
  onToggleWatchlist?: () => void;
}

export const PriceCard = memo(function PriceCard({ quote, sparklineData, showWatchlist, isWatched, onToggleWatchlist }: PriceCardProps) {
  const navigate = useNavigate();
  const isUp = quote.change >= 0;

  const w52High = quote.week52High;
  const w52Low = quote.week52Low;
  const hasRange = w52High != null && w52Low != null && w52High > w52Low;
  const rangePercent = hasRange
    ? Math.min(100, Math.max(0, ((quote.price - w52Low!) / (w52High! - w52Low!)) * 100))
    : 0;

  return (
    <Card
      className="overflow-hidden cursor-pointer group hover:shadow-md hover:border-primary/40 transition-all duration-200 rounded-xl min-h-[218px] animate-fade-in"
      onClick={() => navigate(`/asset/${quote.symbol.toLowerCase()}`)}
      role="article"
      aria-label={`${quote.nameKr} (${quote.symbol}) - 현재가 ${quote.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}, ${isUp ? '상승' : '하락'} ${Math.abs(quote.changePercent).toFixed(2)}%`}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/asset/${quote.symbol.toLowerCase()}`); } }}
    >
      <CardContent className="p-4 sm:p-5">
        {/* Top: Name + Badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm sm:text-base font-bold leading-tight">{quote.nameKr}</h3>
              {showWatchlist && (
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleWatchlist?.(); }}
                  className="shrink-0 p-0.5 hover:scale-110 transition-transform"
                  aria-label={isWatched ? `${quote.nameKr} 관심종목 해제` : `${quote.nameKr} 관심종목 추가`}
                  aria-pressed={isWatched}
                >
                  <Star className={`w-4 h-4 ${isWatched ? 'fill-warning text-warning' : 'text-muted-foreground/40 hover:text-warning'}`} aria-hidden="true" />
                </button>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground font-mono mt-0.5">{quote.symbol}</p>
          </div>
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold ${
            isUp ? 'bg-up-muted text-up' : 'bg-down-muted text-down'
          }`}>
            {isUp ? <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" /> : <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />}
            <span className="sr-only">{isUp ? '상승' : '하락'}</span>
            {isUp ? '+' : ''}{quote.changePercent.toFixed(2)}%
          </div>
        </div>

        {/* Price */}
        <p className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight mb-2">
          {quote.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>

        {/* Sparkline */}
        {sparklineData && sparklineData.length >= 2 && (
          <div className="mb-2" aria-hidden="true">
            <LazySparkline data={sparklineData} isUp={isUp} />
          </div>
        )}

        {/* 52-week range */}
        {hasRange && (
          <div className="mb-2">
            <div className="flex justify-between text-[10px] sm:text-[11px] text-muted-foreground mb-1">
              <span className="font-mono">{w52Low!.toLocaleString()}</span>
              <span className="text-muted-foreground">52주 범위</span>
              <span className="font-mono">{w52High!.toLocaleString()}</span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden" role="meter" aria-label="52주 범위 내 현재가 위치" aria-valuenow={rangePercent} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-down/60 via-muted-foreground/30 to-up/60"
                style={{ width: '100%' }}
                aria-hidden="true"
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-card shadow-sm"
                style={{
                  left: `calc(${rangePercent}% - 6px)`,
                  backgroundColor: isUp ? 'hsl(var(--up))' : 'hsl(var(--down))',
                }}
                aria-hidden="true"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground pt-1">
          <span className={`font-mono font-semibold ${isUp ? 'text-up' : 'text-down'}`}>
            {isUp ? '+' : ''}{quote.change.toFixed(2)}
          </span>
          <span className="flex items-center gap-0.5 text-muted-foreground group-hover:text-primary transition-colors">
            상세보기 <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
});
