import { useMemo, useState, useCallback, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sun, Moon, BarChart3, Gem, DollarSign, Star, LogIn, User, LogOut, Bell, TrendingUp, Calendar, Brain, Calculator, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { InstallBanner } from '@/components/InstallBanner';
import { Footer } from '@/components/Footer';

const CompactQuoteList = lazy(() => import('@/components/CompactQuoteList').then(m => ({ default: m.CompactQuoteList })));
const SentimentGauge = lazy(() => import('@/components/SentimentGauge').then(m => ({ default: m.SentimentGauge })));
const MarketSummary = lazy(() => import('@/components/MarketSummary').then(m => ({ default: m.MarketSummary })));
const NotificationBell = lazy(() => import('@/components/NotificationBell').then(m => ({ default: m.NotificationBell })));
const FearGreedGauge = lazy(() => import('@/components/FearGreedGauge').then(m => ({ default: m.FearGreedGauge })));

import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

const INDEX_SYMBOLS = ['NQ', 'ES', 'YM', 'HSI', 'NIY', 'STOXX50E', 'VIX'];
const COMMODITY_SYMBOLS = ['GC', 'SI', 'CL', 'NG', 'HG'];
const FX_SYMBOLS = ['USDKRW', 'DXY', 'EURUSD', 'USDJPY', 'GBPUSD', 'AUDUSD', 'USDCAD'];
const ALL_SYMBOLS = [...INDEX_SYMBOLS, ...COMMODITY_SYMBOLS, ...FX_SYMBOLS];

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') ?? 'quotes';
  const { data: quotes, isLoading, isError, isPlaceholderData, refetch } = useMarketQuotes();
  const { data: allEvents } = useEconomicEvents();
  const { data: fearGreed } = useFearGreed();
  const signals = useMemo(() => quotes ? computeAllSignals(quotes) : [], [quotes]);
  const composite = useMemo(() => quotes ? computeCompositeScore(quotes, fearGreed ?? null) : null, [quotes, fearGreed]);
  const { theme, toggle } = useTheme();
  const { data: sparklines } = useSparklines(ALL_SYMBOLS);
  const [cacheTtlMinutes, setCacheTtlMinutes] = useState(60);
  const { user, displayName, signOut } = useAuth();
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
    prefs: notifPrefs, updatePrefs: updateNotifPrefs,
    markAllRead, markOneRead, deleteOne, clearAll: clearNotifications,
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

      {/* Tabs 루트가 header + main을 모두 감싸 TabsList↔TabsContent 연결 */}
      <Tabs
        key={defaultTab}
        defaultValue={defaultTab}
        onValueChange={(v) => {
          if (v === 'calendar') navigate('/calendar');
          else if (v === 'calculator') navigate('/calculator');
          else if (v === 'analysis') navigate('/?tab=analysis', { replace: true });
          else navigate('/', { replace: true });
        }}
      >
        {/* ── Header (AppTabNav와 동일한 1행 구조) ── */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border/40" role="banner">
          <div className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-70" />
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2 sm:py-3 flex items-center gap-2 sm:gap-3">

            {/* 로고 */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 shrink-0"
              aria-label="홈으로"
            >
              <div className="relative shrink-0">
                <img
                  src="/logo.png"
                  alt="랩메린이"
                  width={36}
                  height={36}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl"
                />
                {!isLoading && !isError && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary border-2 border-background animate-pulse"
                    aria-label="실시간 데이터 연결됨"
                    role="status"
                  />
                )}
              </div>
              <div className="min-w-0 hidden lg:block">
                <p className="text-sm font-extrabold tracking-tight leading-none">랩메린이</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">실시간 글로벌 마켓 대시보드</p>
              </div>
            </button>

            {/* 탭바 */}
            <TabsList className="flex-1 h-10 sm:h-11 rounded-xl bg-muted/70 border border-border/50 p-1 grid grid-cols-4 shadow-sm">
              <TabsTrigger
                value="quotes"
                className="text-xs sm:text-sm gap-1 sm:gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-semibold transition-all"
              >
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">시세</span>
              </TabsTrigger>
              <TabsTrigger
                value="analysis"
                className="text-xs sm:text-sm gap-1 sm:gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-semibold transition-all"
              >
                <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">분석</span>
              </TabsTrigger>
              <TabsTrigger
                value="calendar"
                className="text-xs sm:text-sm gap-1 sm:gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-semibold transition-all"
              >
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">캘린더</span>
              </TabsTrigger>
              <TabsTrigger
                value="calculator"
                className="text-xs sm:text-sm gap-1 sm:gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-semibold transition-all"
              >
                <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">계산기</span>
              </TabsTrigger>
            </TabsList>

            {/* 우측 액션 버튼 */}
            <div className="flex items-center gap-1 shrink-0">
              {/* LIVE 배지 */}
              {!isLoading && !isError && (
                <div
                  className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 border border-primary/20"
                  role="status"
                  aria-label="실시간 데이터 연결됨"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" aria-hidden="true" />
                  <span className="text-xs font-semibold text-primary">LIVE</span>
                </div>
              )}
              {/* 날짜 */}
              <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline px-1">
                {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
              </span>
              {/* merini.com */}
              <a
                href="https://merini.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1 h-8 px-2.5 rounded-lg text-[11px] font-semibold bg-primary/10 text-primary border border-primary/25 hover:bg-primary hover:text-primary-foreground transition-all shrink-0"
                aria-label="메린이 메인 사이트로 이동"
              >
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
                merini.com
              </a>
              {/* 알림 */}
              <Suspense fallback={
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" aria-label="알림">
                  <Bell className="w-4 h-4" />
                </Button>
              }>
                <NotificationBell
                  notifications={notifications}
                  unreadCount={unreadCount}
                  prefs={notifPrefs}
                  onUpdatePrefs={updateNotifPrefs}
                  onRequestBrowserPermission={requestBrowserPermission}
                  onMarkAllRead={markAllRead}
                  onMarkOneRead={markOneRead}
                  onDeleteOne={deleteOne}
                  onClearAll={clearNotifications}
                  priceAlerts={priceAlerts}
                  onDeletePriceAlert={deletePriceAlert}
                  onClearTriggeredAlerts={clearTriggeredAlerts}
                />
              </Suspense>
              {/* 테마 토글 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                className="h-8 w-8 rounded-lg"
                aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
              >
                {theme === 'dark'
                  ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                }
              </Button>
              {/* 로그인/유저 */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs gap-1 px-2 border-border/60">
                      <User className="w-3 h-3" />
                      <span className="hidden sm:inline max-w-[60px] truncate">
                        {displayName || user.email?.split('@')[0]}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem className="text-sm" disabled>{user.email}</DropdownMenuItem>
                    <DropdownMenuItem className="text-sm gap-2 text-destructive" onClick={signOut}>
                      <LogOut className="w-3.5 h-3.5" />
                      로그아웃
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg text-xs gap-1 px-2 border-border/60"
                  onClick={() => navigate('/auth')}
                  aria-label="로그인"
                >
                  <LogIn className="w-3 h-3" />
                  <span className="hidden sm:inline">로그인</span>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* ── Main content ── */}
        <main id="main-content" className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6" role="main">

          {/* === 시세 탭 === */}
          <TabsContent value="quotes" className="mt-0 space-y-4 sm:space-y-5">
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

              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                {/* 주요 지수 */}
                <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                  <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b border-border/40 bg-muted/30">
                    <BarChart3 className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                    <span className="text-xs font-bold text-foreground/80">주요 지수</span>
                  </div>
                  <Suspense fallback={<div className="p-3 space-y-1">{Array.from({length:7}).map((_,i)=><Skeleton key={i} className="h-10 rounded"/>)}</div>}>
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
                    <Suspense fallback={<div className="p-3 space-y-1">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-10 rounded"/>)}</div>}>
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
                    <Suspense fallback={<div className="p-3 space-y-1">{Array.from({length:7}).map((_,i)=><Skeleton key={i} className="h-10 rounded"/>)}</div>}>
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
          </TabsContent>

          {/* === 분석 탭 === */}
          <TabsContent value="analysis" className="mt-0 space-y-5 sm:space-y-6">
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
                  <TabsContent value="indices" className="mt-0"><SignalGrid items={indexSignals} /></TabsContent>
                  <TabsContent value="commodities" className="mt-0"><SignalGrid items={commoditySignals} /></TabsContent>
                  <TabsContent value="fx" className="mt-0"><SignalGrid items={fxSignals} /></TabsContent>
                </Suspense>
              </Tabs>
            </section>
          </TabsContent>

        </main>
      </Tabs>

      <Footer />
      <InstallBanner />
    </div>
  );
};

export default Index;
