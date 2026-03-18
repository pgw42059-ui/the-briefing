/** 기업실적 티커 → 섹터 + 색상 + Yahoo Finance URL */

export type Sector =
  | '테크' | '반도체' | '금융' | '헬스케어' | '소비재'
  | '에너지' | '산업재' | '통신' | '배터리/소재' | 'IT서비스';

const SECTOR_MAP: Record<string, Sector> = {
  // ── 미국 테크 ────────────────────────────────────────────
  AAPL: '테크', MSFT: '테크', GOOGL: '테크', AMZN: '테크',
  META: '테크', NFLX: '테크', ORCL: '테크', CRM: '테크',
  ADBE: '테크', IBM: '테크', DELL: '테크', HPE: '테크', ACN: '테크',
  // ── 미국 반도체 ──────────────────────────────────────────
  NVDA: '반도체', AMD: '반도체', INTC: '반도체',
  QCOM: '반도체', AVGO: '반도체', TXN: '반도체', MU: '반도체',
  // ── 미국 금융 ────────────────────────────────────────────
  JPM: '금융', BAC: '금융', GS: '금융', MS: '금융',
  WFC: '금융', C: '금융', BLK: '금융', V: '금융', MA: '금융',
  // ── 미국 헬스케어 ────────────────────────────────────────
  JNJ: '헬스케어', PFE: '헬스케어', UNH: '헬스케어',
  ABBV: '헬스케어', MRK: '헬스케어', AMGN: '헬스케어', GILD: '헬스케어',
  // ── 미국 소비재/유통 ─────────────────────────────────────
  WMT: '소비재', KO: '소비재', PG: '소비재', MCD: '소비재',
  SBUX: '소비재', NKE: '소비재', DIS: '소비재', HD: '소비재',
  COST: '소비재', TSLA: '소비재', LULU: '소비재', ULTA: '소비재',
  // ── 미국 에너지 ──────────────────────────────────────────
  XOM: '에너지', CVX: '에너지',
  // ── 미국 산업재 ──────────────────────────────────────────
  BA: '산업재', CAT: '산업재', GE: '산업재', FDX: '산업재',
  // ── 한국 반도체/전자 ─────────────────────────────────────
  '005930.KS': '반도체',    // 삼성전자
  '000660.KS': '반도체',    // SK하이닉스
  '009150.KS': '반도체',    // 삼성전기
  '066570.KS': '테크',      // LG전자
  // ── 한국 IT서비스 ────────────────────────────────────────
  '035420.KS': 'IT서비스',  // NAVER
  '035720.KS': 'IT서비스',  // 카카오
  // ── 한국 자동차/산업재 ───────────────────────────────────
  '005380.KS': '산업재',    // 현대차
  '000270.KS': '산업재',    // 기아
  '012330.KS': '산업재',    // 현대모비스
  // ── 한국 금융 ────────────────────────────────────────────
  '105560.KS': '금융',      // KB금융
  '055550.KS': '금융',      // 신한지주
  '086790.KS': '금융',      // 하나금융지주
  // ── 한국 헬스케어/바이오 ─────────────────────────────────
  '207940.KS': '헬스케어',  // 삼성바이오로직스
  '068270.KS': '헬스케어',  // 셀트리온
  // ── 한국 배터리/소재 ─────────────────────────────────────
  '005490.KS': '배터리/소재', // POSCO홀딩스
  '006400.KS': '배터리/소재', // 삼성SDI
  '051910.KS': '배터리/소재', // LG화학
  // ── 한국 통신 ────────────────────────────────────────────
  '017670.KS': '통신',      // SKT
  '030200.KS': '통신',      // KT
  // ── 한국 소비재 ──────────────────────────────────────────
  '051900.KS': '소비재',    // LG생활건강
};

const SECTOR_COLORS: Record<Sector, string> = {
  '테크':          'bg-blue-500/10 text-blue-400 border-blue-500/20',
  '반도체':        'bg-violet-500/10 text-violet-400 border-violet-500/20',
  '금융':          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  '헬스케어':      'bg-rose-500/10 text-rose-400 border-rose-500/20',
  '소비재':        'bg-orange-500/10 text-orange-400 border-orange-500/20',
  '에너지':        'bg-amber-500/10 text-amber-400 border-amber-500/20',
  '산업재':        'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  '통신':          'bg-teal-500/10 text-teal-400 border-teal-500/20',
  '배터리/소재':   'bg-lime-500/10 text-lime-400 border-lime-500/20',
  'IT서비스':      'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
};

export function getTickerMeta(ticker: string): { sector: Sector; colorClass: string } | null {
  const sector = SECTOR_MAP[ticker];
  if (!sector) return null;
  return { sector, colorClass: SECTOR_COLORS[sector] };
}

/** Yahoo Finance — US(.KS 없음)와 KR(.KS) 모두 지원 */
export function getTickerUrl(ticker: string): string {
  return `https://finance.yahoo.com/quote/${encodeURIComponent(ticker)}`;
}

export function isKrTicker(ticker: string): boolean {
  return ticker.endsWith('.KS') || ticker.endsWith('.KQ');
}
