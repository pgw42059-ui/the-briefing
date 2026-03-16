/**
 * SPA Static Route Generator
 *
 * GitHub Pages는 /asset/nq 같은 경로에 실제 파일이 없으면 HTTP 404를 반환합니다.
 * 이 스크립트는 빌드 후 dist/index.html을 각 라우트 경로에 복사해
 * 구글봇이 HTTP 200 응답을 받을 수 있도록 합니다.
 *
 * 결과:
 *   dist/asset/nq/index.html   → HTTP 200
 *   dist/asset/es/index.html   → HTTP 200
 *   ... (전체 자산 심볼)
 */

import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const SRC  = join(DIST, 'index.html');

// mock-data.ts의 mockAssetDetails 키와 동일해야 함
const ASSET_SYMBOLS = [
  'nq', 'es', 'ym', 'hsi', 'niy', 'stoxx50e',
  'gc', 'si', 'cl', 'ng', 'hg',
  '6e', '6j', '6b', '6a', '6c',
];

// 추가 정적 라우트 (필요 시 확장)
const EXTRA_ROUTES = [
  'auth',
  'install',
];

if (!existsSync(SRC)) {
  console.error('❌ dist/index.html not found. Run `npm run build` first.');
  process.exit(1);
}

let count = 0;

function copyRoute(relPath) {
  const dir  = join(DIST, relPath);
  const dest = join(dir, 'index.html');
  mkdirSync(dir, { recursive: true });
  copyFileSync(SRC, dest);
  console.log(`  ✓ dist/${relPath}/index.html`);
  count++;
}

console.log('\n📄 Generating static route files...\n');

for (const sym of ASSET_SYMBOLS) {
  copyRoute(`asset/${sym}`);
}

for (const route of EXTRA_ROUTES) {
  copyRoute(route);
}

console.log(`\n✅ ${count} route files generated.\n`);
