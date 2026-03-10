export interface TechnicalResult {
  name: string;
  value: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  description: string;
}

function sma(data: number[], period: number): number | null {
  if (data.length < period) return null;
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function ema(data: number[], period: number): number | null {
  if (data.length < period) return null;
  const k = 2 / (period + 1);
  let em = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < data.length; i++) {
    em = data[i] * k + em * (1 - k);
  }
  return em;
}

function computeRSI(closes: number[], period = 14): TechnicalResult | null {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);
  const rounded = Math.round(rsi * 10) / 10;

  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let description = '중립 구간';
  if (rsi > 70) { signal = 'bearish'; description = '과매수 구간 – 조정 가능성'; }
  else if (rsi > 60) { signal = 'bullish'; description = '강세 모멘텀 유지'; }
  else if (rsi < 30) { signal = 'bullish'; description = '과매도 구간 – 반등 가능성'; }
  else if (rsi < 40) { signal = 'bearish'; description = '약세 모멘텀 유지'; }

  return { name: 'RSI (14)', value: rounded.toFixed(1), signal, description };
}

function computeMACD(closes: number[]): TechnicalResult | null {
  if (closes.length < 26) return null;
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  if (ema12 === null || ema26 === null) return null;
  const macdLine = ema12 - ema26;

  // Compute signal line (9-period EMA of MACD values)
  const macdValues: number[] = [];
  const k12 = 2 / 13, k26 = 2 / 27;
  let e12 = closes.slice(0, 12).reduce((a, b) => a + b, 0) / 12;
  let e26 = closes.slice(0, 26).reduce((a, b) => a + b, 0) / 26;
  for (let i = 12; i < closes.length; i++) {
    e12 = closes[i] * k12 + e12 * (1 - k12);
    if (i >= 26) {
      e26 = closes[i] * k26 + e26 * (1 - k26);
      macdValues.push(e12 - e26);
    }
  }

  const signalLine = macdValues.length >= 9 ? ema(macdValues, 9) : null;
  const histogram = signalLine !== null ? macdLine - signalLine : 0;
  const rounded = Math.round(macdLine * 1000) / 1000;

  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let description = 'MACD 중립';
  if (macdLine > 0 && histogram > 0) { signal = 'bullish'; description = '상승 모멘텀 강화'; }
  else if (macdLine > 0 && histogram < 0) { signal = 'neutral'; description = '상승 모멘텀 약화'; }
  else if (macdLine < 0 && histogram < 0) { signal = 'bearish'; description = '하락 모멘텀 강화'; }
  else if (macdLine < 0 && histogram > 0) { signal = 'neutral'; description = '하락 모멘텀 약화'; }

  return { name: 'MACD', value: rounded.toFixed(3), signal, description };
}

function computeMA(closes: number[], price: number, period: number, label: string): TechnicalResult | null {
  const avg = sma(closes, period);
  if (avg === null) return null;
  const diff = ((price - avg) / avg) * 100;
  const signal: 'bullish' | 'bearish' | 'neutral' = diff > 1 ? 'bullish' : diff < -1 ? 'bearish' : 'neutral';
  const description = diff > 1
    ? `현재가가 ${label} 위 – 상승 추세`
    : diff < -1
      ? `현재가가 ${label} 아래 – 하락 추세`
      : `현재가가 ${label} 근접 – 방향 탐색`;
  return { name: label, value: Math.round(avg * 100) / 100 + '', signal, description };
}

function computeStochastic(closes: number[], highs: number[], lows: number[], period = 14): TechnicalResult | null {
  if (closes.length < period || highs.length < period || lows.length < period) return null;
  const recentCloses = closes.slice(-period);
  const recentHighs = highs.slice(-period);
  const recentLows = lows.slice(-period);
  const high = Math.max(...recentHighs);
  const low = Math.min(...recentLows);
  if (high === low) return null;
  const k = ((closes[closes.length - 1] - low) / (high - low)) * 100;
  const rounded = Math.round(k * 10) / 10;

  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let description = '중립 구간';
  if (k > 80) { signal = 'bearish'; description = '과매수 구간 – 하락 전환 주의'; }
  else if (k < 20) { signal = 'bullish'; description = '과매도 구간 – 반등 기대'; }

  return { name: 'Stochastic %K', value: rounded.toFixed(1), signal, description };
}

function computeBollingerPosition(closes: number[], period = 20): TechnicalResult | null {
  if (closes.length < period) return null;
  const avg = sma(closes, period)!;
  const slice = closes.slice(-period);
  const stddev = Math.sqrt(slice.reduce((sum, c) => sum + (c - avg) ** 2, 0) / period);
  const upper = avg + 2 * stddev;
  const lower = avg - 2 * stddev;
  const price = closes[closes.length - 1];
  const position = ((price - lower) / (upper - lower)) * 100;
  const rounded = Math.round(position * 10) / 10;

  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let description = '밴드 중앙 근처';
  if (position > 90) { signal = 'bearish'; description = '상단 밴드 접근 – 과열 주의'; }
  else if (position > 70) { signal = 'neutral'; description = '상단 밴드 근접'; }
  else if (position < 10) { signal = 'bullish'; description = '하단 밴드 접근 – 반등 가능'; }
  else if (position < 30) { signal = 'neutral'; description = '하단 밴드 근접'; }

  return { name: '볼린저 밴드', value: `${rounded.toFixed(1)}%`, signal, description };
}

export interface ChartPointForTechnicals {
  close: number;
  high: number;
  low: number;
}

export function computeTechnicals(points: ChartPointForTechnicals[], currentPrice: number): TechnicalResult[] {
  const closes = points.map(p => p.close);
  const highs = points.map(p => p.high);
  const lows = points.map(p => p.low);
  const results: TechnicalResult[] = [];

  const rsi = computeRSI(closes);
  if (rsi) results.push(rsi);

  const macd = computeMACD(closes);
  if (macd) results.push(macd);

  const stoch = computeStochastic(closes, highs, lows);
  if (stoch) results.push(stoch);

  const bb = computeBollingerPosition(closes);
  if (bb) results.push(bb);

  const ma20 = computeMA(closes, currentPrice, 20, 'SMA 20');
  if (ma20) results.push(ma20);

  const ma50 = computeMA(closes, currentPrice, 50, 'SMA 50');
  if (ma50) results.push(ma50);

  const ma200 = computeMA(closes, currentPrice, 200, 'SMA 200');
  if (ma200) results.push(ma200);

  return results;
}
