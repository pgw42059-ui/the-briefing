import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { AppTabNav } from '@/components/AppTabNav';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MARGIN_DATA = [
  { sym: 'NQ',       name: '나스닥 100',    mini: '$17,600', micro: '$1,760',  note: 'E-mini / Micro (MNQ)' },
  { sym: 'ES',       name: 'S&P 500',       mini: '$15,000', micro: '$1,500',  note: 'E-mini / Micro (MES)' },
  { sym: 'YM',       name: '다우존스',       mini: '$10,500', micro: '$1,050',  note: 'E-mini / Micro (MYM)' },
  { sym: 'GC',       name: '골드',           mini: '$13,500', micro: '$1,350',  note: 'COMEX / Micro (MGC)' },
  { sym: 'SI',       name: '실버',           mini: '$16,000', micro: '-',       note: 'COMEX' },
  { sym: 'CL',       name: '원유 (WTI)',     mini: '$8,000',  micro: '-',       note: 'NYMEX' },
  { sym: 'NG',       name: '천연가스',        mini: '$5,000',  micro: '-',       note: 'NYMEX' },
  { sym: 'HG',       name: '구리',           mini: '$5,500',  micro: '-',       note: 'COMEX' },
  { sym: 'HSI',      name: '항셍 지수',       mini: 'HKD 80,000', micro: '-',   note: 'HKEX' },
  { sym: 'NIY',      name: '닛케이 225',      mini: '$5,500',  micro: '-',       note: 'CME' },
  { sym: 'EURUSD',   name: '유로/달러',       mini: '$2,750',  micro: '-',       note: 'CME' },
  { sym: 'USDJPY',   name: '달러/엔',         mini: '$2,750',  micro: '-',       note: 'CME' },
];

const jsonLd = JSON.stringify([
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: 'https://lab.merini.com/' },
      { '@type': 'ListItem', position: 2, name: '해외선물 증거금', item: 'https://lab.merini.com/guide/futures-margin' },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: '해외선물 증거금 총정리 — 나스닥·금·원유 계약별 필요 자금',
    description: '해외선물 종목별 CME 기준 초기 증거금과 유지 증거금을 정리. 마이크로선물 활용 시 1/10 수준으로 진입 가능.',
    datePublished: '2026-04-29',
    author: { '@type': 'Organization', name: '랩메린이' },
    publisher: { '@type': 'Organization', name: '랩메린이', url: 'https://lab.merini.com' },
    url: 'https://lab.merini.com/guide/futures-margin',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '해외선물 증거금이란 무엇인가요?',
        acceptedAnswer: { '@type': 'Answer', text: '증거금(Margin)은 선물 1계약을 보유하기 위해 거래소에 예치해야 하는 최소 자금입니다. 초기 증거금(Initial Margin)은 포지션 진입 시, 유지 증거금(Maintenance Margin)은 포지션 유지에 필요한 최소 금액입니다.' },
      },
      {
        '@type': 'Question',
        name: '나스닥(NQ) 선물 증거금은 얼마인가요?',
        acceptedAnswer: { '@type': 'Answer', text: 'CME 기준 E-mini 나스닥 100(NQ) 초기 증거금은 약 $17,600(한화 약 2,500만 원)입니다. 마이크로 나스닥(MNQ)은 1/10인 약 $1,760으로 진입 가능합니다.' },
      },
      {
        '@type': 'Question',
        name: '마진콜이 발생하면 어떻게 되나요?',
        acceptedAnswer: { '@type': 'Answer', text: '계좌 잔고가 유지 증거금 아래로 떨어지면 마진콜이 발생합니다. 즉시 추가 증거금을 납입하지 않으면 증권사가 강제 청산(반대 매매)합니다.' },
      },
    ],
  },
]);

