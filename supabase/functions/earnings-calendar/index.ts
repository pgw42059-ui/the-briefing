import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── 종목 설정 ──────────────────────────────────────────────────────────────
const US_TICKERS = new Set([
  'AAPL','MSFT','GOOGL','AMZN','META','NVDA','TSLA','NFLX','AMD','INTC',
  'ORCL','CRM','ADBE','QCOM','AVGO','IBM','TXN','MU',
  'JPM','BAC','GS','MS','WFC','C','BLK','V','MA',
  'JNJ','PFE','UNH','ABBV','MRK','AMGN','GILD',
  'WMT','KO','PG','MCD','SBUX','NKE','DIS','HD',
  'XOM','CVX','BA','CAT','GE',
  'FDX','ACN','COST','DELL','HPE','LULU','ULTA',
]);

const HIGH_IMPORTANCE_US = new Set([
  'AAPL','MSFT','NVDA','GOOGL','AMZN','META','TSLA','AVGO','V','MA','JPM',
]);

const US_COMPANY_NAMES: Record<string, string> = {
  AAPL:'Apple', MSFT:'Microsoft', GOOGL:'Alphabet', AMZN:'Amazon',
  META:'Meta', NVDA:'NVIDIA', TSLA:'Tesla', NFLX:'Netflix',
  AMD:'AMD', INTC:'Intel', ORCL:'Oracle', CRM:'Salesforce',
  ADBE:'Adobe', QCOM:'Qualcomm', AVGO:'Broadcom', IBM:'IBM',
  TXN:'Texas Instruments', MU:'Micron',
  JPM:'JPMorgan Chase', BAC:'Bank of America', GS:'Goldman Sachs',
  MS:'Morgan Stanley', WFC:'Wells Fargo', C:'Citigroup',
  BLK:'BlackRock', V:'Visa', MA:'Mastercard',
  JNJ:'Johnson & Johnson', PFE:'Pfizer', UNH:'UnitedHealth',
  ABBV:'AbbVie', MRK:'Merck', AMGN:'Amgen', GILD:'Gilead',
  WMT:'Walmart', KO:'Coca-Cola', PG:'Procter & Gamble',
  MCD:"McDonald's", SBUX:'Starbucks', NKE:'Nike', DIS:'Disney', HD:'Home Depot',
  XOM:'ExxonMobil', CVX:'Chevron', BA:'Boeing', CAT:'Caterpillar', GE:'GE',
  FDX:'FedEx', ACN:'Accenture', COST:'Costco', DELL:'Dell', HPE:'HP Enterprise',
  LULU:'Lululemon', ULTA:'Ulta Beauty',
};

const KR_TICKER_MAP: Record<string, string> = {
  '005930.KS':'삼성전자', '000660.KS':'SK하이닉스',
  '035420.KS':'NAVER', '035720.KS':'카카오',
  '005380.KS':'현대차', '000270.KS':'기아',
  '005490.KS':'POSCO홀딩스', '006400.KS':'삼성SDI',
  '051910.KS':'LG화학', '066570.KS':'LG전자',
  '017670.KS':'SKT', '030200.KS':'KT',
  '105560.KS':'KB금융', '055550.KS':'신한지주', '086790.KS':'하나금융지주',
  '207940.KS':'삼성바이오로직스', '068270.KS':'셀트리온',
  '012330.KS':'현대모비스', '009150.KS':'삼성전기', '051900.KS':'LG생활건강',
};

const KR_TICKERS = new Set(Object.keys(KR_TICKER_MAP));
const HIGH_IMPORTANCE_KR = new Set(['005930.KS','000660.KS','005380.KS','000270.KS','035420.KS']);

// ── 타입 ────────────────────────────────────────────────────────────────────
interface EarningsEvent {
  id: string;
  date: string;
  time: string;
  country: string;
  name: string;
  importance: 'high' | 'medium' | 'low';
  category: 'earnings';
  ticker: string;
  companyName: string;
  epsEstimate?: string;
  epsActual?: string;
  epsSurprisePct?: number;
  revenueEstimate?: number;
  revenueActual?: number;
  timing: 'BMO' | 'AMC' | 'TNS';
}

interface FMPEarning {
  symbol: string;
  date: string;
  time: string;       // "amc" | "bmo" | "dmh" | ""
  eps: number | null;
  epsEstimated: number | null;
  revenue: number | null;
  revenueEstimated: number | null;
}

