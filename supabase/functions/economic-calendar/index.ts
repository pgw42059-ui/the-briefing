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

  // === 독일 ===
  'German Final CPI m/m': '독일 최종 소비자물가지수 (MoM)',
  'German Final CPI y/y': '독일 최종 소비자물가지수 (YoY)',
  'German CPI m/m': '독일 소비자물가지수 (MoM)',
  'German CPI y/y': '독일 소비자물가지수 (YoY)',
  'German Flash CPI m/m': '독일 소비자물가지수 속보치 (MoM)',
  'German Ifo Business Climate': '독일 Ifo 기업환경지수',
  'German GDP q/q': '독일 GDP (QoQ)',
  'German GDP y/y': '독일 GDP (YoY)',
  'German GDP m/m': '독일 GDP (MoM)',
  'German Prelim GDP q/q': '독일 GDP 속보치 (QoQ)',
  'German Final GDP q/q': '독일 GDP 확정치 (QoQ)',
  'German Trade Balance': '독일 무역수지',
  'German Unemployment Change': '독일 실업자수 변화',
  'German Unemployment Rate': '독일 실업률',
  'German Retail Sales m/m': '독일 소매판매 (MoM)',
  'German Industrial Production m/m': '독일 산업생산 (MoM)',
  'German Manufacturing Orders m/m': '독일 제조업 수주 (MoM)',
  'German Buba Monthly Report': '독일 분데스방크 월례보고서',
  'German Factory Orders m/m': '독일 공장주문 (MoM)',
  'German Construction PMI': '독일 건설업 PMI',
  'German WPI m/m': '독일 도매물가지수 (MoM)',
  'German ZEW Economic Sentiment': '독일 ZEW 경기기대지수',

  // === 프랑스 ===
  'French Final CPI m/m': '프랑스 최종 소비자물가지수 (MoM)',
  'French CPI m/m': '프랑스 소비자물가지수 (MoM)',
  'French Flash CPI m/m': '프랑스 소비자물가지수 속보치 (MoM)',
  'French Industrial Production m/m': '프랑스 산업생산 (MoM)',
  'French GDP q/q': '프랑스 GDP (QoQ)',
  'French Trade Balance': '프랑스 무역수지',
  'French Budget Balance': '프랑스 재정수지',
  'French Consumer Spending m/m': '프랑스 소비지출 (MoM)',
  'French Manufacturing PMI': '프랑스 제조업 PMI',
  'French Services PMI': '프랑스 서비스업 PMI',

  // === 스페인 ===
  'Spanish Flash CPI y/y': '스페인 소비자물가지수 속보치 (YoY)',
  'Spanish CPI y/y': '스페인 소비자물가지수 (YoY)',
  'Spanish GDP q/q': '스페인 GDP (QoQ)',
  'Spanish Unemployment Rate': '스페인 실업률',
  'Spanish Manufacturing PMI': '스페인 제조업 PMI',

  // === 이탈리아 ===
  'Italian CPI m/m': '이탈리아 소비자물가지수 (MoM)',
  'Italian Final CPI m/m': '이탈리아 최종 소비자물가지수 (MoM)',
  'Italian GDP q/q': '이탈리아 GDP (QoQ)',
  'Italian Trade Balance': '이탈리아 무역수지',
  'Italian Manufacturing PMI': '이탈리아 제조업 PMI',

  // === 유로존 전체 ===
  'Flash CPI y/y': '소비자물가지수 속보치 (YoY)',
  'Flash Core CPI y/y': '근원 소비자물가지수 속보치 (YoY)',
  'Final CPI y/y': '소비자물가지수 확정치 (YoY)',
  'Final CPI m/m': '소비자물가지수 확정치 (MoM)',
  'Final Core CPI y/y': '근원 소비자물가지수 확정치 (YoY)',
  'Flash GDP q/q': 'GDP 속보치 (QoQ)',
  'Revised GDP q/q': 'GDP 수정치 (QoQ)',
  'Revised GDP y/y': 'GDP 수정치 (YoY)',
  'Prelim Flash GDP q/q': 'GDP 예비 속보치 (QoQ)',
  'ZEW Economic Sentiment Index': 'ZEW 경기기대지수',
  'EU Economic Forecasts': 'EU 경제전망',

  // === 영국 ===
  'BOE Inflation Report': 'BOE 인플레이션 보고서',
  'BOE Financial Stability Report': 'BOE 금융안정보고서',
  'BOE MPC Summary': 'BOE MPC 요약',
  'BOE Monetary Policy Report': 'BOE 통화정책보고서',
  'Claimant Count Change': '실업급여 청구건수 변화',
  'Average Earnings Index 3m/y': '평균 임금지수 (3개월/YoY)',
  'BRC Retail Sales Monitor y/y': 'BRC 소매판매 (YoY)',
  'Halifax HPI m/m': '핼리팩스 주택가격지수 (MoM)',
  'Nationwide HPI m/m': '나이션와이드 주택가격지수 (MoM)',
  'GfK Consumer Confidence': 'GfK 소비자 신뢰지수',
  'UK GDP m/m': '영국 GDP (MoM)',
  'UK GDP q/q': '영국 GDP (QoQ)',
  'UK GDP y/y': '영국 GDP (YoY)',

  // === 스위스 ===
  'Swiss CPI m/m': '스위스 소비자물가지수 (MoM)',
  'Swiss GDP q/q': '스위스 GDP (QoQ)',
  'Swiss Trade Balance': '스위스 무역수지',
  'Swiss Retail Sales y/y': '스위스 소매판매 (YoY)',
  'Swiss KOF Economic Barometer': '스위스 KOF 경기지수',

  // === 호주 ===
  'Westpac Consumer Sentiment': '웨스트팩 소비자심리지수',
  'Westpac Consumer Sentiment m/m': '웨스트팩 소비자심리 (MoM)',
  'NAB Business Confidence': 'NAB 기업신뢰지수',
  'Building Approvals m/m': '건축허가 (MoM)',
  'RBA Rate Statement': 'RBA 금리 성명서',
  'RBA Trimmed Mean CPI q/q': 'RBA 근원 소비자물가지수 (QoQ)',
  'Private Capital Expenditure q/q': '민간 설비투자 (QoQ)',
  'Private Sector Credit m/m': '민간 신용 (MoM)',
  'Retail Sales m/m': '소매판매 (MoM)',
  'Trade Balance (AUD)': '무역수지',
  'CPI q/q': '소비자물가지수 (QoQ)',
  'CPI y/y (AUD)': '소비자물가지수 (YoY)',

  // === 뉴질랜드 ===
  'GDT Price Index': 'GDT 유제품가격지수',
  'NZIER Business Confidence': 'NZIER 기업신뢰지수',
  'RBNZ Rate Statement': 'RBNZ 금리 성명서',
  'RBNZ Monetary Policy Statement': 'RBNZ 통화정책 성명서',
  'Official Cash Rate': 'RBNZ 기준금리',
  'ANZ Business Confidence': 'ANZ 기업신뢰지수',

  // === 캐나다 ===
  'BOC Rate Statement': 'BOC 금리 성명서',
  'BOC Monetary Policy Report': 'BOC 통화정책보고서',
  'BOC Press Conference': 'BOC 기자회견',
  'Ivey PMI': '아이비 PMI',
  'RMPI m/m': '원자재물가지수 (MoM)',
  'IPPI m/m': '공산품물가지수 (MoM)',

  // === 미국 추가 ===
  'Empire State Manufacturing Index': '엠파이어스테이트 제조업지수',
  'Philly Fed Manufacturing Index': '필라델피아 연준 제조업지수',
  'Philadelphia Fed Manufacturing Index': '필라델피아 연준 제조업지수',
  'Challenger Job Cuts y/y': '챌린저 감원 (YoY)',
  'Chicago PMI': '시카고 PMI',
  'Revised UoM Inflation Expectations': '미시간대 인플레 기대 수정치',
  'IBD/TIPP Economic Optimism': 'IBD/TIPP 경제낙관지수',
  'Wholesale Inventories m/m': '도매재고 (MoM)',
  'Advance Retail Sales m/m': '소매판매 사전치 (MoM)',
  'Advance Core Retail Sales m/m': '근원 소매판매 사전치 (MoM)',
  'Flash Manufacturing PMI (US)': '제조업 PMI 속보치',
  'Flash Services PMI (US)': '서비스업 PMI 속보치',
  'Final Manufacturing PMI': '제조업 PMI 확정치',
  'Final Services PMI': '서비스업 PMI 확정치',
  'S&P/CS Composite-20 HPI y/y': 'S&P/케이스-쉴러 주택가격 (YoY)',
  'CB Leading Index m/m': 'CB 경기선행지수 (MoM)',
  'JOLTS Job Openings': 'JOLTS 구인건수',
  'Treasury Currency Report': '재무부 환율보고서',
  'Fed Stress Test Results': '연준 스트레스테스트 결과',
  'Beige Book': '연준 베이지북',
  'President Trump Speaks': '트럼프 대통령 발언',

  // === 일본 추가 ===
  'National Core CPI y/y': '전국 근원 소비자물가지수 (YoY)',
  'Tokyo Core CPI y/y': '도쿄 근원 소비자물가지수 (YoY)',
  'Tokyo CPI y/y': '도쿄 소비자물가지수 (YoY)',
  'Tankan Large Manufacturers Index': '단칸 대기업 제조업지수',
  'Tankan Large Non-Manufacturers Index': '단칸 대기업 비제조업지수',
  'Tertiary Industry Activity m/m': '3차 산업활동지수 (MoM)',
  'Trade Balance (JPY)': '무역수지',
  'BOJ Summary of Opinions': 'BOJ 의견 요약',
  'BOJ Core CPI y/y': 'BOJ 근원 소비자물가지수 (YoY)',

  // === 중국 추가 ===
  'Caixin Manufacturing PMI': '차이신 제조업 PMI',
  'Caixin Services PMI': '차이신 서비스업 PMI',
  'NBS Manufacturing PMI': 'NBS 제조업 PMI',
  'NBS Non-Manufacturing PMI': 'NBS 비제조업 PMI',
  'FDI (YTD) y/y': '외국인직접투자 (YTD YoY)',
  'Chinese CPI y/y': '중국 소비자물가지수 (YoY)',
  'Chinese PPI y/y': '중국 생산자물가지수 (YoY)',
  'Chinese Industrial Production y/y': '중국 산업생산 (YoY)',
  'Chinese Retail Sales y/y': '중국 소매판매 (YoY)',
  'Chinese Fixed Asset Investment ytd/y': '중국 고정자산투자 (YTD YoY)',

  // === 국채입찰 추가 ===
  '10-y Note Auction': '10년물 국채입찰',
  '30-y Bond Auction (US)': '30년물 국채입찰',
  '2-y Note Auction': '2년물 국채입찰',
  '5-y Note Auction': '5년물 국채입찰',
  '7-y Note Auction': '7년물 국채입찰',
  '3-y Note Auction': '3년물 국채입찰',
  '10-y TIPS Auction': '10년물 TIPS 입찰',
  '30-y TIPS Auction': '30년물 TIPS 입찰',

  // === 회의록 / 보고서 ===
  'RBA Meeting Minutes': 'RBA 통화정책 회의록',
  'BOJ Meeting Minutes': 'BOJ 통화정책 회의록',
  'BOE Meeting Minutes': 'BOE 통화정책 회의록',
  'ECB Meeting Accounts': 'ECB 통화정책 회의록',
  'FOMC Meeting Minutes': 'FOMC 의사록',
  'RBA Financial Stability Review': 'RBA 금융안정보고서',
  'RBA Quarterly Statement on Monetary Policy': 'RBA 분기 통화정책 보고서',
  'RBNZ Financial Stability Report': 'RBNZ 금융안정보고서',
  'SNB Quarterly Bulletin': 'SNB 분기 보고서',

  // === 뉴질랜드 추가 ===
  'RBNZ Gov Orr Speaks': 'RBNZ 오르 총재 연설',
  'Visitor Arrivals m/m': '해외방문자수 (MoM)',
  'NZ ANZ Business Confidence': 'NZ ANZ 기업신뢰지수',
  'Credit Card Spending m/m': '신용카드 지출 (MoM)',

  // === 미국 추가 2 ===
  'Treasury Secretary Bessent Speaks': '베센트 재무장관 발언',
  'Fed Governor Waller Speaks': '월러 연준 이사 연설',
  'Consumer Confidence Index': '소비자 신뢰지수',
  'S&P Global Manufacturing PMI': 'S&P 글로벌 제조업 PMI',
  'S&P Global Services PMI': 'S&P 글로벌 서비스업 PMI',
  'S&P Global Composite PMI': 'S&P 글로벌 복합 PMI',
  'Richmond Manufacturing Index': '리치몬드 연준 제조업지수',
  'Dallas Fed Manufacturing Index': '댈러스 연준 제조업지수',
  'Kansas City Fed Manufacturing Index': '캔자스시티 연준 제조업지수',
  'Atlanta Fed GDPNow': 'Atlanta Fed GDPNow',
  'Import Prices m/m': '수입물가지수 (MoM)',
  'Export Prices m/m': '수출물가지수 (MoM)',
  'Capacity Utilization Rate': '설비가동률',
  'Business Inventories m/m': '기업재고 (MoM)',
  'Labor Costs q/q': '단위 노동비용 (QoQ)',
  'Nonfarm Productivity q/q': '비농업 생산성 (QoQ)',
  'Consumer Spending m/m': '소비지출 (MoM)',
  'Personal Income m/m': '개인소득 (MoM)',

  // === 캐나다 추가 ===
  'Employment Change': '고용변화',
  'Unemployment Rate': '실업률',
  'Raw Materials Price Index m/m': '원자재물가지수 (MoM)',
  'Building Permits m/m': '건축허가 (MoM)',
  'Wholesale Sales m/m': '도매판매 (MoM)',
  'Manufacturing Sales m/m': '제조업 판매 (MoM)',
  'Housing Starts': '주택착공건수',
  'Current Account': '경상수지',

  // === 독일/유로존 추가 ===
  'German Final Manufacturing PMI': '독일 제조업 PMI 확정치',
  'German Final Services PMI': '독일 서비스업 PMI 확정치',
  'German Import Prices m/m': '독일 수입물가지수 (MoM)',
  'German GFK Consumer Climate': '독일 GfK 소비자 기후지수',
  'Eurogroup Meetings': '유로그룹 회의',
  'ECOFIN Meetings': 'EU 재무장관회의',
  'Italian Budget Balance': '이탈리아 재정수지',
  'Italian HICP m/m': '이탈리아 유럽조화 소비자물가지수 (MoM)',
  'Eurozone Final Manufacturing PMI': '유로존 제조업 PMI 확정치',
  'Eurozone Final Services PMI': '유로존 서비스업 PMI 확정치',
  'Eurozone Current Account': '유로존 경상수지',
  'Eurozone Trade Balance': '유로존 무역수지',

  // === 일본 추가 2 ===
  'SPPI y/y': '서비스업생산자물가지수 (YoY)',
  'Monetary Policy Meeting Minutes': '통화정책회의 의사록',
  'Adjusted Merchandise Trade Balance': '상품 무역수지 (계절조정)',
  'Industrial Production m/m': '산업생산 (MoM)',
  'Capacity Utilization m/m': '설비가동률 (MoM)',
  'Core Machinery Orders m/m': '핵심 기계주문 (MoM)',
  'Household Confidence': '가계 신뢰지수',
  'Housing Starts y/y': '주택착공 (YoY)',
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
  [/^German Buba (.+) Speaks$/, '독일 분데스방크 $1 연설'],
  [/^Gov Council Member (.+) Speaks$/, 'ECB 정책위원 $1 연설'],
  [/^RBNZ Gov (.+) Speaks$/, 'RBNZ 총재 $1 연설'],
  [/^RBNZ (.+) Speaks$/, 'RBNZ $1 연설'],
  [/^Treasury Secretary (.+) Speaks$/, '재무장관 $1 발언'],
  [/^Fed (.+) Speaks$/, '연준 $1 연설'],
  [/^ECB (.+) Speaks$/, 'ECB $1 연설'],
  [/^(.+) Testifies$/, '$1 의회 증언'],
  [/^BOC Summary of Deliberations$/, 'BOC 정책결정 요약'],
  [/^(.+) Speaks$/, '$1 연설'],
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
