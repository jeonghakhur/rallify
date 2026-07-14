import { readFileSync, writeFileSync } from 'fs';
import { chromium } from 'playwright';

const b64 = (p) => `data:image/jpeg;base64,${readFileSync(p).toString('base64')}`;
let html = readFileSync('/private/tmp/claude-501/-Users-jeonghak-work-react-tennis-2/f49154e7-b85e-48bf-9db6-ec624308d9dc/scratchpad/redesign-proposal.html', 'utf8');

// 1차: 홈 전체 썸네일만 인라인, 목업 캡처용 임시 파일
let tmp = html
  .replaceAll('{{IMG_HOME_FULL}}', b64('shots/thumb-home-full.jpg'))
  .replaceAll('{{IMG_MOCK_HOME}}', '');
writeFileSync('/private/tmp/claude-501/-Users-jeonghak-work-react-tennis-2/f49154e7-b85e-48bf-9db6-ec624308d9dc/scratchpad/tmp-render.html', `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${tmp}</body></html>`);

// 목업 홈(첫 번째 .phone) 캡처
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
await page.goto(`file://${'/private/tmp/claude-501/-Users-jeonghak-work-react-tennis-2/f49154e7-b85e-48bf-9db6-ec624308d9dc/scratchpad'}/tmp-render.html`);
await page.waitForTimeout(1000);
await page.locator('.phone').first().screenshot({ path: 'shots/mock-home.png' });
await browser.close();
console.log('mock captured');
