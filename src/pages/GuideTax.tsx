import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AppTabNav } from '@/components/AppTabNav';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const jsonLd = JSON.stringify([
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: 'https://lab.merini.com/' },
      { '@type': 'ListItem', position: 2, name: '해외선물 세금', item: 'https://lab.merini.com/guide/futures-tax' },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: '해외선물 세금 완벽 정리 — 양도소득세 22% 신고 방법',
    description: '해외선물 거래 수익에 부과되는 양도소득세(22%) 계산 방법, 기본공제 250만 원, 손익통산, 신고 시기를 정리한 가이드.',
    datePublished: '2026-04-29',
    author: { '@type': 'Organization', name: '랩메린이' },
    publisher: { '@type': 'Organization', name: '랩메린이', url: 'https://lab.merini.com' },
    url: 'https://lab.merini.com/guide/futures-tax',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '해외선물 세금은 얼마인가요?',
        acceptedAnswer: { '@type': 'Answer', text: '해외선물 거래 수익은 양도소득세 22%(지방소득세 2% 포함)가 부과됩니다. 연간 250만 원까지는 기본공제가 적용되어 비과세입니다.' },
      },
      {
        '@type': 'Question',
        name: '해외선물 세금 신고는 언제 하나요?',
        acceptedAnswer: { '@type': 'Answer', text: '해외선물 양도소득세는 매년 5월에 전년도(1월~12월) 거래분을 홈택스에서 확정 신고합니다. 수익이 250만 원을 초과했다면 반드시 신고해야 합니다.' },
      },
      {
        '@type': 'Question',
        name: '해외선물 손실은 다른 소득과 통산되나요?',
        acceptedAnswer: { '@type': 'Answer', text: '해외선물 손실은 같은 해외파생상품(해외선물·옵션) 수익과만 통산(상계)됩니다. 국내주식·해외주식 양도차익과는 통산되지 않습니다. 또한 손실은 이월 공제가 되지 않습니다.' },
      },
    ],
  },
]);

const EXAMPLES = [
  { label: '연 수익 100만 원', tax: 0, desc: '기본공제 250만 원 이하 → 비과세' },
  { label: '연 수익 500만 원', tax: 55, desc: '(500만 - 250만) × 22% = 55만 원' },
  { label: '연 수익 1,000만 원', tax: 165, desc: '(1,000만 - 250만) × 22% = 165만 원' },
  { label: '연 수익 3,000만 원', tax: 605, desc: '(3,000만 - 250만) × 22% = 605만 원' },
];

