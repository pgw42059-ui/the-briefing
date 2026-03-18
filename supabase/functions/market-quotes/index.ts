import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYMBOLS: Record<string, { yahoo: string; name: string; nameKr: string }> = {
  NQ: { yahoo: 'NQ=F', name: 'NASDAQ 100', nameKr: '나스닥' },
  ES: { yahoo: 'ES=F', name: 'S&P 500', nameKr: 'S&P 500' },
  YM: { yahoo: 'YM=F', name: 'Dow Jones', nameKr: '다우존스' },
  HSI: { yahoo: '^HSI', name: 'Hang Seng', nameKr: '항셍' },
  NIY: { yahoo: 'NIY=F', name: 'Nikkei 225', nameKr: '닛케이' },
  STOXX50E: { yahoo: '^STOXX50E', name: 'Euro Stoxx 50', nameKr: '유로스톡스' },
  GC: { yahoo: 'GC=F', name: 'Gold', nameKr: '골드' },
  SI: { yahoo: 'SI=F', name: 'Silver', nameKr: '은' },
  CL: { yahoo: 'CL=F', name: 'Crude Oil', nameKr: '오일' },
  NG: { yahoo: 'NG=F', name: 'Natural Gas', nameKr: '천연가스' },
  HG: { yahoo: 'HG=F', name: 'Copper', nameKr: '구리' },
  VIX: { yahoo: '^VIX', name: 'CBOE Volatility Index', nameKr: 'VIX' },
  EURUSD: { yahoo: 'EURUSD=X', name: 'EUR/USD', nameKr: '유로/달러' },
  DXY: { yahoo: 'DX-Y.NYB', name: 'US Dollar Index', nameKr: '달러인덱스' },
  USDJPY: { yahoo: 'JPY=X', name: 'USD/JPY', nameKr: '달러/엔' },
  GBPUSD: { yahoo: 'GBPUSD=X', name: 'GBP/USD', nameKr: '파운드/달러' },
  AUDUSD: { yahoo: 'AUDUSD=X', name: 'AUD/USD', nameKr: '호주달러/달러' },
  USDCAD: { yahoo: 'CAD=X', name: 'USD/CAD', nameKr: '달러/캐나다' },
};

// ── 인메모리 캐시 (Deno isolate 워밍 시 Yahoo Finance 호출 절감) ──
const CACHE_TTL_MS = 25_000; // 25초 (클라이언트 30초 주기보다 짧게)
let cachedQuotes: any[] | null = null;
let cacheTimestamp = 0;

async function fetchQuote(yahooSymbol: string): Promise<any | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    return meta;
  } catch {
    return null;
  }
}

async function fetchAllQuotes(): Promise<any[]> {
  const results = await Promise.allSettled(
    Object.entries(SYMBOLS).map(async ([key, info]) => {
      const meta = await fetchQuote(info.yahoo);
      if (!meta) return null;

      const price = meta.regularMarketPrice ?? 0;
      const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
      const change = Math.round((price - prevClose) * 100) / 100;
      const changePercent = prevClose ? Math.round((change / prevClose) * 10000) / 100 : 0;

      return {
        symbol: key,
        name: info.name,
        nameKr: info.nameKr,
        price: Math.round(price * 100) / 100,
        change,
        changePercent,
        high: meta.regularMarketDayHigh ?? price,
        low: meta.regularMarketDayLow ?? price,
        volume: formatVolume(meta.regularMarketVolume ?? 0),
        week52High: meta.fiftyTwoWeekHigh ?? null,
        week52Low: meta.fiftyTwoWeekLow ?? null,
      };
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
    .map(r => r.value);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = Date.now();
    const isCacheValid = cachedQuotes !== null && (now - cacheTimestamp) < CACHE_TTL_MS;

    let quotes: any[];
    let cacheStatus: string;

    if (isCacheValid) {
      quotes = cachedQuotes!;
      cacheStatus = 'HIT';
    } else {
      quotes = await fetchAllQuotes();
      if (quotes.length > 0) {
        cachedQuotes = quotes;
        cacheTimestamp = now;
      } else if (cachedQuotes !== null) {
        // Yahoo 실패 시 만료된 캐시라도 반환
        quotes = cachedQuotes;
      }
      cacheStatus = 'MISS';
    }

    const remainingSec = Math.max(0, Math.round((CACHE_TTL_MS - (Date.now() - cacheTimestamp)) / 1000));

    return new Response(JSON.stringify({ quotes, source: 'yahoo-v8', cache: cacheStatus }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${remainingSec}, stale-while-revalidate=10`,
        'X-Cache': cacheStatus,
      },
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', quotes: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(0)}K`;
  return vol.toString();
}
