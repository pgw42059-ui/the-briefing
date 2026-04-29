import { Helmet } from 'react-helmet-async';
import { CalculatorTab } from '@/components/CalculatorTab';
import { AppTabNav } from '@/components/AppTabNav';
import { Footer } from '@/components/Footer';

export default function CalculatorPage() {
  return (
    <>
      <Helmet>
        <title>해외선물 손익계산기 · 나스닥·금·오일 틱 가치 / 증거금 / 환율 변환 — 랩메린이</title>
        <meta
          name="description"
          content="해외선물 손익을 1초 만에 계산. 나스닥(NQ) 1틱 $5, 골드(GC) 1틱 $10 등 12개 종목 틱 가치와 증거금, 수수료 포함 순수익, 계좌 리스크 기반 권장 계약수(포지션 사이징), 실시간 달러/원 환율 변환을 무료로 제공합니다."
        />
        <meta name="keywords" content="해외선물 계산기, 해외선물 손익계산기, 나스닥 1틱 얼마, NQ 틱가치, ES 틱가치, GC 틱가치, 해외선물 증거금, 해외선물 수수료 계산, 포지션 사이징, 마이크로선물, 미니선물, 달러 원화 환율 계산, 선물 거래 계산, MNQ 계산기" />
        <link rel="canonical" href="https://lab.merini.com/calculator" />
        <meta property="og:title" content="해외선물 손익계산기 · 틱 가치 / 증거금 / 환율 변환 — 랩메린이" />
        <meta
          property="og:description"
          content="나스닥·금·오일 등 12개 해외선물 틱 손익, 증거금, 포지션 사이징, 실시간 환율 변환을 한 번에."
        />
        <meta property="og:url" content="https://lab.merini.com/calculator" />
        <meta name="twitter:title" content="해외선물 손익계산기 — 랩메린이" />
        <meta
          name="twitter:description"
          content="나스닥·금·오일 등 12개 해외선물 틱 손익, 증거금, 포지션 사이징, 실시간 환율 변환을 한 번에."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <AppTabNav activeTab="calculator" />
        <main className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
          <CalculatorTab />
        </main>
        <Footer />
      </div>
    </>
  );
}
