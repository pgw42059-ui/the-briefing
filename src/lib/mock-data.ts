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
  revenueEstimate?: number;  // raw USD (e.g. 20237347588)
  revenueActual?: number;
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
  exchange?: string;       // 거래소
  tradingHours?: string;   // 거래 시간 (KST)
  contractSize?: string;   // 계약 단위
  tickInfo?: string;       // 틱 사이즈 / 틱 가치
  tags?: string[];         // 관련 태그
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
    description: 'Apple·Microsoft·NVIDIA 등 미국 기술·성장주 100개로 구성된 지수 선물입니다. AI·반도체·빅테크 실적에 가장 민감하게 반응하며, 금리 변화에 따른 성장주 밸류에이션 민감도가 높습니다. 경제지표 발표와 연준 발언 전후로 변동성이 극대화되는 경향이 강합니다.',
    exchange: 'CME (시카고상업거래소)',
    tradingHours: '월~금 07:00 ~ 익일 06:00 KST',
    contractSize: '$20 × 나스닥 100 지수',
    tickInfo: '최소 0.25pt = $5',
    tags: ['기술주', '빅테크', 'AI', '반도체'],
    keyLevels: { support: 21200, resistance: 21800 },
    relatedEvents: ['CPI 발표 (22:30)', 'FOMC 의사록 (04:00)', 'ADP 고용 (21:15)'],
    chartData: generateChartData(21543, 30, 0.005),
  },
  ES: {
    symbol: 'ES',
    name: 'S&P 500 E-mini Futures',
    nameKr: 'S&P 500',
    description: '미국 시가총액 상위 500개 기업을 추종하며, 세계에서 가장 유동성이 높은 지수 선물입니다. 기술·금융·헬스케어·소비재 등 전 섹터를 아울러 미국 경제 전반을 가장 잘 반영합니다. 1계약 명목 가치는 지수 × $50로 NQ보다 변동성이 낮아 기관 투자자가 선호합니다.',
    exchange: 'CME (시카고상업거래소)',
    tradingHours: '월~금 07:00 ~ 익일 06:00 KST',
    contractSize: '$50 × S&P 500 지수',
    tickInfo: '최소 0.25pt = $12.50',
    tags: ['미국 주식', '대형주', '분산투자', '헤지'],
    keyLevels: { support: 5900, resistance: 6100 },
    relatedEvents: ['CPI 발표 (22:30)', 'FOMC 의사록 (04:00)', '비농업 고용 (22:30)'],
    chartData: generateChartData(6020, 30, 0.004),
  },
  YM: {
    symbol: 'YM',
    name: 'Dow Jones E-mini Futures',
    nameKr: '다우존스',
    description: 'JPMorgan·Goldman Sachs·Boeing 등 전통 대형 우량주 30개로 구성됩니다. NQ·ES보다 기술주 비중이 낮고 금융·산업주 비중이 높아 경기 사이클에 더 민감합니다. 틱 당 $5로 비교적 낮은 자금으로 진입 가능하며, 나스닥과의 스프레드 트레이딩에도 활용됩니다.',
    exchange: 'CBOT (시카고선물거래소)',
    tradingHours: '월~금 07:00 ~ 익일 06:00 KST',
    contractSize: '$5 × 다우존스 지수',
    tickInfo: '최소 1pt = $5',
    tags: ['우량주', '전통 산업', '금융주', '경기민감'],
    keyLevels: { support: 43500, resistance: 44500 },
    relatedEvents: ['ISM 제조업 PMI', 'GDP 발표', '소매판매 (MoM)'],
    chartData: generateChartData(44000, 30, 0.004),
  },
  HSI: {
    symbol: 'HSI',
    name: 'Hang Seng Index Futures',
    nameKr: '항셍 지수',
    description: '알리바바·텐센트 등 중국 빅테크와 금융·부동산 종목 비중이 높아 중국 정책 리스크에 크게 노출됩니다. 한국 낮 시간대에 거래 가능한 주요 아시아 선물로, 아시아 시장 개장 시 글로벌 심리를 가늠하는 지표로 활용됩니다. 위안화 기준환율과 높은 상관관계를 보입니다.',
    exchange: 'HKEX (홍콩거래소)',
    tradingHours: '10:15~13:00, 14:30~17:00, 18:15~21:00 KST',
    contractSize: 'HKD 50 × 항셍 지수',
    tickInfo: '최소 1pt = HKD 50',
    tags: ['중국 경제', '홍콩', '아시아', '신흥시장'],
    keyLevels: { support: 20600, resistance: 21200 },
    relatedEvents: ['중국 무역수지 (00:00)', '위안화 기준환율 발표'],
    chartData: generateChartData(20893, 30, 0.006),
  },
  NIY: {
    symbol: 'NIY',
    name: 'Nikkei 225 Futures (Dollar)',
    nameKr: '닛케이 225',
    description: 'Toyota·Sony·SoftBank 등 일본 대표 기업 225개를 달러로 거래하는 CME 상장 선물입니다. BOJ의 금리 정책 변화와 엔화 방향이 가격에 직접 영향을 미칩니다. 엔저(엔화 약세) 국면에서는 수출 기업 실적 기대로 지수가 상승하는 경향이 강합니다.',
    exchange: 'CME (시카고상업거래소)',
    tradingHours: '월~금 07:00 ~ 익일 06:00 KST',
    contractSize: '$5 × 닛케이 225 지수',
    tickInfo: '최소 5pt = $25',
    tags: ['일본 주식', '엔화', 'BOJ', '수출주'],
    keyLevels: { support: 38000, resistance: 40000 },
    relatedEvents: ['BOJ 금리결정', '일본 GDP 발표', '엔화 환율 동향'],
    chartData: generateChartData(39200, 30, 0.005),
  },
  STOXX50E: {
    symbol: 'STOXX50E',
    name: 'Euro Stoxx 50',
    nameKr: '유로스톡스 50',
    description: 'LVMH·SAP·ASML 등 유로존 12개국 대형주 50개로 구성됩니다. ECB 금리 결정·독일 경기 지표·유로화 강약에 민감하게 반응합니다. 미국 지수 대비 밸류에이션이 낮고 배당 수익률이 높아 유럽 가치주 투자의 기준 지수로 활용됩니다.',
    exchange: 'Eurex (유렉스 거래소)',
    tradingHours: '월~금 09:00 ~ 23:00 KST',
    contractSize: '€10 × 유로스톡스 50 지수',
    tickInfo: '최소 1pt = €10',
    tags: ['유럽 주식', 'ECB', '유로존', '가치주'],
    keyLevels: { support: 4800, resistance: 5100 },
    relatedEvents: ['ECB 금리결정', '유로존 PMI', '독일 ZEW 경기기대지수'],
    chartData: generateChartData(4950, 30, 0.004),
  },
  GC: {
    symbol: 'GC',
    name: 'Gold Futures (COMEX)',
    nameKr: '골드',
    description: '대표적인 안전자산이자 인플레이션 헤지 수단입니다. 달러 인덱스(DXY)와 역상관 관계를 보이며, 실질 금리(명목 금리 - 기대 인플레이션) 하락 시 상승 압력이 강해집니다. 지정학적 긴장·중앙은행 매수·달러 신뢰도 위기 시 수요가 급증하며, 최근 중앙은행들의 금 매수 확대가 장기 지지 요인으로 작용하고 있습니다.',
    exchange: 'COMEX (뉴욕상품거래소)',
    tradingHours: '월~금 07:00 ~ 익일 06:00 KST',
    contractSize: '100 트로이온스',
    tickInfo: '최소 $0.10/온스 = $10',
    tags: ['안전자산', '인플레이션 헤지', '달러 역상관', '중앙은행'],
    keyLevels: { support: 2900, resistance: 2960 },
    relatedEvents: ['CPI 발표 (22:30)', 'FOMC 의사록 (04:00)', '달러 인덱스 동향'],
    chartData: generateChartData(2948, 30, 0.003),
  },
  SI: {
    symbol: 'SI',
    name: 'Silver Futures (COMEX)',
    nameKr: '은',
    description: '귀금속이자 산업금속의 이중적 성격을 가집니다. 금의 20~80배 변동성으로 추세 장세에서 금보다 큰 수익률이 가능합니다. 태양광 패널·전기차 배터리·반도체 제조에 필수적인 산업 수요가 장기 지지 요인이며, 금/은 비율(Gold-Silver Ratio)이 80 이상이면 역사적으로 은의 상대적 저평가 구간으로 분류됩니다.',
    exchange: 'COMEX (뉴욕상품거래소)',
    tradingHours: '월~금 07:00 ~ 익일 06:00 KST',
    contractSize: '5,000 트로이온스',
    tickInfo: '최소 $0.005/온스 = $25',
    tags: ['귀금속', '산업금속', '태양광', '전기차'],
    keyLevels: { support: 31.5, resistance: 34.0 },
    relatedEvents: ['CPI 발표', '달러 인덱스 동향', '산업생산 데이터'],
    chartData: generateChartData(32.8, 30, 0.006),
  },
  CL: {
    symbol: 'CL',
    name: 'WTI Crude Oil Futures',
    nameKr: '크루드 오일',
    description: 'WTI 원유 선물은 글로벌 에너지 시장의 기준 가격입니다. OPEC+ 감산·증산 결정·미국 원유 재고(EIA 주간 보고)·중동 지정학 리스크·달러 강약이 주요 가격 변수입니다. 에너지·항공·해운·화학 등 실물 경제 전반에 영향을 미쳐 경기 방향을 선행하는 지표로도 활용됩니다.',
    exchange: 'NYMEX (뉴욕상업거래소)',
    tradingHours: '월~금 07:00 ~ 익일 06:00 KST',
    contractSize: '1,000 배럴',
    tickInfo: '최소 $0.01/배럴 = $10',
    tags: ['에너지', 'OPEC+', '지정학', '인플레이션'],
    keyLevels: { support: 70.5, resistance: 73.0 },
    relatedEvents: ['EIA 원유재고 발표', 'OPEC+ 회의 동향', '미국 생산량 데이터'],
    chartData: generateChartData(71.28, 30, 0.008),
  },
  NG: {
    symbol: 'NG',
    name: 'Natural Gas Futures',
    nameKr: '천연가스',
    description: '에너지 선물 중 가장 변동성이 높습니다. 겨울 난방·여름 냉방 수요·주간 EIA 재고·생산량·LNG 수출 물량이 핵심 변수입니다. 계절 요인으로 10~1월 강세 패턴을 보이는 경우가 많으며, 날씨 예보 변화에도 단기 급등락이 발생합니다. 높은 변동성으로 단기 트레이딩에서 활용됩니다.',
    exchange: 'NYMEX (뉴욕상업거래소)',
    tradingHours: '월~금 07:00 ~ 익일 06:00 KST',
    contractSize: '10,000 MMBtu',
    tickInfo: '최소 $0.001/MMBtu = $10',
    tags: ['에너지', '계절성', '재고', '고변동성'],
    keyLevels: { support: 2.8, resistance: 3.6 },
    relatedEvents: ['EIA 천연가스 재고', '기상 전망', '미국 생산량 데이터'],
    chartData: generateChartData(3.2, 30, 0.015),
  },
  HG: {
    symbol: 'HG',
    name: 'Copper Futures (COMEX)',
    nameKr: '구리',
    description: '\'닥터 코퍼(Dr. Copper)\'라는 별명처럼 글로벌 경기를 선행하는 지표입니다. 중국이 세계 구리 소비의 약 55%를 차지하므로 중국 PMI·부동산 정책에 특히 민감합니다. 전기차·재생에너지·AI 데이터센터 인프라 확대로 장기 구조적 수요 증가가 기대되는 전략 금속입니다.',
    exchange: 'COMEX (뉴욕상품거래소)',
    tradingHours: '월~금 07:00 ~ 익일 06:00 KST',
    contractSize: '25,000 파운드',
    tickInfo: '최소 $0.0005/파운드 = $12.50',
    tags: ['산업금속', '경기선행', '전기차', '중국 연동'],
    keyLevels: { support: 4.1, resistance: 4.5 },
    relatedEvents: ['중국 PMI 발표', '미국 건설지출', '글로벌 재고 데이터'],
    chartData: generateChartData(4.3, 30, 0.006),
  },
  EURUSD: {
    symbol: 'EURUSD',
    name: 'EUR/USD',
    nameKr: '유로/달러',
    description: '하루 거래량 1조 달러 이상의 세계 최대 거래량 통화쌍입니다. ECB와 Fed의 금리 격차, 유로존·미국 경제 지표 서프라이즈가 방향을 결정합니다. EUR이 기준 통화(앞)이므로 상승=유로 강세·달러 약세, 하락=유로 약세·달러 강세를 의미합니다.',
    exchange: 'CME / OTC 외환시장',
    tradingHours: '24시간 (월 07:00 ~ 토 07:00 KST)',
    contractSize: '€125,000 (CME 표준)',
    tickInfo: '최소 0.00005 = $6.25',
    tags: ['메이저 통화쌍', 'ECB vs Fed', '유로존', '달러'],
    keyLevels: { support: 1.0700, resistance: 1.0950 },
    relatedEvents: ['ECB 금리결정', 'FOMC 금리결정', '비농업 고용 발표'],
    chartData: generateChartData(1.0820, 30, 0.002),
  },
  USDJPY: {
    symbol: 'USDJPY',
    name: 'USD/JPY',
    nameKr: '달러/엔',
    description: '미일 금리차 확대 시 달러 강세 방향으로 움직이는 구조입니다. BOJ가 초저금리를 유지하는 동안 엔 캐리 트레이드(엔 빌려 고수익 자산 매수)가 확대되고, 리스크오프 시 급격한 엔 강세가 발생할 수 있습니다. 글로벌 위기 시 안전통화인 엔 수요가 급증하는 경향이 있습니다.',
    exchange: 'CME / OTC 외환시장',
    tradingHours: '24시간 (월 07:00 ~ 토 07:00 KST)',
    contractSize: '¥12,500,000 (CME 표준)',
    tickInfo: '최소 0.0001 = ¥1,250',
    tags: ['캐리 트레이드', 'BOJ', '안전통화', '금리차'],
    keyLevels: { support: 148.0, resistance: 152.0 },
    relatedEvents: ['BOJ 금리결정', 'FOMC 금리결정', '일본 CPI 발표'],
    chartData: generateChartData(150.2, 30, 0.003),
  },
  GBPUSD: {
    symbol: 'GBPUSD',
    name: 'GBP/USD',
    nameKr: '파운드/달러',
    description: '영국 경제 지표와 BOE 금리 결정에 민감합니다. \'케이블\'이라는 별명으로 불리며 유동성이 높고 일중 변동폭이 큰 편입니다. 브렉시트 이후 EU와의 무역 관계·영국 재정 건전성에 대한 시장 신뢰도가 중요한 추가 변수로 작용합니다.',
    exchange: 'CME / OTC 외환시장',
    tradingHours: '24시간 (월 07:00 ~ 토 07:00 KST)',
    contractSize: '£62,500 (CME 표준)',
    tickInfo: '최소 0.0001 = $6.25',
    tags: ['파운드', 'BOE', '영국 경제', '케이블'],
    keyLevels: { support: 1.2550, resistance: 1.2800 },
    relatedEvents: ['BOE 금리결정', '영국 CPI 발표', '영국 GDP 발표'],
    chartData: generateChartData(1.2680, 30, 0.003),
  },
  AUDUSD: {
    symbol: 'AUDUSD',
    name: 'AUD/USD',
    nameKr: '호주달러/달러',
    description: '철광석·석탄·천연가스 등 원자재 수출에 의존하는 호주 경제를 반영합니다. 중국 제조업 PMI와 원자재 가격 상승 시 AUD 강세 경향이 강합니다. RBA 금리 결정과 중국 경기 서프라이즈가 단기 방향을 좌우하는 핵심 변수로, 위험선호 심리와 높은 상관관계를 보입니다.',
    exchange: 'CME / OTC 외환시장',
    tradingHours: '24시간 (월 07:00 ~ 토 07:00 KST)',
    contractSize: 'A$100,000 (CME 표준)',
    tickInfo: '최소 0.0001 = $10',
    tags: ['원자재 통화', 'RBA', '중국 연동', '위험선호'],
    keyLevels: { support: 0.6400, resistance: 0.6650 },
    relatedEvents: ['RBA 금리결정', '호주 고용 발표', '중국 PMI 발표'],
    chartData: generateChartData(0.6520, 30, 0.003),
  },
  USDCAD: {
    symbol: 'USDCAD',
    name: 'USD/CAD',
    nameKr: '달러/캐나다',
    description: '원유 수출국인 캐나다 경제 특성상 WTI 유가와 역의 상관관계를 보입니다(유가 상승 → CAD 강세 → USDCAD 하락). BOC 금리 결정과 캐나다 고용 지표·미-캐나다 무역 관계도 중요한 변수입니다. 낮은 스프레드와 높은 유동성으로 거래 비용이 저렴한 편입니다.',
    exchange: 'CME / OTC 외환시장',
    tradingHours: '24시간 (월 07:00 ~ 토 07:00 KST)',
    contractSize: 'C$100,000 (CME 표준)',
    tickInfo: '최소 0.0001 = $10',
    tags: ['원유 연동', 'BOC', '캐나다 경제', '달러'],
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
