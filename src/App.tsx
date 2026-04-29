import { lazy, Suspense, useState, useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/use-auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { usePresenceTracker } from "@/hooks/use-presence-tracker";

const LazyTooltipProvider = lazy(() =>
  import("@/components/ui/tooltip").then(m => ({ default: m.TooltipProvider }))
);

const Toaster = lazy(() => import("@/components/ui/toaster").then(m => ({ default: m.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then(m => ({ default: m.Toaster })));

const Index = lazy(() => import("./pages/Index"));
const AssetDetail = lazy(() => import("./pages/AssetDetail"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const InstallPage = lazy(() => import("./pages/InstallPage"));
const CalculatorPage = lazy(() => import("./pages/CalculatorPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const GuideTradingHours = lazy(() => import("./pages/GuideTradingHours"));
const GuideTickValue = lazy(() => import("./pages/GuideTickValue"));
const GuideSymbols = lazy(() => import("./pages/GuideSymbols"));

const queryClient = new QueryClient();

/** Defer toast providers until after first idle to avoid forced reflow during paint */
const DeferredToasts = () => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const id = w.requestIdleCallback
      ? w.requestIdleCallback(() => setReady(true), { timeout: 3000 })
      : setTimeout(() => setReady(true), 2000);
    return () => {
      if (w.cancelIdleCallback) w.cancelIdleCallback(id as number);
      else clearTimeout(id);
    };
  }, []);
  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <Toaster />
      <Sonner />
    </Suspense>
  );
};

function PresenceInit() {
  usePresenceTracker();
  return null;
}

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Suspense fallback={null}>
        <LazyTooltipProvider>
          <DeferredToasts />
          <BrowserRouter>
            <PresenceInit />
            <Suspense fallback={<div className="min-h-screen bg-background" />}>
              <Routes>
                <Route path="/" element={<ErrorBoundary fallbackTitle="시세 페이지 오류"><Index /></ErrorBoundary>} />
                <Route path="/auth" element={<ErrorBoundary fallbackTitle="로그인 페이지 오류"><AuthPage /></ErrorBoundary>} />
                <Route path="/install" element={<ErrorBoundary fallbackTitle="설치 페이지 오류"><InstallPage /></ErrorBoundary>} />
                <Route path="/calculator" element={<ErrorBoundary fallbackTitle="계산기 오류"><CalculatorPage /></ErrorBoundary>} />
                <Route path="/calendar" element={<ErrorBoundary fallbackTitle="캘린더 오류"><CalendarPage /></ErrorBoundary>} />
                <Route path="/asset/:symbol" element={<ErrorBoundary fallbackTitle="종목 상세 오류"><AssetDetail /></ErrorBoundary>} />
                <Route path="/admin" element={<ErrorBoundary fallbackTitle="관리자 페이지 오류"><AdminPage /></ErrorBoundary>} />
                <Route path="/guide/futures-trading-hours" element={<ErrorBoundary fallbackTitle="가이드 페이지 오류"><GuideTradingHours /></ErrorBoundary>} />
                <Route path="/guide/tick-value" element={<ErrorBoundary fallbackTitle="가이드 페이지 오류"><GuideTickValue /></ErrorBoundary>} />
                <Route path="/guide/symbols" element={<ErrorBoundary fallbackTitle="가이드 페이지 오류"><GuideSymbols /></ErrorBoundary>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </LazyTooltipProvider>
      </Suspense>
    </AuthProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
