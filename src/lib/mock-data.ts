export interface FuturesQuote {
  symbol: string;
  name: string;
  nameKr: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: string;
  week52High?: number | null;
  week52Low?: number | null;
}

export interface EconomicEvent {
  id: string;
  date: string; // YYYY-MM-DD
  time: string;
  country: string;
  name: string;
  importance: 'high' | 'medium' | 'low';
  forecast?: string;
  previous?: string;
  actual?: string;
  // Earnings-specific fields
  category?: 'macro' | 'earnings';
  ticker?: string;          // e.g. 'AAPL', '005930.KS'
  companyName?: string;     // e.g. 'Apple Inc.'
  epsEstimate?: string;
  epsActual?: string;
  epsSurprisePct?: number;
  timing?: 'BMO' | 'AMC' | 'TNS'; // Before Market Open / After Market Close / Time Not Supplied
}

export interface MarketSignal {
  symbol: string;
  nameKr: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  score: number; // -100 to 100
  factors: { name: string; impact: 'positive' | 'negative' | 'neutral' }[];
}

export interface MarketPillar {
  label: string;
  score: number; // -100 to 100
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

export type MarketRegime = 'risk-on' | 'risk-off' | 'stagflation' | 'mixed';

export interface MarketCompositeScore {
  score: number; // -100 to 100
  sentiment: 'bullish' | 'bearish' | 'neutral';
  regime: MarketRegime;
  regimeLabel: string;
  pillars: MarketPillar[];
  crossAssetFactors: { name: string; impact: 'positive' | 'negative' | 'neutral' }[];
  fearGreedScore?: number;
  fearGreedLabel?: string;
}

export interface ChartDataPoint {
  date: string;
  price: number;
}

export interface AssetDetail {
  symbol: string;
  name: string;
  nameKr: string;
  description: string;
  keyLevels: { support: number; resistance: number };
  relatedEvents: string[];
  chartData: ChartDataPoint[];
}

function generateChartData(basePrice: number, days: number, volatility: number): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  let price = basePrice * (1 - volatility * 5);
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    price = price + (Math.random() - 0.48) * basePrice * volatility;
    data.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      price: Math.round(price * 100) / 100,
    });
  }
  return data;
}

