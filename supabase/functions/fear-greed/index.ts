import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Alternative.me Fear & Greed Index (공식 무료 API)
 * https://alternative.me/crypto/fear-and-greed-index/#api
 *
 * limit=370 으로 오늘 포함 370일치 요청
 * data[0] = 오늘, data[1] = 전일, data[7] = 1주 전, data[30] = 1개월 전, data[365] = 1년 전
 */
const API_URL = 'https://api.alternative.me/fng/?limit=370&format=json';

// 인메모리 캐시 (10분)
const CACHE_TTL_MS = 10 * 60_000;
let cache: { data: unknown; ts: number } | null = null;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 캐시 유효하면 바로 반환
    if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
      return new Response(JSON.stringify(cache.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`Alternative.me API returned ${res.status}`);

    const json = await res.json();
    const points: { value: string; value_classification: string; timestamp: string }[] =
      json?.data ?? [];

    if (!points.length) throw new Error('No data from Alternative.me');

    const score = (idx: number) => parseInt(points[idx]?.value ?? '0', 10);

    const result = {
      score:         score(0),
      rating:        points[0]?.value_classification ?? 'Neutral',
      previousClose: score(1),
      oneWeekAgo:    score(7),
      oneMonthAgo:   score(30),
      oneYearAgo:    score(365),
      timestamp:     new Date(parseInt(points[0]?.timestamp ?? '0', 10) * 1000).toISOString(),
    };

    cache = { data: result, ts: Date.now() };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Fear & Greed fetch error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch Fear & Greed Index', score: null }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
