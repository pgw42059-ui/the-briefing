import { Helmet } from 'react-helmet-async';
import { EconomicCalendar } from '@/components/EconomicCalendar';
import { AppTabNav } from '@/components/AppTabNav';
import { Footer } from '@/components/Footer';

export default function CalendarPage() {
  return (
    <>
      <Helmet>
        <title>{`경제지표 발표 일정 ${new Date().getFullYear()} — 미국 주요 지표 캘린더 · 랩메린이`}</title>
        <meta
          name="description"
          content={`${new Date().getFullYear()}년 미국·글로벌 경제지표 발표 일정과 기업 실적발표 캘린더. CPI·FOMC·비농업 고용지수(NFP)·PCE·GDP·ISM·EIA 원유재고 등 주요 거시지표와 영향 받는 해외선물 종목(NQ·ES·GC·CL·NG)을 한 페이지에서 확인하세요.`}
        />
        <meta name="keywords" content="경제지표 캘린더, 경제 일정, 미국 CPI 발표일, FOMC 일정, 비농업 고용지수, NFP 발표, PCE 발표, ISM 제조업, EIA 원유재고, 실적발표 일정, 어닝 캘린더, 해외선물 영향 지표, 나스닥 영향, 금 시세 영향" />
        <link rel="canonical" href="https://lab.merini.com/calendar" />
        <meta property="og:title" content={`경제지표 발표 일정 ${new Date().getFullYear()} — 랩메린이`} />
        <meta
          property="og:description"
          content="CPI·FOMC·NFP 등 미국 주요 경제지표 캘린더. NQ·ES·GC·CL 선물 종목 영향도 안내."
        />
        <meta property="og:url" content="https://lab.merini.com/calendar" />
        <meta name="twitter:title" content={`경제지표 발표 일정 ${new Date().getFullYear()} — 랩메린이`} />
        <meta
          name="twitter:description"
          content="CPI·FOMC·NFP 등 미국 주요 경제지표 캘린더. NQ·ES·GC·CL 선물 종목 영향도 안내."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <AppTabNav activeTab="calendar" />
        <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
          <EconomicCalendar />
        </main>
        <Footer />
      </div>
    </>
  );
}
