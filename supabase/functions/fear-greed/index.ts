import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const url = `https://production.dataviz.cnn.io/index/fearandgreed/graphdata/${today}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) {
      throw new Error(`CNN API returned ${res.status}`);
    }

    const data = await res.json();
    const fg = data?.fear_and_greed;

    if (!fg) {
      throw new Error('No fear_and_greed data in response');
    }

    const result = {
      score: Math.round(fg.score ?? 0),
      rating: fg.rating ?? 'Neutral',
      previousClose: Math.round(fg.previous_close ?? 0),
      oneWeekAgo: Math.round(fg.previous_1_week ?? 0),
      oneMonthAgo: Math.round(fg.previous_1_month ?? 0),
      oneYearAgo: Math.round(fg.previous_1_year ?? 0),
      timestamp: fg.timestamp ?? new Date().toISOString(),
    };

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
