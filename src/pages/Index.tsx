import { useMemo, useState, useCallback, lazy, Suspense, startTransition, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, BarChart3, Gem, DollarSign, Activity, Star, LogIn, User, LogOut, Bell, TrendingUp, Calendar, Brain, ChevronDown, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import { InstallBanner } from '@/components/InstallBanner';
import { Footer } from '@/components/Footer';

const PriceCard = lazy(() => import('@/components/PriceCard').then(m => ({ default: m.PriceCard })));
const EconomicCalendar = lazy(() => import('@/components/EconomicCalendar').then(m => ({ default: m.EconomicCalendar })));
const SentimentGauge = lazy(() => import('@/components/SentimentGauge').then(m => ({ default: m.SentimentGauge })));
const MarketSummary = lazy(() => import('@/components/MarketSummary').then(m => ({ default: m.MarketSummary })));
const NotificationBell = lazy(() => import('@/components/NotificationBell').then(m => ({ default: m.NotificationBell })));
const FearGreedGauge = lazy(() => import('@/components/FearGreedGauge').then(m => ({ default: m.FearGreedGauge })));
const CalculatorTab = lazy(() => import('@/components/CalculatorTab').then(m => ({ default: m.CalculatorTab })));
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useMarketQuotes } from '@/hooks/use-market-quotes';
import { useEconomicEvents } from '@/hooks/use-economic-events';
import { useMarketAnalysis } from '@/hooks/use-market-analysis';
import { useSparklines } from '@/hooks/use-sparklines';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { useWatchlist } from '@/hooks/use-watchlist';
import { computeAllSignals, computeCompositeScore } from '@/lib/compute-signals';
import { useNotifications } from '@/hooks/use-notifications';
import { useFearGreed } from '@/hooks/use-fear-greed';
import { MarketCompositeBar } from '@/components/MarketCompositeBar';

const INDEX_SYMBOLS = ['NQ', 'ES', 'YM', 'HSI', 'NIY', 'STOXX50E'];
const COMMODITY_SYMBOLS = ['GC', 'SI', 'CL', 'NG', 'HG'];
const FX_SYMBOLS = ['EURUSD', 'USDJPY', 'GBPUSD', 'AUDUSD', 'USDCAD'];
const ALL_SYMBOLS = [...INDEX_SYMBOLS, ...COMMODITY_SYMBOLS, ...FX_SYMBOLS];

