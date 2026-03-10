import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, Share, MoreVertical, Plus, ArrowLeft, Smartphone, Monitor, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setPlatform('ios');
    else if (/android/.test(ua)) setPlatform('android');
    else setPlatform('desktop');

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const steps = {
    ios: [
      { icon: <Share className="w-5 h-5" />, text: 'Safari 하단의 공유 버튼을 탭하세요', detail: '네모에서 화살표가 나오는 아이콘' },
      { icon: <Plus className="w-5 h-5" />, text: '"홈 화면에 추가"를 선택하세요', detail: '아래로 스크롤하면 찾을 수 있어요' },
      { icon: <CheckCircle2 className="w-5 h-5" />, text: '"추가" 버튼을 눌러 완료!', detail: '홈 화면에 더브리핑 아이콘이 생겨요' },
    ],
    android: [
      { icon: <MoreVertical className="w-5 h-5" />, text: '브라우저 상단의 메뉴(⋮)를 탭하세요', detail: 'Chrome 기준 오른쪽 상단' },
      { icon: <Download className="w-5 h-5" />, text: '"앱 설치" 또는 "홈 화면에 추가"를 선택하세요', detail: '설치 배너가 자동으로 뜰 수도 있어요' },
      { icon: <CheckCircle2 className="w-5 h-5" />, text: '"설치" 버튼을 눌러 완료!', detail: '앱 서랍에 더브리핑이 추가됩니다' },
    ],
    desktop: [
      { icon: <Download className="w-5 h-5" />, text: '주소창 오른쪽의 설치 아이콘을 클릭하세요', detail: 'Chrome/Edge 기준 ⊕ 또는 다운로드 아이콘' },
      { icon: <CheckCircle2 className="w-5 h-5" />, text: '"설치" 버튼을 눌러 완료!', detail: '바탕화면과 작업표시줄에 앱이 추가됩니다' },
    ],
  };

  const platformLabel = { ios: 'iPhone / iPad', android: 'Android', desktop: '데스크톱' };
  const PlatformIcon = platform === 'desktop' ? Monitor : Smartphone;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 sticky top-0 z-10 bg-background/90 backdrop-blur-lg">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" aria-label="뒤로가기">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-base font-bold">앱 설치 안내</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Download className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-extrabold">더브리핑을 설치하세요</h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">
            홈 화면에 추가하면 앱처럼 빠르게 실행할 수 있어요.<br />
            오프라인에서도 최근 데이터를 확인할 수 있습니다.
          </p>
        </div>

        {/* Install button (Android/Desktop) */}
        {isInstalled ? (
          <Card className="rounded-xl border-up/30 bg-up-muted">
            <CardContent className="p-5 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-up shrink-0" />
              <div>
                <p className="font-bold text-up">이미 설치되었습니다!</p>
                <p className="text-sm text-muted-foreground mt-0.5">더브리핑이 앱으로 실행 중이에요.</p>
              </div>
            </CardContent>
          </Card>
        ) : deferredPrompt ? (
          <Button onClick={handleInstall} size="lg" className="w-full h-14 text-base font-bold rounded-xl gap-2">
            <Download className="w-5 h-5" />
            지금 설치하기
          </Button>
        ) : null}

        {/* Platform tabs */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <PlatformIcon className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">
              {platformLabel[platform]} 설치 방법
            </h3>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {steps[platform].map((step, i) => (
              <Card key={i} className="rounded-xl">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                    <span className="text-sm font-extrabold">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{step.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
                  </div>
                  <div className="shrink-0 text-muted-foreground/50">{step.icon}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Other platforms */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-muted-foreground">다른 기기에서 설치하기</h3>
          <div className="grid grid-cols-3 gap-2">
            {(['ios', 'android', 'desktop'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`p-3 rounded-xl text-center text-xs font-medium transition-colors ${
                  platform === p
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                {p === 'desktop' ? <Monitor className="w-5 h-5 mx-auto mb-1" /> : <Smartphone className="w-5 h-5 mx-auto mb-1" />}
                {platformLabel[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Features */}
        <Card className="rounded-xl">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-bold text-sm">✨ 앱으로 설치하면</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                '홈 화면에서 한 번의 탭으로 바로 실행',
                '전체 화면으로 깔끔하게 사용',
                '오프라인에서도 최근 데이터 확인 가능',
                '더 빠른 로딩 속도',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-up shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="text-center pb-4">
          <Link to="/" className="text-sm text-primary hover:underline">← 대시보드로 돌아가기</Link>
        </div>
      </main>
    </div>
  );
}
