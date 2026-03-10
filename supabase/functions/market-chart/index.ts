import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYMBOL_MAP: Record<string, string> = {
  NQ: 'NQ=F',
  ES: 'ES=F',
  YM: 'YM=F',
  HSI: '^HSI',
  NIY: 'NIY=F',
  STOXX50E: '^STOXX50E',
  GC: 'GC=F',
  SI: 'SI=F',
  CL: 'CL=F',
  NG: 'NG=F',
  HG: 'HG=F',
  EURUSD: 'EURUSD=X',
  USDJPY: 'JPY=X',
  GBPUSD: 'GBPUSD=X',
  AUDUSD: 'AUDUSD=X',
  USDCAD: 'CAD=X',
};

const ALLOWED_SYMBOLS = Object.keys(SYMBOL_MAP);
const ALLOWED_RANGES = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '5y'];
const ALLOWED_INTERVALS = ['1m', '5m', '15m', '1h', '1d', '1wk'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const symbol = url.searchParams.get('symbol')?.toUpperCase() || 'NQ';
    const range = url.searchParams.get('range') || '1mo';
    const interval = url.searchParams.get('interval') || '1d';

    // Validate inputs against allowed values
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

    const yahooSymbol = SYMBOL_MAP[symbol];
    const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`;

    const response = await fetch(chartUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance chart API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];

    if (!result) {
      return new Response(JSON.stringify({ points: [], error: 'No data' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    const highs = result.indicators?.quote?.[0]?.high || [];
    const lows = result.indicators?.quote?.[0]?.low || [];
    const opens = result.indicators?.quote?.[0]?.open || [];
    const volumes = result.indicators?.quote?.[0]?.volume || [];

    const points = timestamps.map((ts: number, i: number) => ({
      timestamp: ts * 1000,
      open: opens[i] != null ? Math.round(opens[i] * 100) / 100 : null,
      high: highs[i] != null ? Math.round(highs[i] * 100) / 100 : null,
      low: lows[i] != null ? Math.round(lows[i] * 100) / 100 : null,
      close: closes[i] != null ? Math.round(closes[i] * 100) / 100 : null,
      volume: volumes[i] || 0,
    })).filter((p: any) => p.close !== null);

    return new Response(JSON.stringify({ points, symbol }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', points: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
