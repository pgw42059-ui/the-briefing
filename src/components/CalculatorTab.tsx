import { useState, useMemo } from 'react';
import { ArrowLeftRight, Info, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForexRates } from '@/hooks/use-forex-rates';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

// ──────────────────────────────────────────────
// 선물 종목 데이터
// ──────────────────────────────────────────────
const FUTURES = [
  { symbol: 'NQ',  name: 'NASDAQ E-mini',  emoji: '📈', tickSize: 0.25,    tickValue: 5,     priceStep: 0.25,  margin: 17600 },
  { symbol: 'MNQ', name: 'NASDAQ Micro',    emoji: '📈', tickSize: 0.25,    tickValue: 0.5,   priceStep: 0.25,  margin: 1760  },
  { symbol: 'ES',  name: 'S&P500 E-mini',   emoji: '📊', tickSize: 0.25,    tickValue: 12.5,  priceStep: 0.25,  margin: 14300 },
  { symbol: 'MES', name: 'S&P500 Micro',    emoji: '📊', tickSize: 0.25,    tickValue: 1.25,  priceStep: 0.25,  margin: 1430  },
  { symbol: 'YM',  name: '다우존스 E-mini', emoji: '🏛️', tickSize: 1,       tickValue: 5,     priceStep: 1,     margin: 12100 },
  { symbol: 'MYM', name: '다우존스 Micro',  emoji: '🏛️', tickSize: 1,       tickValue: 0.5,   priceStep: 1,     margin: 1210  },
  { symbol: 'GC',  name: '금 (Gold)',        emoji: '🥇', tickSize: 0.1,     tickValue: 10,    priceStep: 0.1,   margin: 9900  },
  { symbol: 'MGC', name: '금 Micro',         emoji: '🥇', tickSize: 0.1,     tickValue: 1,     priceStep: 0.1,   margin: 990   },
  { symbol: 'SI',  name: '은 (Silver)',      emoji: '🥈', tickSize: 0.005,   tickValue: 25,    priceStep: 0.005, margin: 9900  },
  { symbol: 'CL',  name: '원유 (Crude Oil)', emoji: '🛢️', tickSize: 0.01,    tickValue: 10,    priceStep: 0.01,  margin: 5500  },
  { symbol: 'NG',  name: '천연가스',         emoji: '🔥', tickSize: 0.001,   tickValue: 10,    priceStep: 0.001, margin: 2200  },
  { symbol: 'HG',  name: '구리 (Copper)',    emoji: '🪙', tickSize: 0.0005,  tickValue: 12.5,  priceStep: 0.0005,margin: 5500  },
] as const;

