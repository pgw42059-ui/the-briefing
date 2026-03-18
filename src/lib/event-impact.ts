/**
 * 경제지표 이름 → 영향 받는 선물 종목 매핑
 * 이름에 키워드가 포함되면 해당 종목 배지를 표시 (거시경제 이벤트 전용)
 */
const IMPACT_MAP: [RegExp, string[]][] = [
  [/CPI|Consumer Price|Core PCE|PCE Deflator|소비자물가|인플레/i,                     ['NQ', 'ES', 'GC']],
  [/PCE|Personal Consumption Expenditure/i,                                            ['NQ', 'ES', 'GC']],
  [/PPI|Producer Price|생산자물가/i,                                                   ['NQ', 'ES', 'GC']],
  [/FOMC|Fed Rate|Interest Rate Decision|Federal Reserve|파월|Powell|Beige Book|Jackson Hole|잭슨홀|금리 결정/i, ['NQ', 'ES', 'GC', 'CL']],
  [/Non-?Farm|NFP|비농업|Nonfarm Payroll/i,                                            ['NQ', 'ES']],
  [/Unemployment|실업률|Jobless Claims|실업수당|ADP|JOLTS|Job Opening/i,               ['NQ', 'ES']],
  [/GDP|Gross Domestic|국내총생산/i,                                                   ['NQ', 'ES', 'CL']],
  [/Retail Sales|소매판매/i,                                                           ['NQ', 'ES']],
  [/ISM|PMI|구매관리자/i,                                                              ['NQ', 'ES', 'CL']],
  [/Crude Oil|Oil Inventor|EIA Petroleum|Petroleum Status|원유재고/i,                  ['CL']],
  [/Natural Gas.*Storage|Gas Storage|천연가스.*재고/i,                                 ['NG']],
  [/Michigan|Consumer Sentiment|Consumer Confidence|소비자.*신뢰|소비심리/i,           ['NQ', 'ES']],
  [/Durable Goods|내구재/i,                                                            ['NQ', 'ES']],
  [/Housing Start|Home Sales|Building Permit|주택/i,                                  ['NQ', 'ES']],
  [/Trade Balance|무역수지/i,                                                          ['NQ', 'ES']],
  [/Treasury Auction|국채 입찰/i,                                                      ['NQ', 'ES', 'GC']],
];

// 이름당 최대 1회 매치 → 모듈 레벨 캐시로 중복 계산 방지
const impactCache = new Map<string, string[]>();

export function getEventImpact(name: string): string[] {
  const cached = impactCache.get(name);
  if (cached) return cached;

  for (const [pattern, symbols] of IMPACT_MAP) {
    if (pattern.test(name)) {
      impactCache.set(name, symbols);
      return symbols;
    }
  }
  impactCache.set(name, []);
  return [];
}
