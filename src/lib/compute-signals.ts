import type { FuturesQuote, MarketSignal, MarketCompositeScore, MarketPillar, MarketRegime } from './mock-data';
import type { TechnicalResult } from './compute-technicals';
import type { FearGreedData } from '@/hooks/use-fear-greed';

/**
 * Compute market sentiment signals from live quote data,
 * optionally enhanced with technical indicators and 52-week data.
 */

interface FactorResult {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number; // -1 to 1
}

const ASSET_NAMES_KR: Record<string, string> = {
  NQ: '나스닥',
  ES: 'S&P 500',
  YM: '다우존스',
  HSI: '항셍',
  NIY: '닛케이',
  STOXX50E: '유로스톡스',
  GC: '골드',
  SI: '은',
  CL: '오일',
  NG: '천연가스',
  HG: '구리',
  EURUSD: '유로/달러',
  USDJPY: '달러/엔',
  GBPUSD: '파운드/달러',
  AUDUSD: '호주달러/달러',
  USDCAD: '달러/캐나다',
};

function analyzePricePosition(quote: FuturesQuote): FactorResult {
  const range = quote.high - quote.low;
  if (range === 0) return { name: '가격 범위 없음', impact: 'neutral', weight: 0 };
  const position = (quote.price - quote.low) / range;
  if (position >= 0.7) return { name: '일중 고점 근접', impact: 'positive', weight: position - 0.5 };
  if (position <= 0.3) return { name: '일중 저점 근접', impact: 'negative', weight: position - 0.5 };
  return { name: '일중 중간 위치', impact: 'neutral', weight: 0 };
}

function analyzeChangeDirection(quote: FuturesQuote): FactorResult {
  const pct = quote.changePercent;
  if (pct > 1) return { name: `강한 상승 (+${pct.toFixed(2)}%)`, impact: 'positive', weight: Math.min(pct / 3, 1) };
  if (pct > 0.3) return { name: `상승세 (+${pct.toFixed(2)}%)`, impact: 'positive', weight: pct / 3 };
  if (pct < -1) return { name: `강한 하락 (${pct.toFixed(2)}%)`, impact: 'negative', weight: Math.max(pct / 3, -1) };
  if (pct < -0.3) return { name: `하락세 (${pct.toFixed(2)}%)`, impact: 'negative', weight: pct / 3 };
  return { name: `보합세 (${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%)`, impact: 'neutral', weight: 0 };
}

function analyzeMomentum(quote: FuturesQuote): FactorResult {
  const mid = (quote.high + quote.low) / 2;
  const aboveMid = quote.price >= mid;
  const positiveChange = quote.change >= 0;

  if (aboveMid && positiveChange) return { name: '상승 모멘텀 유지', impact: 'positive', weight: 0.4 };
  if (!aboveMid && !positiveChange) return { name: '하락 모멘텀 지속', impact: 'negative', weight: -0.4 };
  if (aboveMid && !positiveChange) return { name: '고점 부근 매도 압력', impact: 'negative', weight: -0.2 };
  return { name: '저점 부근 매수 유입', impact: 'positive', weight: 0.2 };
}

function analyzeVolatility(quote: FuturesQuote): FactorResult {
  const range = quote.high - quote.low;
  const volatilityPct = quote.price > 0 ? (range / quote.price) * 100 : 0;

  if (volatilityPct > 2) return { name: '높은 변동성', impact: 'negative', weight: -0.3 };
  if (volatilityPct > 1) return { name: '보통 변동성', impact: 'neutral', weight: 0 };
  return { name: '낮은 변동성', impact: 'positive', weight: 0.2 };
}