export const mockAssetDetails: Record<string, AssetDetail> = {
  NQ: {
    symbol: 'NQ',
    name: 'NASDAQ 100 E-mini Futures',
    nameKr: '나스닥 100',
    description: '미국 나스닥 100 지수를 추종하는 선물로, 기술주 중심의 대형주 100개로 구성됩니다. AI, 반도체, 빅테크 실적에 민감하게 반응합니다.',
    keyLevels: { support: 21200, resistance: 21800 },
    relatedEvents: ['CPI 발표 (22:30)', 'FOMC 의사록 (04:00)', 'ADP 고용 (21:15)'],
    chartData: generateChartData(21543, 30, 0.005),
  },
  ES: {
    symbol: 'ES',
    name: 'S&P 500 E-mini Futures',
    nameKr: 'S&P 500',
    description: '미국 S&P 500 지수를 추종하는 선물로, 미국 대형주 500개를 대표합니다. 가장 널리 거래되는 주가지수 선물입니다.',
    keyLevels: { support: 5900, resistance: 6100 },
    relatedEvents: ['CPI 발표 (22:30)', 'FOMC 의사록 (04:00)', '비농업 고용 (22:30)'],
    chartData: generateChartData(6020, 30, 0.004),
  },
  YM: {
    symbol: 'YM',
    name: 'Dow Jones E-mini Futures',
    nameKr: '다우존스',
    description: '다우존스 산업평균지수 30개 대형 우량주를 추종합니다. 전통 산업 및 금융주 비중이 높아 경기 민감도가 높습니다.',
    keyLevels: { support: 43500, resistance: 44500 },
    relatedEvents: ['ISM 제조업 PMI', 'GDP 발표', '소매판매 (MoM)'],
    chartData: generateChartData(44000, 30, 0.004),
  },
  HSI: {
    symbol: 'HSI',
    name: 'Hang Seng Index Futures',
    nameKr: '항셍 지수',
    description: '홍콩 항셍 지수를 추종하는 선물로, 중국 경제 상황 및 부동산 시장에 크게 영향을 받습니다. 위안화 환율과 높은 상관관계를 보입니다.',
    keyLevels: { support: 20600, resistance: 21200 },
    relatedEvents: ['중국 무역수지 (00:00)', '위안화 기준환율 발표'],
    chartData: generateChartData(20893, 30, 0.006),
  },
  NIY: {
    symbol: 'NIY',
    name: 'Nikkei 225 Futures',
    nameKr: '닛케이 225',
    description: '일본 닛케이 225 지수 선물로, 일본 대표 대형주 225개로 구성됩니다. 엔화 환율과 BOJ 통화정책에 민감합니다.',
    keyLevels: { support: 38000, resistance: 40000 },
    relatedEvents: ['BOJ 금리결정', '일본 GDP 발표', '엔화 환율 동향'],
    chartData: generateChartData(39200, 30, 0.005),
  },
  STOXX50E: {
    symbol: 'STOXX50E',
    name: 'Euro Stoxx 50',
    nameKr: '유로스톡스 50',
    description: '유로존 대형주 50개로 구성된 지수입니다. ECB 통화정책과 유럽 경기 지표에 크게 반응합니다.',
    keyLevels: { support: 4800, resistance: 5100 },
    relatedEvents: ['ECB 금리결정', '유로존 PMI', '독일 ZEW 경기기대지수'],
    chartData: generateChartData(4950, 30, 0.004),
  },
  GC: {
    symbol: 'GC',
    name: 'Gold Futures (COMEX)',
    nameKr: '골드',
    description: '금 선물은 대표적인 안전자산으로, 인플레이션 헤지 및 지정학적 리스크 발생 시 수요가 증가합니다. 달러 인덱스와 역상관관계를 보입니다.',
    keyLevels: { support: 2900, resistance: 2960 },
    relatedEvents: ['CPI 발표 (22:30)', 'FOMC 의사록 (04:00)', '달러 인덱스 동향'],
    chartData: generateChartData(2948, 30, 0.003),
  },
  SI: {
    symbol: 'SI',
    name: 'Silver Futures (COMEX)',
    nameKr: '은',
    description: '은 선물은 귀금속이자 산업용 금속으로, 금과 유사하게 안전자산 역할을 하면서도 산업 수요에 영향을 받습니다.',
    keyLevels: { support: 31.5, resistance: 34.0 },
    relatedEvents: ['CPI 발표', '달러 인덱스 동향', '산업생산 데이터'],
    chartData: generateChartData(32.8, 30, 0.006),
  },
  CL: {
    symbol: 'CL',
    name: 'WTI Crude Oil Futures',
    nameKr: '크루드 오일',
    description: 'WTI 원유 선물로, OPEC+ 감산 정책과 글로벌 수요 전망에 크게 영향을 받습니다. 중동 지정학적 리스크도 주요 변수입니다.',
    keyLevels: { support: 70.5, resistance: 73.0 },
    relatedEvents: ['EIA 원유재고 발표', 'OPEC+ 회의 동향', '미국 생산량 데이터'],
    chartData: generateChartData(71.28, 30, 0.008),
  },
  NG: {
    symbol: 'NG',
    name: 'Natural Gas Futures',
    nameKr: '천연가스',
    description: '천연가스 선물로, 계절적 수요(난방/냉방)와 생산량, 재고 데이터에 크게 반응합니다. 높은 변동성이 특징입니다.',
    keyLevels: { support: 2.8, resistance: 3.6 },
    relatedEvents: ['EIA 천연가스 재고', '기상 전망', '미국 생산량 데이터'],
    chartData: generateChartData(3.2, 30, 0.015),
  },
  HG: {
    symbol: 'HG',
    name: 'Copper Futures (COMEX)',
    nameKr: '구리',
    description: '구리 선물은 글로벌 경기 선행지표로 불립니다. 건설, 전기차, 인프라 투자에 따른 수요 변화에 민감합니다.',
    keyLevels: { support: 4.1, resistance: 4.5 },
    relatedEvents: ['중국 PMI 발표', '미국 건설지출', '글로벌 재고 데이터'],
    chartData: generateChartData(4.3, 30, 0.006),
  },
  EURUSD: {
    symbol: 'EURUSD',
    name: 'EUR/USD',
    nameKr: '유로/달러',
    description: '세계에서 가장 많이 거래되는 통화쌍입니다. ECB와 Fed의 통화정책 차이, 유로존과 미국 경제지표에 민감합니다.',
    keyLevels: { support: 1.0700, resistance: 1.0950 },
    relatedEvents: ['ECB 금리결정', 'FOMC 금리결정', '비농업 고용 발표'],
    chartData: generateChartData(1.0820, 30, 0.002),
  },
  USDJPY: {
    symbol: 'USDJPY',
    name: 'USD/JPY',
    nameKr: '달러/엔',
    description: '달러/엔 환율은 미일 금리차와 BOJ 통화정책에 큰 영향을 받습니다. 캐리 트레이드의 핵심 통화쌍입니다.',
    keyLevels: { support: 148.0, resistance: 152.0 },
    relatedEvents: ['BOJ 금리결정', 'FOMC 금리결정', '일본 CPI 발표'],
    chartData: generateChartData(150.2, 30, 0.003),
  },
  GBPUSD: {
    symbol: 'GBPUSD',
    name: 'GBP/USD',
    nameKr: '파운드/달러',
    description: '파운드/달러는 BOE 통화정책과 영국 경제지표에 민감합니다. 브렉시트 이후 정치적 불확실성도 변수입니다.',
    keyLevels: { support: 1.2550, resistance: 1.2800 },
    relatedEvents: ['BOE 금리결정', '영국 CPI 발표', '영국 GDP 발표'],
    chartData: generateChartData(1.2680, 30, 0.003),
  },
  AUDUSD: {
    symbol: 'AUDUSD',
    name: 'AUD/USD',
    nameKr: '호주달러/달러',
    description: '호주달러는 원자재 통화로, 철광석·석탄 가격과 중국 경기에 높은 상관관계를 보입니다.',
    keyLevels: { support: 0.6400, resistance: 0.6650 },
    relatedEvents: ['RBA 금리결정', '호주 고용 발표', '중국 PMI 발표'],
    chartData: generateChartData(0.6520, 30, 0.003),
  },
  USDCAD: {
    symbol: 'USDCAD',
    name: 'USD/CAD',
    nameKr: '달러/캐나다',
    description: '달러/캐나다는 원유 가격과 높은 상관관계를 보입니다. BOC 통화정책과 캐나다 고용지표에 민감합니다.',
    keyLevels: { support: 1.3400, resistance: 1.3650 },
    relatedEvents: ['BOC 금리결정', '캐나다 고용 발표', 'WTI 원유가격 동향'],
    chartData: generateChartData(1.3520, 30, 0.002),
  },
};