const Index = () => {
  const navigate = useNavigate();
  const { data: quotes, isLoading, isError, isPlaceholderData } = useMarketQuotes();
  const { data: allEvents } = useEconomicEvents();
  const [signals, setSignals] = useState<ReturnType<typeof computeAllSignals>>([]);
  const [composite, setComposite] = useState<ReturnType<typeof computeCompositeScore> | null>(null);
  useEffect(() => {
    if (!quotes) { setSignals([]); setComposite(null); return; }
    startTransition(() => {
      setSignals(computeAllSignals(quotes));
      setComposite(computeCompositeScore(quotes, fearGreed ?? null));
    });
  }, [quotes, fearGreed]);
  const { data: fearGreed } = useFearGreed();
  const { theme, toggle } = useTheme();
  const { data: sparklines } = useSparklines(ALL_SYMBOLS);
  const [cacheTtlMinutes, setCacheTtlMinutes] = useState(60);
  const { user, displayName, signOut } = useAuth();
  const { symbols: watchlistSymbols, isWatched, toggle: toggleWatchlist } = useWatchlist();

  const indexQuotes = useMemo(() => quotes?.filter(q => INDEX_SYMBOLS.includes(q.symbol)) || [], [quotes]);
  const commodityQuotes = useMemo(() => quotes?.filter(q => COMMODITY_SYMBOLS.includes(q.symbol)) || [], [quotes]);
  const fxQuotes = useMemo(() => quotes?.filter(q => FX_SYMBOLS.includes(q.symbol)) || [], [quotes]);
  const watchlistQuotes = useMemo(() => quotes?.filter(q => watchlistSymbols.includes(q.symbol)) || [], [quotes, watchlistSymbols]);
  const indexSignals = useMemo(() => signals.filter(s => INDEX_SYMBOLS.includes(s.symbol)), [signals]);
  const commoditySignals = useMemo(() => signals.filter(s => COMMODITY_SYMBOLS.includes(s.symbol)), [signals]);
  const fxSignals = useMemo(() => signals.filter(s => FX_SYMBOLS.includes(s.symbol)), [signals]);

  const todayEvents = useMemo(() => {
    if (!allEvents) return undefined;
    const today = format(new Date(), 'yyyy-MM-dd');
    return allEvents.filter(e => e.date === today);
  }, [allEvents]);

  // isPlaceholderData일 때는 mock 데이터 → 실제 데이터 전환 시 가짜 알림 방지
  const { notifications, unreadCount, prefs: notifPrefs, updatePrefs: updateNotifPrefs, markAllRead, markOneRead, deleteOne, clearAll: clearNotifications } = useNotifications(isPlaceholderData ? undefined : quotes, todayEvents, watchlistSymbols);

  const { data: analysisItems, isLoading: analysisLoading, isError: analysisError, forceRefetch, isFetching: analysisRefreshing, clearCache } = useMarketAnalysis(quotes, todayEvents, cacheTtlMinutes);

  const handleClearCache = useCallback(async () => {
    await clearCache();
    forceRefetch();
  }, [clearCache, forceRefetch]);

  const renderQuoteGrid = (items: typeof quotes, skeletonCount: number, showWatchlistBtn = false) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 min-h-[180px]">
      {isLoading
        ? Array.from({ length: skeletonCount }).map((_, i) => <Skeleton key={i} className="h-[180px] rounded-xl" />)
        : items?.map((q) => (
          <Suspense key={q.symbol} fallback={<Skeleton className="h-[180px] rounded-xl" />}>
            <PriceCard
              quote={q}
              sparklineData={sparklines?.[q.symbol]}
              showWatchlist={!!user}
              isWatched={isWatched(q.symbol)}
              onToggleWatchlist={() => toggleWatchlist(q.symbol)}
            />
          </Suspense>
        ))
      }
    </div>
  );

  const renderSignalGrid = (items: typeof signals) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {items.map((s) => (
        <Suspense key={s.symbol} fallback={<Skeleton className="h-[120px] rounded-xl" />}>
          <SentimentGauge signal={s} />
        </Suspense>
      ))}
    </div>
  );

  const hasWatchlist = user && watchlistSymbols.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to main content */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg">
        메인 콘텐츠로 건너뛰기
      </a>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border/40" role="banner">
        {/* teal accent bar */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-70" />
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative shrink-0">
              <img src="/logo.png" alt="랩메린이" width={36} height={36} className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl shrink-0" />
              {!isLoading && !isError && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary border-2 border-background animate-pulse" aria-label="실시간 데이터 연결됨" role="status" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight leading-none">랩메린이</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-none truncate">실시간 글로벌 마켓 대시보드</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {!isLoading && !isError && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20" role="status" aria-label="실시간 데이터 연결됨">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" aria-hidden="true" />
                <span className="text-xs font-semibold text-primary">LIVE</span>
              </div>
            )}
            <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
              {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
            </span>
            {/* merini.com 연동 버튼 */}
            <a
              href="https://merini.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 h-7 sm:h-8 px-2.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-semibold bg-primary/10 text-primary border border-primary/25 hover:bg-primary hover:text-primary-foreground transition-all shrink-0"
              aria-label="메린이 메인 사이트로 이동"
            >
              <img src="/icons/icon-home.png" alt="" className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">merini.com</span>
            </a>
            <Suspense fallback={<Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg" aria-label="알림"><Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></Button>}>
              <NotificationBell
                notifications={notifications}
                unreadCount={unreadCount}
                prefs={notifPrefs}
                onUpdatePrefs={updateNotifPrefs}
                onMarkAllRead={markAllRead}
                onMarkOneRead={markOneRead}
                onDeleteOne={deleteOne}
                onClearAll={clearNotifications}
              />
            </Suspense>
            <Button variant="ghost" size="icon" onClick={toggle} className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg" aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}>
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </Button>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 sm:h-8 rounded-lg text-xs gap-1 sm:gap-1.5 px-2 sm:px-2.5 border-border/60">
                    <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="max-w-[60px] sm:max-w-[80px] truncate hidden sm:inline">{displayName || user.email?.split('@')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem className="text-sm" disabled>
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-sm gap-2 text-destructive" onClick={signOut}>
                    <LogOut className="w-3.5 h-3.5" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" className="h-7 sm:h-8 rounded-lg text-xs gap-1 sm:gap-1.5 px-2 sm:px-2.5 border-border/60" onClick={() => navigate('/auth')} aria-label="로그인">
                <LogIn className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">로그인</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6" role="main">
        <Tabs defaultValue="quotes" className="w-full">
          {/* Main Navigation Tabs */}
          <TabsList className="w-full h-11 sm:h-12 rounded-xl bg-muted/70 border border-border/50 p-1 mb-5 sm:mb-7 grid grid-cols-4 shadow-sm">
            <TabsTrigger value="quotes" className="text-xs sm:text-sm gap-1.5 sm:gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-semibold transition-all">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              시세
            </TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs sm:text-sm gap-1.5 sm:gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-semibold transition-all">
              <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              분석
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs sm:text-sm gap-1.5 sm:gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-semibold transition-all">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              캘린더
            </TabsTrigger>
            <TabsTrigger value="calculator" className="text-xs sm:text-sm gap-1.5 sm:gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-semibold transition-all">
              <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              계산기
            </TabsTrigger>
          </TabsList>

          {/* === 시세 탭 === */}
          <TabsContent value="quotes" className="mt-0 space-y-6 sm:space-y-8">
            {/* Price Cards */}
            <section aria-labelledby="quotes-heading">
              <Tabs defaultValue={hasWatchlist ? "watchlist" : "indices"} className="w-full">
                <div className="flex items-center justify-between mb-4 sm:mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1 h-6 rounded-full bg-primary shrink-0" aria-hidden="true" />
                    <div>
                      <h2 id="quotes-heading" className="text-base sm:text-lg font-bold leading-tight">실시간 시세</h2>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">클릭하면 상세 차트를 볼 수 있어요</p>
                    </div>
                  </div>
                  <TabsList className="h-8 sm:h-9 rounded-xl bg-muted/70 border border-border/50 p-0.5">
                    {user && (
                      <TabsTrigger value="watchlist" className="text-[10px] sm:text-xs gap-1 sm:gap-1.5 px-2 sm:px-2.5 h-7 sm:h-8 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm font-semibold">
                        <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        관심
                      </TabsTrigger>
                    )}
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
                </div>
                {user && (
                  <TabsContent value="watchlist" className="mt-0">
                    {watchlistSymbols.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">관심종목이 없습니다</p>
                        <p className="text-xs mt-1">각 종목 카드의 ⭐ 버튼을 눌러 추가하세요</p>
                      </div>
                    ) : (
                      renderQuoteGrid(watchlistQuotes, watchlistSymbols.length, true)
                    )}
                  </TabsContent>
                )}
                <TabsContent value="indices" className="mt-0">
                  {renderQuoteGrid(indexQuotes, 6)}
                </TabsContent>
                <TabsContent value="commodities" className="mt-0">
                  {renderQuoteGrid(commodityQuotes, 5)}
                </TabsContent>
                <TabsContent value="fx" className="mt-0">
                  {renderQuoteGrid(fxQuotes, 5)}
                </TabsContent>
              </Tabs>
            </section>

            {/* Signals */}
            <Collapsible defaultOpen>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all group shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                      <Activity className="w-4 h-4 text-primary" aria-hidden="true" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-sm sm:text-base font-bold">강세/약세 시그널</h2>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">각 종목의 방향성을 한눈에 파악하세요</p>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                {composite && <MarketCompositeBar composite={composite} />}
                <Tabs defaultValue="indices" className="w-full">
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
                    <TabsContent value="indices" className="mt-0">{renderSignalGrid(indexSignals)}</TabsContent>
                    <TabsContent value="commodities" className="mt-0">{renderSignalGrid(commoditySignals)}</TabsContent>
                    <TabsContent value="fx" className="mt-0">{renderSignalGrid(fxSignals)}</TabsContent>
                  </Suspense>
                </Tabs>
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>

          {/* === 분석 탭 === */}
          <TabsContent value="analysis" className="mt-0 space-y-5 sm:space-y-6">
            <div className="grid lg:grid-cols-5 gap-4 sm:gap-6">
              <div className="lg:col-span-3">
                <Suspense fallback={<Skeleton className="h-[400px] rounded-xl" />}>
                  <MarketSummary items={analysisItems} isLoading={analysisLoading} isError={analysisError} onRefresh={() => forceRefetch()} isRefreshing={analysisRefreshing} cacheTtlMinutes={cacheTtlMinutes} onCacheTtlChange={setCacheTtlMinutes} onClearCache={handleClearCache} />
                </Suspense>
              </div>
              <div className="lg:col-span-2">
                <Suspense fallback={<Skeleton className="h-[400px] rounded-xl" />}>
                  <FearGreedGauge />
                </Suspense>
              </div>
            </div>
          </TabsContent>

          {/* === 캘린더 탭 === */}
          <TabsContent value="calendar" className="mt-0">
            <Suspense fallback={<Skeleton className="h-[500px] rounded-xl" />}>
              <EconomicCalendar />
            </Suspense>
          </TabsContent>

          {/* === 계산기 탭 === */}
          <TabsContent value="calculator" className="mt-0">
            <Suspense fallback={<Skeleton className="h-[500px] rounded-xl" />}>
              <CalculatorTab />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
      <InstallBanner />
    </div>
  );
};

export default Index;
