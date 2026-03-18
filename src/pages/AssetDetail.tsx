import { useMemo, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Target, ShieldAlert, Sun, Moon, RefreshCw, Share2, BellPlus, X, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SvgAreaChart } from '@/components/SvgAreaChart';
import { Skeleton } from '@/components/ui/skeleton';
import { mockAssetDetails } from '@/lib/mock-data';
import { useMarketQuotes } from '@/hooks/use-market-quotes';
import { useMarketChart } from '@/hooks/use-market-chart';
import { useEconomicEvents } from '@/hooks/use-economic-events';
import { useMarketAnalysis } from '@/hooks/use-market-analysis';
import { computeSignal } from '@/lib/compute-signals';
import { computeTechnicals } from '@/lib/compute-technicals';
import { computeKeyLevels } from '@/lib/compute-levels';
import { TechnicalIndicators } from '@/components/TechnicalIndicators';
import { useTheme } from '@/hooks/use-theme';
import { useQueryClient } from '@tanstack/react-query';
import type { PriceAlert } from '@/hooks/use-notifications';
import { loadPriceAlerts, savePriceAlerts } from '@/hooks/use-notifications';

// 자산별 관련 경제지표 키워드 매핑
const ASSET_KEYWORDS: Record<string, string[]> = {
  NQ:      ['CPI', 'FOMC', 'ADP', '비농업', 'NFP', 'ISM', 'GDP', '소매판매', 'PPI', '연준', '금리'],
  ES:      ['CPI', 'FOMC', '비농업', 'NFP', 'ISM', 'GDP', '소매판매', 'PPI', '연준', '금리'],
  YM:      ['ISM', 'GDP', 'PMI', '소매판매', '제조업', '내구재', '산업생산'],
  HSI:     ['중국', 'China', 'PMI', '위안', '무역수지', 'NBS', '소매판매', '산업생산'],
  NIY:     ['BOJ', '일본', 'Japan', '엔화', 'GDP', '물가', 'CPI'],
  STOXX50E:['ECB', '유로', 'EUR', 'ZEW', 'PMI', 'GDP', '인플레'],
  GC:      ['CPI', 'FOMC', 'PPI', '인플레', '비농업', 'NFP', '달러', '금리', '연준'],
  SI:      ['CPI', 'FOMC', 'PPI', '인플레', '산업생산', '제조업'],
  CL:      ['EIA', '원유', '재고', 'OPEC', '생산량', '석유'],
  NG:      ['EIA', '천연가스', '재고', '기상', '날씨', '가스'],
  HG:      ['중국', 'PMI', '산업생산', '건설', '제조업', 'GDP'],
  EURUSD:  ['ECB', 'FOMC', 'CPI', '비농업', 'NFP', '유로', '달러', '금리'],
  USDJPY:  ['BOJ', 'FOMC', 'CPI', '비농업', 'NFP', '엔화', '달러', '금리'],
  GBPUSD:  ['BOE', 'MPC', 'CPI', 'GDP', '영국', '달러'],
  AUDUSD:  ['RBA', '호주', '중국', 'PMI', 'CPI'],
  USDCAD:  ['BOC', '캐나다', 'CPI', '원유', 'EIA', '달러'],
  USDKRW:  ['FOMC', 'CPI', '비농업', 'NFP', '연준', '달러', '금리', '한국', '무역수지'],
};

// 오늘 날짜 문자열 — 컴포넌트 마운트마다 재계산하지 않도록 모듈 레벨에 위치
const TODAY_STR = new Date().toISOString().slice(0, 10);

const RANGE_OPTIONS = [
  { label: '1일', range: '1d', interval: '5m' },
  { label: '5일', range: '5d', interval: '15m' },
  { label: '1개월', range: '1mo', interval: '1d' },
  { label: '3개월', range: '3mo', interval: '1d' },
  { label: '6개월', range: '6mo', interval: '1wk' },
  { label: '1년', range: '1y', interval: '1wk' },
];

