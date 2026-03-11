import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max 10 requests per minute per IP

function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(clientId) || [];
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) return true;
  recent.push(now);
  rateLimitMap.set(clientId, recent);
  return false;
}

// Input validation helpers
const ALLOWED_SYMBOLS = ['NQ', 'ES', 'YM', 'HSI', 'NIY', 'STOXX50E', 'GC', 'SI', 'CL', 'NG', 'HG', 'EURUSD', 'USDJPY', 'GBPUSD', 'AUDUSD', 'USDCAD'];
const MAX_QUOTES = 10;
const MAX_EVENTS = 20;
const MAX_CACHE_TTL_MINUTES = 1440; // 24 hours

function validateQuote(q: any): boolean {
  return q && typeof q.symbol === 'string' && q.symbol.length <= 10
    && typeof q.price === 'number' && isFinite(q.price)
    && typeof q.change === 'number' && isFinite(q.change)
    && typeof q.changePercent === 'number' && isFinite(q.changePercent);
}

function validateEvent(e: any): boolean {
  return e && typeof e.time === 'string' && e.time.length <= 20
    && typeof e.country === 'string' && e.country.length <= 10
    && typeof e.name === 'string' && e.name.length <= 200;
}

function sanitizeString(s: string, maxLen: number): string {
  return String(s).slice(0, maxLen).replace(/[<>]/g, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientId = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    if (isRateLimited(clientId)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate and sanitize inputs
    const rawQuotes = Array.isArray(body.quotes) ? body.quotes.slice(0, MAX_QUOTES) : [];
    const rawEvents = Array.isArray(body.events) ? body.events.slice(0, MAX_EVENTS) : [];
    const forceRefresh = body.forceRefresh === true;
    const cacheTtlMinutes = typeof body.cacheTtlMinutes === 'number' && body.cacheTtlMinutes > 0 && body.cacheTtlMinutes <= MAX_CACHE_TTL_MINUTES
      ? body.cacheTtlMinutes : undefined;

    const quotes = rawQuotes.filter(validateQuote).map((q: any) => ({
      symbol: sanitizeString(q.symbol, 10),
      name: sanitizeString(q.name || '', 100),
      nameKr: sanitizeString(q.nameKr || '', 50),
      price: Number(q.price),
      change: Number(q.change),
      changePercent: Number(q.changePercent),
      high: typeof q.high === 'number' && isFinite(q.high) ? Number(q.high) : Number(q.price),
      low: typeof q.low === 'number' && isFinite(q.low) ? Number(q.low) : Number(q.price),
    }));

    const events = rawEvents.filter(validateEvent).map((e: any) => ({
      time: sanitizeString(e.time, 20),
      country: sanitizeString(e.country, 10),
      name: sanitizeString(e.name, 200),
      importance: ['high', 'medium', 'low'].includes(e.importance) ? e.importance : 'low',
      forecast: typeof e.forecast === 'string' ? sanitizeString(e.forecast, 50) : undefined,
      previous: typeof e.previous === 'string' ? sanitizeString(e.previous, 50) : undefined,
    }));

    const CACHE_TTL_MS = cacheTtlMinutes ? cacheTtlMinutes * 60 * 1000 : DEFAULT_CACHE_TTL_MS;

    // Check DB cache first
    const { data: cached } = await supabase
      .from('market_analysis_cache')
      .select('response, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!forceRefresh && cached && (Date.now() - new Date(cached.created_at).getTime()) < CACHE_TTL_MS) {
      console.log('Returning DB-cached analysis');
      return new Response(JSON.stringify(cached.response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Gemini API 키 (Google AI Studio에서 무료 발급: https://aistudio.google.com/apikey)
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured');

    // Build context for AI
    const quoteSummary = quotes.map((q: any) =>
      `${q.nameKr || q.name}(${q.symbol}): 현재가 ${q.price}, 변동 ${q.change >= 0 ? '+' : ''}${q.change} (${q.changePercent >= 0 ? '+' : ''}${q.changePercent}%), 고가 ${q.high}, 저가 ${q.low}`
    ).join('\n');

    const todayEvents = events.slice(0, 10).map((e: any) =>
      `${e.time} ${e.country} ${e.name} (중요도: ${e.importance})${e.forecast ? ` 예상: ${e.forecast}` : ''}${e.previous ? ` 이전: ${e.previous}` : ''}`
    ).join('\n');

    const now = new Date();
    const dateStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;

    const systemPrompt = `당신은 한국 선물/외환 트레이더를 위한 시황 분석 전문가입니다.
실시간 시세 데이터와 오늘의 경제 이벤트를 바탕으로 간결하고 핵심적인 시황 요약을 제공하세요.

규칙:
- 반드시 JSON 형식으로만 응답하세요
- items 배열에 5~7개의 시황 포인트를 포함하세요
- 각 항목은 type("alert" 또는 "info")과 text(한국어 한 문장)로 구성
- 실제 수치를 활용해 구체적으로 작성
- 경고(alert)는 변동성 주의, 주요 이벤트 등에 사용
- 정보(info)는 시황 분석, 추세 설명에 사용
- 각 문장은 40자 이내로 간결하게`;

    const userPrompt = `오늘 날짜: ${dateStr}

[실시간 시세]
${quoteSummary || '데이터 없음'}

[오늘의 경제 이벤트]
${todayEvents || '예정된 이벤트 없음'}

위 데이터를 바탕으로 오늘의 시황 요약을 JSON으로 작성해주세요.
형식: {"items": [{"type": "alert" | "info", "text": "..."}]}`;

    // Google Gemini OpenAI-호환 엔드포인트 사용 (무료 티어: 15RPM, 1M 토큰/일)
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.0-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.error('AI gateway error:', response.status);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || '';

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { items: [] };
    } catch {
      console.error('Failed to parse AI response');
      parsed = { items: [] };
    }

    // Save to DB cache (cleanup old entries, keep only latest)
    await supabase.from('market_analysis_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('market_analysis_cache').insert({ response: parsed });

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Market analysis error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', items: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
