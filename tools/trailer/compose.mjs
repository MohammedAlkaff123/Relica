// Builds the trailer MP4 from the captured clips:  node compose.mjs
// Opens compose.html in Chrome, which draws every frame, makes the sound, and encodes H.264 + AAC.
//   node compose.mjs --peek      only saves a few still frames to out/peek/ to check the edit
// Needs the game server running (python serve.py) and the clips in out/ (node capture.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { launch, BASE, OUT } from './lib.mjs';

const peekOnly = process.argv.includes('--peek');
const PEEK = [10, 50, 75, 100, 135, 165, 200, 250, 300, 330, 345, 380, 420, 470, 490, 515, 540, 560, 585, 620, 660, 700, 730, 770, 800, 840, 880];
const FILE = path.join(OUT, 'relica-trailer-30s.mp4');

// The Space Apps logo as a white PNG, from the SVG in the repository. The Madinah version is not in
// the repository yet (TRAILER_HANDOFF.md): put it in public/brand/partners/space-apps-madinah-white.svg
// and it is used instead.
async function partnerLogo(browser) {
  const madinah = path.resolve('../../public/brand/partners/space-apps-madinah-white.svg');
  const general = path.resolve('../../public/brand/partners/space-apps-white.svg');
  const svg = fs.readFileSync(fs.existsSync(madinah) ? madinah : general, 'utf8');
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 600 });
  await page.setContent(`<body style="margin:0;background:transparent">${svg.replace('<svg', '<svg id="l" style="height:420px;width:auto;display:block"')}</body>`);
  const el = await page.$('#l');
  await el.screenshot({ path: path.join('out', 'partner-logo.png'), omitBackground: true });
  await page.close();
  return fs.existsSync(madinah) ? 'Madinah' : 'general (Madinah version missing)';
}

const browser = await launch();
try {
  console.log('partner logo:', await partnerLogo(browser));
  const page = await browser.newPage();
  page.on('console', (m) => console.log('  ', m.text()));
  page.on('pageerror', (e) => console.error('  page error:', e.message));
  await page.goto(BASE + '/tools/trailer/compose.html', { waitUntil: 'load' });
  await page.waitForFunction(() => window.ready === true);
  if (peekOnly) {
    fs.mkdirSync(path.join(OUT, 'peek'), { recursive: true });
    for (const f of PEEK) {
      const url = await page.evaluate((n) => window.drawAt(n), f);
      fs.writeFileSync(path.join(OUT, 'peek', `${String(f).padStart(3, '0')}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
    }
    console.log('saved', PEEK.length, 'stills to out/peek/');
  } else {
    const t0 = Date.now();
    const { bytes } = await page.evaluate(() => window.render({}));
    const out = fs.openSync(FILE, 'w');
    for (let i = 0; i < bytes; i += 4 << 20) fs.writeSync(out, Buffer.from(await page.evaluate((a, b) => window.chunk(a, b), i, 4 << 20), 'base64'));
    fs.closeSync(out);
    console.log(`wrote ${FILE} (${(bytes / 1048576).toFixed(1)} MB) in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
} finally {
  await browser.close();
}
