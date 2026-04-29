import { useNavigate } from 'react-router-dom';
import { Sun, Moon, LogIn, User, LogOut, TrendingUp, Brain, Calendar, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';

const TABS = [
  { value: 'quotes',     label: '시세',   icon: TrendingUp, route: '/' },
  { value: 'analysis',   label: '분석',   icon: Brain,      route: '/?tab=analysis' },
  { value: 'calendar',   label: '캘린더', icon: Calendar,   route: '/calendar' },
  { value: 'calculator', label: '계산기', icon: Calculator, route: '/calculator' },
] as const;

export function GuideHeader() {
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

        {/* 탭 버튼 (Tabs 컴포넌트 없이 — 가이드 페이지는 어느 탭도 active 아님) */}
        <div className="flex-1 h-10 sm:h-11 rounded-xl bg-muted/70 border border-border/50 p-1 grid grid-cols-4 shadow-sm">
          {TABS.map(({ value, label, icon: Icon, route }) => (
            <button
              key={value}
              onClick={() => navigate(route)}
              className="flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-background/60 transition-all"
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* 우측 액션 */}
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
