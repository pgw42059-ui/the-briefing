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
// 종목 선택 버튼 그리드 (공통)
// ──────────────────────────────────────────────
function FutureSelector({
  selectedIdx,
  onSelect,
  showCustom = false,
}: {
  selectedIdx: number | null;
  onSelect: (i: number | null) => void;
  showCustom?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {FUTURES.map((f, i) => (
        <button
          key={f.symbol}
          onClick={() => onSelect(i)}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
            i === selectedIdx
              ? 'bg-primary text-primary-foreground shadow'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {f.symbol}
        </button>
      ))}
      {showCustom && (
        <button
          onClick={() => onSelect(null)}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
            selectedIdx === null
              ? 'bg-primary text-primary-foreground shadow'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          직접 입력
        </button>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// 틱 계산기
// ──────────────────────────────────────────────
function TickCalculator() {
  const { data: forex, isLoading, isError, refetch } = useForexRates();
  const [futIdx, setFutIdx] = useState<number | null>(0);
  const [tickSizeStr,    setTickSizeStr]    = useState(String(FUTURES[0].tickSize));
  const [tickValueStr,   setTickValueStr]   = useState(String(FUTURES[0].tickValue));
  const [marginStr,      setMarginStr]      = useState(String(FUTURES[0].margin));
  const [commissionStr,  setCommissionStr]  = useState('2.5'); // USD per contract per side
  const [contracts, setContracts] = useState('1');
  const [entry, setEntry] = useState('');
  const [target, setTarget] = useState('');
  const [stop, setStop] = useState('');
  const [direction, setDirection] = useState<'long' | 'short'>('long');

  // 프리셋 선택 → 스펙 자동 입력
  const handleSelectFuture = (i: number | null) => {
    setFutIdx(i);
    if (i === null) return;
    setEntry(''); setTarget(''); setStop('');
    setTickSizeStr(String(FUTURES[i].tickSize));
    setTickValueStr(String(FUTURES[i].tickValue));
    setMarginStr(String(FUTURES[i].margin));
  };

  const cnt = Math.max(1, parseInt(contracts) || 1);

  // 스펙 파싱
  const tickSize   = Math.max(0.0001, parseFloat(tickSizeStr)   || 0.25);
  const tickValue  = Math.max(0.01,   parseFloat(tickValueStr)  || 5);
  const margin     = Math.max(0,      parseFloat(marginStr)     || 0);
  const commission = Math.max(0,      parseFloat(commissionStr) || 0); // per contract per side

  // 실시간 KRW 환율 (1 USD = X KRW)
  const krwRate = useMemo(() => {
    if (forex?.rates?.KRW) return forex.rates.KRW;
    return 1320;
  }, [forex]);

  const calcResult = (priceStr: string) => {
    const price = parseFloat(priceStr);
    const entryVal = parseFloat(entry);
    if (isNaN(price) || isNaN(entryVal)) return null;
    const ticks = Math.round((price - entryVal) / tickSize);
    const grossUsd = ticks * tickValue * cnt;
    // 수수료: 진입 + 청산 2회 (round-trip)
    const commTotal = commission * cnt * 2;
    const netUsd    = grossUsd - (grossUsd >= 0 ? commTotal : -commTotal);
    const netWon    = netUsd * krwRate;
    return { ticks, grossUsd, netUsd, netWon, commTotal };
  };

  const tgt = calcResult(target);
  const stp = calcResult(stop);

  const longDir = direction === 'long';
  const tgtIsProfit = tgt != null && (longDir ? tgt.ticks > 0 : tgt.ticks < 0);
  const stpIsLoss   = stp != null && (longDir ? stp.ticks < 0 : stp.ticks > 0);

  const rr = tgtIsProfit && stpIsLoss
    ? Math.abs(tgt!.ticks / stp!.ticks).toFixed(2)
    : null;

  const futDef = futIdx !== null ? FUTURES[futIdx] : null;
  const hasCommission = commission > 0;

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
      <FutureSelector selectedIdx={futIdx} onSelect={handleSelectFuture} showCustom />

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

      {/* 종목 스펙 */}
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

      {/* 계약수 + 수수료 + 환율 */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[11px] text-muted-foreground font-medium block mb-1">계약수 / 로트</label>
          <input
            type="number" min="1" value={contracts}
            onChange={(e) => setContracts(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground font-medium block mb-1">수수료 ($/계약)</label>
          <input
            type="number" min="0" step="0.5" value={commissionStr}
            onChange={(e) => setCommissionStr(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="2.5"
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
              <span className="text-muted-foreground text-xs">로딩…</span>
            ) : (
              <>
                ₩{fmt(krwRate, 0)}
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
            <label className="text-[11px] text-muted-foreground font-medium block mb-1">
              <img src="/icons/icon-target.png" alt="" className="w-3.5 h-3.5 inline-block align-middle mr-0.5" /> 목표가
            </label>
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
              {hasCommission ? (
                <>
                  <p className={`text-[10px] line-through text-muted-foreground`}>
                    {fmtUSD(tgt.grossUsd)}
                  </p>
                  <p className={`text-xs font-semibold ${tgtIsProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                    {fmtUSD(tgt.netUsd)} <span className="text-[9px] font-normal opacity-70">수수료 후</span>
                  </p>
                </>
              ) : (
                <p className={`text-xs font-semibold ${tgtIsProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                  {fmtUSD(tgt.grossUsd)}
                </p>
              )}
              <p className={`text-[10px] ${tgtIsProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                {fmtKRW(tgt.netWon)}
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
              {hasCommission ? (
                <>
                  <p className="text-[10px] line-through text-muted-foreground">
                    {fmtUSD(stp.grossUsd)}
                  </p>
                  <p className={`text-xs font-semibold ${stpIsLoss ? 'text-red-500' : 'text-emerald-500'}`}>
                    {fmtUSD(stp.netUsd)} <span className="text-[9px] font-normal opacity-70">수수료 후</span>
                  </p>
                </>
              ) : (
                <p className={`text-xs font-semibold ${stpIsLoss ? 'text-red-500' : 'text-emerald-500'}`}>
                  {fmtUSD(stp.grossUsd)}
                </p>
              )}
              <p className={`text-[10px] ${stpIsLoss ? 'text-red-400' : 'text-emerald-400'}`}>
                {fmtKRW(stp.netWon)}
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
              손실 ${Math.abs(stp.netUsd / cnt).toFixed(0)} → 수익 ${Math.abs(tgt.netUsd / cnt).toFixed(0)} (계약당{hasCommission ? ', 수수료 후' : ''})
            </p>
            {margin > 0 && (
              <p className="text-[10px] text-muted-foreground">
                손절시 증거금 대비&nbsp;
                <span className="text-red-400 font-semibold">
                  {(Math.abs(stp.netUsd) / (margin * cnt) * 100).toFixed(1)}% 손실
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* 수수료 안내 */}
      {hasCommission && (
        <p className="text-[10px] text-muted-foreground text-center">
          수수료 ${commission.toFixed(2)}/계약/편도 · 왕복 ${(commission * 2).toFixed(2)}/계약
        </p>
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
// 포지션 사이징 계산기
// ──────────────────────────────────────────────
function PositionSizingCalculator() {
  const { data: forex, isLoading, isError, refetch } = useForexRates();
  const [futIdx, setFutIdx] = useState<number>(0);
  const [accountStr,    setAccountStr]    = useState('50000');
  const [riskPctStr,    setRiskPctStr]    = useState('1');
  const [stopTicksStr,  setStopTicksStr]  = useState('20');
  const [commissionStr, setCommissionStr] = useState('2.5'); // per contract per side

  const krwRate = useMemo(() => {
    if (forex?.rates?.KRW) return forex.rates.KRW;
    return 1320;
  }, [forex]);

  const future    = FUTURES[futIdx];
  const account   = Math.max(0, parseFloat(accountStr)   || 0);
  const riskPct   = Math.max(0, parseFloat(riskPctStr)   || 0);
  const stopTicks = Math.max(1, parseInt(stopTicksStr)    || 1);
  const commission = Math.max(0, parseFloat(commissionStr) || 0);

  const result = useMemo(() => {
    if (!account || !riskPct || !stopTicks) return null;

    const maxRiskUsd     = account * (riskPct / 100);
    // 1계약 손실 = 손절틱 × 틱가치 + 왕복 수수료
    const lossPerContract = stopTicks * future.tickValue + commission * 2;
    if (lossPerContract <= 0) return null;

    const rawContracts   = maxRiskUsd / lossPerContract;
    const contracts      = Math.max(0, Math.floor(rawContracts));
    const actualRiskUsd  = contracts * lossPerContract;
    const actualRiskPct  = account > 0 ? (actualRiskUsd / account) * 100 : 0;
    const marginRequired = contracts * future.margin;
    const marginPct      = account > 0 ? (marginRequired / account) * 100 : 0;
    const stopLossUsd    = stopTicks * future.tickValue * contracts;

    return {
      contracts,
      rawContracts,
      maxRiskUsd,
      actualRiskUsd,
      actualRiskPct,
      marginRequired,
      marginPct,
      stopLossUsd,
      lossPerContract,
      marginOk: marginRequired <= account,
    };
  }, [account, riskPct, stopTicks, commission, future]);

  return (
    <div className="space-y-4">
      {/* 상태 배지 */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium">포지션 사이징</p>
        <RateBadge
          isLoading={isLoading} isError={isError}
          updatedAt={forex?.updatedAt}
          onRefresh={() => refetch()}
        />
      </div>

      {/* 종목 선택 */}
      <div>
        <p className="text-[11px] text-muted-foreground font-medium mb-1.5">종목 선택</p>
        <FutureSelector selectedIdx={futIdx} onSelect={(i) => { if (i !== null) setFutIdx(i); }} />
      </div>

      {/* 선택 종목 스펙 */}
      <div className="px-3 py-2 rounded-xl bg-muted/40 border border-border/30 flex items-center gap-3 flex-wrap text-xs">
        <span className="text-base">{future.emoji}</span>
        <span className="font-semibold">{future.symbol}</span>
        <span className="text-muted-foreground">{future.name}</span>
        <span className="ml-auto font-mono">틱 {future.tickSize} = ${future.tickValue}</span>
        <span className="font-mono text-muted-foreground">증거금 ${fmt(future.margin)}</span>
      </div>

      {/* 입력값 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] text-muted-foreground font-medium block mb-1">계좌 잔고 ($)</label>
          <input
            type="number" min="0" value={accountStr}
            onChange={(e) => setAccountStr(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-muted/60 border border-border/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="50000"
          />
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground font-medium block mb-1">리스크 비율 (%)</label>
          <input
            type="number" min="0.1" max="100" step="0.1" value={riskPctStr}
            onChange={(e) => setRiskPctStr(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-muted/60 border border-border/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="1"
          />
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground font-medium block mb-1">손절 틱수</label>
          <input
            type="number" min="1" value={stopTicksStr}
            onChange={(e) => setStopTicksStr(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-muted/60 border border-border/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="20"
          />
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground font-medium block mb-1">수수료 ($/계약/편도)</label>
          <input
            type="number" min="0" step="0.5" value={commissionStr}
            onChange={(e) => setCommissionStr(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-muted/60 border border-border/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="2.5"
          />
        </div>
      </div>

      {/* 결과 */}
      {!result && (
        <div className="py-8 text-center text-muted-foreground">
          <p className="text-sm">계좌 잔고와 리스크를 입력하면 결과가 표시됩니다</p>
        </div>
      )}
      {result ? (
        <div className="space-y-3">
          {/* 권장 계약수 — 메인 */}
          <div className="px-5 py-4 rounded-2xl bg-primary/10 border border-primary/30 text-center">
            <p className="text-[11px] text-muted-foreground mb-1">권장 계약수</p>
            <p className="text-5xl font-extrabold tracking-tight text-primary">
              {result.contracts}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {future.symbol} · 계좌 {riskPct}% 리스크 · 손절 {stopTicksStr}틱
            </p>
            {result.rawContracts < 1 && (
              <p className="text-[11px] text-amber-500 mt-1">
                ⚠ 계좌 대비 리스크가 너무 작아 0계약 — 손절 틱수를 줄이거나 리스크 비율을 늘리세요
              </p>
            )}
          </div>

          {/* 상세 분석 */}
          <div className="rounded-xl border border-border/40 overflow-hidden">
            <div className="px-3 py-2 bg-muted/40">
              <p className="text-[11px] font-semibold text-muted-foreground">상세 분석</p>
            </div>
            <div className="divide-y divide-border/30">
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">최대 허용 손실</span>
                <span className="font-semibold text-red-500">
                  -${fmt(result.maxRiskUsd, 2)}
                  <span className="text-xs text-muted-foreground font-normal ml-1">({riskPct}%)</span>
                </span>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">실제 리스크</span>
                <span className="font-semibold">
                  -${fmt(result.actualRiskUsd, 2)}
                  <span className="text-xs text-muted-foreground font-normal ml-1">({result.actualRiskPct.toFixed(2)}%)</span>
                </span>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">손절 손실 (수수료 전)</span>
                <span className="font-semibold">-${fmt(result.stopLossUsd, 2)}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">필요 증거금</span>
                <span className={`font-semibold ${result.marginOk ? '' : 'text-red-500'}`}>
                  ${fmt(result.marginRequired)}
                  <span className="text-xs text-muted-foreground font-normal ml-1">({result.marginPct.toFixed(1)}%)</span>
                  {!result.marginOk && <span className="ml-1 text-red-500">⚠ 부족</span>}
                </span>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">계약당 손실 (수수료 포함)</span>
                <span className="font-semibold">-${result.lossPerContract.toFixed(2)}</span>
              </div>
              {krwRate > 0 && result.contracts > 0 && (
                <div className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-muted-foreground">실제 리스크 (원화)</span>
                  <span className="font-semibold text-red-500">
                    -{Math.round(result.actualRiskUsd * krwRate).toLocaleString('ko-KR')}원
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="px-5 py-8 rounded-2xl bg-muted/30 border border-border/30 text-center">
          <p className="text-sm text-muted-foreground">계좌 잔고와 리스크 비율을 입력하세요</p>
        </div>
      )}

      {/* 계산 방법 안내 */}
      <details className="group">
        <summary className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors list-none">
          <Info className="w-3 h-3" />
          계산 방법
        </summary>
        <div className="mt-2 px-3 py-3 rounded-xl bg-muted/30 border border-border/30 text-[11px] text-muted-foreground space-y-1">
          <p>권장 계약수 = 바닥(최대손실 ÷ 계약당손실)</p>
          <p>계약당손실 = 손절틱 × 틱가치 + 수수료 × 2</p>
          <p>최대손실 = 계좌잔고 × 리스크%</p>
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
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium">실시간 환율 변환</p>
        <RateBadge
          isLoading={isLoading} isError={isError}
          updatedAt={forex?.updatedAt}
          onRefresh={() => refetch()}
        />
      </div>

      <div>
        <label className="text-[11px] text-muted-foreground font-medium block mb-1">금액</label>
        <input
          type="text" value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-muted/60 border border-border/50 text-base font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="1,000"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="text-[11px] text-muted-foreground font-medium block mb-1">변환 전</label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
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

        <button
          onClick={swap}
          className="mt-5 p-2 rounded-full bg-muted hover:bg-muted/70 transition-colors shrink-0"
          aria-label="통화 교환"
        >
          <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex-1">
          <label className="text-[11px] text-muted-foreground font-medium block mb-1">변환 후</label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
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
        <p className="text-xs text-muted-foreground mt-0.5">실시간 환율 기반 · 틱 손익 · 포지션 사이징 · 환율 변환</p>
      </div>

      <Tabs defaultValue="tick">
        <TabsList className="w-full h-10 rounded-xl bg-muted p-1 mb-5 grid grid-cols-3">
          <TabsTrigger value="tick"     className="text-xs rounded-lg font-semibold flex items-center gap-1">
            <img src="/icons/icon-chart-up.png" alt="" className="w-3.5 h-3.5" /> 틱 계산기
          </TabsTrigger>
          <TabsTrigger value="position" className="text-xs rounded-lg font-semibold">
            📐 포지션 사이징
          </TabsTrigger>
          <TabsTrigger value="fx"       className="text-xs rounded-lg font-semibold">
            💱 환율 변환
          </TabsTrigger>
        </TabsList>

        <div className="glass-card rounded-2xl p-5">
          <TabsContent value="tick"     className="mt-0"><TickCalculator /></TabsContent>
          <TabsContent value="position" className="mt-0"><PositionSizingCalculator /></TabsContent>
          <TabsContent value="fx"       className="mt-0"><FxCalculator /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
