import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Server, Wifi, WifiOff, Users, AlertTriangle, Database,
  Activity, RefreshCw, CheckCircle2, XCircle, Clock,
  TrendingUp, ShieldAlert, Settings, LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

/* ── Mock 데이터 ─────────────────────────────────────── */
const SIGNAL_DATA = [
  { time: '00:00', bullish: 3, bearish: 1 },
  { time: '03:00', bullish: 2, bearish: 4 },
  { time: '06:00', bullish: 5, bearish: 2 },
  { time: '09:00', bullish: 8, bearish: 3 },
  { time: '12:00', bullish: 6, bearish: 5 },
  { time: '15:00', bullish: 9, bearish: 2 },
  { time: '18:00', bullish: 4, bearish: 6 },
  { time: '21:00', bullish: 7, bearish: 1 },
];

const PRICE_FEEDS = [
  { symbol: 'NQ', name: '나스닥', latency: 42, status: 'ok' },
  { symbol: 'ES', name: 'S&P500', latency: 38, status: 'ok' },
  { symbol: 'GC', name: '골드', latency: 61, status: 'ok' },
  { symbol: 'CL', name: '원유', latency: 55, status: 'ok' },
  { symbol: 'VIX', name: 'VIX', latency: 120, status: 'warn' },
  { symbol: 'DXY', name: '달러인덱스', latency: 0, status: 'error' },
];

const ERROR_LOGS = [
  { time: '21:43', level: 'ERROR', msg: 'Finnhub WS reconnect timeout — DXY' },
  { time: '18:12', level: 'WARN',  msg: 'VIX latency > 100ms (spike)' },
  { time: '15:57', level: 'ERROR', msg: 'Supabase realtime subscription dropped' },
  { time: '11:30', level: 'WARN',  msg: 'Rate limit 90% — Finnhub REST' },
  { time: '09:04', level: 'INFO',  msg: 'Daily DB backup completed ✓' },
];

const BACKUPS = [
  { name: '전체 DB 스냅샷', lastRun: '오늘 09:04', status: 'ok',  nextRun: '내일 09:00' },
  { name: '사용자 테이블',  lastRun: '오늘 09:04', status: 'ok',  nextRun: '내일 09:00' },
  { name: '알림 로그',      lastRun: '어제 09:04', status: 'warn', nextRun: '오늘 21:00' },
];

