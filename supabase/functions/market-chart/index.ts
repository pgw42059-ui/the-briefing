import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYMBOL_MAP: Record<string, string> = {
  NQ: 'NQ=F', ES: 'ES=F', YM: 'YM=F', HSI: '^HSI', NIY: 'NIY=F',
  STOXX50E: '^STOXX50E', VIX: '^VIX', GC: 'GC=F', SI: 'SI=F', CL: 'CL=F',
  NG: 'NG=F', HG: 'HG=F', DXY: 'DX-Y.NYB', EURUSD: 'EURUSD=X', USDJPY: 'JPY=X',
  GBPUSD: 'GBPUSD=X', AUDUSD: 'AUDUSD=X', USDCAD: 'CAD=X', USDKRW: 'KRW=X',
};

const ALLOWED_SYMBOLS  = Object.keys(SYMBOL_MAP);
const ALLOWED_RANGES   = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '5y'];
const ALLOWED_INTERVALS = ['1m', '5m', '15m', '1h', '1d', '1wk'];

// 범위별 캐시 TTL (단기 차트일수록 짧게)
const RANGE_TTL_MS: Record<string, number> = {
  '1d':  60_000,        // 1분
  '5d':  5 * 60_000,   // 5분
  '1mo': 30 * 60_000,  // 30분
  '3mo': 60 * 60_000,  // 1시간
  '6mo': 60 * 60_000,
  '1y':  60 * 60_000,
  '5y':  60 * 60_000,
};

// ── 인메모리 캐시: key = "SYMBOL:range:interval" ──
interface CacheEntry {
  data: any[];
  timestamp: number;
}
const chartCache = new Map<string, CacheEntry>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const symbol   = url.searchParams.get('symbol')?.toUpperCase() || 'NQ';
    const range    = url.searchParams.get('range')    || '1mo';
    const interval = url.searchParams.get('interval') || '1d';

    if (!ALLOWED_SYMBOLS.includes(symbol)) {
      return new Response(JSON.stringify({ error: 'Invalid symbol', points: [] }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!ALLOWED_RANGES.includes(range)) {
      return new Response(JSON.stringify({ error: 'Invalid range', points: [] }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!ALLOWED_INTERVALS.includes(interval)) {
      return new Response(JSON.stringify({ error: 'Invalid interval', points: [] }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cacheKey  = `${symbol}:${range}:${interval}`;
    const ttl       = RANGE_TTL_MS[range] ?? 60_000;
    const now       = Date.now();
    const cached    = chartCache.get(cacheKey);
    const isValid   = cached && (now - cached.timestamp) < ttl;

    let points: any[];
    let cacheStatus: string;

    if (isValid) {
      points = cached!.data;
      cacheStatus = 'HIT';
    } else {
      const yahooSymbol = SYMBOL_MAP[symbol];
      const YAHOO_HOSTS = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'];
      const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

      let response: Response | null = null;
      for (const host of YAHOO_HOSTS) {
        try {
          const chartUrl = `https://${host}/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`;
          const r = await fetch(chartUrl, { headers: { 'User-Agent': UA } });
          if (r.ok) { response = r; break; }
        } catch { /* 다음 호스트 시도 */ }
      }

      if (!response) throw new Error('Yahoo Finance chart API unavailable on all hosts');

      const data   = await response.json();
      const result = data?.chart?.result?.[0];

      if (!result) {
        return new Response(JSON.stringify({ points: [], error: 'No data' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const timestamps = result.timestamp || [];
      const closes   = result.indicators?.quote?.[0]?.close   || [];
      const highs    = result.indicators?.quote?.[0]?.high    || [];
      const lows     = result.indicators?.quote?.[0]?.low     || [];
      const opens    = result.indicators?.quote?.[0]?.open    || [];
      const volumes  = result.indicators?.quote?.[0]?.volume  || [];

      points = timestamps.map((ts: number, i: number) => ({
        timestamp: ts * 1000,
        open:   opens[i]  != null ? Math.round(opens[i]  * 100) / 100 : null,
        high:   highs[i]  != null ? Math.round(highs[i]  * 100) / 100 : null,
        low:    lows[i]   != null ? Math.round(lows[i]   * 100) / 100 : null,
        close:  closes[i] != null ? Math.round(closes[i] * 100) / 100 : null,
        volume: volumes[i] || 0,
      })).filter((p: any) => p.close !== null);

      // 캐시 저장
      chartCache.set(cacheKey, { data: points, timestamp: now });
      cacheStatus = 'MISS';
    }

    const entry       = chartCache.get(cacheKey);
    const remainingSec = entry
      ? Math.max(0, Math.round((ttl - (Date.now() - entry.timestamp)) / 1000))
      : 0;

    return new Response(JSON.stringify({ points, symbol, cache: cacheStatus }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${remainingSec}, stale-while-revalidate=30`,
        'X-Cache': cacheStatus,
      },
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', points: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
