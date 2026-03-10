import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const COUNTRY_FLAG: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', AUD: '🇦🇺',
  CAD: '🇨🇦', CHF: '🇨🇭', CNY: '🇨🇳', NZD: '🇳🇿', KRW: '🇰🇷',
};

const EVENT_NAME_KR: Record<string, string> = {
  'Non-Farm Employment Change': '비농업 고용변화',
  'Unemployment Rate': '실업률',
  'Unemployment Claims': '신규 실업수당 청구건수',
  'Average Hourly Earnings m/m': '평균 시간당 임금 (MoM)',
  'Average Hourly Earnings y/y': '평균 시간당 임금 (YoY)',
  'ADP Non-Farm Employment Change': 'ADP 비농업 고용변화',
  'Employment Change': '고용변화',
  'Employment Change q/q': '고용변화 (QoQ)',
  'Job Openings': 'JOLTS 구인건수',
  'Average Cash Earnings y/y': '평균 현금급여 (YoY)',
  'CPI m/m': '소비자물가지수 (MoM)',
  'CPI y/y': '소비자물가지수 (YoY)',
  'Core CPI m/m': '근원 소비자물가지수 (MoM)',
  'Core CPI y/y': '근원 소비자물가지수 (YoY)',
  'PPI m/m': '생산자물가지수 (MoM)',
  'PPI y/y': '생산자물가지수 (YoY)',
  'Core PPI m/m': '근원 생산자물가지수 (MoM)',
  'Core PPI y/y': '근원 생산자물가지수 (YoY)',
  'PCE Price Index m/m': 'PCE 물가지수 (MoM)',
  'Core PCE Price Index m/m': '근원 PCE 물가지수 (MoM)',
  'Core PCE Price Index y/y': '근원 PCE 물가지수 (YoY)',
  'GDP q/q': 'GDP (QoQ)',
  'GDP y/y': 'GDP (YoY)',
  'GDP m/m': 'GDP (MoM)',
  'Prelim GDP q/q': 'GDP 속보치 (QoQ)',
  'Advance GDP q/q': 'GDP 사전치 (QoQ)',
  'Final GDP q/q': 'GDP 확정치 (QoQ)',
  'Prelim GDP Price Index q/q': 'GDP 물가지수 속보치 (QoQ)',
  'Federal Funds Rate': '연방기금금리',
  'FOMC Statement': 'FOMC 성명서',
  'FOMC Meeting Minutes': 'FOMC 의사록',
  'FOMC Press Conference': 'FOMC 기자회견',
  'FOMC Economic Projections': 'FOMC 경제전망',
  'ECB Press Conference': 'ECB 기자회견',
  'ECB Monetary Policy Statement': 'ECB 통화정책 성명서',
  'Main Refinancing Rate': 'ECB 기준금리',
  'BOJ Policy Rate': 'BOJ 정책금리',
  'BOJ Press Conference': 'BOJ 기자회견',
  'BOE Official Bank Rate': 'BOE 기준금리',
  'BOC Rate Statement': 'BOC 금리 성명서',
  'Overnight Rate': 'BOC 익일물 금리',
  'Cash Rate': '기준금리',
  'Official Cash Rate': '공식 기준금리',
  'SNB Policy Rate': 'SNB 정책금리',
  'Retail Sales m/m': '소매판매 (MoM)',
  'Core Retail Sales m/m': '근원 소매판매 (MoM)',
  'Retail Sales y/y': '소매판매 (YoY)',
  'Consumer Confidence': '소비자 신뢰지수',
  'CB Consumer Confidence': 'CB 소비자 신뢰지수',
  'Prelim UoM Consumer Sentiment': '미시간대 소비자심리 속보치',
  'Revised UoM Consumer Sentiment': '미시간대 소비자심리 수정치',
  'Prelim UoM Inflation Expectations': '미시간대 인플레 기대 속보치',
  'Household Spending m/m': '가계지출 (MoM)',
  'Household Spending y/y': '가계지출 (YoY)',
  'ISM Manufacturing PMI': 'ISM 제조업 PMI',
  'ISM Services PMI': 'ISM 서비스업 PMI',
  'Manufacturing PMI': '제조업 PMI',
  'Services PMI': '서비스업 PMI',
  'Flash Manufacturing PMI': '제조업 PMI 속보치',
  'Flash Services PMI': '서비스업 PMI 속보치',
  'Industrial Production m/m': '산업생산 (MoM)',
  'Industrial Production y/y': '산업생산 (YoY)',
  'Manufacturing Production m/m': '제조업 생산 (MoM)',
  'Prelim Business Investment q/q': '기업투자 속보치 (QoQ)',
  'Construction Output m/m': '건설생산 (MoM)',
  'Factory Orders m/m': '공장주문 (MoM)',
  'Durable Goods Orders m/m': '내구재 주문 (MoM)',
  'Core Durable Goods Orders m/m': '근원 내구재 주문 (MoM)',
  'Existing Home Sales': '기존주택 판매',
  'New Home Sales': '신규주택 판매',
  'Pending Home Sales m/m': '주택계약 보류 (MoM)',
  'Housing Starts': '주택착공건수',
  'Building Permits': '건축허가',
  'Building Permits m/m': '건축허가 (MoM)',
  'NAHB Housing Market Index': 'NAHB 주택시장지수',
  'HPI m/m': '주택가격지수 (MoM)',
  'Trade Balance': '무역수지',
  'Goods Trade Balance': '상품 무역수지',
  'Current Account': '경상수지',
  'Current Account q/q': '경상수지 (QoQ)',
  'Crude Oil Inventories': '원유재고',
  'Natural Gas Storage': '천연가스 저장량',
  '10-y Bond Auction': '10년물 국채입찰',
  '30-y Bond Auction': '30년물 국채입찰',
  '2-y Bond Auction': '2년물 국채입찰',
  '5-y Bond Auction': '5년물 국채입찰',
  '3-y Bond Auction': '3년물 국채입찰',
  '7-y Bond Auction': '7년물 국채입찰',
  'German 10-y Bond Auction': '독일 10년물 국채입찰',
  'German 30-y Bond Auction': '독일 30년물 국채입찰',
  'Federal Budget Balance': '연방 재정수지',
  'Bank Holiday': '공휴일',
  'Bank Lending y/y': '은행 대출 (YoY)',
  'M2 Money Supply y/y': 'M2 통화공급 (YoY)',
  'New Loans': '신규 대출',
  'Economy Watchers Sentiment': '경기동향지수',
  'ZEW Economic Sentiment': 'ZEW 경기기대지수',
  'Sentix Investor Confidence': 'Sentix 투자자신뢰지수',
  'SECO Consumer Climate': 'SECO 소비자심리',
  'Mortgage Delinquencies': '모기지 연체율',
  'MI Inflation Expectations': 'MI 인플레 기대',
  'RICS House Price Balance': 'RICS 주택가격지수',
  'API Weekly Statistical Bulletin': 'API 주간 원유재고',
  'Italian Industrial Production m/m': '이탈리아 산업생산 (MoM)',
  'Lower House Elections': '총선',
};

