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
];

// 추가 정적 라우트 (메타데이터 주입 없이 단순 복사)
const EXTRA_ROUTES = ['auth', 'install'];

if (!existsSync(SRC)) {
  console.error('❌ dist/index.html not found. Run `npm run build` first.');
  process.exit(1);
}

const baseHtml = readFileSync(SRC, 'utf-8');
let count = 0;

function injectMeta(html, asset) {
  const { symbol, nameKr, nameEn, category } = asset;
  const url = `https://lab.merini.com/asset/${symbol}`;
  const SYMBOL = symbol.toUpperCase();
  const title = `${nameKr} (${SYMBOL}) 실시간 시세 · 랩메린이`;
  const description = `${nameKr} (${SYMBOL}) 실시간 시세, 강세/약세 시그널, 기술적 분석을 한눈에 확인하세요. ${nameEn} — ${category} 전문 분석 대시보드.`;

  return html
    // title
    .replace(
      /<title>[^<]*<\/title>/,
      `<title>${title}</title>`
    )
    // description
    .replace(
      /<meta name="description" content="[^"]*"/,
      `<meta name="description" content="${description}"`
    )
    // canonical
    .replace(
      /<link rel="canonical" href="[^"]*"/,
      `<link rel="canonical" href="${url}"`
    )
    // hreflang ko
    .replace(
      /<link rel="alternate" hreflang="ko" href="[^"]*"/,
      `<link rel="alternate" hreflang="ko" href="${url}"`
    )
    // hreflang x-default
    .replace(
      /<link rel="alternate" hreflang="x-default" href="[^"]*"/,
      `<link rel="alternate" hreflang="x-default" href="${url}"`
    )
    // OG title
    .replace(
      /<meta property="og:title" content="[^"]*"/,
      `<meta property="og:title" content="${title}"`
    )
    // OG description
    .replace(
      /<meta property="og:description" content="[^"]*"/,
      `<meta property="og:description" content="${description}"`
    )
    // OG url
    .replace(
      /<meta property="og:url" content="[^"]*"/,
      `<meta property="og:url" content="${url}"`
    )
    // Twitter title
    .replace(
      /<meta name="twitter:title" content="[^"]*"/,
      `<meta name="twitter:title" content="${title}"`
    )
    // Twitter description
    .replace(
      /<meta name="twitter:description" content="[^"]*"/,
      `<meta name="twitter:description" content="${description}"`
    );
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
  const html = injectMeta(baseHtml, asset);
  writeRoute(`asset/${asset.symbol}`, html);
}

for (const route of EXTRA_ROUTES) {
  writeRoute(route, baseHtml);
}

console.log(`\n✅ ${count} route files generated.\n`);
