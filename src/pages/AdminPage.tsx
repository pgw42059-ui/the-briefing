import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Server, Wifi, WifiOff, Users, AlertTriangle, Database,
  Activity, RefreshCw, CheckCircle2, XCircle, Clock,
  ShieldAlert, Settings, LogOut, MemoryStick, Star,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useOnlineCount } from '@/hooks/use-online-count';
import { useAdminStats } from '@/hooks/use-admin-stats';
import { useMarketQuotes } from '@/hooks/use-market-quotes';
import { computeAllSignals } from '@/lib/compute-signals';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

/* ── 시그널 스냅샷 타입 ──────────────────────────────── */
interface SignalSnap { time: string; bullish: number; bearish: number; neutral: number; }

/* ── SVG 바 차트 (시그널) ────────────────────────────── */
function SignalBarChart({ data }: { data: SignalSnap[] }) {
  if (!data.length) return <div className="h-40 flex items-center justify-center text-[12px] text-muted-foreground">데이터 수집 중…</div>;
  const W = 520, H = 160, PL = 24, PR = 8, PT = 8, PB = 28;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;
  const maxVal = Math.max(...data.flatMap(d => [d.bullish, d.bearish]), 1);
  const barGroupW = chartW / data.length;
  const barW = Math.max(6, Math.floor(barGroupW * 0.28));
  const gap = Math.floor(barGroupW * 0.06);

  const latest = data[data.length - 1];
  const summary = latest ? `강세 ${latest.bullish}개, 약세 ${latest.bearish}개, 중립 ${latest.neutral}개` : '데이터 없음';

  return (
    <svg role="img" aria-label={`시그널 발생 현황 바 차트. ${summary}`} viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const y = PT + chartH * (1 - t);
        return (
          <g key={t}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="hsl(var(--border))" strokeWidth="0.5" />
            <text x={PL - 4} y={y + 3} textAnchor="end" fontSize="9" fill="hsl(var(--muted-foreground))">
              {Math.round(t * maxVal)}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const cx = PL + i * barGroupW + barGroupW / 2;
        const bH = (d.bullish / maxVal) * chartH;
        const rH = (d.bearish / maxVal) * chartH;
        return (
          <g key={i}>
            <rect x={cx - barW - gap / 2} y={PT + chartH - bH} width={barW} height={Math.max(bH, 0)} rx="2" fill="hsl(var(--primary))" opacity="0.85" />
            <rect x={cx + gap / 2} y={PT + chartH - rH} width={barW} height={Math.max(rH, 0)} rx="2" fill="hsl(var(--destructive))" opacity="0.75" />
            <text x={cx} y={H - 6} textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">{d.time}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── SVG 미니 차트 (7일 가입자) ─────────────────────── */
function SignupMiniChart({ data }: { data: { date: string; count: number }[] }) {
  if (!data.length) return null;
  const W = 260, H = 64, PL = 4, PR = 4, PT = 4, PB = 20;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;
  const maxVal = Math.max(...data.map(d => d.count), 1);
  const barW = Math.max(4, Math.floor(chartW / data.length) - 3);

  const maxDay = data.reduce((a, b) => (b.count > a.count ? b : a), data[0]);
  return (
    <svg role="img" aria-label={`최근 7일 신규 가입 차트. 최다 ${maxDay?.date} ${maxDay?.count}명`} viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {data.map((d, i) => {
        const cx = PL + (i + 0.5) * (chartW / data.length);
        const bH = Math.max((d.count / maxVal) * chartH, d.count > 0 ? 2 : 0);
        return (
          <g key={i}>
            <rect
              x={cx - barW / 2}
              y={PT + chartH - bH}
              width={barW}
              height={bH}
              rx="2"
              fill="hsl(var(--primary))"
              opacity={d.count === 0 ? 0.2 : 0.8}
            />
            <text x={cx} y={H - 5} textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))">
              {d.date.replace('월 ', '/').replace('일', '')}
            </text>
            {d.count > 0 && (
              <text x={cx} y={PT + chartH - bH - 2} textAnchor="middle" fontSize="7" fill="hsl(var(--primary))">
                {d.count}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ── 서브 컴포넌트 ───────────────────────────────────── */
function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
      ok ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive'
    }`}>
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {label}
    </span>
  );
}

function LevelBadge({ level, count }: { level: 'ERROR' | 'WARN' | 'INFO'; count: number }) {
  const cfg = {
    ERROR: 'bg-destructive/15 text-destructive',
    WARN:  'bg-yellow-500/15 text-yellow-500',
    INFO:  'bg-primary/15 text-primary',
  }[level];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg}`}>
      {level} {count}
    </span>
  );
}

function MiniBar({ value, max = 100, warn = 70, danger = 90 }: { value: number; max?: number; warn?: number; danger?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = value >= danger ? 'bg-destructive' : value >= warn ? 'bg-yellow-500' : 'bg-primary';
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={`${value}% 사용 중`}
      className="h-2 w-full rounded-full bg-muted overflow-hidden"
    >
      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ── JS 힙 메모리 (performance.memory, Chrome only) ─── */
function useJsHeap() {
  const [used, setUsed] = useState(0);
  const [total, setTotal] = useState(1);
  useEffect(() => {
    const read = () => {
      const mem = (performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      if (mem) { setUsed(mem.usedJSHeapSize); setTotal(mem.jsHeapSizeLimit); }
    };
    read();
    const id = setInterval(read, 3000);
    return () => clearInterval(id);
  }, []);
  return { used, total, pct: total ? Math.round((used / total) * 100) : 0 };
}

/* ── AdminPage ───────────────────────────────────────── */
export default function AdminPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const isAdmin = user?.user_metadata?.role === 'admin';
  useEffect(() => {
    if (user === null) { navigate('/auth', { replace: true }); return; }
    if (user && !isAdmin) { navigate('/', { replace: true }); }
  }, [user, isAdmin, navigate]);

  /* ── 실시간 데이터 훅 ── */
  const online = useOnlineCount();
  const {
    totalUsers, newUsersToday, newUsersWeek,
    signupsByDay, topWatchlist, logLevelCounts,
    logs, logsLoading,
  } = useAdminStats();
  const { data: quotes, isError: quotesError, isLoading: quotesLoading, dataUpdatedAt } = useMarketQuotes();
  const heap = useJsHeap();

  /* ── 시그널 스냅샷 (30초마다 누적, 최대 10개) ── */
  const [signalHistory, setSignalHistory] = useState<SignalSnap[]>([]);
  const tickRef = useRef(0);

  useEffect(() => {
    if (!quotes?.length) return;
    const signals = computeAllSignals(quotes);
    const bullish = signals.filter(s => s.sentiment === 'bullish').length;
    const bearish = signals.filter(s => s.sentiment === 'bearish').length;
    const neutral = signals.filter(s => s.sentiment === 'neutral').length;
    const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    tickRef.current += 1;
    setSignalHistory(prev => [...prev.slice(-9), { time, bullish, bearish, neutral }]);
  }, [quotes, dataUpdatedAt]);

  /* ── 피드 상태 (실제 quotes 기반) ── */
  const KEY_SYMBOLS = [
    { symbol: 'NQ',     name: '나스닥' },
    { symbol: 'ES',     name: 'S&P500' },
    { symbol: 'GC',     name: '골드' },
    { symbol: 'CL',     name: '원유' },
    { symbol: 'VIX',    name: 'VIX' },
    { symbol: 'USDKRW', name: '원달러' },
  ];

  const priceFeeds = KEY_SYMBOLS.map(({ symbol, name }) => {
    const q = quotes?.find(q => q.symbol === symbol);
    if (quotesLoading) return { symbol, name, status: 'loading' as const, info: '로딩 중' };
    if (!q || quotesError) return { symbol, name, status: 'error' as const, info: '데이터 없음' };
    const changePct = Math.abs(q.changePercent ?? 0);
    const status = changePct === 0 ? 'warn' as const : 'ok' as const;
    return { symbol, name, status, info: `${q.changePercent >= 0 ? '+' : ''}${q.changePercent?.toFixed(2)}%` };
  });

  /* ── Supabase 연결 상태 ── */
  const supabaseOk = !quotesError;
  const finnhubOk  = !quotesError && (quotes?.length ?? 0) > 0;

  /* ── 시스템 설정 ── */
  const [settings, setSettings] = useState({
    realtime: true, pushNotif: true, maintenace: false,
    rateLimitGuard: true, debugMode: false, cacheWarm: true,
  });
  const toggleSetting = (key: keyof typeof settings) =>
    setSettings(s => ({ ...s, [key]: !s[key] }));

  /* ── 마지막 갱신 시각 ── */
  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* ── 헤더 ─────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <ShieldAlert className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm">Admin Dashboard</span>
          </div>

          <div className="hidden md:flex items-center gap-4 flex-1">
            {/* JS 힙 메모리 */}
            <div className="flex items-center gap-2 min-w-[160px]">
              <MemoryStick className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <MiniBar value={heap.pct} warn={70} danger={90} />
              <span className="text-[11px] font-mono w-16 text-right shrink-0">
                {(heap.used / 1024 / 1024).toFixed(0)}MB
              </span>
            </div>

            <div className="flex items-center gap-2 ml-1">
              <StatusBadge ok={true}        label="API" />
              <StatusBadge ok={supabaseOk}  label="Supabase" />
              <StatusBadge ok={finnhubOk}   label="Finnhub" />
            </div>

            <div className="flex items-center gap-1.5 ml-2 text-[12px] text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span className="font-semibold text-foreground">{online}</span>
              <span>명 접속 중</span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground hidden sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => navigate('/')}>
              사이트로
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={signOut} aria-label="로그아웃">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── 바디 ─────────────────────────────────────── */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">

        {/* ── 메인 (좌) ──────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* 시그널 발생 현황 */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">시그널 발생 현황 (실시간)</h2>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-primary inline-block" />강세</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-destructive inline-block" />약세</span>
                <span className="text-muted-foreground">갱신: {lastUpdated}</span>
              </div>
            </div>
            <SignalBarChart data={signalHistory} />
            {signalHistory.length > 0 && (() => {
              const latest = signalHistory[signalHistory.length - 1];
              return (
                <div className="mt-3 flex gap-3 text-[11px]">
                  <span className="text-primary font-semibold">강세 {latest.bullish}개</span>
                  <span className="text-destructive font-semibold">약세 {latest.bearish}개</span>
                  <span className="text-muted-foreground">중립 {latest.neutral}개</span>
                </div>
              );
            })()}
          </Card>

          {/* 실시간 시세 피드 */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">실시간 시세 피드 상태</h2>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <RefreshCw className={`w-3 h-3 ${quotesLoading ? 'animate-spin' : ''}`} />
                <span>30s 마다 갱신</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {priceFeeds.map(f => (
                <div key={f.symbol} className={`rounded-xl p-3 border flex flex-col gap-1 ${
                  f.status === 'error'   ? 'border-destructive/40 bg-destructive/5' :
                  f.status === 'warn'    ? 'border-yellow-500/40 bg-yellow-500/5' :
                  f.status === 'loading' ? 'border-border/30 bg-muted/20' :
                  'border-border/40 bg-muted/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{f.symbol}</span>
                    {f.status === 'error'   ? <WifiOff className="w-3.5 h-3.5 text-destructive" /> :
                     f.status === 'warn'    ? <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" /> :
                     f.status === 'loading' ? <RefreshCw className="w-3.5 h-3.5 text-muted-foreground animate-spin" /> :
                     <Wifi className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{f.name}</span>
                  <span className={`text-[11px] font-mono font-semibold ${
                    f.status === 'error'   ? 'text-destructive' :
                    f.status === 'warn'    ? 'text-yellow-500' :
                    f.status === 'loading' ? 'text-muted-foreground' :
                    'text-primary'
                  }`}>{f.info}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── 사이드 (우) ────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* 사용자 분석 */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">사용자 분석</h2>
            </div>

            {/* 총 가입자 + 오늘 + 이번 주 */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="rounded-xl bg-muted/40 p-2.5 text-center">
                <p className="text-[9px] text-muted-foreground mb-0.5">총 가입자</p>
                <p className="text-lg font-bold">{totalUsers.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-primary/10 p-2.5 text-center">
                <p className="text-[9px] text-muted-foreground mb-0.5">오늘</p>
                <p className="text-lg font-bold text-primary">+{newUsersToday}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-2.5 text-center">
                <p className="text-[9px] text-muted-foreground mb-0.5">이번 주</p>
                <p className="text-lg font-bold">+{newUsersWeek}</p>
              </div>
            </div>

            {/* 7일 가입자 미니 차트 */}
            {signupsByDay.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5">최근 7일 신규 가입</p>
                <SignupMiniChart data={signupsByDay} />
              </div>
            )}
          </Card>

          {/* 에러 로그 (실제 admin_logs 테이블) */}
          <Card className="p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <h2 className="font-semibold text-sm">시스템 로그</h2>
              </div>
              {/* 로그 레벨별 카운트 */}
              <div className="flex items-center gap-1">
                {logLevelCounts.ERROR > 0 && <LevelBadge level="ERROR" count={logLevelCounts.ERROR} />}
                {logLevelCounts.WARN  > 0 && <LevelBadge level="WARN"  count={logLevelCounts.WARN} />}
                {logLevelCounts.INFO  > 0 && <LevelBadge level="INFO"  count={logLevelCounts.INFO} />}
              </div>
            </div>
            {logsLoading ? (
              <p className="text-[11px] text-muted-foreground">로딩 중…</p>
            ) : logs.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">기록된 로그가 없습니다.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {logs.map(log => (
                  <div key={log.id} className="flex gap-2 text-[11px]">
                    <span className="text-muted-foreground font-mono shrink-0">
                      {new Date(log.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`shrink-0 font-semibold w-10 ${
                      log.level === 'ERROR' ? 'text-destructive' :
                      log.level === 'WARN'  ? 'text-yellow-500' : 'text-primary'
                    }`}>{log.level}</span>
                    <span className="text-muted-foreground leading-tight">{log.message}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>

      {/* ── 하단 섹션 ─────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 pb-8 grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* DB 현황 */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">데이터베이스 현황</h2>
          </div>
          <DbStats />
        </Card>

        {/* 인기 관심종목 TOP 5 */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">인기 관심종목 TOP 5</h2>
          </div>
          {topWatchlist.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">관심종목 데이터 없음</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {topWatchlist.map((item, idx) => {
                const maxCount = topWatchlist[0].count;
                const pct = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                return (
                  <div key={item.symbol} className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold text-muted-foreground w-4 shrink-0">{idx + 1}</span>
                    <span className="text-xs font-semibold font-mono w-16 shrink-0">{item.symbol}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-700"
                        style={{ width: `${pct}%`, opacity: 0.7 + 0.3 * (1 - idx / 5) }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-8 text-right shrink-0">{item.count}명</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* 시스템 설정 */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">시스템 설정</h2>
          </div>
          <div className="flex flex-col gap-3">
            {([
              { key: 'realtime',       label: '실시간 데이터 피드',  desc: 'WebSocket 연결 활성화' },
              { key: 'pushNotif',      label: '푸시 알림',           desc: '브라우저 알림 발송' },
              { key: 'maintenace',     label: '점검 모드',           desc: '사용자에게 점검 공지 표시' },
              { key: 'rateLimitGuard', label: 'Rate Limit 가드',     desc: 'API 요청 자동 스로틀링' },
              { key: 'debugMode',      label: '디버그 모드',         desc: '콘솔 상세 로그 출력' },
              { key: 'cacheWarm',      label: '캐시 웜업',           desc: '서버 시작 시 자동 프리페치' },
            ] as const).map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{desc}</p>
                </div>
                <Switch checked={settings[key]} onCheckedChange={() => toggleSetting(key)} className="shrink-0" aria-label={label} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ── DB 현황 컴포넌트 ────────────────────────────────── */
function DbStats() {
  const [rows, setRows] = useState<{ name: string; count: number | null }[]>([]);

  useEffect(() => {
    const tables = [
      { name: '사용자 프로필', table: 'profiles' },
      { name: '관심종목',     table: 'watchlist' },
      { name: '시스템 로그',  table: 'admin_logs' },
    ];
    Promise.all(
      tables.map(async ({ name, table }) => {
        try {
          const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
          if (error) throw error;
          return { name, count };
        } catch (e) {
          console.warn(`[AdminPage] ${table} 행 수 조회 실패:`, e);
          return { name, count: null };
        }
      })
    ).then(setRows);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {rows.map(r => (
        <div key={r.name} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs font-medium">{r.name}</p>
          </div>
          <span className="text-xs font-mono font-semibold">
            {r.count !== null ? `${r.count.toLocaleString()}행` : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}