function analyze52WeekPosition(quote: FuturesQuote): FactorResult | null {
  if (quote.week52High == null || quote.week52Low == null || quote.week52High <= quote.week52Low) return null;
  const range = quote.week52High - quote.week52Low;
  const position = (quote.price - quote.week52Low) / range; // 0~1

  if (position >= 0.9) return { name: '52주 신고가 근접', impact: 'positive', weight: 0.5 };
  if (position >= 0.7) return { name: '52주 고점권', impact: 'positive', weight: 0.3 };
  if (position <= 0.1) return { name: '52주 신저가 근접', impact: 'negative', weight: -0.5 };
  if (position <= 0.3) return { name: '52주 저점권', impact: 'negative', weight: -0.3 };
  return { name: '52주 중간 구간', impact: 'neutral', weight: 0 };
}

function analyzeTechnicals(technicals: TechnicalResult[]): FactorResult[] {
  if (!technicals.length) return [];
  const bullish = technicals.filter(t => t.signal === 'bullish').length;
  const bearish = technicals.filter(t => t.signal === 'bearish').length;
  const total = technicals.length;
  
  if (total === 0) return [];
  
  const ratio = (bullish - bearish) / total;
  const factors: FactorResult[] = [];

  if (ratio > 0.3) {
    factors.push({ name: `보조지표 다수 강세 (${bullish}/${total})`, impact: 'positive', weight: ratio * 0.6 });
  } else if (ratio < -0.3) {
    factors.push({ name: `보조지표 다수 약세 (${bearish}/${total})`, impact: 'negative', weight: ratio * 0.6 });
  } else {
    factors.push({ name: `보조지표 혼조 (강세${bullish}/약세${bearish})`, impact: 'neutral', weight: 0 });
  }

  return factors;
}

export function computeSignal(
  quote: FuturesQuote,
  technicals?: TechnicalResult[]
): MarketSignal {
  const factors: FactorResult[] = [
    analyzePricePosition(quote),
    analyzeChangeDirection(quote),
    analyzeMomentum(quote),
    analyzeVolatility(quote),
  ];

  const w52 = analyze52WeekPosition(quote);
  if (w52) factors.push(w52);

  if (technicals?.length) {
    factors.push(...analyzeTechnicals(technicals));
  }

  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const score = Math.round(Math.max(-100, Math.min(100, totalWeight * 60)));

  const sentiment: MarketSignal['sentiment'] =
    score > 15 ? 'bullish' : score < -15 ? 'bearish' : 'neutral';

  return {
    symbol: quote.symbol,
    nameKr: ASSET_NAMES_KR[quote.symbol] || quote.symbol,
    sentiment,
    score,
    factors: factors.map(({ name, impact }) => ({ name, impact })),
  };
}

export function computeAllSignals(quotes: FuturesQuote[]): MarketSignal[] {
  return quotes.map(q => computeSignal(q));
}

// ── Pillar helpers ─────────────────────────────────────────────

const INDEX_SYMBOLS    = ['NQ', 'ES', 'YM', 'HSI', 'NIY', 'STOXX50E'];
const COMMODITY_SYMBOLS = ['GC', 'SI', 'CL', 'NG', 'HG'];
const FX_SYMBOLS       = ['EURUSD', 'USDJPY', 'GBPUSD', 'AUDUSD', 'USDCAD'];

function avgScore(signals: MarketSignal[], symbols: string[]): number {
  const filtered = signals.filter(s => symbols.includes(s.symbol));
  if (!filtered.length) return 0;
  return Math.round(filtered.reduce((sum, s) => sum + s.score, 0) / filtered.length);
}

function scoreSentiment(score: number): MarketSignal['sentiment'] {
  return score > 15 ? 'bullish' : score < -15 ? 'bearish' : 'neutral';
}

// ── Cross-asset regime detection ───────────────────────────────

