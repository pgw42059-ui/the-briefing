/**
 * SPA Static Route Generator
 *
 * GitHub Pages는 /asset/nq 같은 경로에 실제 파일이 없으면 HTTP 404를 반환합니다.
 * 이 스크립트는 빌드 후 dist/index.html을 각 라우트 경로에 복사하되,
 * 각 페이지별 고유한 메타데이터(canonical, title, description, OG)를 주입합니다.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const SRC  = join(DIST, 'index.html');

// 각 자산별 메타데이터 (symbol은 라우트 경로용 소문자)
const ASSETS = [
  { symbol: 'nq',       nameKr: '나스닥 100',     nameEn: 'NASDAQ 100 E-mini Futures', category: '주가지수 선물' },
  { symbol: 'es',       nameKr: 'S&P 500',        nameEn: 'S&P 500 E-mini Futures',    category: '주가지수 선물' },
  { symbol: 'ym',       nameKr: '다우존스',        nameEn: 'Dow Jones E-mini Futures',  category: '주가지수 선물' },
  { symbol: 'hsi',      nameKr: '항셍 지수',       nameEn: 'Hang Seng Index Futures',   category: '주가지수 선물' },
  { symbol: 'niy',      nameKr: '닛케이 225',      nameEn: 'Nikkei 225 Futures',        category: '주가지수 선물' },
  { symbol: 'stoxx50e', nameKr: '유로스톡스 50',   nameEn: 'Euro Stoxx 50',             category: '주가지수 선물' },
  { symbol: 'vix',      nameKr: 'VIX 공포지수',    nameEn: 'CBOE Volatility Index',     category: '변동성 지수' },
  { symbol: 'gc',       nameKr: '골드',            nameEn: 'Gold Futures (COMEX)',       category: '원자재 선물' },
  { symbol: 'si',       nameKr: '은',              nameEn: 'Silver Futures (COMEX)',     category: '원자재 선물' },
  { symbol: 'cl',       nameKr: '크루드 오일',     nameEn: 'WTI Crude Oil Futures',     category: '원자재 선물' },
  { symbol: 'ng',       nameKr: '천연가스',        nameEn: 'Natural Gas Futures',        category: '원자재 선물' },
  { symbol: 'hg',       nameKr: '구리',            nameEn: 'Copper Futures (COMEX)',     category: '원자재 선물' },
  { symbol: 'eurusd',   nameKr: '유로/달러',       nameEn: 'EUR/USD',                   category: 'FX 선물' },
  { symbol: 'usdjpy',   nameKr: '달러/엔',         nameEn: 'USD/JPY',                   category: 'FX 선물' },
  { symbol: 'gbpusd',   nameKr: '파운드/달러',     nameEn: 'GBP/USD',                   category: 'FX 선물' },
  { symbol: 'audusd',   nameKr: '호주달러/달러',   nameEn: 'AUD/USD',                   category: 'FX 선물' },
  { symbol: 'usdcad',   nameKr: '달러/캐나다',     nameEn: 'USD/CAD',                   category: 'FX 선물' },
  { symbol: 'dxy',      nameKr: '달러인덱스',      nameEn: 'US Dollar Index',           category: 'FX' },
];

// 추가 정적 라우트 (메타데이터 주입 없이 단순 복사)
const EXTRA_ROUTES = ['auth', 'install'];

// 페이지별 메타데이터
const PAGE_METAS = {
  calculator: {
    title: '선물 트레이더 계산기 — 틱 손익·포지션 사이징·환율 변환 · 랩메린이',
    description: '선물 트레이딩 필수 계산기. NQ·ES·GC 등 12개 종목 틱 손익 계산, 수수료 포함 순수익, 포지션 사이징(계좌 리스크 기반 권장 계약수), 실시간 환율 변환을 한 번에.',
    url: 'https://lab.merini.com/calculator',
  },
  calendar: {
    title: '경제지표 발표 일정 2025 — 미국 주요 지표 캘린더 · 랩메린이',
    description: '2025년 미국 경제지표 발표 일정. CPI, FOMC, NFP, PCE, GDP 등 주요 거시경제 지표와 기업실적 발표 일정을 실시간으로 확인하세요. 선물 트레이더를 위한 영향 종목(NQ·ES·GC·CL) 안내 포함.',
    url: 'https://lab.merini.com/calendar',
  },
};

if (!existsSync(SRC)) {
  console.error('❌ dist/index.html not found. Run `npm run build` first.');
  process.exit(1);
}

const baseHtml = readFileSync(SRC, 'utf-8');
let count = 0;

// 공통 메타 주입 함수 — asset 페이지와 독립 페이지 모두 사용
function injectPageMeta(html, { title, description, url }) {
  return html
    .replace(/<title>[^<]*<\/title>/,                            `<title>${title}</title>`)
    .replace(/<meta name="description" content="[^"]*"/,         `<meta name="description" content="${description}"`)
    .replace(/<link rel="canonical" href="[^"]*"/,               `<link rel="canonical" href="${url}"`)
    .replace(/<link rel="alternate" hreflang="ko" href="[^"]*"/, `<link rel="alternate" hreflang="ko" href="${url}"`)
    .replace(/<link rel="alternate" hreflang="x-default" href="[^"]*"/, `<link rel="alternate" hreflang="x-default" href="${url}"`)
    .replace(/<meta property="og:title" content="[^"]*"/,        `<meta property="og:title" content="${title}"`)
    .replace(/<meta property="og:description" content="[^"]*"/,  `<meta property="og:description" content="${description}"`)
    .replace(/<meta property="og:url" content="[^"]*"/,          `<meta property="og:url" content="${url}"`)
    .replace(/<meta name="twitter:title" content="[^"]*"/,       `<meta name="twitter:title" content="${title}"`)
    .replace(/<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${description}"`);
}

function injectAssetMeta(html, asset) {
  const { symbol, nameKr, nameEn, category } = asset;
  const SYMBOL = symbol.toUpperCase();
  return injectPageMeta(html, {
    title:       `${nameKr} (${SYMBOL}) 실시간 시세 · 랩메린이`,
    description: `${nameKr} (${SYMBOL}) 실시간 시세, 강세/약세 시그널, 기술적 분석을 한눈에 확인하세요. ${nameEn} — ${category} 전문 분석 대시보드.`,
    url:         `https://lab.merini.com/asset/${symbol}`,
  });
}

function writeRoute(relPath, html) {
  const dir  = join(DIST, relPath);
  const dest = join(dir, 'index.html');
  mkdirSync(dir, { recursive: true });
  writeFileSync(dest, html, 'utf-8');
  console.log(`  ✓ dist/${relPath}/index.html`);
  count++;
}

console.log('\n📄 Generating static route files...\n');

for (const asset of ASSETS) {
  writeRoute(`asset/${asset.symbol}`, injectAssetMeta(baseHtml, asset));
}

for (const route of EXTRA_ROUTES) {
  writeRoute(route, baseHtml);
}

for (const [route, meta] of Object.entries(PAGE_METAS)) {
  writeRoute(route, injectPageMeta(baseHtml, meta));
}

console.log(`\n✅ ${count} route files generated.\n`);