export default function GuideTax() {
  return (
    <>
      <Helmet>
        <title>해외선물 세금 완벽 정리 · 양도소득세 22% 신고 방법 — 랩메린이</title>
        <meta
          name="description"
          content="해외선물 세금은 양도소득세 22%(지방세 포함)입니다. 연 250만 원 기본공제, 손익통산 범위, 5월 확정신고 방법, 세금 계산 예시까지 해외선물 트레이더가 꼭 알아야 할 세금 정보를 정리했습니다."
        />
        <meta name="keywords" content="해외선물 세금, 해외선물 양도소득세, 해외선물 세금 신고, 해외선물 22%, 해외선물 기본공제, 해외선물 손익통산, 해외선물 홈택스 신고, 선물 세금 계산, 해외파생상품 세금" />
        <link rel="canonical" href="https://lab.merini.com/guide/futures-tax" />
        <meta property="og:title" content="해외선물 세금 완벽 정리 — 랩메린이" />
        <meta property="og:description" content="양도소득세 22%, 250만 원 공제, 5월 신고 — 해외선물 세금 핵심만 정리." />
        <meta property="og:url" content="https://lab.merini.com/guide/futures-tax" />
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
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">해외선물 세금 완벽 정리</h1>
            <p className="text-sm text-muted-foreground mt-2">
              해외선물 수익에는 <b>양도소득세 22%</b>(지방소득세 2% 포함)가 부과됩니다.
              기본공제·손익통산·신고 시기까지 핵심 내용을 정리했습니다.
            </p>
            <div className="mt-3 px-3 py-2 rounded-lg bg-warning/10 border border-warning/30 text-xs text-muted-foreground">
              ⚠️ 본 내용은 참고용 정보이며 세무·법률 조언이 아닙니다. 정확한 세금 계산과 신고는 세무사 또는 국세청 홈택스를 이용하세요.
            </div>
          </div>

          {/* 핵심 요약 */}
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">핵심 요약 3가지</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-muted/50 text-center">
                <p className="text-3xl font-extrabold text-primary">22%</p>
                <p className="text-xs text-muted-foreground mt-1">양도소득세율<br />(지방소득세 2% 포함)</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50 text-center">
                <p className="text-3xl font-extrabold text-primary">250만</p>
                <p className="text-xs text-muted-foreground mt-1">연간 기본공제<br />(이하 비과세)</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50 text-center">
                <p className="text-3xl font-extrabold text-primary">5월</p>
                <p className="text-xs text-muted-foreground mt-1">확정신고 시기<br />(매년 5/1~5/31)</p>
              </div>
            </CardContent>
          </Card>

          {/* 세금 계산 예시 */}
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">세금 계산 예시</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">공식: (연간 순이익 - 250만 원) × 22%</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border/50">
                    <tr>
                      <th className="text-left px-4 py-2 font-semibold">연간 수익</th>
                      <th className="text-left px-4 py-2 font-semibold">납부 세금</th>
                      <th className="text-left px-4 py-2 font-semibold hidden sm:table-cell">계산</th>
                    </tr>
                  </thead>
                  <tbody>
                    {EXAMPLES.map((e) => (
                      <tr key={e.label} className="border-b border-border/30">
                        <td className="px-4 py-2.5 font-semibold">{e.label}</td>
                        <td className={`px-4 py-2.5 font-mono font-bold ${e.tax === 0 ? 'text-up' : 'text-down'}`}>
                          {e.tax === 0 ? '0원 (비과세)' : `${e.tax}만 원`}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground hidden sm:table-cell">{e.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 손익통산 */}
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">손익통산 범위</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed">
              <p>해외선물 손실·이익은 <b>같은 해외파생상품끼리만</b> 통산됩니다.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground border-b border-border/50">
                    <tr>
                      <th className="text-left px-3 py-2">구분</th>
                      <th className="text-left px-3 py-2">통산 가능 여부</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { a: '해외선물 A 수익 + 해외선물 B 손실', b: '✅ 가능 (동일 카테고리)' },
                      { a: '해외선물 손실 + 해외옵션 수익', b: '✅ 가능 (해외파생상품)' },
                      { a: '해외선물 손실 + 국내주식 양도차익', b: '❌ 불가 (카테고리 다름)' },
                      { a: '해외선물 손실 + 해외주식 양도차익', b: '❌ 불가 (카테고리 다름)' },
                      { a: '올해 손실 → 내년으로 이월 공제', b: '❌ 이월 불가' },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-border/30">
                        <td className="px-3 py-2 text-xs">{row.a}</td>
                        <td className="px-3 py-2 text-xs font-semibold">{row.b}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 신고 절차 */}
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">신고 절차 (5월 확정신고)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm leading-relaxed">
              <p><b>1단계</b> — 거래 증권사에서 연간 거래내역서 발급 (보통 이듬해 1~2월)</p>
              <p><b>2단계</b> — 국세청 홈택스(hometax.go.kr) 접속 → 신고/납부 → 양도소득세 → 해외파생상품</p>
              <p><b>3단계</b> — 거래내역 입력 후 납부 세액 확인 (매년 5월 1일 ~ 5월 31일)</p>
              <p><b>4단계</b> — 세금 납부 또는 자동 이체 설정</p>
              <p className="text-xs text-muted-foreground mt-2">* 예정신고(반기별)는 선택 사항이며, 확정신고 한 번으로 완료 가능합니다.</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">관련 가이드</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Link to="/guide/how-to-start" className="block py-1.5 hover:text-primary">→ 해외선물 시작하는 법</Link>
              <Link to="/guide/futures-margin" className="block py-1.5 hover:text-primary">→ 증거금 총정리</Link>
              <Link to="/guide/tick-value" className="block py-1.5 hover:text-primary">→ 1틱 가치 총정리</Link>
              <Link to="/glossary" className="block py-1.5 hover:text-primary">→ 선물 용어 사전</Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    </>
  );
}