function detectRegime(quotes: FuturesQuote[]): {
  regime: MarketRegime;
  regimeLabel: string;
  factors: MarketCompositeScore['crossAssetFactors'];
} {
  const get = (sym: string) => quotes.find(q => q.symbol === sym);

  const nq  = get('NQ');
  const es  = get('ES');
  const gc  = get('GC');   // gold
  const hg  = get('HG');   // copper
  const cl  = get('CL');   // oil
  const jpy = get('USDJPY'); // yen (↑ = risk-off)

  const equityUp    = ((nq?.changePercent ?? 0) + (es?.changePercent ?? 0)) / 2 > 0.2;
  const equityDown  = ((nq?.changePercent ?? 0) + (es?.changePercent ?? 0)) / 2 < -0.2;
  const goldUp      = (gc?.changePercent ?? 0) > 0.3;
  const copperUp    = (hg?.changePercent ?? 0) > 0.3;
  const oilUp       = (cl?.changePercent ?? 0) > 0.5;
  const yenUp       = (jpy?.changePercent ?? 0) < -0.2; // JPY appreciates when USDJPY falls

  const factors: MarketCompositeScore['crossAssetFactors'] = [];

  if (equityUp)   factors.push({ name: '주요 지수 동반 상승', impact: 'positive' });
  if (equityDown) factors.push({ name: '주요 지수 동반 하락', impact: 'negative' });
  if (goldUp)     factors.push({ name: '골드 강세 (안전자산 선호)', impact: equityDown ? 'negative' : 'neutral' });
  if (copperUp)   factors.push({ name: '구리 강세 (경기 확장 신호)', impact: 'positive' });
  if (oilUp && !equityUp) factors.push({ name: '유가 상승 + 주식 약세 (스태그플레이션 우려)', impact: 'negative' });
  if (yenUp)      factors.push({ name: '엔화 강세 (리스크 회피)', impact: 'negative' });

  // Regime classification
  let regime: MarketRegime;
  let regimeLabel: string;

  if (equityUp && copperUp && !goldUp) {
    regime = 'risk-on';
    regimeLabel = '리스크온 (Risk-On) 🟢';
  } else if (equityDown && goldUp && yenUp) {
    regime = 'risk-off';
    regimeLabel = '리스크오프 (Risk-Off) 🔴';
  } else if (equityDown && oilUp) {
    regime = 'stagflation';
    regimeLabel = '스태그플레이션 우려 ⚠️';
  } else {
    regime = 'mixed';
    regimeLabel = '혼조세 (Mixed) ⚪';
  }

  return { regime, regimeLabel, factors };
}

// ── Main composite score ───────────────────────────────────────

export function computeCompositeScore(
  quotes: FuturesQuote[],
  fearGreed?: FearGreedData | null,
): MarketCompositeScore {
  const signals = computeAllSignals(quotes);

  const equityScore    = avgScore(signals, INDEX_SYMBOLS);
  const commodityScore = avgScore(signals, COMMODITY_SYMBOLS);
  const fxScore        = avgScore(signals, FX_SYMBOLS);

  // Fear/greed: normalize 0-100 → -100 to +100
  const fgNorm = fearGreed != null ? (fearGreed.score - 50) * 2 : null;

  // Weighted composite
  const weightedBase =
    equityScore    * 0.45 +
    commodityScore * 0.30 +
    fxScore        * 0.25;

  const composite = fgNorm != null
    ? Math.round(weightedBase * 0.85 + fgNorm * 0.15)
    : Math.round(weightedBase);

  const score = Math.max(-100, Math.min(100, composite));

  const pillars: MarketPillar[] = [
    { label: '지수', score: equityScore,    sentiment: scoreSentiment(equityScore) },
    { label: '원자재', score: commodityScore, sentiment: scoreSentiment(commodityScore) },
    { label: 'FX',  score: fxScore,         sentiment: scoreSentiment(fxScore) },
  ];

  if (fgNorm != null) {
    pillars.push({ label: '공포/탐욕', score: Math.round(fgNorm), sentiment: scoreSentiment(Math.round(fgNorm)) });
  }

  const { regime, regimeLabel, factors } = detectRegime(quotes);

  return {
    score,
    sentiment: scoreSentiment(score),
    regime,
    regimeLabel,
    pillars,
    crossAssetFactors: factors,
    fearGreedScore: fearGreed?.score,
    fearGreedLabel: fearGreed?.rating,
  };
}