export const mockQuotes: FuturesQuote[] = [
  { symbol: 'NQ', name: 'NASDAQ 100', nameKr: '나스닥', price: 21543.25, change: 187.50, changePercent: 0.88, high: 21612.00, low: 21298.75, volume: '524K' },
  { symbol: 'ES', name: 'S&P 500', nameKr: 'S&P 500', price: 6020.50, change: 32.75, changePercent: 0.55, high: 6045.00, low: 5985.25, volume: '1.2M' },
  { symbol: 'YM', name: 'Dow Jones', nameKr: '다우존스', price: 44012.00, change: -125.00, changePercent: -0.28, high: 44250.00, low: 43890.00, volume: '312K' },
  { symbol: 'HSI', name: 'Hang Seng', nameKr: '항셍', price: 20893.50, change: -156.25, changePercent: -0.74, high: 21102.00, low: 20845.00, volume: '312K' },
  { symbol: 'NIY', name: 'Nikkei 225', nameKr: '닛케이', price: 39200.00, change: 280.00, changePercent: 0.72, high: 39450.00, low: 38900.00, volume: '198K' },
  { symbol: 'STOXX50E', name: 'Euro Stoxx 50', nameKr: '유로스톡스', price: 4952.30, change: 18.40, changePercent: 0.37, high: 4970.00, low: 4928.00, volume: '156K' },
  { symbol: 'GC', name: 'Gold', nameKr: '골드', price: 2948.30, change: 22.40, changePercent: 0.77, high: 2955.60, low: 2918.10, volume: '198K' },
  { symbol: 'SI', name: 'Silver', nameKr: '은', price: 32.85, change: 0.42, changePercent: 1.30, high: 33.10, low: 32.30, volume: '85K' },
  { symbol: 'CL', name: 'Crude Oil', nameKr: '오일', price: 71.28, change: -0.45, changePercent: -0.63, high: 72.15, low: 70.88, volume: '445K' },
  { symbol: 'NG', name: 'Natural Gas', nameKr: '천연가스', price: 3.22, change: 0.15, changePercent: 4.89, high: 3.28, low: 3.05, volume: '320K' },
  { symbol: 'HG', name: 'Copper', nameKr: '구리', price: 4.32, change: -0.05, changePercent: -1.14, high: 4.40, low: 4.28, volume: '95K' },
  { symbol: 'EURUSD', name: 'EUR/USD', nameKr: '유로/달러', price: 1.0823, change: 0.0035, changePercent: 0.32, high: 1.0855, low: 1.0785, volume: '890K' },
  { symbol: 'USDJPY', name: 'USD/JPY', nameKr: '달러/엔', price: 150.22, change: -0.48, changePercent: -0.32, high: 150.85, low: 149.80, volume: '720K' },
  { symbol: 'GBPUSD', name: 'GBP/USD', nameKr: '파운드/달러', price: 1.2682, change: 0.0028, changePercent: 0.22, high: 1.2710, low: 1.2645, volume: '560K' },
  { symbol: 'AUDUSD', name: 'AUD/USD', nameKr: '호주달러/달러', price: 0.6518, change: -0.0042, changePercent: -0.64, high: 0.6565, low: 0.6502, volume: '410K' },
  { symbol: 'USDCAD', name: 'USD/CAD', nameKr: '달러/캐나다', price: 1.3522, change: 0.0018, changePercent: 0.13, high: 1.3548, low: 1.3495, volume: '380K' },
];

