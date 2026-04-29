import { useMemo, useState, useCallback, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, Gem, DollarSign, Star, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { InstallBanner } from '@/components/InstallBanner';
import { Footer } from '@/components/Footer';
import { AppTabNav } from '@/components/AppTabNav';

const CompactQuoteList = lazy(() => import('@/components/CompactQuoteList').then(m => ({ default: m.CompactQuoteList })));
const SentimentGauge = lazy(() => import('@/components/SentimentGauge').then(m => ({ default: m.SentimentGauge })));
const MarketSummary = lazy(() => import('@/components/MarketSummary').then(m => ({ default: m.MarketSummary })));
const FearGreedGauge = lazy(() => import('@/components/FearGreedGauge').then(m => ({ default: m.FearGreedGauge })));

import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useMarketQuotes } from '@/hooks/use-market-quotes';
import { useEconomicEvents } from '@/hooks/use-economic-events';
import { useMarketAnalysis } from '@/hooks/use-market-analysis';
import { useSparklines } from '@/hooks/use-sparklines';
import { useAuth } from '@/hooks/use-auth';
import { useWatchlist } from '@/hooks/use-watchlist';
import { computeAllSignals, computeCompositeScore } from '@/lib/compute-signals';
import { useNotifications } from '@/hooks/use-notifications';
import { useFearGreed } from '@/hooks/use-fear-greed';
import { MarketCompositeBar } from '@/components/MarketCompositeBar';

const INDEX_SYMBOLS = ['NQ', 'ES', 'YM', 'HSI', 'NIY', 'STOXX50E', 'VIX'];
const COMMODITY_SYMBOLS = ['GC', 'SI', 'CL', 'NG', 'HG'];
const FX_SYMBOLS = ['USDKRW', 'DXY', 'EURUSD', 'USDJPY', 'GBPUSD', 'AUDUSD', 'USDCAD'];
const ALL_SYMBOLS = [...INDEX_SYMBOLS, ...COMMODITY_SYMBOLS, ...FX_SYMBOLS];

function QuoteListSkeleton({ count }: { count: number }) {
  return (
    <div className="p-3 space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-10 rounded" />
      ))}
    </div>
  );
}

function SignalGrid({ items }: { items: ReturnType<typeof computeAllSignals> }) {
  // 3열 그리드 기준 마지막 행에 아이템이 1개뿐이면 중앙 정렬
  const orphanLg = items.length % 3 === 1;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {items.map((s, i) => {
        const isLast = i === items.length - 1;
        return (
          <Suspense
            key={s.symbol}
            fallback={<Skeleton className={`h-[120px] rounded-xl${isLast && orphanLg ? ' lg:col-start-2' : ''}`} />}
          >
            <div className={isLast && orphanLg ? 'lg:col-start-2' : ''}>
              <SentimentGauge signal={s} />
            </div>
          </Suspense>
        );
      })}
    </div>
  );
}

