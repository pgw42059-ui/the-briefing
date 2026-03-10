import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function InstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('install-banner-dismissed');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (!dismissed && !isStandalone) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem('install-banner-dismissed', '1');
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 pointer-events-none">
      <div className="max-w-xl mx-auto pointer-events-auto bg-card border border-border/60 rounded-2xl shadow-lg p-4 flex items-center gap-3 backdrop-blur-lg">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight">더브리핑을 설치하세요</p>
          <p className="text-xs text-muted-foreground mt-0.5">홈 화면에서 앱처럼 빠르게 실행</p>
        </div>
        <Link to="/install">
          <Button size="sm" className="h-9 rounded-xl text-xs font-bold px-4 shrink-0 text-primary-foreground">
            설치 안내
          </Button>
        </Link>
        <button onClick={dismiss} className="shrink-0 p-1 rounded-lg hover:bg-muted transition-colors" aria-label="닫기">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
