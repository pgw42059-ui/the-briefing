import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { AppTabNav } from '@/components/AppTabNav';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TERMS = [
  { term: '선물 (Futures)', en: 'Futures', def: '미래의 특정 시점에 정해진 가격으로 자산을 사고파는 계약. 현물과 달리 증거금만으로 큰 금액을 거래할 수 있는 레버리지 상품입니다.' },
  { term: '증거금 (Margin)', en: 'Margin', def: '선물 1계약을 보유하기 위해 거래소에 예치해야 하는 최소 자금. 초기 증거금(Initial Margin)과 유지 증거금(Maintenance Margin)으로 구분됩니다.' },
  { term: '마진콜 (Margin Call)', en: 'Margin Call', def: '계좌 잔고가 유지 증거금 아래로 내려갈 때 발생. 추가 증거금을 납입하지 않으면 증권사가 강제 청산(반대 매매)합니다.' },
  { term: '틱 (Tick)', en: 'Tick', def: '선물 가격의 최소 변동 단위. 나스닥(NQ) 최소 틱은 0.25pt, 1틱 가치는 $5입니다.' },
  { term: '틱 가치 (Tick Value)', en: 'Tick Value', def: '1틱 움직임 시 발생하는 손익 금액. NQ 1틱 = $5, ES 1틱 = $12.50, GC 1틱 = $10입니다.' },
  { term: '롱 (Long)', en: 'Long', def: '가격 상승을 예상하고 매수 포지션을 취하는 것. 가격이 오르면 이익, 내리면 손실이 발생합니다.' },
  { term: '숏 (Short)', en: 'Short', def: '가격 하락을 예상하고 매도 포지션을 취하는 것. 선물은 현물을 보유하지 않아도 매도(공매도) 가능합니다.' },
  { term: '포지션 (Position)', en: 'Position', def: '현재 보유하고 있는 매수(롱) 또는 매도(숏) 상태. 반대 주문을 내면 포지션이 청산됩니다.' },
  { term: '청산 (Close/Liquidation)', en: 'Close', def: '보유 포지션을 반대 매매로 종료하는 것. 강제 청산은 증거금 부족 시 증권사가 자동으로 반대 매매하는 것입니다.' },
  { term: '일일 정산 (Mark-to-Market)', en: 'Mark-to-Market', def: '선물은 매일 장 마감 시 손익이 계좌에 즉시 반영됩니다. 주식과 달리 미실현 손익 개념이 없습니다.' },
  { term: '롤오버 (Rollover)', en: 'Rollover', def: '만기가 다가온 선물 계약을 다음 만기 계약으로 교체하는 것. 월 선물은 보통 만기 1주일 전 롤오버를 진행합니다.' },
  { term: '컨탱고 (Contango)', en: 'Contango', def: '원월물 가격이 현월물보다 높은 상태. 원자재 보유 비용(창고료·이자)이 반영되어 일반적으로 발생합니다.' },
  { term: '백워데이션 (Backwardation)', en: 'Backwardation', def: '현월물 가격이 원월물보다 높은 비정상적 상태. 공급 부족·수요 폭증 시 발생하며 원유 시장에서 자주 나타납니다.' },
  { term: '베이시스 (Basis)', en: 'Basis', def: '선물 가격과 현물 가격의 차이(선물 - 현물). 만기가 가까울수록 0에 수렴합니다.' },
  { term: '레버리지 (Leverage)', en: 'Leverage', def: '소액 증거금으로 큰 명목 금액의 포지션을 취할 수 있는 것. NQ는 증거금 $17,600으로 약 $500,000 이상의 계약을 거래합니다.' },
  { term: '슬리피지 (Slippage)', en: 'Slippage', def: '주문 가격과 실제 체결 가격의 차이. 시장가 주문 시 유동성이 낮은 종목에서 크게 발생합니다.' },
  { term: '스프레드 (Spread)', en: 'Spread', def: '매수 호가(Bid)와 매도 호가(Ask)의 차이. 유동성이 높은 NQ·ES는 스프레드가 거의 0이며, 변동성 폭발 시 일시적으로 확대됩니다.' },
  { term: 'VIX (변동성 지수)', en: 'VIX', def: 'S&P500 옵션 가격에 내재된 30일 예상 변동성. "공포지수"라고도 불리며 20 이상이면 시장 불안, 30 이상이면 공포 국면으로 해석합니다.' },
  { term: '기술적 분석 (Technical Analysis)', en: 'Technical Analysis', def: '과거 가격·거래량 데이터를 바탕으로 미래 가격을 예측하는 방법. 이동평균선·RSI·MACD·볼린저밴드 등이 대표적입니다.' },
  { term: '이동평균선 (MA)', en: 'Moving Average', def: '일정 기간의 평균 가격을 연결한 선. 20일 MA, 50일 MA, 200일 MA가 주요 지지·저항으로 활용됩니다.' },
  { term: 'RSI (상대강도지수)', en: 'RSI', def: '0~100 사이로 과매수(70 이상)·과매도(30 이하) 상태를 나타내는 모멘텀 지표.' },
  { term: 'MACD', en: 'MACD', def: '12일·26일 지수이동평균 차이와 9일 시그널선으로 구성된 추세·모멘텀 지표. 크로스오버로 매수·매도 시점을 파악합니다.' },
  { term: '볼린저밴드 (Bollinger Bands)', en: 'Bollinger Bands', def: '20일 이동평균선 ± 2표준편차로 구성된 밴드. 가격이 밴드 상단에 닿으면 과매수, 하단에 닿으면 과매도로 판단합니다.' },
  { term: '지지선 (Support)', en: 'Support', def: '가격이 하락할 때 매수세가 유입되어 반등하는 가격 수준. 이전 저점·이동평균선이 주요 지지선 역할을 합니다.' },
  { term: '저항선 (Resistance)', en: 'Resistance', def: '가격이 상승할 때 매도세가 강해져 반락하는 가격 수준. 이전 고점·심리적 라운드 숫자가 주요 저항선입니다.' },
  { term: 'NFP (비농업 고용지수)', en: 'Non-Farm Payrolls', def: '매월 첫째 주 금요일 발표되는 미국 신규 고용자 수. 시장에서 가장 큰 변동성을 일으키는 경제지표 중 하나입니다.' },
  { term: 'CPI (소비자물가지수)', en: 'Consumer Price Index', def: '미국 물가 수준을 나타내는 지수. 예상치를 크게 웃돌면 금리 인상 우려로 나스닥·채권 약세, 달러 강세가 나타납니다.' },
  { term: 'FOMC', en: 'Federal Open Market Committee', def: '미 연방공개시장위원회. 연 8회 회의를 열고 기준금리를 결정합니다. 금리 결정 및 의장 기자회견은 선물 시장 최대 이벤트입니다.' },
  { term: 'EIA 원유재고', en: 'EIA Crude Oil Inventories', def: '미국 에너지정보청(EIA)이 매주 수요일 발표하는 원유 재고량. 예상보다 많으면 원유 가격 하락, 적으면 상승 압력이 생깁니다.' },
];