// ── 인메모리 캐시 (1시간) ──────────────────────────────────────────────────
const CACHE_TTL_MS = 60 * 60_000;
let cachedEvents: EarningsEvent[] | null = null;
let cacheTimestamp = 0;

// ── 유틸 ────────────────────────────────────────────────────────────────────
function getDateRange(): { from: string; to: string } {
  const today = new Date();
  const day = today.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(today);
  mon.setDate(today.getDate() + diffToMon);
  const end = new Date(mon);
  end.setDate(mon.getDate() + 27); // 4주
  return {
    from: mon.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
}

function calcSurprise(epsEst?: string, epsAct?: string): number | undefined {
  if (!epsEst || !epsAct) return undefined;
  const est = parseFloat(epsEst);
  const act = parseFloat(epsAct);
  if (isNaN(est) || isNaN(act) || est === 0) return undefined;
  return Math.round(((act - est) / Math.abs(est)) * 1000) / 10;
}

function mapTiming(time: string): 'BMO' | 'AMC' | 'TNS' {
  const t = (time ?? '').toLowerCase();
  if (t === 'bmo') return 'BMO';
  if (t === 'amc') return 'AMC';
  return 'TNS';
}

// ── FMP API 호출 ─────────────────────────────────────────────────────────────
async function fetchFromFMP(): Promise<EarningsEvent[]> {
  const key = Deno.env.get('FMP_KEY');
  if (!key) {
    console.warn('FMP_KEY not set — earnings-calendar returning empty');
    return [];
  }

  const { from, to } = getDateRange();
  const res = await fetch(
    `https://financialmodelingprep.com/stable/earnings-calendar?from=${from}&to=${to}&apikey=${key}`
  );
  if (!res.ok) throw new Error(`FMP responded ${res.status}`);

  const calendar: FMPEarning[] = await res.json();
  if (!Array.isArray(calendar)) throw new Error('FMP returned unexpected format');

  const events: EarningsEvent[] = [];
  for (const e of calendar) {
    const isUS = US_TICKERS.has(e.symbol);
    const isKR = KR_TICKERS.has(e.symbol);
    if (!isUS && !isKR) continue;

    const timing = mapTiming(e.time);
    const epsEst = e.epsEstimated != null ? String(e.epsEstimated) : undefined;
    const epsAct = e.eps != null ? String(e.eps) : undefined;

    events.push({
      id: `earn-${e.symbol}-${e.date}`,
      date: e.date,
      time: timing === 'BMO' ? '09:30' : timing === 'AMC' ? '16:00' : 'TBD',
      country: isKR ? '🇰🇷' : '🇺🇸',
      name: `${isKR ? KR_TICKER_MAP[e.symbol] : (US_COMPANY_NAMES[e.symbol] ?? e.symbol)} 실적 발표`,
      importance: isKR
        ? (HIGH_IMPORTANCE_KR.has(e.symbol) ? 'high' : 'medium')
        : (HIGH_IMPORTANCE_US.has(e.symbol) ? 'high' : 'medium'),
      category: 'earnings',
      ticker: e.symbol,
      companyName: isKR ? KR_TICKER_MAP[e.symbol] : (US_COMPANY_NAMES[e.symbol] ?? e.symbol),
      epsEstimate: epsEst,
      epsActual: epsAct,
      epsSurprisePct: calcSurprise(epsEst, epsAct),
      revenueEstimate: e.revenueEstimated ?? undefined,
      revenueActual: e.revenue ?? undefined,
      timing,
    });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}

// ── Handler ─────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = Date.now();
    const isCacheValid = cachedEvents !== null && (now - cacheTimestamp) < CACHE_TTL_MS;

    let events: EarningsEvent[];
    let cacheStatus: string;

    if (isCacheValid) {
      events = cachedEvents!;
      cacheStatus = 'HIT';
    } else {
      events = await fetchFromFMP();
      if (events.length > 0) {
        cachedEvents = events;
        cacheTimestamp = now;
      } else if (cachedEvents !== null) {
        events = cachedEvents;
      }
      cacheStatus = 'MISS';
    }

    return new Response(
      JSON.stringify({ events: events ?? [], cache: cacheStatus }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=60',
          'X-Cache': cacheStatus,
        },
      }
    );
  } catch (error) {
    console.error('earnings-calendar error:', error);
    if (cachedEvents !== null) {
      return new Response(
        JSON.stringify({ events: cachedEvents, cache: 'STALE' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    return new Response(
      JSON.stringify({ error: 'Internal server error', events: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