const SPEECH_PATTERNS: [RegExp, string][] = [
  [/^FOMC Member (.+) Speaks$/, 'FOMC 위원 $1 연설'],
  [/^Fed Chair (.+) Speaks$/, '연준 의장 $1 연설'],
  [/^ECB President (.+) Speaks$/, 'ECB 총재 $1 연설'],
  [/^BOJ Gov (.+) Speaks$/, 'BOJ 총재 $1 연설'],
  [/^BOE Gov (.+) Speaks$/, 'BOE 총재 $1 연설'],
  [/^BOC Gov (.+) Speaks$/, 'BOC 총재 $1 연설'],
  [/^RBA Gov (.+) Speaks$/, 'RBA 총재 $1 연설'],
  [/^RBA Deputy Gov (.+) Speaks$/, 'RBA 부총재 $1 연설'],
  [/^RBA Assist Gov (.+) Speaks$/, 'RBA 총재보 $1 연설'],
  [/^MPC Member (.+) Speaks$/, 'MPC 위원 $1 연설'],
  [/^SNB (.+) Speaks$/, 'SNB $1 연설'],
  [/^German Buba President (.+) Speaks$/, '독일 분데스방크 총재 $1 연설'],
  [/^Gov Council Member (.+) Speaks$/, '정책위원 $1 연설'],
  [/^BOC Summary of Deliberations$/, 'BOC 정책결정 요약'],
];

function translateEventName(name: string): string {
  if (EVENT_NAME_KR[name]) return EVENT_NAME_KR[name];
  for (const [pattern, replacement] of SPEECH_PATTERNS) {
    if (pattern.test(name)) return name.replace(pattern, replacement);
  }
  return name;
}

interface FFRawEvent {
  title: string;
  country: string;
  date: string;
  impact: string;
  forecast: string;
  previous: string;
  actual?: string;
}

function mapImportance(impact: string): 'high' | 'medium' | 'low' {
  if (impact === 'High') return 'high';
  if (impact === 'Medium') return 'medium';
  return 'low';
}

function parseFFDate(dateStr: string): { date: string; time: string } {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: '', time: '' };
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const date = kst.toISOString().slice(0, 10);
    const time = `${String(kst.getUTCHours()).padStart(2, '0')}:${String(kst.getUTCMinutes()).padStart(2, '0')}`;
    return { date, time };
  } catch {
    return { date: '', time: '' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const res = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!res.ok) throw new Error(`FF API error: ${res.status}`);
    const raw: FFRawEvent[] = await res.json();

    const events = raw
      .filter((e) => e.date && e.title)
      .map((e, i) => {
        const { date, time } = parseFFDate(e.date);
        const actual = (e.actual && e.actual.trim()) || undefined;
        return {
          id: `ff-${i + 1}`,
          date,
          time: time || 'TBD',
          country: COUNTRY_FLAG[e.country] || `[${e.country}]`,
          name: translateEventName(e.title),
          importance: mapImportance(e.impact),
          forecast: e.forecast || undefined,
          previous: e.previous || undefined,
          actual,
        };
      })
      .filter((e) => e.date);

    return new Response(JSON.stringify({ events }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching economic calendar:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', events: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