const ALPHABET = [...new Set(TERMS.map(t => t.term[0]))].sort();

const jsonLd = JSON.stringify([
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: 'https://lab.merini.com/' },
      { '@type': 'ListItem', position: 2, name: '선물 용어 사전', item: 'https://lab.merini.com/glossary' },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: '해외선물 용어 사전',
    description: '해외선물 트레이더를 위한 필수 용어 29개를 쉽게 정리한 사전.',
    url: 'https://lab.merini.com/glossary',
    definedTerm: TERMS.map(t => ({
      '@type': 'DefinedTerm',
      name: t.term,
      description: t.def,
      inDefinedTermSet: 'https://lab.merini.com/glossary',
    })),
  },
]);

export default function Glossary() {
  const [search, setSearch] = useState('');
  const filtered = search
    ? TERMS.filter(t =>
        t.term.toLowerCase().includes(search.toLowerCase()) ||
        t.en.toLowerCase().includes(search.toLowerCase()) ||
        t.def.includes(search)
      )
    : TERMS;

  return (
    <>
      <Helmet>
        <title>해외선물 용어 사전 · 선물 투자 필수 용어 29개 — 랩메린이</title>
        <meta
          name="description"
          content="해외선물 입문자를 위한 용어 사전. 증거금·마진콜·롤오버·컨탱고·백워데이션·틱·RSI·MACD·VIX·NFP·CPI·FOMC 등 29개 선물 투자 필수 용어를 쉽게 설명합니다."
        />
        <meta name="keywords" content="해외선물 용어, 선물 용어 사전, 증거금 뜻, 마진콜 뜻, 롤오버 뜻, 컨탱고 뜻, 백워데이션 뜻, 틱 가치 뜻, RSI 뜻, MACD 뜻, VIX 뜻, NFP 뜻, FOMC 뜻, 해외선물 기초, 선물 입문 용어" />
        <link rel="canonical" href="https://lab.merini.com/glossary" />
        <meta property="og:title" content="해외선물 용어 사전 — 랩메린이" />
        <meta property="og:description" content="증거금·마진콜·컨탱고·VIX·NFP·FOMC 등 선물 필수 용어 29개를 쉽게 설명." />
        <meta property="og:url" content="https://lab.merini.com/glossary" />
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
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">해외선물 용어 사전</h1>
            <p className="text-sm text-muted-foreground mt-2">
              증거금·마진콜·컨탱고·VIX·NFP·FOMC 등 해외선물 트레이더가 꼭 알아야 할 용어 {TERMS.length}개를 정리했습니다.
            </p>
          </div>

          {/* 검색 */}
          <input
            type="search"
            placeholder="용어 검색 (예: 마진콜, RSI, Margin)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 px-4 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />

          {/* 용어 목록 */}
          <Card className="rounded-xl">
            <CardContent className="p-0 divide-y divide-border/40">
              {filtered.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground text-center">검색 결과가 없습니다.</p>
              ) : filtered.map((t) => (
                <div key={t.term} className="px-4 py-3">
                  <div className="flex items-baseline gap-2 mb-1">
                    <h2 className="font-bold text-sm sm:text-base">{t.term}</h2>
                    <span className="text-xs text-muted-foreground font-mono">{t.en}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t.def}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">관련 가이드</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Link to="/guide/how-to-start" className="block py-1.5 hover:text-primary">→ 해외선물 시작하는 법</Link>
              <Link to="/guide/tick-value" className="block py-1.5 hover:text-primary">→ 1틱 가치 총정리</Link>
              <Link to="/guide/futures-margin" className="block py-1.5 hover:text-primary">→ 증거금 가이드</Link>
              <Link to="/guide/futures-tax" className="block py-1.5 hover:text-primary">→ 세금 가이드 (양도소득세 22%)</Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    </>
  );
}
