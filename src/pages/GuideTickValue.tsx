import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calculator } from 'lucide-react';
import { AppTabNav } from '@/components/AppTabNav';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockAssetDetails } from '@/lib/mock-data';

const SYMBOL_ORDER = ['NQ', 'ES', 'YM', 'HSI', 'NIY', 'STOXX50E', 'GC', 'SI', 'CL', 'NG', 'HG', 'EURUSD', 'USDJPY', 'GBPUSD', 'AUDUSD', 'USDCAD'];

export default function GuideTickValue() {
  const rows = SYMBOL_ORDER
    .map((s) => mockAssetDetails[s])
    .filter(Boolean);

  const jsonLd = JSON.stringify([
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: 'https://lab.merini.com/' },
        { '@type': 'ListItem', position: 2, name: '해외선물 1틱 가치', item: 'https://lab.merini.com/guide/tick-value' },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: '해외선물 1틱 가치 총정리 — NQ·ES·GC·CL 틱당 손익',
      description: '나스닥(NQ) 1틱 $5, S&P500(ES) $12.50, 골드(GC) $10 등 16개 해외선물 종목의 틱 사이즈와 틱 가치를 정리한 가이드.',
      datePublished: '2026-04-29',
      author: { '@type': 'Organization', name: '랩메린이' },
      publisher: { '@type': 'Organization', name: '랩메린이', url: 'https://lab.merini.com' },
      url: 'https://lab.merini.com/guide/tick-value',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: '나스닥(NQ) 선물 1틱은 얼마인가요?',
          acceptedAnswer: { '@type': 'Answer', text: 'E-mini 나스닥 100(NQ) 선물의 최소 틱은 0.25포인트이며, 1틱당 $5입니다. 1포인트 움직이면 $20입니다.' },
        },
        {
          '@type': 'Question',
          name: 'S&P500(ES) 선물 1틱은 얼마인가요?',
          acceptedAnswer: { '@type': 'Answer', text: 'E-mini S&P500(ES) 선물의 최소 틱은 0.25포인트, 1틱당 $12.50입니다. 1포인트 움직이면 $50입니다.' },
        },
        {
          '@type': 'Question',
          name: '금(GC) 선물 1틱은 얼마인가요?',
          acceptedAnswer: { '@type': 'Answer', text: 'COMEX 금 선물(GC)의 최소 틱은 $0.10/온스, 1틱당 $10입니다. $1 움직이면 $100입니다.' },
        },
        {
          '@type': 'Question',
          name: '미니선물과 마이크로선물의 차이는?',
          acceptedAnswer: { '@type': 'Answer', text: '마이크로선물(MNQ, MES, MGC 등)은 미니선물의 1/10 크기입니다. 예를 들어 MNQ는 NQ의 1/10이라 1틱이 $0.50, 증거금도 약 1/10이라 소액 트레이더에게 적합합니다.' },
        },
      ],
    },
  ]);

  return (
    <>
      <Helmet>
        <title>해외선물 1틱 가치 총정리 · NQ $5 · ES $12.50 · GC $10 — 랩메린이</title>
        <meta
          name="description"
          content="해외선물 1틱당 손익을 한눈에. 나스닥 NQ $5, S&P500 ES $12.50, 다우 YM $5, 골드 GC $10, 원유 CL $10, 유로/달러 EURUSD $12.50 등 주요 16개 해외선물 종목의 틱 사이즈와 틱 가치, 계약 단위를 정리했습니다."
        />
        <meta name="keywords" content="해외선물 1틱, 나스닥 1틱 얼마, NQ 틱가치, ES 틱가치, GC 틱가치, 골드 1틱, 원유 1틱, S&P500 틱, 해외선물 틱 사이즈, 미니선물 틱, 마이크로선물 틱, MNQ 1틱, 해외선물 손익 계산" />
        <link rel="canonical" href="https://lab.merini.com/guide/tick-value" />
        <meta property="og:title" content="해외선물 1틱 가치 총정리 — 랩메린이" />
        <meta property="og:description" content="나스닥 $5, S&P500 $12.50, 골드 $10 — 16개 해외선물의 틱 가치를 한 페이지에서." />
        <meta property="og:url" content="https://lab.merini.com/guide/tick-value" />
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
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">해외선물 1틱 가치 총정리</h1>
            <p className="text-sm text-muted-foreground mt-2">
              나스닥 1틱 $5, S&P500 1틱 $12.50처럼 종목마다 1틱당 손익이 다릅니다.
              주요 16개 해외선물의 틱 사이즈, 틱 가치, 계약 단위를 한 페이지에서 확인하세요.
            </p>
          </div>

          {/* 핵심 요약 */}
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" /> 자주 찾는 종목
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { sym: 'NQ', label: '나스닥', tick: '$5' },
                  { sym: 'ES', label: 'S&P 500', tick: '$12.50' },
                  { sym: 'YM', label: '다우존스', tick: '$5' },
                  { sym: 'GC', label: '골드', tick: '$10' },
                  { sym: 'CL', label: '원유', tick: '$10' },
                  { sym: 'NG', label: '천연가스', tick: '$10' },
                ].map((item) => (
                  <Link
                    key={item.sym}
                    to={`/asset/${item.sym.toLowerCase()}`}
                    className="p-3 rounded-lg bg-muted/40 hover:bg-primary/10 transition-colors"
                  >
                    <p className="text-xs text-muted-foreground">{item.label} ({item.sym})</p>
                    <p className="text-lg font-extrabold font-mono mt-0.5">1틱 = {item.tick}</p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 종목별 표 */}
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">종목별 틱 가치 / 계약 단위</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border/50">
                    <tr>
                      <th className="text-left px-3 sm:px-4 py-2 font-semibold">종목</th>
                      <th className="text-left px-3 sm:px-4 py-2 font-semibold">심볼</th>
                      <th className="text-left px-3 sm:px-4 py-2 font-semibold">틱 사이즈 / 가치</th>
                      <th className="text-left px-3 sm:px-4 py-2 font-semibold hidden sm:table-cell">계약 단위</th>
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
                        <td className="px-3 sm:px-4 py-2.5 text-xs font-mono">{d.tickInfo ?? '-'}</td>
                        <td className="px-3 sm:px-4 py-2.5 text-xs hidden sm:table-cell">{d.contractSize ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 미니 vs 마이크로 */}
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">미니선물 vs 마이크로선물</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed">
              <p>
                CME는 같은 지수에 대해 <b>E-mini</b>(미니)와 <b>Micro E-mini</b>(마이크로) 두 종류 선물을 상장하고 있습니다.
                마이크로는 미니의 정확히 1/10 크기로, 틱 가치도 1/10이라 소액 트레이더가 진입하기 좋습니다.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border/50">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold">상품</th>
                      <th className="text-left px-3 py-2 font-semibold">심볼</th>
                      <th className="text-left px-3 py-2 font-semibold">1틱</th>
                      <th className="text-left px-3 py-2 font-semibold">증거금 (대략)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/30">
                      <td className="px-3 py-2">E-mini 나스닥</td>
                      <td className="px-3 py-2 font-mono text-xs">NQ</td>
                      <td className="px-3 py-2 font-mono">$5</td>
                      <td className="px-3 py-2 font-mono">$17,600</td>
                    </tr>
                    <tr className="border-b border-border/30 bg-primary/5">
                      <td className="px-3 py-2">Micro 나스닥</td>
                      <td className="px-3 py-2 font-mono text-xs">MNQ</td>
                      <td className="px-3 py-2 font-mono">$0.50</td>
                      <td className="px-3 py-2 font-mono">$1,760</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="px-3 py-2">E-mini S&P500</td>
                      <td className="px-3 py-2 font-mono text-xs">ES</td>
                      <td className="px-3 py-2 font-mono">$12.50</td>
                      <td className="px-3 py-2 font-mono">$15,000</td>
                    </tr>
                    <tr className="border-b border-border/30 bg-primary/5">
                      <td className="px-3 py-2">Micro S&P500</td>
                      <td className="px-3 py-2 font-mono text-xs">MES</td>
                      <td className="px-3 py-2 font-mono">$1.25</td>
                      <td className="px-3 py-2 font-mono">$1,500</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="px-3 py-2">Gold</td>
                      <td className="px-3 py-2 font-mono text-xs">GC</td>
                      <td className="px-3 py-2 font-mono">$10</td>
                      <td className="px-3 py-2 font-mono">$13,500</td>
                    </tr>
                    <tr className="bg-primary/5">
                      <td className="px-3 py-2">Micro Gold</td>
                      <td className="px-3 py-2 font-mono text-xs">MGC</td>
                      <td className="px-3 py-2 font-mono">$1</td>
                      <td className="px-3 py-2 font-mono">$1,350</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground italic">
                * 증거금은 CME 공식 기준 대략값이며, 증권사·계좌 유형에 따라 다를 수 있습니다.
              </p>
            </CardContent>
          </Card>

          {/* 관련 페이지 */}
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">관련 도구</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Link to="/calculator" className="block py-1.5 hover:text-primary">→ 해외선물 손익계산기로 직접 계산해보기</Link>
              <Link to="/guide/futures-trading-hours" className="block py-1.5 hover:text-primary">→ 해외선물 거래시간 (KST)</Link>
              <Link to="/guide/symbols" className="block py-1.5 hover:text-primary">→ 해외선물 종목 한눈에 보기</Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    </>
  );
}