export default function GuideMargin() {
  return (
    <>
      <Helmet>
        <title>해외선물 증거금 총정리 · 나스닥·금·원유 계약별 필요 자금 — 랩메린이</title>
        <meta
          name="description"
          content="해외선물 증거금이란 무엇이고 얼마나 필요할까요? CME 기준 나스닥(NQ) $17,600, S&P500(ES) $15,000, 골드(GC) $13,500 등 12개 종목 초기 증거금과 마이크로선물 증거금을 정리했습니다. 마진콜 뜻과 강제 청산 기준도 설명합니다."
        />
        <meta name="keywords" content="해외선물 증거금, 나스닥 선물 증거금, NQ 증거금, ES 증거금, GC 증거금, 해외선물 마진, 마진콜, 유지증거금, 초기증거금, 마이크로선물 증거금, MNQ 증거금, 해외선물 필요 자금" />
        <link rel="canonical" href="https://lab.merini.com/guide/futures-margin" />
        <meta property="og:title" content="해외선물 증거금 총정리 — 랩메린이" />
        <meta property="og:description" content="나스닥 $17,600, S&P500 $15,000, 골드 $13,500 — 종목별 증거금과 마진콜 기준." />
        <meta property="og:url" content="https://lab.merini.com/guide/futures-margin" />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{jsonLd}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <AppTabNav activeTab="quotes" />
        <main className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
          <div>
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-3">
              <ArrowLeft className="w-4 h-4" /> 홈으로
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">해외선물 증거금 총정리</h1>
            <p className="text-sm text-muted-foreground mt-2">
              해외선물 1계약을 거래하려면 거래소에 증거금(Margin)을 예치해야 합니다.
              종목별 CME 기준 초기 증거금과 마이크로선물을 이용한 소액 진입 방법을 정리했습니다.
            </p>
          </div>

          {/* 증거금 개념 */}
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-warning" /> 증거금 기본 개념
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/50">
                  <p className="font-bold mb-1">초기 증거금 (Initial Margin)</p>
                  <p className="text-muted-foreground text-xs">포지션 진입 시 최초로 예치해야 하는 금액. CME가 변동성에 따라 주기적으로 조정합니다.</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/50">
                  <p className="font-bold mb-1">유지 증거금 (Maintenance Margin)</p>
                  <p className="text-muted-foreground text-xs">포지션 보유 중 계좌 잔고가 이 금액 아래로 내려가면 마진콜이 발생합니다. 보통 초기 증거금의 70~90% 수준.</p>
                </div>
                <div className="p-3 rounded-xl bg-down-muted border border-down/20">
                  <p className="font-bold mb-1 text-down">마진콜 (Margin Call)</p>
                  <p className="text-muted-foreground text-xs">잔고 &lt; 유지 증거금 시 발생. 추가 입금 없으면 증권사가 강제 청산(반대 매매)합니다.</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/50">
                  <p className="font-bold mb-1">일일 정산 (Mark-to-Market)</p>
                  <p className="text-muted-foreground text-xs">선물은 매일 장 마감 시 손익이 계좌에 즉시 반영됩니다. 주식과 달리 미실현 손익이 없습니다.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 종목별 증거금 표 */}
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">종목별 초기 증거금 (CME 기준)</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">※ 실제 증거금은 시장 변동성에 따라 수시로 변경됩니다. 거래 전 최신 CME 공시를 확인하세요.</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border/50">
                    <tr>
                      <th className="text-left px-3 sm:px-4 py-2 font-semibold">종목</th>
                      <th className="text-left px-3 sm:px-4 py-2 font-semibold">심볼</th>
                      <th className="text-left px-3 sm:px-4 py-2 font-semibold">미니 증거금</th>
                      <th className="text-left px-3 sm:px-4 py-2 font-semibold">마이크로 증거금</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MARGIN_DATA.map((d) => (
                      <tr key={d.sym} className="border-b border-border/30 hover:bg-primary/5 transition-colors">
                        <td className="px-3 sm:px-4 py-2.5">
                          <Link to={`/asset/${d.sym.toLowerCase()}`} className="font-semibold hover:text-primary">{d.name}</Link>
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 font-mono text-xs text-muted-foreground">{d.sym}</td>
                        <td className="px-3 sm:px-4 py-2.5 font-mono text-xs">{d.mini}</td>
                        <td className="px-3 sm:px-4 py-2.5 font-mono text-xs">{d.micro === '-' ? <span className="text-muted-foreground">-</span> : d.micro}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 실전 팁 */}
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">증거금 관리 실전 팁</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm leading-relaxed">
              <p>• <b>계좌 잔고의 50% 이하로만 증거금 사용</b> — 급격한 변동성에 대비한 버퍼 확보</p>
              <p>• <b>마이크로선물로 리스크 분산</b> — MNQ·MES는 1/10 크기로 손실 제한에 유리</p>
              <p>• <b>야간 증거금 할증</b> — 일부 증권사는 야간 시간대 증거금 요건을 높임. 사전 확인 필수</p>
              <p>• <b>CME 공식 증거금 확인</b> — CME Group 홈페이지 &gt; Products &gt; Performance Bond에서 최신 수치 확인 가능</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">관련 가이드</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Link to="/calculator" className="block py-1.5 hover:text-primary">→ 손익계산기로 증거금 대비 수익률 계산</Link>
              <Link to="/guide/tick-value" className="block py-1.5 hover:text-primary">→ 1틱 가치 총정리</Link>
              <Link to="/guide/futures-trading-hours" className="block py-1.5 hover:text-primary">→ 거래시간 (KST)</Link>
              <Link to="/guide/how-to-start" className="block py-1.5 hover:text-primary">→ 해외선물 시작하는 법</Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    </>
  );
}
