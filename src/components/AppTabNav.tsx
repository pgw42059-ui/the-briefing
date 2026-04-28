/**
 * AppTabNav — 전체 페이지 공유 헤더 네비게이션
 *
 * 4개 탭(시세·분석·캘린더·계산기)과 테마 토글, 로그인 버튼을 포함.
 * Index.tsx / CalendarPage / CalculatorPage 에서 공통으로 사용.
 */
import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, LogIn, User, LogOut, TrendingUp, Brain, Calendar, Calculator, ExternalLink, Bell } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { useNotifications, type AppNotification, type PriceAlert } from '@/hooks/use-notifications';
import { useMarketQuotes } from '@/hooks/use-market-quotes';

const NotificationBell = lazy(() => import('@/components/NotificationBell').then(m => ({ default: m.NotificationBell })));

type TabValue = 'quotes' | 'analysis' | 'calendar' | 'calculator';

/** Index.tsx처럼 실시간 데이터가 있는 페이지에서 알림 컨텍스트를 주입할 때 사용 */
export interface NotificationHandlers {
  notifications: AppNotification[];
  unreadCount: number;
  prefs: ReturnType<typeof useNotifications>['prefs'];
  updatePrefs: ReturnType<typeof useNotifications>['updatePrefs'];
  requestBrowserPermission: ReturnType<typeof useNotifications>['requestBrowserPermission'];
  markAllRead: ReturnType<typeof useNotifications>['markAllRead'];
  markOneRead: ReturnType<typeof useNotifications>['markOneRead'];
  deleteOne: ReturnType<typeof useNotifications>['deleteOne'];
  clearAll: ReturnType<typeof useNotifications>['clearAll'];
  priceAlerts: PriceAlert[];
  deletePriceAlert: ReturnType<typeof useNotifications>['deletePriceAlert'];
  clearTriggeredAlerts: ReturnType<typeof useNotifications>['clearTriggeredAlerts'];
}

interface AppTabNavProps {
  activeTab: TabValue;
  /** 실시간 데이터 연결 상태 (Index에서만 사용) */
  isLive?: boolean;
  /** 실시간 알림 컨텍스트 (Index에서 주입). 없으면 내부 useNotifications 사용 */
  notificationHandlers?: NotificationHandlers;
}

const TAB_ROUTES: Record<TabValue, string> = {
  quotes:     '/',
  analysis:   '/?tab=analysis',
  calendar:   '/calendar',
  calculator: '/calculator',
};

export function AppTabNav({ activeTab, isLive, notificationHandlers }: AppTabNavProps) {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { user, displayName, signOut } = useAuth();
  // 모든 페이지에서 가격 알림이 동작하도록 quotes 로드 (React Query 캐시 공유)
  const { data: internalQuotes } = useMarketQuotes();
  const internal = useNotifications(internalQuotes, [], []);

  // 주입된 핸들러가 있으면 사용, 없으면 내부 상태 폴백
  const {
    notifications, unreadCount, prefs: notifPrefs,
    updatePrefs, requestBrowserPermission,
    markAllRead, markOneRead, deleteOne, clearAll,
    priceAlerts, deletePriceAlert, clearTriggeredAlerts,
  } = notificationHandlers ?? {
    notifications: internal.notifications,
    unreadCount: internal.unreadCount,
    prefs: internal.prefs,
    updatePrefs: internal.updatePrefs,
    requestBrowserPermission: internal.requestBrowserPermission,
    markAllRead: internal.markAllRead,
    markOneRead: internal.markOneRead,
    deleteOne: internal.deleteOne,
    clearAll: internal.clearAll,
    priceAlerts: internal.priceAlerts,
    deletePriceAlert: internal.deletePriceAlert,
    clearTriggeredAlerts: internal.clearTriggeredAlerts,
  };

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border/40">
      <div className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-70" />
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2 sm:py-3 flex items-center gap-2 sm:gap-3">
        {/* 로고 */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 shrink-0"
          aria-label="홈으로"
        >
          <img src="/logo.png" alt="랩메린이" width={36} height={36} className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl" />
          <div className="min-w-0 hidden lg:block">
            <p className="text-sm font-extrabold tracking-tight leading-none">랩메린이</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">실시간 글로벌 마켓 대시보드</p>
          </div>
        </button>

        {/* 탭바 */}
        <Tabs
          value={activeTab}
          className="flex-1"
          onValueChange={(v) => {
            const route = TAB_ROUTES[v as TabValue];
            if (route) navigate(route);
          }}
        >
          <TabsList className="w-full h-10 sm:h-11 rounded-xl bg-muted/70 border border-border/50 p-1 grid grid-cols-4 shadow-sm">
            <TabsTrigger
              value="quotes"
              className="text-xs sm:text-sm gap-1 sm:gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-semibold transition-all"
            >
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>시세</span>
            </TabsTrigger>
            <TabsTrigger
              value="analysis"
              className="text-xs sm:text-sm gap-1 sm:gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-semibold transition-all"
            >
              <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>분석</span>
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="text-xs sm:text-sm gap-1 sm:gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-semibold transition-all"
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>캘린더</span>
            </TabsTrigger>
            <TabsTrigger
              value="calculator"
              className="text-xs sm:text-sm gap-1 sm:gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-semibold transition-all"
            >
              <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>계산기</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 우측 액션 버튼 */}
        <div className="flex items-center gap-1 shrink-0">
          {/* LIVE 배지 */}
          {isLive && (
            <div
              className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 border border-primary/20"
              role="status"
              aria-label="실시간 데이터 연결됨"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" aria-hidden="true" />
              <span className="text-xs font-semibold text-primary">LIVE</span>
            </div>
          )}
          {/* 날짜 */}
          <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline px-1">
            {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
          </span>
          <a
            href="https://merini.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 h-8 px-2.5 rounded-lg text-[11px] font-semibold bg-primary/10 text-primary border border-primary/25 hover:bg-primary hover:text-primary-foreground transition-all shrink-0"
            aria-label="메린이 메인 사이트로 이동"
          >
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
            merini.com
          </a>
          {/* 알림벨 */}
          <Suspense fallback={
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" aria-label="알림">
              <Bell className="w-4 h-4" />
            </Button>
          }>
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              prefs={notifPrefs}
              onUpdatePrefs={updatePrefs}
              onRequestBrowserPermission={requestBrowserPermission}
              onMarkAllRead={markAllRead}
              onMarkOneRead={markOneRead}
              onDeleteOne={deleteOne}
              onClearAll={clearAll}
              priceAlerts={priceAlerts}
              onDeletePriceAlert={deletePriceAlert}
              onClearTriggeredAlerts={clearTriggeredAlerts}
            />
          </Suspense>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="h-8 w-8 rounded-lg"
            aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            {theme === 'dark'
              ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            }
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs gap-1 px-2 border-border/60">
                  <User className="w-3 h-3" />
                  <span className="hidden sm:inline max-w-[60px] truncate">{displayName || user.email?.split('@')[0]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem className="text-sm" disabled>{user.email}</DropdownMenuItem>
                <DropdownMenuItem className="text-sm gap-2 text-destructive" onClick={signOut}>
                  <LogOut className="w-3.5 h-3.5" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-xs gap-1 px-2 border-border/60"
              onClick={() => navigate('/auth')}
              aria-label="로그인"
            >
              <LogIn className="w-3 h-3" />
              <span className="hidden sm:inline">로그인</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
