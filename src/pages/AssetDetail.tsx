import { useMemo, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Target, ShieldAlert, Sun, Moon, RefreshCw, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SvgAreaChart } from '@/components/SvgAreaChart';
import { Skeleton } from '@/components/ui/skeleton';
import { mockAssetDetails } from '@/lib/mock-data';
import { useMarketQuotes } from '@/hooks/use-market-quotes';
import { useMarketChart } from '@/hooks/use-market-chart';
import { computeSignal } from '@/lib/compute-signals';
import { computeTechnicals } from '@/lib/compute-technicals';
import { computeKeyLevels } from '@/lib/compute-levels';
import { TechnicalIndicators } from '@/components/TechnicalIndicators';
import { useTheme } from '@/hooks/use-theme';
import { useQueryClient } from '@tanstack/react-query';

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
  const quote = quotes?.find((q) => q.symbol === upperSymbol);
  const { theme, toggle: toggleTheme } = useTheme();


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

  if (isLoading || !quote) {
    return (
      <>
        <Helmet>
          <title>{pageTitle}</title>
          <meta name="description" content={pageDesc} />
          <link rel="canonical" href={pageUrl!} />
          <meta property="og:title" content={pageTitle} />
          <meta property="og:description" content={pageDesc} />
          <meta property="og:url" content={pageUrl!} />
          <meta property="og:type" content="website" />
          <meta name="twitter:title" content={pageTitle} />
          <meta name="twitter:description" content={pageDesc} />
          {jsonLd && <script type="application/ld+json">{jsonLd}</script>}
        </Helmet>
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

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={pageUrl!} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={pageUrl!} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        {jsonLd && <script type="application/ld+json">{jsonLd}</script>}
      </Helmet>
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
        {/* Overview */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">📖 종목 개요</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{detail.description}</p>
          </CardContent>
        </Card>

        {/* Price Details */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">💰 가격 상세</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {(() => {
                const prevClose = quote.price - quote.change;
                const todayOpen = chartData?.[0]?.open ?? null;
                return [
                  { label: '현재가', value: quote.price.toLocaleString('en-US', { minimumFractionDigits: 2 }), emoji: '💵' },
                  { label: '전일대비', value: `${isUp ? '+' : ''}${quote.change.toFixed(2)}`, color: isUp ? 'text-up' : 'text-down', emoji: <img src={isUp ? '/icons/icon-chart-up.png' : '/icons/icon-chart-down.png'} alt="" className="w-3.5 h-3.5 inline-block align-middle" /> },
                  { label: '전일 종가', value: prevClose.toLocaleString('en-US', { minimumFractionDigits: 2 }), emoji: '🕐' },
                  { label: '금일 시가', value: todayOpen != null ? todayOpen.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-', emoji: '🔔' },
                  { label: '고가', value: quote.high.toLocaleString(), emoji: '⬆️' },
                  { label: '저가', value: quote.low.toLocaleString(), emoji: '⬇️' },
                ];
              })().map((item, i) => (
                <div key={i} className="text-center p-2.5 rounded-xl bg-muted/50">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 font-medium">{item.emoji} {item.label}</p>
                  <p className={`text-sm sm:text-lg font-extrabold font-mono ${item.color || ''}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Price Chart */}
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
          <CardContent>
            {chartLoading ? (
              <Skeleton className="h-[220px] sm:h-[280px] w-full rounded-lg" />
            ) : (
              <div className="relative h-[220px] sm:h-[280px] w-full">
                <SvgAreaChart data={chartData || []} color={chartColor} className="h-full w-full" />
              </div>
            )}
          </CardContent>
        </Card>

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

          {/* Key Info */}
          <div className="space-y-4 sm:space-y-5">
            {/* 52-Week Range */}
            {quote.week52High != null && quote.week52Low != null && quote.week52High > quote.week52Low && (() => {
              const pct = Math.min(100, Math.max(0, ((quote.price - quote.week52Low!) / (quote.week52High! - quote.week52Low!)) * 100));
              return (
                <Card className="rounded-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold">📏 52주 레인지</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5 font-medium">
                      <span className="font-mono">{quote.week52Low!.toLocaleString()}</span>
                      <span>현재가 ({pct.toFixed(1)}%)</span>
                      <span className="font-mono">{quote.week52High!.toLocaleString()}</span>
                    </div>
                    <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                      <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-down/50 via-muted-foreground/20 to-up/50" style={{ width: '100%' }} />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-card shadow-md"
                        style={{
                          left: `calc(${pct}% - 8px)`,
                          backgroundColor: isUp ? 'hsl(var(--up))' : 'hsl(var(--down))',
                        }}
                      />
                    </div>
                    <p className="text-center text-sm font-mono font-bold mt-2">
                      {quote.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>
              );
            })()}

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

            {/* Related Events */}
            <Card className="rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-warning" />
                  관련 경제 이벤트
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {detail.relatedEvents.map((ev, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm p-2 rounded-lg bg-warning/5">
                    <span className="w-2 h-2 rounded-full bg-warning shrink-0" />
                    <span>{ev}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Technical Indicators */}
        {technicals.length > 0 && <TechnicalIndicators indicators={technicals} />}


      </main>
    </div>
  );
};

export default AssetDetail;
