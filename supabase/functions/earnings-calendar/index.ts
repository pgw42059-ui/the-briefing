import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// US watchlist tickers
const US_TICKERS = new Set([
  // Tech
  'AAPL','MSFT','GOOGL','AMZN','META','NVDA','TSLA','NFLX','AMD','INTC',
  'ORCL','CRM','ADBE','QCOM','AVGO','IBM','TXN','MU',
  // Finance
  'JPM','BAC','GS','MS','WFC','C','BLK','V','MA',
  // Healthcare
  'JNJ','PFE','UNH','ABBV','MRK','AMGN','GILD',
  // Consumer
  'WMT','KO','PG','MCD','SBUX','NKE','DIS','HD',
  // Energy/Industrial
  'XOM','CVX','BA','CAT','GE',
]);

// Tickers with ~$1T+ market cap → high importance
const HIGH_IMPORTANCE_US = new Set(['AAPL','MSFT','NVDA','GOOGL','AMZN','META','TSLA','AVGO','V','MA','JPM']);

// KR watchlist tickers
const KR_TICKERS = [
  '005930.KS', // 삼성전자
  '000660.KS', // SK하이닉스
  '035420.KS', // NAVER
  '035720.KS', // 카카오
  '005380.KS', // 현대차
  '000270.KS', // 기아
  '005490.KS', // POSCO홀딩스
  '006400.KS', // 삼성SDI
  '051910.KS', // LG화학
  '066570.KS', // LG전자
  '017670.KS', // SKT
  '030200.KS', // KT
  '105560.KS', // KB금융
  '055550.KS', // 신한지주
  '086790.KS', // 하나금융지주
  '207940.KS', // 삼성바이오로직스
  '068270.KS', // 셀트리온
  '012330.KS', // 현대모비스
  '009150.KS', // 삼성전기
  '051900.KS', // LG생활건강
];

const HIGH_IMPORTANCE_KR = new Set(['005930.KS','000660.KS','005380.KS','000270.KS','035420.KS']);

const KR_COMPANY_NAMES: Record<string, string> = {
  '005930.KS': '삼성전자',
  '000660.KS': 'SK하이닉스',
  '035420.KS': 'NAVER',
  '035720.KS': '카카오',
  '005380.KS': '현대차',
  '000270.KS': '기아',
  '005490.KS': 'POSCO홀딩스',
  '006400.KS': '삼성SDI',
  '051910.KS': 'LG화학',
  '066570.KS': 'LG전자',
  '017670.KS': 'SKT',
  '030200.KS': 'KT',
  '105560.KS': 'KB금융',
  '055550.KS': '신한지주',
  '086790.KS': '하나금융지주',
  '207940.KS': '삼성바이오로직스',
  '068270.KS': '셀트리온',
  '012330.KS': '현대모비스',
  '009150.KS': '삼성전기',
  '051900.KS': 'LG생활건강',
};

