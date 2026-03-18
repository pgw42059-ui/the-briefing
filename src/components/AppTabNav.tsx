/**
 * AppTabNav — 전체 페이지 공유 헤더 네비게이션
 *
 * 4개 탭(시세·분석·캘린더·계산기)과 테마 토글, 로그인 버튼을 포함.
 * Index.tsx / CalendarPage / CalculatorPage 에서 공통으로 사용.
 */
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, LogIn, User, LogOut, TrendingUp, Brain, Calendar, Calculator } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';

type TabValue = 'quotes' | 'analysis' | 'calendar' | 'calculator';

interface AppTabNavProps {
  activeTab: TabValue;
}

const TAB_ROUTES: Record<TabValue, string> = {
  quotes:     '/',
  analysis:   '/?tab=analysis',
  calendar:   '/calendar',
  calculator: '/calculator',
};

export function AppTabNav({ activeTab }: AppTabNavProps) {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { user, displayName, signOut } = useAuth();

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
              시세
            </TabsTrigger>
            <TabsTrigger
              value="analysis"
              className="text-xs sm:text-sm gap-1 sm:gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-semibold transition-all"
            >
              <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              분석
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="text-xs sm:text-sm gap-1 sm:gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-semibold transition-all"
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              캘린더
            </TabsTrigger>
            <TabsTrigger
              value="calculator"
              className="text-xs sm:text-sm gap-1 sm:gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-semibold transition-all"
            >
              <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              계산기
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 우측 액션 버튼 */}
        <div className="flex items-center gap-1 shrink-0">
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