const AssetDetail = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const upperSymbol = symbol?.toUpperCase() || '';
  const detail = mockAssetDetails[upperSymbol];
  const [rangeIdx, setRangeIdx] = useState(2);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const selectedRange = RANGE_OPTIONS[rangeIdx];
  const queryClient = useQueryClient();
  const { data: quotes, isLoading } = useMarketQuotes();
  const { data: chartData, isLoading: chartLoading } = useMarketChart(upperSymbol, selectedRange.range, selectedRange.interval);
  const { data: dailyData } = useMarketChart(upperSymbol, '1y', '1d');
  const { data: allEvents } = useEconomicEvents();
  const quote = quotes?.find((q) => q.symbol === upperSymbol);
  const { theme, toggle: toggleTheme } = useTheme();

  // 가격 목표 알림 상태
  const [alertOpen, setAlertOpen] = useState(false);
  const [targetInput, setTargetInput] = useState('');
  const [alertDirection, setAlertDirection] = useState<'above' | 'below'>('above');
  const [symbolAlerts, setSymbolAlerts] = useState<PriceAlert[]>(() =>
    loadPriceAlerts().filter(a => a.symbol === upperSymbol)
  );

  const handleAddAlert = useCallback(() => {
    const price = parseFloat(targetInput.replace(/,/g, ''));
    if (isNaN(price) || price <= 0) {
      toast.error('유효한 가격을 입력해주세요');
      return;
    }
    const newAlert: PriceAlert = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      symbol: upperSymbol,
      symbolName: detail?.nameKr ?? upperSymbol,
      targetPrice: price,
      direction: alertDirection,
      createdAt: Date.now(),
      triggered: false,
    };
    const all = [newAlert, ...loadPriceAlerts()];
    savePriceAlerts(all);
    setSymbolAlerts(all.filter(a => a.symbol === upperSymbol));
    setTargetInput('');
    const dirLabel = alertDirection === 'above' ? '이상' : '이하';
    toast.success(`가격 알림 등록 완료`, { description: `${upperSymbol} ${price.toLocaleString()} ${dirLabel} 도달 시 알림` });
  }, [targetInput, alertDirection, upperSymbol, detail]);

  const handleDeleteAlert = useCallback((id: string) => {
    const filtered = loadPriceAlerts().filter(a => a.id !== id);
    savePriceAlerts(filtered);
    setSymbolAlerts(filtered.filter(a => a.symbol === upperSymbol));
  }, [upperSymbol]);

  const technicals = useMemo(() => {
    if (!dailyData?.length || !quote) return [];
    return computeTechnicals(dailyData, quote.price);
  }, [dailyData, quote]);

  const signal = useMemo(() => quote ? computeSignal(quote, technicals) : null, [quote, technicals]);

  const dynamicLevels = useMemo(() => {
    if (!dailyData?.length || !quote) return null;
    return computeKeyLevels(dailyData, quote.price);
  }, [dailyData, quote]);

  const keyLevels = dynamicLevels || detail?.keyLevels;

  // 실제 경제 이벤트 필터링 (오늘~3일 이내)
  const relatedEvents = useMemo(() => {
    const keywords = ASSET_KEYWORDS[upperSymbol] ?? [];
    if (allEvents?.length && keywords.length) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 3);
      const endStr = endDate.toISOString().slice(0, 10);
      const real = allEvents
        .filter(e =>
          e.date >= TODAY_STR &&
          e.date <= endStr &&
          e.category !== 'earnings' &&
          keywords.some(kw => e.name.includes(kw))
        )
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
        .slice(0, 4)
        .map(e => ({
          label: e.time && e.time !== 'TBD' ? `${e.name} (${e.time})` : e.name,
          isReal: true,
          importance: e.importance,
        }));
      if (real.length > 0) return real;
    }
    // 실제 데이터 없으면 mock fallback
    return (detail?.relatedEvents ?? []).map(ev => ({ label: ev, isReal: false, importance: 'medium' as const }));
  }, [allEvents, upperSymbol, detail]);

  // AI 분석용 데이터 준비
  const quoteForAI = useMemo(() => quote ? [{
    symbol: quote.symbol,
    name: detail.name,
    nameKr: detail.nameKr,
    price: quote.price,
    change: quote.change,
    changePercent: quote.changePercent,
    high: quote.high,
    low: quote.low,
  }] : undefined, [quote, detail]);

  const eventsForAI = useMemo(() => {
    const keywords = ASSET_KEYWORDS[upperSymbol] ?? [];
    if (!allEvents?.length || !keywords.length) return [];
    return allEvents
      .filter(e => e.date === TODAY_STR && e.category !== 'earnings' && keywords.some(kw => e.name.includes(kw)))
      .map(e => ({
        time: e.time,
        country: e.country ?? '',
        name: e.name,
        importance: e.importance,
        forecast: e.forecast,
        previous: e.previous,
      }));
  }, [allEvents, upperSymbol]);

  const { data: analysisData, isLoading: analysisLoading, isError: analysisError, forceRefetch } =
    useMarketAnalysis(quoteForAI, eventsForAI);

  const handleShare = useCallback(async () => {
    const shareUrl = `https://lab.merini.com/asset/${symbol}`;
    const shareText = `${detail?.nameKr ?? ''} (${upperSymbol}) 실시간 시세 — 랩메린이`;
    if (navigator.share) {
      try {
        await navigator.share({ title: shareText, url: shareUrl });
      } catch {
        // 사용자 취소 시 무시
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast('링크가 복사됐습니다', { description: shareUrl, duration: 3000 });
    }
  }, [symbol, upperSymbol, detail]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['market-quotes'] }),
      queryClient.invalidateQueries({ queryKey: ['market-chart', upperSymbol] }),
    ]);
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [queryClient, upperSymbol]);

  // ── 메타태그: detail만 있으면 즉시 계산 (로딩 중에도 SEO 적용) ──
  const pageUrl = detail ? `https://lab.merini.com/asset/${symbol}` : null;
  const pageTitle = detail
    ? `${detail.nameKr} (${detail.symbol}) 실시간 시세 · 랩메린이`
    : '랩메린이 — 해외선물 경제지표 대시보드';
  const pageDesc = detail
    ? `${detail.nameKr}(${detail.symbol}) 실시간 선물 시세와 기술적 분석을 제공합니다. 강세/약세 시그널, 지지·저항선, 경제 이벤트를 한눈에 확인하세요. ${detail.description.slice(0, 50)}`
    : '해외선물 실시간 시세 대시보드';
  const jsonLd = detail
    ? JSON.stringify([
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://lab.merini.com/" },
            { "@type": "ListItem", "position": 2, "name": detail.nameKr, "item": pageUrl },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "FinancialProduct",
          "name": `${detail.nameKr} (${detail.symbol}) 선물`,
          "description": detail.description,
          "url": pageUrl,
          "provider": { "@type": "Organization", "name": "랩메린이", "url": "https://lab.merini.com" },
          "category": "Futures",
        },
      ])
    : null;

  if (!detail) {
    return (
      <>
        <Helmet>
          <title>종목을 찾을 수 없습니다 · 랩메린이</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-4xl">🔍</p>
            <p className="text-lg text-muted-foreground">종목을 찾을 수 없습니다</p>
            <Link to="/"><Button variant="outline" className="rounded-xl">← 대시보드로 돌아가기</Button></Link>
          </div>
        </div>
      </>
    );
  }

  const helmet = (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDesc} />
      <link rel="canonical" href={pageUrl!} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDesc} />
      <meta property="og:url" content={pageUrl!} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="https://lab.merini.com/og-image.png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDesc} />
      <meta name="twitter:image" content="https://lab.merini.com/og-image.png" />
      {jsonLd && <script type="application/ld+json">{jsonLd}</script>}
    </Helmet>
  );

  if (isLoading || !quote) {
    return (
      <>
        {helmet}
        <div className="min-h-screen bg-background">
          <header className="border-b border-border/60 sticky top-0 z-10 bg-background/90 backdrop-blur-lg">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
              <Link to="/"><Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="w-4 h-4" /></Button></Link>
              <Skeleton className="h-6 w-32" />
            </div>
          </header>
          <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            <Skeleton className="h-[300px] rounded-xl" />
            <div className="grid md:grid-cols-2 gap-4">
              <Skeleton className="h-[200px] rounded-xl" />
              <Skeleton className="h-[200px] rounded-xl" />
            </div>
          </main>
        </div>
      </>
    );
  }

  const isUp = quote.change >= 0;
  const sentimentLabel = signal!.sentiment === 'bullish' ? '강세' : signal!.sentiment === 'bearish' ? '약세' : '중립';
  const sentimentColor = signal!.sentiment === 'bullish' ? 'text-up' : signal!.sentiment === 'bearish' ? 'text-down' : 'text-muted-foreground';
  const SentimentIcon = signal!.sentiment === 'bullish' ? TrendingUp : signal!.sentiment === 'bearish' ? TrendingDown : Minus;
  const gaugePercent = ((signal!.score + 100) / 200) * 100;

  const chartColor = isUp ? 'hsl(var(--up))' : 'hsl(var(--down))';
  const activeAlertCount = symbolAlerts.filter(a => !a.triggered).length;
  const prevClose = quote.price - quote.change;
  const todayOpen = chartData?.[0]?.open ?? null;
  const week52Pct = quote.week52High != null && quote.week52Low != null && quote.week52High > quote.week52Low
    ? Math.min(100, Math.max(0, ((quote.price - quote.week52Low) / (quote.week52High - quote.week52Low)) * 100))
    : null;

  return (
    <div className="min-h-screen bg-background">
      {helmet}
      {/* Header */}
      <header className="border-b border-border/60 sticky top-0 z-10 bg-background/90 backdrop-blur-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 rounded-xl">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold truncate">{detail.nameKr}</h1>
              <span className="text-xs text-muted-foreground font-mono shrink-0 bg-muted px-2 py-0.5 rounded-md">{detail.symbol}</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{detail.name}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right">
              <p className="text-lg sm:text-2xl font-extrabold font-mono">
                {quote.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <div className={`inline-flex items-center gap-1 text-xs sm:text-sm font-bold px-2 py-0.5 rounded-lg ${
                isUp ? 'bg-up-muted text-up' : 'bg-down-muted text-down'
              }`}>
                {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {isUp ? '+' : ''}{quote.change.toFixed(2)} ({isUp ? '+' : ''}{quote.changePercent.toFixed(2)}%)
              </div>
            </div>
            {/* 가격 알림 설정 Popover */}
            <Popover open={alertOpen} onOpenChange={setAlertOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl relative"
                  aria-label="가격 알림 설정"
                >
                  <BellPlus className="w-4 h-4" />
                  {activeAlertCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center">
                      {activeAlertCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0 rounded-xl" align="end">
                <div className="p-4 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold mb-0.5">가격 알림 설정</h3>
                    <p className="text-[11px] text-muted-foreground">{detail.nameKr} ({upperSymbol}) 목표가 도달 시 알림</p>
                  </div>

                  {/* 현재가 표시 */}
                  <div className="px-3 py-2 rounded-lg bg-muted/50 text-center">
                    <p className="text-[10px] text-muted-foreground font-medium mb-0.5">현재가</p>
                    <p className="text-base font-extrabold font-mono">{quote.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>

                  {/* 방향 선택 */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={alertDirection === 'above' ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 text-xs gap-1.5"
                      onClick={() => setAlertDirection('above')}
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                      이 가격 이상
                    </Button>
                    <Button
                      variant={alertDirection === 'below' ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 text-xs gap-1.5"
                      onClick={() => setAlertDirection('below')}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                      이 가격 이하
                    </Button>
                  </div>

                  {/* 목표가 입력 */}
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="목표가 입력"
                      value={targetInput}
                      onChange={e => setTargetInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddAlert()}
                      className="h-8 text-xs font-mono"
                    />
                    <Button size="sm" className="h-8 px-3 shrink-0" onClick={handleAddAlert}>
                      등록
                    </Button>
                  </div>

                  {/* 이 종목 알림 목록 */}
                  {symbolAlerts.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">등록된 알림</p>
                      {symbolAlerts.map(alert => (
                        <div key={alert.id} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs ${alert.triggered ? 'bg-muted/30 opacity-60' : 'bg-muted/50'}`}>
                          <span className={`text-sm ${alert.direction === 'above' ? 'text-up' : 'text-down'}`}>
                            {alert.direction === 'above' ? '↑' : '↓'}
                          </span>
                          <span className="font-mono font-semibold flex-1">{alert.targetPrice.toLocaleString()}</span>
                          <span className="text-muted-foreground">{alert.direction === 'above' ? '이상' : '이하'}</span>
                          {alert.triggered && <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">완료</span>}
                          <Button variant="ghost" size="icon" className="h-5 w-5 rounded shrink-0" onClick={() => handleDeleteAlert(alert.id)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl"
              aria-label="페이지 공유"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl"
              aria-label="데이터 새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl" aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-8">

        {/* 1. AI 시장 브리핑 - 최상단 */}
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                🤖 AI 시장 브리핑
                {!analysisLoading && !analysisError && analysisData && analysisData.length > 0 && (
                  <span className="text-[10px] text-muted-foreground font-normal bg-muted px-1.5 py-0.5 rounded">Gemini</span>
                )}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={forceRefetch}
                disabled={analysisLoading}
                className="h-7 w-7 rounded-lg"
                aria-label="AI 분석 새로고침"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${analysisLoading ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysisLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-4/5 rounded-lg" />
              </div>
            ) : analysisError ? (
              <p className="text-xs text-muted-foreground italic text-center py-4">AI 분석을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>
            ) : !analysisData?.length ? (
              <p className="text-xs text-muted-foreground italic text-center py-4">분석 데이터를 준비 중입니다.</p>
            ) : (
              <div className="space-y-2">
                {analysisData.map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2.5 p-3 rounded-lg text-sm ${
                      item.type === 'alert'
                        ? 'bg-down-muted border border-down/20'
                        : 'bg-primary/5 border border-primary/20'
                    }`}
                  >
                    <span className="shrink-0 text-base leading-relaxed">
                      {item.type === 'alert' ? '⚠️' : 'ℹ️'}
                    </span>
                    <p className="leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. 가격 추이 + 가격 상세 통합 */}
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2"><img src="/icons/icon-chart-up.png" alt="" className="w-5 h-5" /> 가격 추이</CardTitle>
              <div className="flex gap-1 bg-muted p-1 rounded-xl">
                {RANGE_OPTIONS.map((opt, i) => (
                  <Button
                    key={opt.range}
                    variant={i === rangeIdx ? 'default' : 'ghost'}
                    size="sm"
                    className={`h-7 px-2.5 text-xs sm:text-sm rounded-lg ${i === rangeIdx ? 'shadow-sm' : ''}`}
                    onClick={() => setRangeIdx(i)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {chartLoading ? (
              <Skeleton className="h-[220px] sm:h-[280px] w-full rounded-lg" />
            ) : (
              <div className="relative h-[220px] sm:h-[280px] w-full">
                <SvgAreaChart data={chartData || []} color={chartColor} className="h-full w-full" />
              </div>
            )}
            {/* 가격 상세 - 차트 하단 4칸 */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border/20">
              {[
                { label: '전일 종가', value: prevClose.toLocaleString('en-US', { minimumFractionDigits: 2 }), emoji: '🕐' },
                { label: '금일 시가', value: todayOpen != null ? todayOpen.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-', emoji: '🔔' },
                { label: '고가', value: quote.high.toLocaleString(), emoji: '⬆️' },
                { label: '저가', value: quote.low.toLocaleString(), emoji: '⬇️' },
              ].map((item, i) => (
                <div key={i} className="text-center p-2 rounded-xl bg-muted/50">
                  <p className="text-[10px] text-muted-foreground mb-1 font-medium">{item.emoji} {item.label}</p>
                  <p className="text-xs sm:text-sm font-bold font-mono">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 3. 시그널 + 지지/저항선 + 52주 레인지 2-col */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
          {/* Sentiment */}
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg font-bold flex items-center justify-between">
                <span className="flex items-center gap-2"><img src="/icons/icon-target.png" alt="" className="w-5 h-5" /> 강세/약세 시그널</span>
                <span className={`flex items-center gap-1.5 text-sm font-bold ${sentimentColor}`}>
                  <SentimentIcon className="w-4 h-4" />
                  {sentimentLabel} ({signal!.score > 0 ? '+' : ''}{signal!.score})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Gauge */}
              <div>
                <div className="relative h-3.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: '100%',
                      background: 'linear-gradient(to right, hsl(var(--down)), hsl(var(--muted-foreground)) 50%, hsl(var(--up)))',
                      opacity: 0.3,
                    }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-card shadow-md transition-all duration-500"
                    style={{
                      left: `calc(${gaugePercent}% - 10px)`,
                      backgroundColor: signal!.sentiment === 'bullish' ? 'hsl(var(--up))' : signal!.sentiment === 'bearish' ? 'hsl(var(--down))' : 'hsl(var(--muted-foreground))',
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground mt-1.5 font-medium">
                  <span>🔵 약세</span><span>중립</span><span>강세 🔴</span>
                </div>
              </div>
              {/* Factors */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">영향 요인</p>
                {signal!.factors.map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      f.impact === 'positive' ? 'bg-up' : f.impact === 'negative' ? 'bg-down' : 'bg-muted-foreground'
                    }`} />
                    <span className="flex-1">{f.name}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      f.impact === 'positive' ? 'bg-up-muted text-up' : f.impact === 'negative' ? 'bg-down-muted text-down' : 'bg-muted text-muted-foreground'
                    }`}>
                      {f.impact === 'positive' ? '호재' : f.impact === 'negative' ? '악재' : '중립'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 지지/저항선 + 52주 레인지 */}
          <div className="space-y-4 sm:space-y-5">
            {/* Key Levels - now dynamic */}
            {keyLevels && (
              <Card className="rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    주요 지지/저항선
                    {dynamicLevels && <span className="text-[10px] text-muted-foreground font-normal bg-muted px-1.5 py-0.5 rounded">실시간</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-down-muted text-center">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">지지선 (하방)</p>
                      <p className="text-xl font-extrabold font-mono text-down">{keyLevels.support.toLocaleString()}</p>
                      {dynamicLevels && quote.price > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          현재가 대비 {((quote.price - keyLevels.support) / quote.price * 100).toFixed(1)}% 위
                        </p>
                      )}
                    </div>
                    <div className="p-3 rounded-xl bg-up-muted text-center">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">저항선 (상방)</p>
                      <p className="text-xl font-extrabold font-mono text-up">{keyLevels.resistance.toLocaleString()}</p>
                      {dynamicLevels && quote.price > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          현재가 대비 {((keyLevels.resistance - quote.price) / quote.price * 100).toFixed(1)}% 위
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 52-Week Range */}
            {week52Pct !== null && (
              <Card className="rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold">📏 52주 레인지</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5 font-medium">
                    <span className="font-mono">{quote.week52Low!.toLocaleString()}</span>
                    <span>현재가 ({week52Pct.toFixed(1)}%)</span>
                    <span className="font-mono">{quote.week52High!.toLocaleString()}</span>
                  </div>
                  <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-down/50 via-muted-foreground/20 to-up/50" style={{ width: '100%' }} />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-card shadow-md"
                      style={{
                        left: `calc(${week52Pct}% - 8px)`,
                        backgroundColor: isUp ? 'hsl(var(--up))' : 'hsl(var(--down))',
                      }}
                    />
                  </div>
                  <p className="text-center text-sm font-mono font-bold mt-2">
                    {quote.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* 4. 관련 경제 이벤트 - full-width 승격 */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-warning" />
              관련 경제 이벤트
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {relatedEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">관련 경제 이벤트가 없습니다.</p>
            ) : (
              relatedEvents.map((ev, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm p-2 rounded-lg bg-warning/5">
                  <span className="w-2 h-2 rounded-full bg-warning shrink-0" />
                  <span className="flex-1">{ev.label}</span>
                  {ev.isReal && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">실시간</span>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 5. Technical Indicators */}
        {technicals.length > 0 && <TechnicalIndicators indicators={technicals} />}

        {/* 6. 종목 개요 - 최하단 */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">📖 종목 개요</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">{detail.description}</p>

            {/* 스펙 그리드 */}
            {(detail.exchange || detail.tradingHours || detail.contractSize || detail.tickInfo) && (
              <div className="grid grid-cols-2 gap-2">
                {detail.exchange && (
                  <div className="p-2.5 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground mb-0.5 font-medium">🏛️ 거래소</p>
                    <p className="text-xs font-semibold">{detail.exchange}</p>
                  </div>
                )}
                {detail.tradingHours && (
                  <div className="p-2.5 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground mb-0.5 font-medium">🕐 거래 시간 (KST)</p>
                    <p className="text-xs font-semibold">{detail.tradingHours}</p>
                  </div>
                )}
                {detail.contractSize && (
                  <div className="p-2.5 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground mb-0.5 font-medium">📦 계약 단위</p>
                    <p className="text-xs font-semibold">{detail.contractSize}</p>
                  </div>
                )}
                {detail.tickInfo && (
                  <div className="p-2.5 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground mb-0.5 font-medium">⚡ 틱 정보</p>
                    <p className="text-xs font-semibold">{detail.tickInfo}</p>
                  </div>
                )}
              </div>
            )}

            {/* 태그 */}
            {detail.tags && detail.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {detail.tags.map((tag) => (
                  <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </main>
    </div>
  );
};

export default AssetDetail;