// ──────────────────────────────────────────────
// 지원 통화
// ──────────────────────────────────────────────
const CCY_LIST = ['USD', 'KRW', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD'] as const;
type Ccy = typeof CCY_LIST[number];

const CCY_FLAGS: Record<Ccy, string> = {
  USD: '🇺🇸', KRW: '🇰🇷', EUR: '🇪🇺',
  JPY: '🇯🇵', GBP: '🇬🇧', AUD: '🇦🇺', CAD: '🇨🇦',
};

// Finnhub quote 키 매핑 (1 USD = X 통화)
const CCY_QUOTE_KEY: Partial<Record<Ccy, string>> = {
  KRW: 'KRW', EUR: 'EUR', JPY: 'JPY', GBP: 'GBP', AUD: 'AUD', CAD: 'CAD',
};

// ──────────────────────────────────────────────
// 포맷 헬퍼
// ──────────────────────────────────────────────
const fmt  = (n: number, d = 0) =>
  n.toLocaleString('ko-KR', { minimumFractionDigits: d, maximumFractionDigits: d });

const fmtUSD = (n: number) =>
  (n < 0 ? '-$' : '+$') +
  Math.abs(n).toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtKRW = (n: number) =>
  (n < 0 ? '-₩' : '+₩') + Math.abs(Math.round(n)).toLocaleString('ko-KR');

// ──────────────────────────────────────────────
// 실시간 환율 상태 배지
// ──────────────────────────────────────────────
function RateBadge({
  isLoading,
  isError,
  updatedAt,
  onRefresh,
}: {
  isLoading: boolean;
  isError: boolean;
  updatedAt?: number;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {isLoading ? (
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <RefreshCw className="w-2.5 h-2.5 animate-spin" /> 환율 로딩 중…
        </span>
      ) : isError ? (
        <span className="text-[10px] text-destructive">환율 로드 실패</span>
      ) : updatedAt ? (
        <span className="text-[10px] text-muted-foreground">
          🟢 실시간 ·{' '}
          {formatDistanceToNow(updatedAt, { addSuffix: true, locale: ko })} 갱신
        </span>
      ) : null}
      <button
        onClick={onRefresh}
        className="p-0.5 rounded hover:bg-muted/60 transition-colors"
        aria-label="환율 새로고침"
      >
        <RefreshCw className="w-2.5 h-2.5 text-muted-foreground" />
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────
// 틱 계산기
// ──────────────────────────────────────────────
function TickCalculator() {
  const { data: forex, isLoading, isError, refetch } = useForexRates();
  const [futIdx, setFutIdx] = useState<number | null>(0);
  const [tickSizeStr,  setTickSizeStr]  = useState(String(FUTURES[0].tickSize));
  const [tickValueStr, setTickValueStr] = useState(String(FUTURES[0].tickValue));
  const [marginStr,    setMarginStr]    = useState(String(FUTURES[0].margin));
  const [contracts, setContracts] = useState('1');
  const [entry, setEntry] = useState('');
  const [target, setTarget] = useState('');
  const [stop, setStop] = useState('');
  const [direction, setDirection] = useState<'long' | 'short'>('long');

  // 프리셋 선택 → 스펙 자동 입력
  const handleSelectFuture = (i: number) => {
    setFutIdx(i);
    setEntry(''); setTarget(''); setStop('');
    setTickSizeStr(String(FUTURES[i].tickSize));
    setTickValueStr(String(FUTURES[i].tickValue));
    setMarginStr(String(FUTURES[i].margin));
  };

  const cnt = Math.max(1, parseInt(contracts) || 1);

  // 스펙 파싱 (입력값 기준 — 프리셋 선택 여부와 무관하게 이 값으로 계산)
  const tickSize  = Math.max(0.0001, parseFloat(tickSizeStr)  || 0.25);
  const tickValue = Math.max(0.01,   parseFloat(tickValueStr) || 5);
  const margin    = Math.max(0,      parseFloat(marginStr)    || 0);

  // 실시간 KRW 환율 (1 USD = X KRW)
  const krwRate = useMemo(() => {
    if (forex?.rates?.KRW) return forex.rates.KRW;
    return 1320; // 로딩 전 기본값
  }, [forex]);

  const calcResult = (priceStr: string) => {
    const price = parseFloat(priceStr);
    const entryVal = parseFloat(entry);
    if (isNaN(price) || isNaN(entryVal)) return null;
    const ticks = Math.round((price - entryVal) / tickSize);
    const usd   = ticks * tickValue * cnt;
    const won   = usd * krwRate;
    return { ticks, usd, won };
  };

  const tgt = calcResult(target);
  const stp = calcResult(stop);

  // 방향 기반 손익 판단
  const longDir = direction === 'long';
  const tgtIsProfit = tgt != null && (longDir ? tgt.ticks > 0 : tgt.ticks < 0);
  const stpIsLoss   = stp != null && (longDir ? stp.ticks < 0 : stp.ticks > 0);

  // 유효한 셋업(목표=수익, 손절=손실)일 때만 R:R 표시
  const rr = tgtIsProfit && stpIsLoss
    ? Math.abs(tgt!.ticks / stp!.ticks).toFixed(2)
    : null;

  const futDef = futIdx !== null ? FUTURES[futIdx] : null;

  return (
    <div className="space-y-4">
      {/* 환율 상태 */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium">종목 선택</p>
        <RateBadge
          isLoading={isLoading} isError={isError}
          updatedAt={forex?.updatedAt}
          onRefresh={() => refetch()}
        />
      </div>

      {/* 종목 선택 */}
      <div className="flex flex-wrap gap-1.5">
        {FUTURES.map((f, i) => (
          <button
            key={f.symbol}
            onClick={() => handleSelectFuture(i)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              i === futIdx
                ? 'bg-primary text-primary-foreground shadow'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f.symbol}
          </button>
        ))}
        <button
          onClick={() => setFutIdx(null)}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
            futIdx === null
              ? 'bg-primary text-primary-foreground shadow'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          직접 입력
        </button>
      </div>

      {/* 매수/매도 방향 */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setDirection('long')}
          className={`py-2 rounded-xl text-sm font-bold transition-colors ${
            longDir
              ? 'bg-emerald-500 text-white shadow'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <img src="/icons/icon-chart-up.png" alt="" className="w-4 h-4 inline-block align-middle mr-1" /> 매수 (롱)
        </button>
        <button
          onClick={() => setDirection('short')}
          className={`py-2 rounded-xl text-sm font-bold transition-colors ${
            !longDir
              ? 'bg-red-500 text-white shadow'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <img src="/icons/icon-chart-down.png" alt="" className="w-4 h-4 inline-block align-middle mr-1" /> 매도 (숏)
        </button>
      </div>

      {/* 종목 스펙 입력 (프리셋 선택 시 자동 채워짐, 직접 수정 가능) */}
      <div className="space-y-1.5">
        {futDef && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span>{futDef.emoji}</span>
            <span className="font-semibold text-foreground/80">{futDef.name}</span>
            <span className="text-muted-foreground/50">· 아래 값 수정 가능</span>
          </p>
        )}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[11px] text-muted-foreground font-medium block mb-1">틱 크기</label>
            <input
              type="number" value={tickSizeStr}
              onChange={(e) => { setTickSizeStr(e.target.value); setFutIdx(null); }}
              className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="0.25"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground font-medium block mb-1">틱 가치 ($)</label>
            <input
              type="number" value={tickValueStr}
              onChange={(e) => { setTickValueStr(e.target.value); setFutIdx(null); }}
              className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="5"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground font-medium block mb-1">증거금 ($)</label>
            <input
              type="number" value={marginStr}
              onChange={(e) => { setMarginStr(e.target.value); setFutIdx(null); }}
              className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* 계약수 + 실시간 환율 표시 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] text-muted-foreground font-medium block mb-1">계약수 / 로트</label>
          <input
            type="number" min="1" value={contracts}
            onChange={(e) => setContracts(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground font-medium block mb-1">
            달러/원 환율
            {!isLoading && !isError && forex && (
              <span className="ml-1 text-emerald-500">● 실시간</span>
            )}
          </label>
          <div className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border/50 text-sm font-bold tabular-nums">
            {isLoading ? (
              <span className="text-muted-foreground">로딩 중…</span>
            ) : (
              <>
                ₩ {fmt(krwRate, 1)}
                <span className="text-[10px] text-muted-foreground font-normal ml-1">/USD</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 가격 입력 */}
      <div className="space-y-2">
        <div>
          <label className="text-[11px] text-muted-foreground font-medium block mb-1">진입가</label>
          <input
            type="number" step={tickSize} value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="진입 가격 입력"
            className="w-full px-3 py-2.5 rounded-xl bg-muted/60 border border-border/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* 목표가 */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-[11px] text-muted-foreground font-medium block mb-1"><img src="/icons/icon-target.png" alt="" className="w-3.5 h-3.5 inline-block align-middle mr-0.5" /> 목표가</label>
            <input
              type="number" step={tickSize} value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-muted/60 border border-border/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
          {tgt && (
            <div className={`mt-5 px-3 py-2 rounded-xl text-right min-w-[130px] ${
              tgtIsProfit
                ? 'bg-emerald-500/10 border border-emerald-500/30'
                : 'bg-red-500/10 border border-red-500/30'
            }`}>
              <p className={`text-xs font-bold ${tgtIsProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                {tgt.ticks > 0 ? '+' : ''}{tgt.ticks}틱
              </p>
              <p className={`text-xs font-semibold ${tgtIsProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                {fmtUSD(tgt.usd)}
              </p>
              <p className={`text-[10px] ${tgtIsProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                {fmtKRW(tgt.won)}
              </p>
            </div>
          )}
        </div>

        {/* 손절가 */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-[11px] text-muted-foreground font-medium block mb-1">🛑 손절가</label>
            <input
              type="number" step={tickSize} value={stop}
              onChange={(e) => setStop(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-muted/60 border border-border/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500/40"
            />
          </div>
          {stp && (
            <div className={`mt-5 px-3 py-2 rounded-xl text-right min-w-[130px] ${
              stpIsLoss
                ? 'bg-red-500/10 border border-red-500/30'
                : 'bg-emerald-500/10 border border-emerald-500/30'
            }`}>
              <p className={`text-xs font-bold ${stpIsLoss ? 'text-red-500' : 'text-emerald-500'}`}>
                {stp.ticks > 0 ? '+' : ''}{stp.ticks}틱
              </p>
              <p className={`text-xs font-semibold ${stpIsLoss ? 'text-red-500' : 'text-emerald-500'}`}>
                {fmtUSD(stp.usd)}
              </p>
              <p className={`text-[10px] ${stpIsLoss ? 'text-red-400' : 'text-emerald-400'}`}>
                {fmtKRW(stp.won)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* R:R */}
      {rr && tgt && stp && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-primary/10 border border-primary/30">
          <div className="text-sm font-bold">Risk : Reward</div>
          <div className="text-right">
            <span className="text-xl font-extrabold text-primary">1 : {rr}</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              손실 ${Math.abs(stp.usd / cnt).toFixed(0)} → 수익 ${Math.abs(tgt.usd / cnt).toFixed(0)} (계약당)
            </p>
            {margin > 0 && (
              <p className="text-[10px] text-muted-foreground">
                손절시 증거금 대비&nbsp;
                <span className="text-red-400 font-semibold">
                  {(Math.abs(stp.usd) / (margin * cnt) * 100).toFixed(1)}% 손실
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* 틱 레퍼런스 */}
      <details className="group">
        <summary className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors list-none">
          <Info className="w-3 h-3" />
          전체 종목 틱 정보
        </summary>
        <div className="mt-2 rounded-xl border border-border/40 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground">종목</th>
                <th className="px-3 py-1.5 text-right font-semibold text-muted-foreground">틱</th>
                <th className="px-3 py-1.5 text-right font-semibold text-muted-foreground">틱가치</th>
                <th className="px-3 py-1.5 text-right font-semibold text-muted-foreground">증거금</th>
              </tr>
            </thead>
            <tbody>
              {FUTURES.map((f, i) => (
                <tr key={f.symbol} className={`border-t border-border/30 ${i === futIdx ? 'bg-primary/10' : ''}`}>
                  <td className="px-3 py-1.5 font-semibold">
                    {f.symbol} <span className="text-muted-foreground font-normal hidden sm:inline">{f.name}</span>
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono">{f.tickSize}</td>
                  <td className="px-3 py-1.5 text-right font-mono">${f.tickValue}</td>
                  <td className="px-3 py-1.5 text-right font-mono">${fmt(f.margin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

// ──────────────────────────────────────────────
// 환율 계산기
// ──────────────────────────────────────────────
function FxCalculator() {
  const { data: forex, isLoading, isError, refetch } = useForexRates();
  const [amount, setAmount] = useState('1000');
  const [from, setFrom]     = useState<Ccy>('USD');
  const [to, setTo]         = useState<Ccy>('KRW');

  // 1 USD = X 해당통화 → 역산: 1 해당통화 = Y USD
  const usdPer = useMemo<Record<Ccy, number>>(() => {
    const fallback: Record<Ccy, number> = {
      USD: 1, KRW: 1 / 1320, EUR: 1 / 0.923,
      JPY: 1 / 149, GBP: 1 / 0.789,
      AUD: 1 / 1.54, CAD: 1 / 1.36,
    };
    if (!forex?.rates) return fallback;
    const r = forex.rates;
    return {
      USD: 1,
      KRW: r.KRW ? 1 / r.KRW : fallback.KRW,
      EUR: r.EUR ? 1 / r.EUR : fallback.EUR,
      JPY: r.JPY ? 1 / r.JPY : fallback.JPY,
      GBP: r.GBP ? 1 / r.GBP : fallback.GBP,
      AUD: r.AUD ? 1 / r.AUD : fallback.AUD,
      CAD: r.CAD ? 1 / r.CAD : fallback.CAD,
    };
  }, [forex]);

  const result = useMemo(() => {
    const n = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(n)) return null;
    const inUSD = n * usdPer[from];
    return inUSD / usdPer[to];
  }, [amount, from, to, usdPer]);

  const rateLabel = useMemo(() => {
    const r = usdPer[from] / usdPer[to];
    const decimals = (to === 'KRW' || to === 'JPY') ? 2 : 4;
    return `1 ${from} = ${r.toLocaleString('ko-KR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} ${to}`;
  }, [from, to, usdPer]);

  // 1 USD 기준 각 통화 값 (표시용)
  const usdToOther = useMemo<Partial<Record<Ccy, string>>>(() => {
    const r = forex?.rates;
    if (!r) return {};
    return {
      KRW: r.KRW?.toLocaleString('ko-KR', { maximumFractionDigits: 1 }),
      EUR: r.EUR?.toLocaleString('ko-KR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      JPY: r.JPY?.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      GBP: r.GBP?.toLocaleString('ko-KR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      AUD: r.AUD?.toLocaleString('ko-KR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      CAD: r.CAD?.toLocaleString('ko-KR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
    };
  }, [forex]);

  const swap = () => { setFrom(to); setTo(from); };

  return (
    <div className="space-y-4">
      {/* 상태 배지 */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium">실시간 환율 변환</p>
        <RateBadge
          isLoading={isLoading} isError={isError}
          updatedAt={forex?.updatedAt}
          onRefresh={() => refetch()}
        />
      </div>

      {/* 금액 입력 */}
      <div>
        <label className="text-[11px] text-muted-foreground font-medium block mb-1">금액</label>
        <input
          type="text" value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-muted/60 border border-border/50 text-base font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="1,000"
        />
      </div>

      {/* 통화 선택 */}
      <div className="flex items-center gap-2">
        {/* From */}
        <div className="flex-1">
          <label className="text-[11px] text-muted-foreground font-medium block mb-1">변환 전</label>
          <div className="grid grid-cols-4 gap-1">
            {CCY_LIST.map((c) => (
              <button
                key={c}
                onClick={() => setFrom(c)}
                className={`flex flex-col items-center py-2 rounded-xl text-xs font-semibold transition-colors ${
                  from === c
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                }`}
              >
                <span className="text-base leading-none mb-0.5">{CCY_FLAGS[c]}</span>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Swap */}
        <button
          onClick={swap}
          className="mt-5 p-2 rounded-full bg-muted hover:bg-muted/70 transition-colors shrink-0"
          aria-label="통화 교환"
        >
          <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* To */}
        <div className="flex-1">
          <label className="text-[11px] text-muted-foreground font-medium block mb-1">변환 후</label>
          <div className="grid grid-cols-4 gap-1">
            {CCY_LIST.map((c) => (
              <button
                key={c}
                onClick={() => setTo(c)}
                className={`flex flex-col items-center py-2 rounded-xl text-xs font-semibold transition-colors ${
                  to === c
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                }`}
              >
                <span className="text-base leading-none mb-0.5">{CCY_FLAGS[c]}</span>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 결과 */}
      {result !== null ? (
        <div className="px-5 py-4 rounded-2xl bg-primary/10 border border-primary/30 text-center space-y-1">
          <p className="text-[11px] text-muted-foreground">
            {parseFloat(amount.replace(/,/g, '')).toLocaleString('ko-KR')} {from}
          </p>
          <p className="text-3xl font-extrabold tracking-tight">
            {CCY_FLAGS[to]}&nbsp;
            {result.toLocaleString('ko-KR', {
              minimumFractionDigits: (to === 'KRW' || to === 'JPY') ? 0 : 2,
              maximumFractionDigits: (to === 'KRW' || to === 'JPY') ? 0 : 4,
            })}
            <span className="text-lg font-bold text-muted-foreground ml-1">{to}</span>
          </p>
          <p className="text-[11px] text-muted-foreground">{rateLabel}</p>
          {!isLoading && !isError && forex && (
            <p className="text-[10px] text-emerald-500">● ExchangeRate Open API 실시간</p>
          )}
        </div>
      ) : (
        <div className="px-5 py-8 rounded-2xl bg-muted/30 border border-border/30 text-center">
          <p className="text-sm text-muted-foreground">금액을 입력하세요</p>
        </div>
      )}

      {/* 실시간 환율 참고 테이블 */}
      <div className="rounded-xl border border-border/40 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-muted/40">
          <p className="text-[11px] font-semibold text-muted-foreground">실시간 환율 (USD 기준)</p>
          {isLoading && <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />}
        </div>
        <div className="divide-y divide-border/30">
          {(Object.entries(CCY_QUOTE_KEY) as [Ccy, string][]).map(([ccy]) => {
            const displayVal = usdToOther[ccy];
            const isLive = !!displayVal;
            return (
              <div key={ccy} className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-medium">{CCY_FLAGS[ccy]} {ccy}</span>
                <div className="text-right">
                  <span className="text-xs font-mono">
                    {isLoading ? '—' : isLive ? `${displayVal} ${ccy}` : '—'}
                  </span>
                  {isLive && (
                    <span className="ml-1 text-[9px] text-emerald-500">●</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="px-3 py-1.5 text-[10px] text-muted-foreground bg-muted/20">
          ExchangeRate Open API · 30분 간격 갱신
        </p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// 메인 탭
// ──────────────────────────────────────────────
export function CalculatorTab() {
  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-5">
        <h2 className="text-lg font-bold">🧮 트레이더 계산기</h2>
        <p className="text-xs text-muted-foreground mt-0.5">실시간 환율 기반 · 틱 손익 & 환율 변환</p>
      </div>

      <Tabs defaultValue="tick">
        <TabsList className="w-full h-10 rounded-xl bg-muted p-1 mb-5 grid grid-cols-2">
          <TabsTrigger value="tick" className="text-sm rounded-lg font-semibold flex items-center gap-1.5"><img src="/icons/icon-chart-up.png" alt="" className="w-4 h-4" /> 틱 계산기</TabsTrigger>
          <TabsTrigger value="fx"   className="text-sm rounded-lg font-semibold">💱 환율 계산기</TabsTrigger>
        </TabsList>

        <div className="glass-card rounded-2xl p-5">
          <TabsContent value="tick" className="mt-0"><TickCalculator /></TabsContent>
          <TabsContent value="fx"   className="mt-0"><FxCalculator /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