function fmtDate(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export const mockEvents: EconomicEvent[] = [
  // Today
  { id: '1', date: fmtDate(0), time: '22:30', country: '🇺🇸', name: '소비자물가지수 (CPI) (YoY)', importance: 'high', forecast: '2.9%', previous: '2.9%' },
  { id: '2', date: fmtDate(0), time: '22:30', country: '🇺🇸', name: '근원 CPI (MoM)', importance: 'high', forecast: '0.3%', previous: '0.2%' },
  { id: '3', date: fmtDate(0), time: '04:00', country: '🇺🇸', name: 'FOMC 의사록 공개', importance: 'high' },
  { id: '4', date: fmtDate(0), time: '21:15', country: '🇺🇸', name: 'ADP 비농업 고용변화', importance: 'medium', forecast: '150K', previous: '122K' },
  // Yesterday
  { id: '5', date: fmtDate(-1), time: '00:00', country: '🇨🇳', name: '무역수지', importance: 'medium', forecast: '$104.8B', previous: '$104.8B', actual: '$104.2B' },
  { id: '6', date: fmtDate(-1), time: '16:00', country: '🇬🇧', name: 'GDP (QoQ)', importance: 'low', forecast: '0.1%', previous: '0.0%', actual: '0.1%' },
  { id: '7', date: fmtDate(-1), time: '22:30', country: '🇺🇸', name: '생산자물가지수 (PPI)', importance: 'medium', forecast: '0.3%', previous: '0.2%', actual: '0.4%' },
  // Tomorrow
  { id: '8', date: fmtDate(1), time: '22:30', country: '🇺🇸', name: '소매판매 (MoM)', importance: 'high', forecast: '0.2%', previous: '-0.9%' },
  { id: '9', date: fmtDate(1), time: '22:30', country: '🇺🇸', name: '신규 실업수당 청구건수', importance: 'medium', forecast: '217K', previous: '219K' },
  { id: '10', date: fmtDate(1), time: '00:00', country: '🇦🇺', name: '고용변화', importance: 'medium', forecast: '20.0K', previous: '56.3K' },
  // Day after tomorrow
  { id: '11', date: fmtDate(2), time: '22:30', country: '🇺🇸', name: '주택착공건수', importance: 'low', forecast: '1.40M', previous: '1.50M' },
  { id: '12', date: fmtDate(2), time: '23:15', country: '🇺🇸', name: '산업생산 (MoM)', importance: 'medium', forecast: '0.3%', previous: '0.9%' },
  // 2 days ago
  { id: '13', date: fmtDate(-2), time: '18:00', country: '🇩🇪', name: 'ZEW 경기기대지수', importance: 'medium', forecast: '15.2', previous: '10.3', actual: '16.9' },
  { id: '14', date: fmtDate(-2), time: '22:30', country: '🇺🇸', name: '근원 PPI (MoM)', importance: 'medium', forecast: '0.2%', previous: '0.0%', actual: '0.3%' },
];

export function getEventsForDate(date: Date): EconomicEvent[] {
  const dateStr = date.toISOString().slice(0, 10);
  return mockEvents.filter((e) => e.date === dateStr).sort((a, b) => a.time.localeCompare(b.time));
}

export function getEventDates(): string[] {
  return [...new Set(mockEvents.map((e) => e.date))];
}

export const mockSignals: MarketSignal[] = [
  { symbol: 'NQ', nameKr: '나스닥', sentiment: 'bullish', score: 35, factors: [
    { name: 'CPI 예상 부합', impact: 'positive' }, { name: '기술주 실적 호조', impact: 'positive' },
    { name: 'FOMC 금리동결 예상', impact: 'positive' }, { name: '고용 둔화 우려', impact: 'negative' },
  ]},
  { symbol: 'ES', nameKr: 'S&P 500', sentiment: 'bullish', score: 25, factors: [
    { name: '실적 시즌 호조', impact: 'positive' }, { name: '소비자 심리 개선', impact: 'positive' },
    { name: '금리 인하 기대', impact: 'positive' }, { name: '밸류에이션 부담', impact: 'negative' },
  ]},
  { symbol: 'YM', nameKr: '다우존스', sentiment: 'neutral', score: -5, factors: [
    { name: '산업주 보합세', impact: 'neutral' }, { name: '금융주 실적 호조', impact: 'positive' },
    { name: '경기 둔화 신호', impact: 'negative' }, { name: '배당 매력 유지', impact: 'positive' },
  ]},
  { symbol: 'HSI', nameKr: '항셍', sentiment: 'bearish', score: -25, factors: [
    { name: '중국 경기 부양 기대', impact: 'positive' }, { name: '부동산 리스크 지속', impact: 'negative' },
    { name: '위안화 약세', impact: 'negative' }, { name: '무역갈등 우려', impact: 'negative' },
  ]},
  { symbol: 'NIY', nameKr: '닛케이', sentiment: 'bullish', score: 30, factors: [
    { name: '엔화 약세 수출 호재', impact: 'positive' }, { name: '기업 실적 개선', impact: 'positive' },
    { name: 'BOJ 정책 불확실성', impact: 'negative' }, { name: '외국인 매수세', impact: 'positive' },
  ]},
  { symbol: 'STOXX50E', nameKr: '유로스톡스', sentiment: 'neutral', score: 10, factors: [
    { name: 'ECB 금리 인하 기대', impact: 'positive' }, { name: '독일 경기 부진', impact: 'negative' },
    { name: '에너지 비용 안정화', impact: 'positive' }, { name: '지정학적 리스크', impact: 'negative' },
  ]},
  { symbol: 'GC', nameKr: '골드', sentiment: 'bullish', score: 55, factors: [
    { name: '안전자산 수요 증가', impact: 'positive' }, { name: '중앙은행 매입 지속', impact: 'positive' },
    { name: '인플레 헤지 수요', impact: 'positive' }, { name: '달러 강세 제한적', impact: 'neutral' },
  ]},
  { symbol: 'SI', nameKr: '은', sentiment: 'bullish', score: 40, factors: [
    { name: '귀금속 동반 상승', impact: 'positive' }, { name: '산업 수요 증가', impact: 'positive' },
    { name: '태양광 수요 확대', impact: 'positive' }, { name: '변동성 확대', impact: 'negative' },
  ]},
  { symbol: 'CL', nameKr: '오일', sentiment: 'neutral', score: -10, factors: [
    { name: 'OPEC+ 감산 유지', impact: 'positive' }, { name: '글로벌 수요 둔화', impact: 'negative' },
    { name: '미국 재고 증가', impact: 'negative' }, { name: '지정학적 리스크', impact: 'positive' },
  ]},
  { symbol: 'NG', nameKr: '천연가스', sentiment: 'bullish', score: 45, factors: [
    { name: '한파 예보 수요 증가', impact: 'positive' }, { name: '재고 감소세', impact: 'positive' },
    { name: 'LNG 수출 호조', impact: 'positive' }, { name: '생산량 증가', impact: 'negative' },
  ]},
  { symbol: 'HG', nameKr: '구리', sentiment: 'bearish', score: -20, factors: [
    { name: '중국 수요 둔화', impact: 'negative' }, { name: '재고 증가', impact: 'negative' },
    { name: '전기차 장기 수요', impact: 'positive' }, { name: '달러 강세 압력', impact: 'negative' },
  ]},
  { symbol: 'EURUSD', nameKr: '유로/달러', sentiment: 'neutral', score: 10, factors: [
    { name: 'ECB 금리 인하 기대', impact: 'negative' }, { name: '유로존 경기 회복 조짐', impact: 'positive' },
    { name: '달러 약세 전환 가능', impact: 'positive' }, { name: '정치적 불확실성', impact: 'negative' },
  ]},
  { symbol: 'USDJPY', nameKr: '달러/엔', sentiment: 'bearish', score: -15, factors: [
    { name: 'BOJ 금리 인상 기대', impact: 'negative' }, { name: '미일 금리차 축소', impact: 'negative' },
    { name: '캐리 트레이드 청산', impact: 'negative' }, { name: '안전자산 수요', impact: 'positive' },
  ]},
  { symbol: 'GBPUSD', nameKr: '파운드/달러', sentiment: 'neutral', score: 5, factors: [
    { name: 'BOE 긴축 유지', impact: 'positive' }, { name: '영국 인플레 둔화', impact: 'negative' },
    { name: '경기 연착륙 기대', impact: 'positive' }, { name: '재정 불확실성', impact: 'negative' },
  ]},
  { symbol: 'AUDUSD', nameKr: '호주달러/달러', sentiment: 'bearish', score: -25, factors: [
    { name: '중국 경기 둔화', impact: 'negative' }, { name: '철광석 가격 하락', impact: 'negative' },
    { name: 'RBA 금리 동결', impact: 'neutral' }, { name: '달러 강세 압력', impact: 'negative' },
  ]},
  { symbol: 'USDCAD', nameKr: '달러/캐나다', sentiment: 'neutral', score: 5, factors: [
    { name: '원유 가격 약세', impact: 'positive' }, { name: 'BOC 금리 인하', impact: 'positive' },
    { name: '캐나다 고용 견조', impact: 'negative' }, { name: '미국 경기 우위', impact: 'positive' },
  ]},
];