/* ── SVG 바 차트 ─────────────────────────────────────── */
function SignalBarChart({ data }: { data: typeof SIGNAL_DATA }) {
  const W = 520, H = 160, PL = 24, PR = 8, PT = 8, PB = 28;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;
  const maxVal = Math.max(...data.flatMap(d => [d.bullish, d.bearish]));
  const barGroupW = chartW / data.length;
  const barW = Math.floor(barGroupW * 0.3);
  const gap = Math.floor(barGroupW * 0.06);
  const yLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* 그리드 */}
      {yLines.map(t => {
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
      {/* 바 */}
      {data.map((d, i) => {
        const cx = PL + i * barGroupW + barGroupW / 2;
        const bH = (d.bullish / maxVal) * chartH;
        const rH = (d.bearish / maxVal) * chartH;
        return (
          <g key={i}>
            <rect x={cx - barW - gap / 2} y={PT + chartH - bH} width={barW} height={bH} rx="2" fill="hsl(var(--primary))" opacity="0.85" />
            <rect x={cx + gap / 2}         y={PT + chartH - rH} width={barW} height={rH} rx="2" fill="hsl(var(--destructive))" opacity="0.75" />
            <text x={cx} y={H - 6} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">{d.time}</text>
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

function MiniBar({ value, max = 100, warn = 70, danger = 90 }: { value: number; max?: number; warn?: number; danger?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = value >= danger ? 'bg-destructive' : value >= warn ? 'bg-yellow-500' : 'bg-primary';
  return (
    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ── AdminPage ───────────────────────────────────────── */
export default function AdminPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // 실시간 갱신 시뮬레이션
  const [cpu, setCpu]     = useState(34);
  const [ram, setRam]     = useState(61);
  const [online, setOnline] = useState(127);
  const [tick, setTick]   = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCpu(v  => Math.max(10, Math.min(95, v + (Math.random() - 0.5) * 8)));
      setRam(v  => Math.max(40, Math.min(90, v + (Math.random() - 0.5) * 3)));
      setOnline(v => Math.max(80, Math.min(200, v + Math.floor((Math.random() - 0.5) * 5))));
      setTick(t => t + 1);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // 시스템 설정 스위치 상태
  const [settings, setSettings] = useState({
    realtime:   true,
    pushNotif:  true,
    maintenace: false,
    rateLimitGuard: true,
    debugMode:  false,
    cacheWarm:  true,
  });

  const toggleSetting = (key: keyof typeof settings) =>
    setSettings(s => ({ ...s, [key]: !s[key] }));

  const apiConnected  = true;
  const supabaseOk    = true;
  const finnhubOk     = true;

  const apiQueries = { used: 7230, limit: 10000, reset: '내일 00:00 UTC' };
  const newUsers   = { today: 14, week: 87 };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* ── 헤더 ─────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <ShieldAlert className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm">Admin Dashboard</span>
          </div>

          {/* 서버 상태 */}
          <div className="hidden md:flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2 min-w-[140px]">
              <span className="text-[11px] text-muted-foreground w-8">CPU</span>
              <MiniBar value={cpu} warn={70} danger={85} />
              <span className="text-[11px] font-mono w-8 text-right">{cpu.toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-2 min-w-[140px]">
              <span className="text-[11px] text-muted-foreground w-8">RAM</span>
              <MiniBar value={ram} warn={75} danger={90} />
              <span className="text-[11px] font-mono w-8 text-right">{ram.toFixed(0)}%</span>
            </div>

            <div className="flex items-center gap-2 ml-2">
              <StatusBadge ok={apiConnected}  label="API" />
              <StatusBadge ok={supabaseOk}    label="Supabase" />
              <StatusBadge ok={finnhubOk}     label="Finnhub" />
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
      <div className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">

        {/* ── 메인 (좌) ──────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* 시그널 발생 현황 차트 */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">시그널 발생 현황 (오늘)</h2>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-primary inline-block" />강세</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-destructive inline-block" />약세</span>
              </div>
            </div>
            <SignalBarChart data={SIGNAL_DATA} />
          </Card>

          {/* 실시간 시세 피드 점검 */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">실시간 시세 피드 상태</h2>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} />
                <span>3s 마다 갱신 (tick #{tick})</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRICE_FEEDS.map(f => (
                <div key={f.symbol} className={`rounded-xl p-3 border flex flex-col gap-1 ${
                  f.status === 'error' ? 'border-destructive/40 bg-destructive/5' :
                  f.status === 'warn'  ? 'border-yellow-500/40 bg-yellow-500/5' :
                  'border-border/40 bg-muted/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{f.symbol}</span>
                    {f.status === 'error' ? <WifiOff className="w-3.5 h-3.5 text-destructive" /> :
                     f.status === 'warn'  ? <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" /> :
                     <Wifi className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{f.name}</span>
                  <span className={`text-[11px] font-mono font-semibold ${
                    f.status === 'error' ? 'text-destructive' :
                    f.status === 'warn'  ? 'text-yellow-500' :
                    'text-primary'
                  }`}>
                    {f.status === 'error' ? '연결 끊김' : `${f.latency}ms`}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── 사이드 (우) ────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* API 잔여 쿼리 */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Server className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">API 잔여 쿼리</h2>
            </div>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-bold font-mono">{(apiQueries.limit - apiQueries.used).toLocaleString()}</span>
              <span className="text-[11px] text-muted-foreground">/ {apiQueries.limit.toLocaleString()}</span>
            </div>
            <MiniBar value={apiQueries.used} max={apiQueries.limit} warn={70} danger={90} />
            <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>사용: {apiQueries.used.toLocaleString()}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{apiQueries.reset}</span>
            </div>
          </Card>

          {/* 신규 사용자 */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">신규 사용자</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-primary/10 p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">오늘</p>
                <p className="text-xl font-bold text-primary">+{newUsers.today}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">이번 주</p>
                <p className="text-xl font-bold">+{newUsers.week}</p>
              </div>
            </div>
          </Card>

          {/* 오늘의 에러 로그 */}
          <Card className="p-4 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <h2 className="font-semibold text-sm">오늘의 에러 로그</h2>
            </div>
            <div className="flex flex-col gap-2">
              {ERROR_LOGS.map((log, i) => (
                <div key={i} className="flex gap-2 text-[11px]">
                  <span className="text-muted-foreground font-mono shrink-0">{log.time}</span>
                  <span className={`shrink-0 font-semibold w-10 ${
                    log.level === 'ERROR' ? 'text-destructive' :
                    log.level === 'WARN'  ? 'text-yellow-500' :
                    'text-primary'
                  }`}>{log.level}</span>
                  <span className="text-muted-foreground leading-tight">{log.msg}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── 하단 섹션 ─────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 pb-8 grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* 데이터베이스 백업 상태 */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">데이터베이스 백업 상태</h2>
          </div>
          <div className="flex flex-col gap-3">
            {BACKUPS.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                {b.status === 'ok'
                  ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  : <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{b.name}</p>
                  <p className="text-[10px] text-muted-foreground">마지막: {b.lastRun}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground">다음</p>
                  <p className="text-[11px] font-medium">{b.nextRun}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 시스템 설정 */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">시스템 설정</h2>
          </div>
          <div className="flex flex-col gap-3">
            {([
              { key: 'realtime',       label: '실시간 데이터 피드',    desc: 'WebSocket 연결 활성화' },
              { key: 'pushNotif',      label: '푸시 알림',             desc: '브라우저 알림 발송' },
              { key: 'maintenace',     label: '점검 모드',             desc: '사용자에게 점검 공지 표시' },
              { key: 'rateLimitGuard', label: 'Rate Limit 가드',       desc: 'API 요청 자동 스로틀링' },
              { key: 'debugMode',      label: '디버그 모드',           desc: '콘솔 상세 로그 출력' },
              { key: 'cacheWarm',      label: '캐시 웜업',             desc: '서버 시작 시 자동 프리페치' },
            ] as const).map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{desc}</p>
                </div>
                <Switch
                  checked={settings[key]}
                  onCheckedChange={() => toggleSetting(key)}
                  className="shrink-0"
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
