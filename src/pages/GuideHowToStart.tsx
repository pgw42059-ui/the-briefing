import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { GuideHeader } from '@/components/GuideHeader';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const jsonLd = JSON.stringify([
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: 'https://lab.merini.com/' },
      { '@type': 'ListItem', position: 2, name: '해외선물 시작하는 법', item: 'https://lab.merini.com/guide/how-to-start' },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: '해외선물 시작하는 법 — 계좌 개설부터 첫 거래까지 입문 가이드',
    description: '해외선물을 처음 시작하는 분을 위한 입문 가이드. 증권사 선택, 계좌 개설, 증거금 입금, 첫 종목 선택, 주문 방법까지 단계별로 설명합니다.',
    datePublished: '2026-04-29',
    author: { '@type': 'Organization', name: '랩메린이' },
    publisher: { '@type': 'Organization', name: '랩메린이', url: 'https://lab.merini.com' },
    url: 'https://lab.merini.com/guide/how-to-start',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '해외선물 거래는 누구나 할 수 있나요?',
        acceptedAnswer: { '@type': 'Answer', text: '만 19세 이상 대한민국 국민이라면 증권사에서 해외선물 계좌를 개설할 수 있습니다. 단, 대부분의 증권사가 투자 경험·자산 확인 절차를 요구하며, 레버리지 상품이므로 고위험 투자자 확인 절차를 거쳐야 합니다.' },
      },
      {
        '@type': 'Question',
        name: '해외선물 최소 투자금은 얼마인가요?',
        acceptedAnswer: { '@type': 'Answer', text: '정규 E-mini 선물은 종목에 따라 $8,000~$17,600의 증거금이 필요합니다. Micro 선물(MNQ·MES 등)은 그 1/10인 $800~$1,760으로 시작할 수 있어 소액 입문에 적합합니다.' },
      },
      {
        '@type': 'Question',
        name: '해외선물 초보자에게 추천하는 종목은?',
        acceptedAnswer: { '@type': 'Answer', text: '유동성이 가장 높고 정보가 풍부한 E-mini 나스닥(NQ) 또는 E-mini S&P500(ES)를 추천합니다. 소액으로 시작하려면 Micro E-mini(MNQ·MES)로 먼저 감각을 익히는 것이 좋습니다.' },
      },
    ],
  },
]);

const STEPS = [
  {
    step: 1,
    title: '증권사 선택 및 계좌 개설',
    desc: '국내 증권사(키움·미래에셋·한투·삼성·NH 등) 중 해외선물 서비스를 제공하는 곳을 선택합니다. HTS/MTS 앱에서 비대면으로 개설 가능하며, 신분증·투자 성향 확인 절차가 필요합니다.',
    tips: ['수수료 비교: 계약당 $2~5 수준, 이벤트 기간 할인 확인', '야간 거래 지원 여부 확인', 'HTS/MTS UI 편의성 직접 체험'],
  },
  {
    step: 2,
    title: '해외선물 전용 계좌 신청',
    desc: '일반 주식 계좌와 별도로 해외선물 계좌를 개설해야 합니다. 대부분의 증권사가 고위험 상품 가입 확인 절차(투자 경험, 자산 규모 등)를 요구합니다.',
    tips: ['레버리지 위험 고지 동의 필요', '일부 증권사는 모의거래 계좌 제공 — 먼저 연습'],
  },
  {
    step: 3,
    title: '증거금 입금',
    desc: '거래하려는 종목의 증거금 이상을 해외선물 계좌에 입금합니다. 계좌 잔고가 유지증거금 아래로 내려가면 마진콜이 발생하니 여유 자금을 더 확보하세요.',
    tips: ['첫 거래는 Micro 선물(MNQ·MES)로 1/10 증거금 활용', '총 자금의 30~50% 이하만 증거금으로 사용 권장'],
  },
  {
    step: 4,
    title: '첫 종목 선택',
    desc: '유동성이 가장 높은 E-mini 나스닥(NQ) 또는 S&P500(ES)를 추천합니다. 거래량이 많아 체결이 빠르고 스프레드가 좁습니다.',
    tips: ['NQ: 기술주·AI 트렌드에 민감, 변동성 큼', 'ES: 변동성 낮고 안정적, 기관 선호', 'MNQ/MES: 소액 입문용, 1/10 크기'],
  },
  {
    step: 5,
    title: '주문 방법 익히기',
    desc: '선물 주문은 주식과 비슷하지만 롱(매수)/숏(매도) 모두 진입 가능합니다. 시장가 주문보다 지정가 주문을 활용해 슬리피지를 줄이세요.',
    tips: ['진입(Open): 신규 매수 또는 신규 매도', '청산(Close): 반대 포지션으로 종료', '스탑로스 필수: 계좌 손실 제한'],
  },
  {
    step: 6,
    title: '경제지표와 거래시간 파악',
    desc: 'CPI·FOMC·비농업 고용지수(NFP) 등 주요 지표 발표 시간에 변동성이 폭발합니다. 랩메린이 경제 캘린더와 실시간 시세로 사전에 확인하세요.',
    tips: ['미국 서머타임 시 발표 시각 1시간 빨라짐', '지표 발표 직전·직후 스프레드 확대 주의', '포지션 없이 지표 발표를 관찰하는 것도 전략'],
  },
];