function getWeekDates(): string[] {
  const now = new Date();
  // Get Monday of this week (KST)
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const day = kstNow.getUTCDay(); // 0=Sun, 1=Mon ... 6=Sat
  const diffToMon = day === 0 ? -6 : 1 - day;
  const dates: string[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(kstNow);
    d.setUTCDate(kstNow.getUTCDate() + diffToMon + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function importanceUS(ticker: string): 'high' | 'medium' | 'low' {
  return HIGH_IMPORTANCE_US.has(ticker) ? 'high' : 'medium';
}

function importanceKR(ticker: string): 'high' | 'medium' | 'low' {
  return HIGH_IMPORTANCE_KR.has(ticker) ? 'high' : 'medium';
}

// Map Yahoo Finance callType to our timing field
function mapTiming(callType?: string): 'BMO' | 'AMC' | 'TNS' {
  if (!callType) return 'TNS';
  if (callType === 'Before Market Open' || callType === 'BMO') return 'BMO';
  if (callType === 'After Market Close' || callType === 'AMC') return 'AMC';
  return 'TNS';
}

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
  timing: 'BMO' | 'AMC' | 'TNS';
}

async function fetchUSEarnings(weekDates: string[]): Promise<EarningsEvent[]> {
  const results: EarningsEvent[] = [];
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
  };

  await Promise.allSettled(weekDates.map(async (dateStr) => {
    try {
      const url = `https://query1.finance.yahoo.com/v1/finance/earning?date=${dateStr}`;
      const res = await fetch(url, { headers });
      if (!res.ok) return;
      const data = await res.json();
      // deno-lint-ignore no-explicit-any
      const rows: any[] = data?.earnings?.earningsCalendar ?? [];
      for (const row of rows) {
        const ticker: string = row.ticker ?? '';
        if (!US_TICKERS.has(ticker)) continue;
        const epsEst = row.epsestimate != null ? String(row.epsestimate) : undefined;
        const epsAct = row.epsactual != null ? String(row.epsactual) : undefined;
        let surprise: number | undefined;
        if (epsEst != null && epsAct != null) {
          const est = parseFloat(epsEst);
          const act = parseFloat(epsAct);
          if (!isNaN(est) && !isNaN(act) && est !== 0) {
            surprise = Math.round(((act - est) / Math.abs(est)) * 1000) / 10;
          }
        }
        const timing = mapTiming(row.startdaytime);
        const timeStr = timing === 'BMO' ? '09:30' : timing === 'AMC' ? '16:00' : 'TBD';
        results.push({
          id: `earn-us-${ticker}-${dateStr}`,
          date: dateStr,
          time: timeStr,
          country: '🇺🇸',
          name: `${row.companyshortName ?? ticker} 실적 발표`,
          importance: importanceUS(ticker),
          category: 'earnings',
          ticker,
          companyName: row.companyshortName ?? ticker,
          epsEstimate: epsEst,
          epsActual: epsAct,
          epsSurprisePct: surprise,
          timing,
        });
      }
    } catch {
      // ignore per-day errors
    }
  }));

  return results;
}

async function fetchKREarnings(weekDates: string[]): Promise<EarningsEvent[]> {
  const weekSet = new Set(weekDates);
  const results: EarningsEvent[] = [];
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
  };

  await Promise.allSettled(KR_TICKERS.map(async (ticker) => {
    try {
      const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=calendarEvents,price`;
      const res = await fetch(url, { headers });
      if (!res.ok) return;
      const data = await res.json();
      // deno-lint-ignore no-explicit-any
      const result = data?.quoteSummary?.result?.[0];
      if (!result) return;

      const cal = result.calendarEvents;
      if (!cal) return;

      // earningsDate can be an array of {raw, fmt}
      // deno-lint-ignore no-explicit-any
      const earningsDateArr: any[] = cal.earningsDate ?? [];
      for (const eDate of earningsDateArr) {
        const ts: number = eDate.raw ?? 0;
        if (!ts) continue;
        const d = new Date(ts * 1000);
        const dateStr = d.toISOString().slice(0, 10);
        if (!weekSet.has(dateStr)) continue;

        const epsEst = cal.earnings?.earningsAverage?.raw != null
          ? String(cal.earnings.earningsAverage.raw)
          : undefined;
        const epsAct = cal.earnings?.earningsActual?.raw != null
          ? String(cal.earnings.earningsActual.raw)
          : undefined;

        let surprise: number | undefined;
        if (epsEst != null && epsAct != null) {
          const est = parseFloat(epsEst);
          const act = parseFloat(epsAct);
          if (!isNaN(est) && !isNaN(act) && est !== 0) {
            surprise = Math.round(((act - est) / Math.abs(est)) * 1000) / 10;
          }
        }

        const companyName = KR_COMPANY_NAMES[ticker] ?? ticker;
        results.push({
          id: `earn-kr-${ticker}-${dateStr}`,
          date: dateStr,
          time: 'TBD',
          country: '🇰🇷',
          name: `${companyName} 실적 발표`,
          importance: importanceKR(ticker),
          category: 'earnings',
          ticker,
          companyName,
          epsEstimate: epsEst,
          epsActual: epsAct,
          epsSurprisePct: surprise,
          timing: 'TNS',
        });
        break; // take first matching date
      }
    } catch {
      // ignore per-ticker errors
    }
  }));

  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const weekDates = getWeekDates();
    const [usEvents, krEvents] = await Promise.all([
      fetchUSEarnings(weekDates),
      fetchKREarnings(weekDates),
    ]);

    const events = [...usEvents, ...krEvents].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });

    return new Response(JSON.stringify({ events }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching earnings calendar:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', events: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