const Index = () => {
  const [searchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') ?? 'quotes') as 'quotes' | 'analysis';
  const { data: quotes, isLoading, isError, isPlaceholderData, refetch } = useMarketQuotes();
  const { data: allEvents } = useEconomicEvents();
  const { data: fearGreed } = useFearGreed();
  const signals = useMemo(() => quotes ? computeAllSignals(quotes) : [], [quotes]);
  const composite = useMemo(() => quotes ? computeCompositeScore(quotes, fearGreed ?? null) : null, [quotes, fearGreed]);
  const { data: sparklines } = useSparklines(ALL_SYMBOLS);
  const [cacheTtlMinutes, setCacheTtlMinutes] = useState(60);
  const [signalTab, setSignalTab] = useState<'indices' | 'commodities' | 'fx'>(
    () => (localStorage.getItem('signal-tab') as 'indices' | 'commodities' | 'fx') ?? 'indices'
  );
  const { user } = useAuth();
  const { symbols: watchlistSymbols, isWatched, toggle: toggleWatchlist } = useWatchlist();

  const { indexQuotes, commodityQuotes, fxQuotes } = useMemo(() => {
    const bySymbol = new Map(quotes?.map(q => [q.symbol, q]));
    return {
      indexQuotes: INDEX_SYMBOLS.flatMap(s => bySymbol.has(s) ? [bySymbol.get(s)!] : []),
      commodityQuotes: COMMODITY_SYMBOLS.flatMap(s => bySymbol.has(s) ? [bySymbol.get(s)!] : []),
      fxQuotes: FX_SYMBOLS.flatMap(s => bySymbol.has(s) ? [bySymbol.get(s)!] : []),
    };
  }, [quotes]);

  const watchlistQuotes = useMemo(
    () => quotes?.filter(q => watchlistSymbols.includes(q.symbol)) ?? [],
    [quotes, watchlistSymbols]
  );

  const { indexSignals, commoditySignals, fxSignals } = useMemo(() => ({
    indexSignals: signals.filter(s => INDEX_SYMBOLS.includes(s.symbol)),
    commoditySignals: signals.filter(s => COMMODITY_SYMBOLS.includes(s.symbol)),
    fxSignals: signals.filter(s => FX_SYMBOLS.includes(s.symbol)),
  }), [signals]);

  const todayEvents = useMemo(() => {
    if (!allEvents) return undefined;
    const today = format(new Date(), 'yyyy-MM-dd');
    return allEvents.filter(e => e.date === today);
  }, [allEvents]);

  const {
    notifications, unreadCount,
    prefs: notifPrefs, updatePrefs,
    markAllRead, markOneRead, deleteOne, clearAll,
    requestBrowserPermission,
    priceAlerts, deletePriceAlert, clearTriggeredAlerts,
  } = useNotifications(isPlaceholderData ? undefined : quotes, todayEvents, watchlistSymbols);

  const {
    data: analysisItems, isLoading: analysisLoading, isError: analysisError,
    forceRefetch, isFetching: analysisRefreshing, clearCache,
  } = useMarketAnalysis(quotes, todayEvents, cacheTtlMinutes);

  const handleClearCache = useCallback(async () => {
    await clearCache();
    forceRefetch();
  }, [clearCache, forceRefetch]);

  const hasWatchlist = user && watchlistSymbols.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>랩메린이 — 해외선물 경제지표 대시보드</title>
        <meta name="description" content="나스닥, S&P500, 항셍, 골드, 오일 등 해외선물 실시간 시세와 경제지표를 한눈에. 강세/약세 시그널과 기술적 분석을 제공합니다." />
        <link rel="canonical" href="https://lab.merini.com/" />
        <meta property="og:title" content="랩메린이 — 해외선물 경제지표 대시보드" />
        <meta property="og:description" content="나스닥, S&P500, 항셍, 골드, 오일 등 해외선물 실시간 시세와 강세/약세 시그널을 한눈에 확인하세요." />
        <meta property="og:url" content="https://lab.merini.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://lab.merini.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="랩메린이 — 해외선물 경제지표 대시보드" />
        <meta name="twitter:description" content="나스닥, S&P500, 항셍, 골드, 오일 등 해외선물 실시간 시세와 강세/약세 시그널을 한눈에 확인하세요." />
        <meta name="twitter:image" content="https://lab.merini.com/og-image.png" />
      </Helmet>

      {/* Skip to main content */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg">
        메인 콘텐츠로 건너뛰기
      </a>

      <AppTabNav
        activeTab={activeTab}
        isLive={!isLoading && !isError}
        notificationHandlers={{
          notifications, unreadCount,
          prefs: notifPrefs, updatePrefs,
          requestBrowserPermission,
          markAllRead, markOneRead, deleteOne, clearAll,
          priceAlerts, deletePriceAlert, clearTriggeredAlerts,
        }}
      />

      {/* ── Main content ── */}
      <main id="main-content" className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6" role="main">

        {/* === 시세 탭 === */}
        {activeTab === 'quotes' && <div className="space-y-4 sm:space-y-5">
            {/* 에러 배너 */}
            {isError && (
              <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/5" role="alert">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="text-sm font-medium">시세 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="shrink-0 h-8 text-xs gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  재시도
                </Button>
              </div>
            )}

            {/* 실시간 시세 */}
            <section aria-labelledby="quotes-heading">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-1 h-6 rounded-full bg-primary shrink-0" aria-hidden="true" />
                  <div>
                    <h2 id="quotes-heading" className="text-base sm:text-lg font-bold leading-tight">실시간 시세</h2>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">클릭하면 상세 차트를 볼 수 있어요</p>
                  </div>
                </div>
              </div>

              {/* 관심종목 */}
              {hasWatchlist && (
                <div className="rounded-xl border border-border/50 bg-card mb-3 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b border-border/40 bg-muted/30">
                    <Star className="w-3.5 h-3.5 text-warning fill-warning" aria-hidden="true" />
                    <span className="text-xs font-bold text-foreground/80">관심종목</span>
                  </div>
                  <Suspense fallback={<div className="p-3"><Skeleton className="h-10 rounded" /></div>}>
                    <CompactQuoteList
                      quotes={watchlistQuotes}
                      sparklines={sparklines}
                      isLoading={isLoading}
                      skeletonCount={watchlistSymbols.length}
                      showWatchlist
                      isWatched={isWatched}
                      onToggleWatchlist={toggleWatchlist}
                    />
                  </Suspense>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 items-start">
                {/* 주요 지수 */}
                <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                  <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b border-border/40 bg-muted/30">
                    <BarChart3 className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                    <span className="text-xs font-bold text-foreground/80">주요 지수</span>
                  </div>
                  <Suspense fallback={<QuoteListSkeleton count={7} />}>
                    <CompactQuoteList
                      quotes={indexQuotes}
                      sparklines={sparklines}
                      isLoading={isLoading}
                      skeletonCount={7}
                      showWatchlist={!!user}
                      isWatched={isWatched}
                      onToggleWatchlist={toggleWatchlist}
                    />
                  </Suspense>
                </div>

                {/* 원자재 + FX */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                    <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b border-border/40 bg-muted/30">
                      <Gem className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                      <span className="text-xs font-bold text-foreground/80">원자재</span>
                    </div>
                    <Suspense fallback={<QuoteListSkeleton count={5} />}>
                      <CompactQuoteList
                        quotes={commodityQuotes}
                        sparklines={sparklines}
                        isLoading={isLoading}
                        skeletonCount={5}
                        showWatchlist={!!user}
                        isWatched={isWatched}
                        onToggleWatchlist={toggleWatchlist}
                      />
                    </Suspense>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                    <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b border-border/40 bg-muted/30">
                      <DollarSign className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                      <span className="text-xs font-bold text-foreground/80">FX</span>
                    </div>
                    <Suspense fallback={<QuoteListSkeleton count={7} />}>
                      <CompactQuoteList
                        quotes={fxQuotes}
                        sparklines={sparklines}
                        isLoading={isLoading}
                        skeletonCount={7}
                        showWatchlist={!!user}
                        isWatched={isWatched}
                        onToggleWatchlist={toggleWatchlist}
                      />
                    </Suspense>
                  </div>
                </div>
              </div>
            </section>
        </div>}

        {/* === 분석 탭 === */}
        {activeTab === 'analysis' && <div className="space-y-5 sm:space-y-6">
            {/* 1. 시장 종합 심리 */}
            {composite && <MarketCompositeBar composite={composite} />}

            {/* 2. AI 분석 + 공포/탐욕 */}
            <div className="grid lg:grid-cols-5 gap-4 sm:gap-6">
              <div className="lg:col-span-3">
                <Suspense fallback={<Skeleton className="h-[400px] rounded-xl" />}>
                  <MarketSummary
                    items={analysisItems}
                    isLoading={analysisLoading}
                    isError={analysisError}
                    onRefresh={() => forceRefetch()}
                    isRefreshing={analysisRefreshing}
                    cacheTtlMinutes={cacheTtlMinutes}
                    onCacheTtlChange={setCacheTtlMinutes}
                    onClearCache={handleClearCache}
                  />
                </Suspense>
              </div>
              <div className="lg:col-span-2">
                <Suspense fallback={<Skeleton className="h-[400px] rounded-xl" />}>
                  <FearGreedGauge />
                </Suspense>
              </div>
            </div>

            {/* 3. 강세/약세 시그널 */}
            <section aria-labelledby="signals-heading">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-1 h-6 rounded-full bg-primary shrink-0" aria-hidden="true" />
                <div>
                  <h2 id="signals-heading" className="text-base sm:text-lg font-bold leading-tight">강세/약세 시그널</h2>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">각 종목의 방향성을 한눈에 파악하세요</p>
                </div>
              </div>
              <Tabs
                value={signalTab}
                onValueChange={(v) => {
                  const tab = v as 'indices' | 'commodities' | 'fx';
                  setSignalTab(tab);
                  localStorage.setItem('signal-tab', tab);
                }}
                className="w-full"
              >
                <TabsList className="h-8 sm:h-9 rounded-xl bg-muted/70 border border-border/50 p-0.5 mb-4">
                  <TabsTrigger value="indices" className="text-[10px] sm:text-xs gap-1 sm:gap-1.5 px-2 sm:px-2.5 h-7 sm:h-8 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm font-semibold">
                    <BarChart3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    지수
                  </TabsTrigger>
                  <TabsTrigger value="commodities" className="text-[10px] sm:text-xs gap-1 sm:gap-1.5 px-2 sm:px-2.5 h-7 sm:h-8 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm font-semibold">
                    <Gem className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    원자재
                  </TabsTrigger>
                  <TabsTrigger value="fx" className="text-[10px] sm:text-xs gap-1 sm:gap-1.5 px-2 sm:px-2.5 h-7 sm:h-8 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm font-semibold">
                    <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    FX
                  </TabsTrigger>
                </TabsList>
                <Suspense fallback={<div className="min-h-[200px]" />}>
                  <TabsContent value="indices" className="mt-0"><SignalGrid items={indexSignals} /></TabsContent>
                  <TabsContent value="commodities" className="mt-0"><SignalGrid items={commoditySignals} /></TabsContent>
                  <TabsContent value="fx" className="mt-0"><SignalGrid items={fxSignals} /></TabsContent>
                </Suspense>
              </Tabs>
            </section>
        </div>}

      </main>

      <Footer />
      <InstallBanner />
    </div>
  );
};

export default Index;