export default function GuideHowToStart() {
  return (
    <>
      <Helmet>
        <title>해외선물 시작하는 법 · 계좌 개설부터 첫 거래까지 입문 가이드 — 랩메린이</title>
        <meta
          name="description"
          content="해외선물 입문자를 위한 완전 가이드. 증권사 선택·계좌 개설·증거금 입금·종목 선택·주문 방법까지 6단계로 설명합니다. 마이크로선물(MNQ·MES)로 소액 시작하는 법, 경제지표 활용법도 포함."
        />
        <meta name="keywords" content="해외선물 시작하는법, 해외선물 입문, 해외선물 계좌 개설, 해외선물 처음, 해외선물 방법, 해외선물 초보, 마이크로선물 입문, MNQ 시작, 해외선물 증권사, 해외선물 거래방법" />
        <link rel="canonical" href="https://lab.merini.com/guide/how-to-start" />
        <meta property="og:title" content="해외선물 시작하는 법 — 랩메린이" />
        <meta property="og:description" content="계좌 개설부터 첫 거래까지 6단계 입문 가이드. 마이크로선물로 소액 시작하는 법 포함." />
        <meta property="og:url" content="https://lab.merini.com/guide/how-to-start" />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{jsonLd}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <GuideHeader />
        <main className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
          <div>
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-3">
              <ArrowLeft className="w-4 h-4" /> 홈으로
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">해외선물 시작하는 법</h1>
            <p className="text-sm text-muted-foreground mt-2">
              해외선물은 주식보다 진입 장벽이 높지만, 순서를 알면 어렵지 않습니다.
              계좌 개설부터 첫 거래까지 6단계로 설명합니다.
            </p>
            <div className="mt-3 px-3 py-2 rounded-lg bg-warning/10 border border-warning/30 text-xs text-muted-foreground">
              ⚠️ 해외선물은 레버리지 상품으로 원금 손실 위험이 있습니다. 충분한 학습 후 신중하게 투자하세요.
            </div>
          </div>

          {/* 단계별 가이드 */}
          {STEPS.map((s) => (
            <Card key={s.step} className="rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                    {s.step}
                  </span>
                  {s.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                <div className="space-y-1">
                  {s.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* 랩메린이 활용 */}
          <Card className="rounded-xl border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">랩메린이로 거래 준비하기</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Link to="/" className="block py-1.5 hover:text-primary">→ 실시간 해외선물 시세 — 나스닥·항셍·금·원유</Link>
              <Link to="/calendar" className="block py-1.5 hover:text-primary">→ 경제지표 캘린더 — CPI·FOMC·NFP 발표 일정</Link>
              <Link to="/calculator" className="block py-1.5 hover:text-primary">→ 손익계산기 — 틱 가치·증거금·환율 계산</Link>
              <Link to="/guide/tick-value" className="block py-1.5 hover:text-primary">→ 1틱 가치 총정리 — NQ $5, ES $12.50, GC $10</Link>
              <Link to="/guide/futures-margin" className="block py-1.5 hover:text-primary">→ 증거금 가이드 — 종목별 필요 자금</Link>
              <Link to="/guide/futures-tax" className="block py-1.5 hover:text-primary">→ 세금 가이드 — 양도소득세 22%</Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    </>
  );
}
