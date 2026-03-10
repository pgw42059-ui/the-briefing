import { lazy, Suspense, useState, useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const LazyTooltipProvider = lazy(() =>
  import("@/components/ui/tooltip").then(m => ({ default: m.TooltipProvider }))
);

const Toaster = lazy(() => import("@/components/ui/toaster").then(m => ({ default: m.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then(m => ({ default: m.Toaster })));

const Index = lazy(() => import("./pages/Index"));
const AssetDetail = lazy(() => import("./pages/AssetDetail"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const InstallPage = lazy(() => import("./pages/InstallPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

/** Defer toast providers until after first idle to avoid forced reflow during paint */
const DeferredToasts = () => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = 'requestIdleCallback' in window
      ? (window as any).requestIdleCallback(() => setReady(true), { timeout: 3000 })
      : setTimeout(() => setReady(true), 2000);
    return () => {
      if ('cancelIdleCallback' in window) (window as any).cancelIdleCallback(id);
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Suspense fallback={null}>
        <LazyTooltipProvider>
          <DeferredToasts />
          <BrowserRouter>
            <ErrorBoundary>
              <Suspense fallback={<div className="min-h-screen bg-background" />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/install" element={<InstallPage />} />
                  <Route path="/asset/:symbol" element={<AssetDetail />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </LazyTooltipProvider>
      </Suspense>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
