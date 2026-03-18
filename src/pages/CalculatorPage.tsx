import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Brain, Calendar, Calculator } from 'lucide-react';
import { CalculatorTab } from '@/components/CalculatorTab';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Footer } from '@/components/Footer';

export default function CalculatorPage() {
  const navigate = useNavigate();

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
        {/* Shared tab nav */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border/40">
          <div className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-70" />
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center gap-2.5">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 shrink-0"
              aria-label="홈으로"
            >
              <img src="/logo.png" alt="랩메린이" width={36} height={36} className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl" />
              <div className="min-w-0 hidden sm:block">
                <p className="text-sm font-extrabold tracking-tight leading-none">랩메린이</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">실시간 글로벌 마켓 대시보드</p>
              </div>
            </button>
            <Tabs value="calculator" className="flex-1" onValueChange={(v) => {
              if (v === 'quotes') navigate('/');
              else if (v === 'analysis') navigate('/?tab=analysis');
              else if (v === 'calendar') navigate('/calendar');
            }}>
              <TabsList className="w-full h-10 sm:h-11 rounded-xl bg-muted/70 border border-border/50 p-1 grid grid-cols-4 shadow-sm">
                <TabsTrigger value="quotes" className="text-xs sm:text-sm gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-semibold transition-all">
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  시세
                </TabsTrigger>
                <TabsTrigger value="analysis" className="text-xs sm:text-sm gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-semibold transition-all">
                  <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  분석
                </TabsTrigger>
                <TabsTrigger value="calendar" className="text-xs sm:text-sm gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-semibold transition-all">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  캘린더
                </TabsTrigger>
                <TabsTrigger value="calculator" className="text-xs sm:text-sm gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-semibold transition-all">
                  <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  계산기
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
          <CalculatorTab />
        </main>
        <Footer />
      </div>
    </>
  );
}
