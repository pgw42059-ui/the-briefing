import { useQuery } from '@tanstack/react-query';
import type { EconomicEvent } from '@/lib/mock-data';

const US_TICKERS = new Set([
  'AAPL','MSFT','GOOGL','AMZN','META','NVDA','TSLA','NFLX','AMD','INTC',
  'ORCL','CRM','ADBE','QCOM','AVGO','IBM','TXN','MU',
  'JPM','BAC','GS','MS','WFC','C','BLK','V','MA',
  'JNJ','PFE','UNH','ABBV','MRK','AMGN','GILD',
  'WMT','KO','PG','MCD','SBUX','NKE','DIS','HD',
  'XOM','CVX','BA','CAT','GE',
  // 3월 발표 종목 추가
  'FDX','ACN','COST','DELL','HPE','LULU','ULTA',
]);

const HIGH_IMPORTANCE = new Set([
  'AAPL','MSFT','NVDA','GOOGL','AMZN','META','TSLA','AVGO','V','MA','JPM',
]);

const US_COMPANY_NAMES: Record<string, string> = {
  AAPL: 'Apple', MSFT: 'Microsoft', GOOGL: 'Alphabet', AMZN: 'Amazon',
  META: 'Meta', NVDA: 'NVIDIA', TSLA: 'Tesla', NFLX: 'Netflix',
  AMD: 'AMD', INTC: 'Intel', ORCL: 'Oracle', CRM: 'Salesforce',
  ADBE: 'Adobe', QCOM: 'Qualcomm', AVGO: 'Broadcom', IBM: 'IBM',
  TXN: 'Texas Instruments', MU: 'Micron',
  JPM: 'JPMorgan Chase', BAC: 'Bank of America', GS: 'Goldman Sachs',
  MS: 'Morgan Stanley', WFC: 'Wells Fargo', C: 'Citigroup',
  BLK: 'BlackRock', V: 'Visa', MA: 'Mastercard',
  JNJ: 'Johnson & Johnson', PFE: 'Pfizer', UNH: 'UnitedHealth',
  ABBV: 'AbbVie', MRK: 'Merck', AMGN: 'Amgen', GILD: 'Gilead',
  WMT: 'Walmart', KO: 'Coca-Cola', PG: 'Procter & Gamble',
  MCD: "McDonald's", SBUX: 'Starbucks', NKE: 'Nike', DIS: 'Disney', HD: 'Home Depot',
  XOM: 'ExxonMobil', CVX: 'Chevron', BA: 'Boeing', CAT: 'Caterpillar', GE: 'GE',
  FDX: 'FedEx', ACN: 'Accenture', COST: 'Costco', DELL: 'Dell', HPE: 'HP Enterprise',
  LULU: 'Lululemon', ULTA: 'Ulta Beauty',
};

// KR tickers — Finnhub uses KS: prefix (e.g. "005930.KS" → "KS:005930")
const KR_TICKER_MAP: Record<string, string> = {
  '005930.KS': '삼성전자', '000660.KS': 'SK하이닉스',
  '035420.KS': 'NAVER', '035720.KS': '카카오',
  '005380.KS': '현대차', '000270.KS': '기아',
  '005490.KS': 'POSCO홀딩스', '006400.KS': '삼성SDI',
  '051910.KS': 'LG화학', '066570.KS': 'LG전자',
  '017670.KS': 'SKT', '030200.KS': 'KT',
  '105560.KS': 'KB금융', '055550.KS': '신한지주', '086790.KS': '하나금융지주',
  '207940.KS': '삼성바이오로직스', '068270.KS': '셀트리온',
  '012330.KS': '현대모비스', '009150.KS': '삼성전기', '051900.KS': 'LG생활건강',
};

const KR_HIGH = new Set(['005930.KS','000660.KS','005380.KS','000270.KS','035420.KS']);

// Finnhub sends KRX tickers as e.g. "005930.KS" — same as our keys
const KR_TICKERS = new Set(Object.keys(KR_TICKER_MAP));

interface FinnhubEarning {
  date: string;
  symbol: string;
  epsActual: number | null;
  epsEstimate: number | null;
  hour: string; // 'bmo' | 'amc' | 'dmh' | ''
}

function getDateRange(): { from: string; to: string } {
  const today = new Date();
  const day = today.getDay(); // 0=Sun
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(today);
  mon.setDate(today.getDate() + diffToMon);
  // Fetch 4 weeks ahead so users can see upcoming earnings seasons
  const end = new Date(mon);
  end.setDate(mon.getDate() + 27); // Mon + 27 days = 4 full weeks
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

function mapTiming(hour: string): 'BMO' | 'AMC' | 'TNS' {
  if (hour === 'bmo') return 'BMO';
  if (hour === 'amc') return 'AMC';
  return 'TNS';
}

async function fetchEarningsEvents(): Promise<EconomicEvent[]> {
  const key = import.meta.env.VITE_FINNHUB_KEY;
  if (!key) return [];

  const { from, to } = getDateRange();
  const res = await fetch(
    `https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${key}`
  );
  if (!res.ok) throw new Error(`Finnhub ${res.status}`);

  const data = await res.json();
  const calendar: FinnhubEarning[] = data.earningsCalendar ?? [];

  const events: EconomicEvent[] = [];

  for (const e of calendar) {
    const isUS = US_TICKERS.has(e.symbol);
    const isKR = KR_TICKERS.has(e.symbol);
    if (!isUS && !isKR) continue;

    const timing = mapTiming(e.hour);
    const epsEst = e.epsEstimate != null ? String(e.epsEstimate) : undefined;
    const epsAct = e.epsActual != null ? String(e.epsActual) : undefined;

    events.push({
      id: `earn-${e.symbol}-${e.date}`,
      date: e.date,
      time: timing === 'BMO' ? '09:30' : timing === 'AMC' ? '16:00' : 'TBD',
      country: isKR ? '🇰🇷' : '🇺🇸',
      name: `${isKR ? KR_TICKER_MAP[e.symbol] : (US_COMPANY_NAMES[e.symbol] ?? e.symbol)} 실적 발표`,
      importance: isKR
        ? (KR_HIGH.has(e.symbol) ? 'high' : 'medium')
        : (HIGH_IMPORTANCE.has(e.symbol) ? 'high' : 'medium'),
      category: 'earnings',
      ticker: e.symbol,
      companyName: isKR ? KR_TICKER_MAP[e.symbol] : (US_COMPANY_NAMES[e.symbol] ?? e.symbol),
      epsEstimate: epsEst,
      epsActual: epsAct,
      epsSurprisePct: calcSurprise(epsEst, epsAct),
      timing,
    });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}

export function useEarningsEvents() {
  return useQuery({
    queryKey: ['earnings-events'],
    queryFn: fetchEarningsEvents,
    staleTime: 60 * 60_000, // 1hr — earnings schedules change infrequently
    retry: 1,
    enabled: !!import.meta.env.VITE_FINNHUB_KEY,
  });
}
