import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, ChevronRight, Star } from 'lucide-react';
import { LazySparkline } from '@/components/LazySparkline';
import type { FuturesQuote } from '@/lib/mock-data';
import type { SparklinePoint } from '@/hooks/use-sparklines';
import { Skeleton } from '@/components/ui/skeleton';

interface CompactQuoteRowProps {
  quote: FuturesQuote;
  sparklineData?: SparklinePoint[];
  showWatchlist?: boolean;
  isWatched?: boolean;
  onToggleWatchlist?: () => void;
}

const CompactQuoteRow = memo(function CompactQuoteRow({
  quote, sparklineData, showWatchlist, isWatched, onToggleWatchlist,
}: CompactQuoteRowProps) {
  const navigate = useNavigate();
  const isUp = quote.change >= 0;

  return (
    <div
      role="row"
      tabIndex={0}
      aria-label={`${quote.nameKr} ${quote.price.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${isUp ? '상승' : '하락'} ${Math.abs(quote.changePercent).toFixed(2)}%`}
      onClick={() => navigate(`/asset/${quote.symbol.toLowerCase()}`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/asset/${quote.symbol.toLowerCase()}`); } }}
      className="flex items-center gap-3 px-3 sm:px-4 py-3 cursor-pointer hover:bg-primary/5 transition-colors group rounded-lg"
    >
      {/* Change badge */}
      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-bold shrink-0 w-[68px] sm:w-20 justify-center ${
        isUp ? 'bg-up-muted text-up' : 'bg-down-muted text-down'
      }`}>
        {isUp
          ? <TrendingUp className="w-3 h-3" aria-hidden="true" />
          : <TrendingDown className="w-3 h-3" aria-hidden="true" />}
        {isUp ? '+' : ''}{quote.changePercent.toFixed(2)}%
      </div>

      {/* Name + symbol */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <div className="min-w-0">
          <span className="text-sm sm:text-[15px] font-bold leading-none block truncate">{quote.nameKr}</span>
          <span className="text-[10px] text-muted-foreground font-mono">{quote.symbol}</span>
        </div>
        {showWatchlist && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleWatchlist?.(); }}
            className="shrink-0 p-0.5 hover:scale-110 transition-transform ml-0.5"
            aria-label={isWatched ? `${quote.nameKr} 관심종목 해제` : `${quote.nameKr} 관심종목 추가`}
            aria-pressed={isWatched}
          >
            <Star className={`w-3.5 h-3.5 ${isWatched ? 'fill-warning text-warning' : 'text-muted-foreground/40 hover:text-warning'}`} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Mini sparkline */}
      {sparklineData && sparklineData.length >= 2 && (
        <div className="w-14 sm:w-20 h-8 shrink-0 hidden xs:block" aria-hidden="true">
          <LazySparkline data={sparklineData} isUp={isUp} />
        </div>
      )}

      {/* Price + change */}
      <div className="text-right shrink-0">
        <p className="text-sm sm:text-base font-extrabold font-mono leading-none">
          {quote.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
        <p className={`text-[11px] font-mono font-semibold mt-0.5 ${isUp ? 'text-up' : 'text-down'}`}>
          {isUp ? '+' : ''}{quote.change.toFixed(2)}
        </p>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" aria-hidden="true" />
    </div>
  );
});

interface CompactQuoteListProps {
  quotes?: FuturesQuote[];
  sparklines?: Record<string, SparklinePoint[]>;
  skeletonCount?: number;
  isLoading?: boolean;
  showWatchlist?: boolean;
  isWatched?: (symbol: string) => boolean;
  onToggleWatchlist?: (symbol: string) => void;
}

export const CompactQuoteList = memo(function CompactQuoteList({
  quotes, sparklines, skeletonCount = 5, isLoading, showWatchlist, isWatched, onToggleWatchlist,
}: CompactQuoteListProps) {
  if (isLoading) {
    return (
      <div className="space-y-1">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/40" role="table" aria-label="시세 목록">
      {quotes?.map((q) => (
        <CompactQuoteRow
          key={q.symbol}
          quote={q}
          sparklineData={sparklines?.[q.symbol]}
          showWatchlist={showWatchlist}
          isWatched={isWatched?.(q.symbol)}
          onToggleWatchlist={() => onToggleWatchlist?.(q.symbol)}
        />
      ))}
    </div>
  );
});
