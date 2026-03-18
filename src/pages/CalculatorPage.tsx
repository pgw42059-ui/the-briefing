import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { CalculatorTab } from '@/components/CalculatorTab';

export default function CalculatorPage() {
  return (
    <>
      <Helmet>
        <title>선물 트레이더 계산기 — 틱 손익·포지션 사이징·환율 변환 · 랩메린이</title>
        <meta
          name="description"
          content="선물 트레이딩 필수 계산기. NQ·ES·GC 등 12개 종목 틱 손익 계산, 수수료 포함 순수익, 포지션 사이징(계좌 리스크 기반 권장 계약수), 실시간 환율 변환을 한 번에."
        />
        <link rel="canonical" href="https://lab.merini.com/calculator" />
        <meta property="og:title" content="선물 트레이더 계산기 — 랩메린이" />
        <meta
          property="og:description"
          content="틱 손익, 포지션 사이징, 환율 변환 — 선물 트레이딩 필수 계산기."
        />
        <meta property="og:url" content="https://lab.merini.com/calculator" />
        <meta name="twitter:title" content="선물 트레이더 계산기 — 랩메린이" />
        <meta
          name="twitter:description"
          content="틱 손익, 포지션 사이징, 환율 변환 — 선물 트레이딩 필수 계산기."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-12">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            홈으로
          </Link>
          <CalculatorTab />
        </div>
      </div>
    </>
  );
}
