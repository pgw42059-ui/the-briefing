import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { EconomicCalendar } from '@/components/EconomicCalendar';

export default function CalendarPage() {
  return (
    <>
      <Helmet>
        <title>경제지표 발표 일정 2025 — 미국 주요 지표 캘린더 · 랩메린이</title>
        <meta
          name="description"
          content="2025년 미국 경제지표 발표 일정. CPI, FOMC, NFP, PCE, GDP 등 주요 거시경제 지표와 기업실적 발표 일정을 실시간으로 확인하세요. 선물 트레이더를 위한 영향 종목(NQ·ES·GC·CL) 안내 포함."
        />
        <link rel="canonical" href="https://lab.merini.com/calendar" />
        <meta property="og:title" content="경제지표 발표 일정 2025 — 랩메린이" />
        <meta
          property="og:description"
          content="CPI·FOMC·NFP 등 미국 주요 경제지표 캘린더. NQ·ES·GC·CL 선물 종목 영향도 안내."
        />
        <meta property="og:url" content="https://lab.merini.com/calendar" />
        <meta name="twitter:title" content="경제지표 발표 일정 2025 — 랩메린이" />
        <meta
          name="twitter:description"
          content="CPI·FOMC·NFP 등 미국 주요 경제지표 캘린더. NQ·ES·GC·CL 선물 종목 영향도 안내."
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
          <EconomicCalendar />
        </div>
      </div>
    </>
  );
}
