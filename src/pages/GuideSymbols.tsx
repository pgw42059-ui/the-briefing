import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { AppTabNav } from '@/components/AppTabNav';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockAssetDetails } from '@/lib/mock-data';

const CATEGORIES = [
  {
    title: '미국 주가지수 선물',
    desc: '미국 주식시장을 대표하는 3대 지수 선물. 한국 트레이더가 가장 많이 거래합니다.',
    symbols: ['NQ', 'ES', 'YM'],
  },
  {
    title: '아시아·유럽 주가지수 선물',
    desc: '아시아 시간대 거래 가능한 항셍·닛케이와 유럽 대표 유로스톡스 50.',
    symbols: ['HSI', 'NIY', 'STOXX50E'],
  },
  {
    title: '귀금속·에너지 선물',
    desc: '안전자산 금·은과 변동성 큰 원유·천연가스. 매크로 이벤트에 민감.',
    symbols: ['GC', 'SI', 'CL', 'NG', 'HG'],
  },
  {
    title: '통화 선물 (FX)',
    desc: '주요 통화쌍 선물. ECB·BOJ·연준 금리 결정에 직접 반응.',
    symbols: ['EURUSD', 'USDJPY', 'GBPUSD', 'AUDUSD', 'USDCAD', 'USDKRW'],
  },
  {
    title: '변동성 지수',
    desc: '시장 공포지수 VIX 선물. 헤지·역방향 베팅에 활용.',
    symbols: ['VIX'],
  },
];

export default function GuideSymbols() {
  const jsonLd = JSON.stringify([
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: 'https://lab.merini.com/' },
        { '@type': 'ListItem', position: 2, name: '해외선물 종목 가이드', item: 'https://lab.merini.com/guide/symbols' },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: '해외선물 종목 한눈에 보기 — 17개 주요 선물 가이드',
      description: '나스닥(NQ)·S&P500(ES)·항셍(HSI)·골드(GC)·원유(CL) 등 17개 해외선물 종목의 특징과 거래 정보를 한 페이지에서.',
      datePublished: '2026-04-29',
      author: { '@type': 'Organization', name: '랩메린이' },
      publisher: { '@type': 'Organization', name: '랩메린이', url: 'https://lab.merini.com' },
      url: 'https://lab.merini.com/guide/symbols',
    },
  ]);

  return (
    <>
      <Helmet>
        <title>해외선물 종목 한눈에 보기 · 17개 주요 선물 가이드 — 랩메린이</title>
        <meta
          name="description"
          content="해외선물 어떤 종목이 있나요? 미국 지수(NQ·ES·YM), 아시아/유럽(HSI·NIY·STOXX50E), 귀금속·에너지(GC·SI·CL·NG·HG), 통화(EURUSD·USDJPY 등), 변동성(VIX) 등 17개 주요 해외선물 종목의 특징·거래소·거래시간을 카테고리별로 정리했습니다."
        />
        <meta name="keywords" content="해외선물 종목, 해외선물 종류, 해외선물 어떤 종목, 나스닥선물, 항셍선물, 닛케이선물, 골드선물, 원유선물, 천연가스선물, EURUSD 선물, USDJPY 선물, VIX 선물, 해외선물 입문" />
        <link rel="canonical" href="https://lab.merini.com/guide/symbols" />
        <meta property="og:title" content="해외선물 종목 한눈에 보기 — 랩메린이" />
        <meta property="og:description" content="17개 주요 해외선물 종목의 특징·거래소·거래시간을 카테고리별로." />
        <meta property="og:url" content="https://lab.merini.com/guide/symbols" />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{jsonLd}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <AppTabNav activeTab="quotes" />
        <main className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
          {/* 헤더 */}
          <div>
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-3">
              <ArrowLeft className="w-4 h-4" /> 홈으로
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">해외선물 종목 한눈에 보기</h1>
            <p className="text-sm text-muted-foreground mt-2">
              해외선물에는 어떤 종목이 있을까요? 미국 지수, 아시아·유럽 지수, 귀금속·에너지, 통화, 변동성까지
              17개 주요 해외선물을 카테고리별로 정리했습니다. 각 종목 카드를 클릭하면 실시간 시세와 차트로 이동합니다.
            </p>
          </div>

          {/* 카테고리별 카드 */}
          {CATEGORIES.map((cat) => (
            <Card key={cat.title} className="rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">{cat.title}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{cat.desc}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {cat.symbols.map((s) => {
                  const d = mockAssetDetails[s];
                  if (!d) return null;
                  return (
                    <Link
                      key={s}
                      to={`/asset/${s.toLowerCase()}`}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-primary/10 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <h3 className="font-bold text-sm sm:text-base">{d.nameKr}</h3>
                          <span className="font-mono text-[11px] text-muted-foreground">{d.symbol}</span>
                          {d.exchange && (
                            <span className="text-[10px] text-muted-foreground hidden sm:inline">· {d.exchange}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{d.description}</p>
                        {d.tags && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {d.tags.slice(0, 3).map((t) => (
                              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-1" />
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          ))}

          {/* 관련 페이지 */}
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">관련 가이드</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Link to="/guide/futures-trading-hours" className="block py-1.5 hover:text-primary">→ 해외선물 거래시간 (KST)</Link>
              <Link to="/guide/tick-value" className="block py-1.5 hover:text-primary">→ 해외선물 1틱 가치 총정리</Link>
              <Link to="/calculator" className="block py-1.5 hover:text-primary">→ 해외선물 손익계산기</Link>
              <Link to="/calendar" className="block py-1.5 hover:text-primary">→ 경제지표 발표 캘린더</Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    </>
  );
}
