import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { AppTabNav } from '@/components/AppTabNav';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockAssetDetails } from '@/lib/mock-data';

const SYMBOL_ORDER = ['NQ', 'ES', 'YM', 'HSI', 'NIY', 'STOXX50E', 'GC', 'SI', 'CL', 'NG', 'HG', 'EURUSD', 'USDJPY', 'GBPUSD', 'AUDUSD', 'USDCAD', 'USDKRW', 'VIX'];

export default function GuideTradingHours() {
  const rows = SYMBOL_ORDER
    .map((s) => mockAssetDetails[s])
    .filter(Boolean);

  const jsonLd = JSON.stringify([
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: 'https://lab.merini.com/' },
        { '@type': 'ListItem', position: 2, name: '가이드', item: 'https://lab.merini.com/guide/futures-trading-hours' },
        { '@type': 'ListItem', position: 3, name: '해외선물 거래시간', item: 'https://lab.merini.com/guide/futures-trading-hours' },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: '해외선물 거래시간 총정리 — 나스닥·항셍·금·원유 KST 기준',
      description: 'CME·CBOT·COMEX·HKEX·Eurex 17개 해외선물 종목의 한국 시간(KST) 기준 거래시간을 정리한 가이드.',
      datePublished: '2026-04-29',
      author: { '@type': 'Organization', name: '랩메린이' },
      publisher: { '@type': 'Organization', name: '랩메린이', url: 'https://lab.merini.com' },
      url: 'https://lab.merini.com/guide/futures-trading-hours',
    },
  ]);

  return (
    <>
      <Helmet>
        <title>해외선물 거래시간 총정리 · 나스닥·항셍·금 KST 기준 — 랩메린이</title>
        <meta
          name="description"
          content="해외선물 거래시간을 한국시간(KST) 기준으로 정리. 나스닥(NQ)·S&P500(ES)·다우(YM) 미국 지수, 항셍(HSI)·닛케이(NIY) 아시아, 골드(GC)·원유(CL)·천연가스(NG) 원자재까지 17개 종목의 거래시간과 거래소를 한 페이지에서 확인하세요."
        />
        <meta name="keywords" content="해외선물 거래시간, 나스닥선물 거래시간, 항셍선물 거래시간, 골드선물 거래시간, 원유선물 거래시간, CME 거래시간, KST 거래시간, 야간선물 시간, 해외선물 야간거래" />
        <link rel="canonical" href="https://lab.merini.com/guide/futures-trading-hours" />
        <meta property="og:title" content="해외선물 거래시간 총정리 — 랩메린이" />
        <meta property="og:description" content="17개 해외선물 종목의 한국시간(KST) 기준 거래시간 가이드." />
        <meta property="og:url" content="https://lab.merini.com/guide/futures-trading-hours" />
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
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">해외선물 거래시간 총정리</h1>
            <p className="text-sm text-muted-foreground mt-2">
              나스닥·항셍·금·원유 등 17개 해외선물 종목의 한국시간(KST) 기준 거래시간을 한 페이지에서 정리했습니다.
              미국·유럽 서머타임 적용 시 1시간씩 변동될 수 있으니 참고용으로 활용하세요.
            </p>
          </div>

          {/* 핵심 요약 */}
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> 한 줄 요약
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm leading-relaxed">
              <p>• <b>미국 지수·원자재 (CME 계열)</b>: KST 월~금 07:00 ~ 익일 06:00 (거의 23시간 거래)</p>
              <p>• <b>항셍(HSI)</b>: KST 10:15~13:00, 14:30~17:00, 18:15~21:00 (점심·저녁 휴장 있음)</p>
              <p>• <b>닛케이(NIY)</b>: KST 월~금 07:00 ~ 익일 06:00 (CME 달러 표시 선물 기준)</p>
              <p>• <b>유로스톡스 50</b>: KST 월~금 09:00 ~ 23:00</p>
              <p>• 미국 서머타임(3월 둘째 일~11월 첫째 일) 적용 시 모든 미국 선물 시작/종료 1시간 빨라짐</p>
            </CardContent>
          </Card>

          {/* 종목별 표 */}
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">종목별 거래시간 (KST)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border/50">
                    <tr>
                      <th className="text-left px-3 sm:px-4 py-2 font-semibold">종목</th>
                      <th className="text-left px-3 sm:px-4 py-2 font-semibold">심볼</th>
                      <th className="text-left px-3 sm:px-4 py-2 font-semibold">거래소</th>
                      <th className="text-left px-3 sm:px-4 py-2 font-semibold">거래시간 (KST)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((d) => (
                      <tr key={d.symbol} className="border-b border-border/30 hover:bg-primary/5 transition-colors">
                        <td className="px-3 sm:px-4 py-2.5">
                          <Link to={`/asset/${d.symbol.toLowerCase()}`} className="font-semibold hover:text-primary">
                            {d.nameKr}
                          </Link>
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 font-mono text-xs text-muted-foreground">{d.symbol}</td>
                        <td className="px-3 sm:px-4 py-2.5 text-xs">{d.exchange ?? '-'}</td>
                        <td className="px-3 sm:px-4 py-2.5 text-xs">{d.tradingHours ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 추가 정보 */}
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">자주 묻는 질문</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <div>
                <p className="font-semibold mb-1">Q. 해외선물은 24시간 거래되나요?</p>
                <p className="text-muted-foreground">CME·CBOT·COMEX 미국 선물은 일~금 23시간(60분 정산 휴장) 거래되어 사실상 24시간에 가깝습니다. 항셍은 점심·저녁 휴장이 있어 거래시간이 분할되어 있습니다.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Q. 서머타임이 적용되면 시간이 어떻게 바뀌나요?</p>
                <p className="text-muted-foreground">미국 서머타임(3월 둘째 일~11월 첫째 일) 기간에는 모든 미국 선물의 시작·종료가 1시간씩 빨라집니다. 즉, 평소 07:00 시작이 06:00 시작이 됩니다.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Q. 가장 변동성이 큰 시간대는 언제인가요?</p>
                <p className="text-muted-foreground">미국 정규장 개장(KST 22:30 또는 서머타임 21:30) 직후와 주요 경제지표 발표(CPI 22:30, FOMC 03:00 등) 직후 변동성이 크게 확대됩니다.</p>
              </div>
            </CardContent>
          </Card>

          {/* 관련 페이지 */}
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">관련 가이드</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Link to="/guide/tick-value" className="block py-1.5 hover:text-primary">→ 해외선물 1틱 가치 총정리</Link>
              <Link to="/guide/symbols" className="block py-1.5 hover:text-primary">→ 해외선물 종목 한눈에 보기</Link>
              <Link to="/calendar" className="block py-1.5 hover:text-primary">→ 경제지표 발표 캘린더</Link>
              <Link to="/calculator" className="block py-1.5 hover:text-primary">→ 해외선물 손익계산기</Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    </>
  );
}
